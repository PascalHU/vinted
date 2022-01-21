const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  product_name: { type: String, maxlength: 50 },
  product_description: { type: String, maxlength: 500 },
  product_price: Number,
  product_details: Array,
  product_image: { type: mongoose.Schema.Types.Mixed, default: {} },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Offer;
