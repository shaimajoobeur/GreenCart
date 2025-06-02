const express = require('express')
const productController=require("../controllers/Product")
const isAuth=require("../middlewares/checkAuth")
const isProducer=require("../middlewares/isProducer")
const isConsumer=require("../middlewares/isConsumer")
const error = require("../middlewares/error")
const router = express.Router();

// main path /api/products/ +

router.get('/', productController.getAll,error);
router.get("/topsold", productController.getTop,error)
router.get("/cache/",isAuth,productController.gettingByCache,error)
router.get("/categories", productController.getCategories,error)
router.get("/cache/:id",isAuth,productController.createCache,error)
router.get('/:id',productController.getById,error);
router.put('/:id/reviews', isAuth,isConsumer, productController.addReview,error );

router.put('/:id', isAuth, isProducer, productController.update,error);
router.delete('/:id', isAuth, isProducer,productController.remove,error );
router.post('/', isAuth, isProducer,productController.create,error);

module.exports=router;
