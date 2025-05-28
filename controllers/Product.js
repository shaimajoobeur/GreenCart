const Product=require("../models/productModel")
const User=require("../models/userModel")

exports.getAll = async (req, res, next) => {
    try {
      // Build filter object dynamically
      const filter = {};
  
      // Filter by category
      if (req.query.category) {
        filter.category = req.query.category;
      }
  
      // Filter by name (search keyword)
      if (req.query.searchKeyword) {
        filter.name = {
          $regex: req.query.searchKeyword,
          $options: 'i', // case-insensitive
        };
      }
  
      // Filter by price range
      if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
      }
  
      // Filter by impact range
      if (req.query.minImpact || req.query.maxImpact) {
        filter.impact = {};
        if (req.query.minImpact) filter.impact.$gte = Number(req.query.minImpact);
        if (req.query.maxImpact) filter.impact.$lte = Number(req.query.maxImpact);
      }
  
      // Filter by rating range
      if (req.query.minRating || req.query.maxRating) {
        filter.rating = {};
        if (req.query.minRating) filter.rating.$gte = Number(req.query.minRating);
        if (req.query.maxRating) filter.rating.$lte = Number(req.query.maxRating);
      }
  
      // Filter by provenance
      if (req.query.provenance) {
        filter.provenance = req.query.provenance;
      }
  
      // Filter by expiration date (dateExp)
      if (req.query.dateExpBefore || req.query.dateExpAfter) {
        filter.dateExp = {};
        if (req.query.dateExpBefore) {
          filter.dateExp.$lte = new Date(req.query.dateExpBefore);
        }
        if (req.query.dateExpAfter) {
          filter.dateExp.$gte = new Date(req.query.dateExpAfter);
        }
      }
  
      // Sort order
      const sortOrder = req.query.sortOrder === 'highest'
        ? { rating: -1 }
        : req.query.sortOrder === 'lowest'
        ? { rating: 1 }
        : { rating: -1 };
  
      // Fetch products
      const products = await Product.find(filter).sort(sortOrder);
  
      return res.status(200).send(products);
    } catch (ex) {
      next(ex.message);
    }
  };
  

exports.getTop=async(req,res,next)=>{
  try{
    const products = await Product.find().sort({ "sold": -1 }).limit(10);
    //return products
    return res.status(200).send(products);
  }
  catch(ex)
  {
    next(ex.message)
  }
}

exports.getById=async (req, res,next) => {
    try{
    const product = await Product.findOne({ _id: req.params.id });
    if (product) {
      res.status(200).send(product);
    } else {
      res.status(404).send({ message: 'Product Not Found.' });
    }
  }
  catch(ex)
  {
    next(ex.message)
  }
}

exports.gettingByCache=async(req,res,next)=>{
    try
    {
        // récuperer les catégories
      const { favoris } = await User.findById(req.user._id).select("favoris")
      let categories=favoris.sort((a,b)=>(a.indicator > b.indicator) ? -1 : ((b.indicator > a.indicator) ? 1 : 0))
      categories=categories.map(c=>c.category)
      //console.log(categories)

      // récupérer les produits
      var products=[]
      await Promise.all(
        categories.map( async (category) => {
              const favorisproducts=await Product.find({"category":{"$eq":category}}).sort({rating:1})
              favorisproducts.forEach(product=>products.push(product))
        })
      )
      
      //const notfavorisproducts=await Product.find({"category":{"$nin":categories}}).sort({rating:1})
      //notfavorisproducts.forEach(product=>products.push(product))  
      //console.log(products)
      
      return res.status(200).send(products) 
    }
    catch(ex)
    {
      next(ex.message)
    }
}

exports.getCategories= async(req,res,next)=>{
  
    function removeDups(names) {
      let unique = {};
      names.forEach(function(i) {
        if(!unique[i]) {
          unique[i] = true;
        }
      });
      return Object.keys(unique);
    }

  try
  {
    const data=await Product.find().select("category")
    let categories=[]
    data.map(cat=>categories.push(cat.category))
    categories=removeDups(categories)
    
    return res.status(200).send(categories)
  }
  catch(ex)
  {
  next(ex.message)
  }
}

