const express = require('express')
const orderController=require("../controllers/Order")
const isAuth=require("../middlewares/checkAuth")
const isConsumer=require("../middlewares/isConsumer")
const isProducer=require("../middlewares/isProducer")
const error = require("../middlewares/error")
const router = express.Router();

router.get("/getConsumerOrders", isAuth,isProducer,orderController.getConsumerOrders,error);
router.get("/getProducerOrders", isAuth,isProducer,orderController.getProducerOrders,error);
router.get("/mine", isAuth, isConsumer, orderController.getByUser, error);
router.get("/:id", isAuth,orderController.getById,error);
router.delete("/:id", isAuth, isConsumer,orderController.removeById,error);
router.post("/", isAuth, isConsumer, orderController.create,error);
router.put("/:id/comment", isAuth,isConsumer, orderController.addReviewToOrder, error);
router.put("/:id/pay", isAuth,isConsumer, orderController.pay,error);
router.put("/:id/payByPoints", isAuth, isConsumer,orderController.payByPoints,error);
router.put("/:id/payShipping",isAuth,isConsumer, orderController.payShipping,error);


module.exports=router;