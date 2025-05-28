const mongoose = require("mongoose");

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
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  images: [{ type: String, required: true }],
  price: { type: Number, default: 0, required: true },
  points_price:{ type: Number, default: 0, required: true },
  category: { type: String, required: true },
  impact: { type: Number, default: 0, required: true },
  provenance : { type: String, required: true },
  regions: [{ type: String, required: true }],
  countInStock: { type: Number, default: 0, required: true },
  description: { type: String, required: true },
  rating: { type: Number, default: 0, required: true },
  numReviews: { type: Number, default: 0, required: true },
  sold:{type:Number,default:0,required:true},
  dateExp: {
    type: Date,
    default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Adds 3 days
    required: true
  },
  reviews: [reviewSchema],
  owner : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const productModel = mongoose.model('Product', productSchema);

module.exports=productModel;
