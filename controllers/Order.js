const Order=require('../models/orderModel');
const Product=require("../models/productModel");


// pour le producer à modifier
exports.getProducerOrders = async (req, res, next) => {
  try {s
    const userId = req.user._id; // assuming you have authentication middleware

    const orders = await Order.find({})
      .populate('consumer')
      .populate({
        path: 'orderItems.product',
        model: 'Product',
        select: 'owner name images',
      });

    // Filter orders to only include ones that have at least one product owned by the current user
    const filteredOrders = orders.filter(order =>
      order.orderItems.some(item => item.product && item.product.owner.toString() === userId.toString())
    );

    return res.status(200).send(filteredOrders);
  } catch (ex) {
    next(ex.message);
  }
};


exports.getConsumerOrders = async (req, res, next) => {
  try {
    const userId = req.user._id; // Assuming the user is authenticated

    const orders = await Order.find({ consumer: userId })
      .populate({
        path: 'orderItems.product',
        model: 'Product',
        select: 'name price points_price images category',
      })
      .sort({ createdAt: -1 }); // Most recent orders first

    return res.status(200).send(orders);
  } catch (ex) {
    next(ex.message);
  }
};


exports.getById = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid Order ID" });
    }

    // Deep population
    const order = await Order.findById(orderId)
      .populate({
        path: 'consumer',
        select: 'name email' // only expose needed fields
      })
      .populate({
        path: 'orderItems.product',
        model: 'Product',
        populate: {
          path: 'owner',
          model: 'User',
          select: 'name email' // get owner info
        }
      });

    if (!order) {
      return res.status(404).json({ message: "Order Not Found" });
    }

    return res.status(200).json(order);
  } catch (ex) {
    next(ex.message);
  }
};


exports.getByUser = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id })
      .populate({
        path: 'consumer',
        model: 'User',
        select: 'name email role', // Add any user fields you want
      })
      .populate({
        path: 'orderItems.product',
        model: 'Product',
        select: 'name price points_price images category owner',
        populate: {
          path: 'owner',
          model: 'User',
          select: 'name email' // populate the owner of the product (if useful)
        }
      });

    if (order) {
      return res.status(200).send(order);
    } else {
      res.status(404).send("Order Not Found.");
    }
  } catch (ex) {
    next(ex.message);
  }
};

   
exports.removeById = async (req, res, next) => {
     try {
       const order = await Order.findById(req.params.id);
   
       if (!order) {
         return res.status(404).send("Order Not Found.");
       }
   
       // Restore product stock and sold count
    for (const item of order.orderItems) {
     const product = await Product.findById(item.product);
     if (product) {
           product.countInStock += item.qty;
           product.sold = Math.max(product.sold - item.qty, 0); // Avoid negative sold count
           await product.save();
     }
}
   
       const deletedOrder = await order.remove();
       return res.status(200).send({
         message: "Order successfully cancelled and inventory updated.",
         data: deletedOrder
       });
   
     } catch (ex) {
       next(ex.message);
     }
   };
   
   

exports.addReviewToOrder = async (req, res, next) => {
     try {
       const order = await Order.findById(req.params.id);
   
       if (order) {
         // Create new review
         const review = {
           name: req.user.name,
           rating: Number(req.body.rating),
           comment: req.body.comment,
         };
   
         // Add review to order
         order.reviews.push(review);
   
         // Update number of reviews
         order.numReviews = order.reviews.length;
   
         // Recalculate average rating
         order.rating = order.reviews.reduce((acc, curr) => curr.rating + acc, 0) / order.reviews.length;
   
         // Save updates
         const updatedOrder = await order.save();
   
         return res.status(202).send({
           data: updatedOrder.reviews[updatedOrder.reviews.length - 1],
           message: 'Review saved successfully.',
         });
       } else {
         return res.status(404).send({ message: 'Order Not Found' });
       }
     } catch (ex) {
       next(ex.message);
     }
};
   

exports.pay = async (req, res, next) => {
  try {
    // Récupération de la commande avec les détails des produits
    const order = await Order.findById(req.params.id).populate('orderItems.product');

    if (!order) {
      return res.status(404).send({ message: 'Order not found.' });
    }

    // Mettre à jour les informations de paiement
    order.isDelivered = true;
    order.isPaid = true;
    order.deliveredAt = Date.now();
    order.paidAt = Date.now();
    order.payment = {
      paymentMethod: "card",
      payerID: req.body.payerID,
      orderID: req.body.orderID,
      paymentID: req.body.paymentID
    };

    // Sauvegarder la commande mise à jour
    const updatedOrder = await order.save();

    // Calcul total des greenPoints
    let totalGreenPoints = 0;

    for (const item of order.orderItems) {
      const product = item.product;
      const quantity = item.qty;
      const impact = product.impact || 1;

      // somme des indicators de toutes les provenances du produit
      const totalIndicator = (product.provenances || []).reduce((sum, p) => sum + (p.indicator || 0), 0);

      // Calcul des jours restants avant expiration
      const now = new Date();
      const expDate = new Date(product.dateExp);
      const daysRemaining = Math.max(1, Math.ceil((expDate - now) / (1000 * 60 * 60 * 24)));

      // Appliquer la formule
      const greenPoints = (impact * totalIndicator * quantity) / daysRemaining;
      totalGreenPoints += greenPoints;
    }

    // Mettre à jour les greenPoints de l'utilisateur
    const currentUser = await User.findById(req.user._id);
    currentUser.greenPoints = Math.round((currentUser.greenPoints || 0) + totalGreenPoints);
    await currentUser.save();

    // Mise à jour des quantités vendues (sold)
    await Promise.all(order.orderItems.map(async (item) => {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { sold: item.qty } });
    }));

    return res.status(200).send({
      message: 'Order paid successfully. Green points updated.',
      order: updatedOrder,
      greenPointsEarned: Math.round(totalGreenPoints)
    });

  } catch (ex) {
    next(ex.message);
  }
};