// incrementation de category du produit consulté
exports.createCache=async(req,res,next)=>{
    
    try
    {
    
   const product = await Product.findOne({ _id: req.params.id });
   let user=await User.findById(req.user._id);

   // chercher si la catégroie existe déjà
   const indexProduct=user.favoris.findIndex(c=>c.category==product.category)

   // si elle existe on incrémente
   if(indexProduct!=-1) user.favoris[indexProduct].indicator++

   // si la catégorie n'existe pas dans le tableau favoris du User on crée une
   else user.favoris.push({category:product.category,indicator:1})

   // save changemets
   await user.save()

   if (product) {
     return res.status(200).send(product);
   } else {
     return res.status(404).send({ message: 'Product Not Found.' });
   }
  }
  catch(ex)
  {
    next(ex.message)
  }
}

exports.addReview=async (req, res,next) => {
    try{
    const product = await Product.findById(req.params.id);
    if (product) {
      // create new review
      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      //add review to reviews in user model
      product.reviews.push(review);
      //update number reviews
      product.numReviews = product.reviews.length;
      //recalculate rating product
      product.rating =product.reviews.reduce((a, c) => c.rating + a, 0) /product.reviews.length;
      // save updates
      const updatedProduct = await product.save();
      //return only the updated product as data 
      return res.status(202).send({
        data: updatedProduct.reviews[updatedProduct.reviews.length - 1],
        message: 'Review saved successfully.',
      });
    } else {
      return res.status(404).send({ message: 'Product Not Found' });
    }
  }
  catch(ex)
  {
    next(ex.message)
  }
}

// update name,price,image,brand,category,countInStock,description
exports.update = async (req, res, next) => {
    try {
      const productId = req.params.id;
  
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).send({ message: 'Product not found.' });
      }
  
      // Mettez à jour seulement les champs présents dans la requête
      if (req.body.name) product.name = req.body.name;
      if (req.body.price) product.price = req.body.price;
      if (req.body.points_price) product.points_price = req.body.points_price;
      if (req.body.images) product.images = req.body.images;
      if (req.body.category) product.category = req.body.category;
      if (req.body.countInStock) product.countInStock = req.body.countInStock;
      if (req.body.description) product.description = req.body.description;
      if (req.body.impact !== undefined) product.impact = req.body.impact;
      if (req.body.provenance) product.provenance = req.body.provenance;
      if (req.body.regions) product.regions = req.body.regions;
      if (req.body.rating !== undefined) product.rating = req.body.rating;
      if (req.body.numReviews !== undefined) product.numReviews = req.body.numReviews;
      if (req.body.sold !== undefined) product.sold = req.body.sold;
      if (req.body.dateExp) product.dateExp = new Date(req.body.dateExp); // veillez à valider la date côté client
  
      const updatedProduct = await product.save();
  
      res.status(202).send({ message: 'Product updated', data: updatedProduct });
    } catch (ex) {
      next(ex.message);
    }
  };
  

// delete product by Id
exports.remove=async (req, res,next) => {
    try
    {
        const deletedProduct = await Product.findById(req.params.id);
        if (deletedProduct) {
            await deletedProduct.remove();
            return res.send({ message: 'Product Deleted' });
        } 
        else {
            return res.send('Error remove');
        }
    }
    catch(ex)
    {
      next(ex.message)
    }
}

//create new Product with name,price,image,brand,category,countInStock,description
exports.create = async (req, res, next) => {
    try {
      const product = new Product({
        name: req.body.name,
        images: req.body.images,
        price: req.body.price,
        points_price: req.body.points_price,
        category: req.body.category,
        impact: req.body.impact,
        provenance: req.body.provenance,
        regions: req.body.regions,
        countInStock: req.body.countInStock,
        description: req.body.description,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        sold: req.body.sold || 0,
        dateExp: req.body.dateExp ? new Date(req.body.dateExp) : undefined,
        reviews: [],
        owner: req.user._id
      });
  
      const newProduct = await product.save();
  
      if (newProduct) {
        return res
          .status(201)
          .send({ message: 'New Product Created', data: newProduct });
      }
  
      return res.status(500).send({ message: 'Error in Creating Product.' });
    } catch (ex) {
      next(ex.message);
    }
  };
  