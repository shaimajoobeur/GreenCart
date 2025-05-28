const Order=require('../models/orderModel');
const User=require("../models/userModel");
const Product=require("../models/productModel");


// pour le producer à modifier
exports.getAll=async (req,res,next)=>{
      try{
        const orders = await Order.find({}).populate('consumer');
        //return orders
        return res.status(200).send(orders);
      }
      catch(ex)
      {
        next(ex.message)
      }
}


// get all user orders by req.user._id
exports.getByUser=async (req, res,next) => {
    try {
      const orders = await Order.find({ user: req.user._id });
      //return orders
      return res.status(200).send(orders);
    }
    catch(ex)
    {
      next(ex.message)
    }
  }

  exports.getById=async (req, res,next) => {
    try{
      const order = await Order.findOne({ _id: req.params.id });
      if (order) {
        //return order
        return res.status(200).send(order);
      } else {
        res.status(404).send("Order Not Found.")
      }
    }
    catch(ex)
    {
      next(ex.message)
    }
      
  }

   //delete one Order By Id
exports.removeById=async (req, res,next) => {
    try
    {
      const order = await Order.findOne({ _id: req.params.id });
      if (order) {
        const deletedOrder = await order.remove();
        //return deleted Order
        return res.status(200).send(deletedOrder);
      } else {
        //order not found
        res.status(404).send("Order Not Found.")
      }
    }
    catch(ex)
    {
    next(ex.message)
    }
  }


  //create new Order
exports.create=async (req, res,next) => {
    try{
    
    const newOrder = new Order({
      orderItems: req.body.orderItems, // c'est un tableau
      user: req.user._id,
      shipping: req.body.shipping,   // objet 
      payment: {
        paymentMethod:req.body.pay,
        payerID: " ",
        orderID:" ",
        paymentID:" "
      },
      itemsPrice: req.body.itemsPrice,
      taxPrice: req.body.taxPrice,
      shippingPrice: req.body.shippingPrice,
      totalPrice: req.body.totalPrice,
    });
    
    const newOrderCreated = await newOrder.save();
    if(!newOrderCreated) return res.status(404).send("Order Not Created")
    return res.status(200).send({ message: "New Order Created", data: newOrderCreated });
  }
  catch(ex)
  {
    next(ex.message)
  }
}