exports.payByPoints = async (req, res, next) => {
  try {
    // Récupération de la commande avec les détails des produits
    const order = await Order.findById(req.params.id).populate('orderItems.product');

    if (!order) {
      return res.status(404).send({ message: 'Order not found.' });
    }

    // Mise à jour du statut de la commande
    order.isDelivered = true;
    order.isPaid = true;
    order.deliveredAt = Date.now();
    order.paidAt = Date.now();
    order.payment = {
      paymentMethod: "points",
      payerID: req.body.payerID,
      orderID: req.body.orderID,
      paymentID: req.body.paymentID
    };

    // Calcul des greenPoints à ajouter
    let totalGreenPoints = 0;

    for (const item of order.orderItems) {
      const product = item.product;
      const quantity = item.qty;
      const impact = product.impact || 0;

      // somme des indicators de toutes les provenances du produit
      const totalIndicator = (product.provenances || []).reduce((sum, p) => sum + (p.indicator || 0), 0);

      // Calcul des jours restants avant expiration
      const now = new Date();
      const expDate = new Date(product.dateExp);
      const daysRemaining = Math.max(1, Math.ceil((expDate - now) / (1000 * 60 * 60 * 24)));

      // Calcul des points
      const greenPoints = (impact * totalIndicator * quantity) / daysRemaining;
      totalGreenPoints += greenPoints;
    }

    // Mise à jour de l'utilisateur
    const currentUser = await User.findById(req.user._id);
    currentUser.points = (currentUser.points || 0) - req.body.points;
    currentUser.greenPoints = Math.round((currentUser.greenPoints || 0) + totalGreenPoints);
    await currentUser.save();

    // Sauvegarde de la commande
    const updatedOrder = await order.save();

    // Mise à jour du nombre de ventes des produits
    await Promise.all(order.orderItems.map(async (item) => {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { sold: item.qty } });
    }));

    res.send({
      message: 'Order paid using points. Green points updated.',
      order: updatedOrder,
      greenPointsEarned: Math.round(totalGreenPoints)
    });

  } catch (ex) {
    next(ex.message);
  }
};

exports.payShipping=async (req, res,next) => {
  try{
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDelivered=true;
      order.isPaid = true;
      order.deliveredAt=Date.now();
      order.paidAt = Date.now();
      order.payment = {
          paymentMethod: "points-shipping",
          payerID: req.body.payerID,
          orderID: req.body.orderID,
          paymentID: req.body.paymentID
      }
      const updatedOrder = await order.save();
  
      const currentUser=await User.findByIdAndUpdate(req.user._id,{$inc:{points:-req.body.pointsProducts}})
    
      await currentUser.save()
    
      Promise.all(updatedOrder.orderItems.map(async (item)=>{
        let id=item.product
        await Product.findByIdAndUpdate({_id:id},{ $inc: {sold:1}  })
      }))
      
    
      return res.status(200).send({ message: 'Order Paid by card.', order: updatedOrder });
      
    } else {
      res.status(404).send({ message: 'Order not found.' })
    }
  }
    catch(ex)
    {
      next(ex.message)
    }
}

  //create new Order
exports.create = async (req, res, next) => {
    try {
      const {
        orderItems,
        shipping,
        pay: paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
      } = req.body;
  
      if (!orderItems || orderItems.length === 0) {
        return res.status(400).send({ message: "Order items are required." });
      }
  
      // Decrement product stock and increment sold count
      for (const item of orderItems) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).send({ message: `Product not found: ${item.product}` });
        }
  
        if (product.countInStock < item.qty) {
          return res.status(400).send({
            message: `Insufficient stock for product: ${product.name}`
          });
        }
  
        product.countInStock -= item.qty;
        product.sold += item.qty;
        await product.save();
      }
  
      // Create the order
      const newOrder = new Order({
        consumer: req.user._id,
        orderItems,
        shipping,
        payment: {
          paymentMethod,
          payerID: " ",
          orderID: " ",
          paymentID: " "
        },
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
      });
  
      const savedOrder = await newOrder.save();
  
      return res.status(201).send({
        message: "New Order Created",
        data: savedOrder
      });
  
    } catch (ex) {
      next(ex.message);
    }
  };
  