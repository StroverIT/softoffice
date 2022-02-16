const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "Users",
  },
  cart: {
    type: Object,
    required: true,
  },
  name: { type: String, required: true },
  telephone: { type: Number, required: true },
  city: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },

  description: {
    type: String,
  },
  orderStatus:{
    type: String,
  }
});
module.exports = mongoose.model("Order", schema);
