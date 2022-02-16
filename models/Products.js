const mongoose = require("mongoose");
const imageSchema = new mongoose.Schema({
  name: String,
  desc: String,
  img:
  {
      data: Buffer,
      contentType: String
  }
});
const itemsSchema = new mongoose.Schema({
  cvetove: {
    type: Boolean,
  },
  cena: {
    type: Number,
    required: true
  }, 
  katNomer: {
    type: String,
    required: true

  },
  tipove: {
    type: String,
    required: true

  },
  isOnPromotions:{
    type: Boolean,
    default: false,
  },
  isInStock: {
    type: Boolean,
    default: true,
  }
})

const subsectionSchema = new mongoose.Schema({
  opisanie: {
    type: String
  },
  tiput: {
    type: String
  },
 
  nameToDisplay:{
    type: String
  },
  img: [imageSchema],
  items: [itemsSchema]
})
const ProductsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameToDisplay: { type: String, unique: false, required: false}, 
  subsection: [subsectionSchema]
});

module.exports = mongoose.model("Products", ProductsSchema);
