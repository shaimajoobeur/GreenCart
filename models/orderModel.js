const mongoose = require("mongoose");
const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  images: [{ type: String, required: true }],
  price: { type: String, required: true },
  points_price:{ type: String, required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
});

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, default: 0 },
    comment: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const orderSchema = new mongoose.Schema({
  consumer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderItems: [orderItemSchema],
  shipping: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  payment: {
    paymentMethod: { type: String, required: true },
    payerID: {type: String, required: true},
    orderID: {type: String, required: true},
    paymentID:{type: String, required: true}
  },
  itemsPrice: { type: Number },
  taxPrice: { type: Number },
  shippingPrice: { type: Number },
  totalPrice: { type: Number },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date },
  isDelivered: { type: Boolean, default: false },
  deliveredAt: { type: Date },
  reviews: [reviewSchema]
}, {
  timestamps: true
});

const orderModel = mongoose.model("Order", orderSchema);
module.exports=orderModel;