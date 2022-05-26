const express = require("express");
const router = express.Router();
const path = require("path");
const mongoose = require("mongoose");
// const jwt = require("jsonwebtoken");

const db = mongoose.connection;
const productCollection = db.collection("products");
// Products collection
router.get("/:section", async (req, res, next) => {
  const section = req.params.section;
  const currentSection = await productCollection.findOne({ name: section });
  res.render(path.resolve("views/products/productPage.ejs"), {
    currentSection,
  });
});
router.get("/:section/:typeProduct", async (req, res, next) => {
  const section = req.params.section;
  const typeProduct = req.params.typeProduct;
  const item = await productCollection.findOne({
    name: section,
    "subsection.tiput": typeProduct,
  });
  const itemLen = item.subsection.length;
  const currentItem = {};
  for (let i = 0; i < itemLen; i++) {
    const itemType = item.subsection[i];
    if (itemType.tiput == typeProduct) {
      currentItem["item"] = itemType;
      break;
    }
  }
  res.render(path.resolve("views/products/showProduct.ejs"), {
    currentItem,
    section: item.nameToDisplay,
  });
});
// Get product collection to array

module.exports = router;
