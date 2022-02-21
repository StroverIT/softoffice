const express = require("express");
const router = express.Router();
const path = require("path");
const passport = require("passport");
const flash = require("express-flash");
const bodyParser = require("body-parser");
const Validator = require("jsonschema").Validator;
const methodOverride = require("method-override")
const v = new Validator();
const fs = require("fs");
//Mongod 
const mongoose = require("mongoose");
const mongooseSchema = require("mongoose-schema-jsonschema")()
const config = require("mongoose-schema-jsonschema/config")
const ObjectId = require("mongodb").ObjectId;
const db = mongoose.connection;
//Uploading images 
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function(req,file,cb){
    cb(null, "./public/uploads")
  },
  filename: function(req,file,cb){
    cb(null, file.originalname)
  }
})
const upload = multer({storage:storage})
// Use
router.use(bodyParser.json());
router.use(flash());

router.use(passport.initialize());
router.use(passport.session());

router.use(bodyParser.urlencoded({ extended: true }));
router.use(methodOverride("_method"))
// CORS
const main_url = "http://perfect.spot.bg/api/categories.xml"

const parseString = require('xml2js').parseString;
const http = require('http');
function xmlToJson(url, callback) {
  var req = http.get(url, function(res) {
    var xml = '';
    
    res.on('data', function(chunk) {
      xml += chunk;
    });

    res.on('error', function(e) {
      callback(e, null);
    }); 

    res.on('timeout', function(e) {
      callback(e, null);
    }); 

    res.on('end', function() {
      parseString(xml, function(err, result) {
        callback(null, result);
      });
    });
  });
}

//--- Models ---\\
const Products = require("../models/Products")

// Dostavki 
router.get("/dostavki", checkAuthanticatedAdmin, async(req,res,next)=>{
  // const orders = require("../models/Order")
  const totalOrder = await db.collection("orders").find({}).toArray()
  res.render(path.resolve("views/userAuthantication/dostavki.ejs"),{
    orders: totalOrder
  })
})
// Chaning a order status from here :)
router.post("/dostavki/:id/:status",checkAuthanticatedAdmin,(req,res,next)=>{
  const id = req.params.id
  const status = req.params.status
  db.collection("orders").updateOne({"_id": ObjectId(id)}, {$set: {orderStatus: status}}, {w:1}, function(err,result){
    if(err) console.log(err)
    res.redirect(req.get("referer"))
    // console.log(result)
  })
})
// Deleting the order by id
router.delete("/dostavki/:id", async (req,res,next)=>{
  const orders = require("../models/Order")
  
  await orders.findByIdAndDelete(req.params.id)
      res.redirect(req.get("referer"))

})

router.get(
    "/products",
    checkAuthanticatedAdmin,
    async (req, res) => {
      const allProducts = await db.collection("products").find({}).toArray()
      res.render(path.resolve("views/userAuthantication/adminProducts.ejs"), {
        allProducts
      })
    }
  );
router.get("/products/createProduct", checkAuthanticatedAdmin, async(req,res)=>{
  const productSchema = Products.jsonSchema().properties
  res.render(path.resolve("views/userAuthantication/adminProductsNew.ejs"),{
    productSchema
  })
})
// Create a item 
router.post("/products/createProduct",checkAuthanticatedAdmin,upload.any(), async (req,res)=>{

  // console.log(req.files)
  const item = Object.entries(req.body)
  const currentObj = {}
  // Adding to object
  item.forEach((element,index)=>{
    const key = element[0]
    const value= element[1]
    currentObj[key] = value
  })
  if(req.files){
    // console.log(req.files)
    currentObj.subsection.forEach((section,index)=>{
  section.img = req.files[index]
    })
  }

  currentObj.subsection.forEach((section,index)=>{
    section["_id"] = new ObjectId()
    if(section.items){
      section.items.forEach(item=>{
        item["_id"] = new ObjectId();
      })
    }
 
  })
  // console.log(currentObj.subsection)
     const collection = db.collection("products")
    const inserting = collection.insertOne(currentObj, function(err,result){
       if(err){
         console.log(err)
         return
       }
       console.log(result)
       res.redirect(req.get("referer"));
     })
} )

router.get("/products/createProduct/newSubSection", checkAuthanticatedAdmin,(req,res)=>{
  console.log("Adding new subsection")
  try{
    const productSchema = Products.jsonSchema().properties
  const subsecSchema = productSchema.subsection.items.properties
  // console.log(subsecSchema.items.items.properties)
   res.json(subsecSchema)
  }catch(e){
    if(e){
      console.log(e)
    }
  }
})
router.get("/products/:id/show", checkAuthanticatedAdmin, async (req,res)=>{
  const id = req.params.id
  const itemToShow = await db.collection("products").findOne({"_id": ObjectId(id)})
    res.render(path.resolve("views/userAuthantication/adminProductsShow.ejs"),{
      currentSection: itemToShow
    })
})
router.get("/products/getImages", checkAuthanticatedAdmin, (req,res, next)=>{
    // const myData  = xmlToJson(main_url, function(err,data){
    //   if(err) console.err(err)
    //   console.log(JSON.stringify(data,null,2))
    // })
res.render(path.resolve("views/otherPages/downloadImages.ejs"),{
  imagesSection: xmlToJson(main_url,function(err,data){
    let counter = 0
    if(err) console.log(err)
    console.log(JSON.stringify(data,null,2))
    counter++
    console.log(counter)
  })
})
})
router.get("/products/:sectionName/:subSectionId", checkAuthanticatedAdmin, async(req,res,next)=>{

  const subsecId = req.params.subSectionId
const section = await db.collection("products").findOne({name: req.params.sectionName})
let itemForEdit = {}
outer: for(const el of section.subsection){
  if(el._id == subsecId){
    itemForEdit["foundItem"] = el

    itemForEdit["section"] = {
      name: section.name,
      _id: section._id
    }
    break outer
  }
}
  res.render(path.resolve("views/userAuthantication/adminSubsecEdit.ejs"),{itemForEdit})
})
router.post("/products/productEdit", checkAuthanticatedAdmin, async (req,res)=>{
  const collection = db.collection("products")

  const id =req.body._id
  if(!req.body.itemToChange) return res.redirect(req.get("referer"));
  const items= Object.entries(req.body.itemToChange)
console.log(req.body);

  for(let [itemKey, itemValue] of items){
    // console.log(itemKey)
     collection.updateOne({ "subsection._id": ObjectId(id) }, { $set: { [`subsection.$[i].${itemKey}`]: itemValue } }, {arrayFilters: [{"i._id": {$eq: ObjectId(id)}}]}, function(err, result){
       if(err) return console.log(err)
       console.log("YES");
       console.log(result)
     })
  }
  res.redirect(req.get("referer"));
})
router.delete("/products/removeSubsection/:subsecId", checkAuthanticatedAdmin,async (req,res)=>{
 const id = req.params.subsecId
//  Delete image
const collection = db.collection("products")
const foundSection = await collection.findOne({"subsection._id": ObjectId(id)})
let itemImg 
outer: for(const item of foundSection.subsection){
  if(item._id == id){
    if(item.img){
      itemImg = item.img.originalname
    }
    break outer
  }
}
if(itemImg){
  const filePath = path.resolve(`public/uploads/${itemImg}`)
  if(fs.existsSync(filePath)){
    fs.unlinkSync(filePath);
  }

}

 db.collection('products').updateOne({"subsection._id": ObjectId(id)},{$pull:{"subsection":{"_id":ObjectId(id)}}},{multi:true},function(err,result){
   if(err)return console.log(err)
   console.log(result);
 })
 res.redirect("/admin/products");

})
router.get("/products/editImage/:section/:imageId", checkAuthanticatedAdmin, async(req,res)=>{
    const section = req.params.section
    const imageId = req.params.imageId
    const item = await db.collection("products").findOne({"subsection._id": ObjectId(imageId)})

    const img ={}
    for(let foundImg of item.subsection){
      if(foundImg._id == imageId){
        img["img"] = foundImg.img
      }
    }
    console.log(img);
  res.render(path.resolve("views/userAuthantication/editImage.ejs"), {section,imageId})
})
router.post("/products/editImage/:section/:imageId",checkAuthanticatedAdmin, upload.any(), async(req,res)=>{
  const imageId = req.params.imageId
  const section = req.params.section
  const collection =  db.collection("products")
  const item = await collection.findOne({"subsection._id": ObjectId(imageId)})
  const img ={}
   outer: for(let foundImg of item.subsection){
      if(foundImg._id == imageId){
        img["img"] = foundImg.img
        break outer
      }
    }
  

    if(img && img.img){
    const origName = img.img.originalname

      const filePath = path.resolve(`public/uploads/${origName}`)
      console.log("filePath", filePath);
      try {
        fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
        console.log("can read/write:", path);
        fs.unlinkSync(filePath);

      } catch (err) {
        console.log("no access:", path);
        console.error(err);
      }
      // if(fs.existsSync(filePath)){
      //   console.log("FOUND")
      //   fs.unlinkSync(filePath);
      // }
    }
    console.log(imageId);
    if(req.files){
      console.log(req.files);
      collection.updateOne({ "subsection._id": ObjectId(imageId) }, { $set: { [`subsection.$[i].img`]: req.files[0] } }, {arrayFilters: [{"i._id": {$eq: ObjectId(imageId)}}]}, function(err, result){
        if(err) return console.log(err)
        console.log("YES");
        console.log(result)
        res.redirect(`/admin/products/${section}/${imageId}`)
      })
    }
} )
router.get("/products/:sectionName/:subsectionName/:itemId/edit", checkAuthanticatedAdmin, async (req,res,next)=>{
  const subsecName= req.params.subsectionName
  const itemId= req.params.itemId
  const section  = await db.collection("products").findOne({name: req.params.sectionName})
  let itemForEdit = {}
  outer: for(const el of section.subsection){
    for(const item of el.items){
    if(item._id == itemId){
      console.log("True");
      // console.log(item);
      itemForEdit["foundItem"] = item
      itemForEdit["subSec"] = {
        tiput: el.tiput,
        _id: el._id
      }
      itemForEdit["section"] = {
        name: section.name,
        _id: section._id
      }
      break outer
    }
    }
  }
  
  // db.products.updateOne({ "subsection.items._id": ObjectId("61f5740f9cb334a8d97657f4") }, { $set: { "subsection.$[i].items.$.cena": "2.99" } }, {arrayFilters: [{"i.items._id": {$eq: ObjectId("61f5740f9cb334a8d97657f4")}}]})
  // console.log("itemForEdit", itemForEdit);
  res.render(path.resolve("views/userAuthantication/adminItemEdit.ejs"),{
    itemForEdit
  })

})

router.post("/products/editItem", checkAuthanticatedAdmin, async(req,res,next)=>{
  const collection = db.collection("products")
  const id =req.body._id
  const items= Object.entries(req.body.itemToChange)
  let foundIndex = 0
  const foundCol = await collection.findOne({"subsection.items._id": ObjectId(id)})
  try{
    foundCol.subsection.forEach(item=>{
      item.items.forEach((itemSection, index) => {
        if(itemSection._id == id){
         foundIndex = index
         throw "Break"
        }
      })
    })
  }catch(e){
    if(e !== "Break") throw e
  }
 
  // console.log(foundIndex);
  for(let [itemKey, itemValue] of items){
    // console.log(itemKey)
     collection.updateOne({ "subsection.items._id": ObjectId(id) }, { $set: { [`subsection.$[i].items.${foundIndex}.${itemKey}`]: itemValue } }, {arrayFilters: [{"i.items._id": {$eq: ObjectId(id)}}]}, function(err, result){
       if(err) return console.log(err)
       console.log("YES");
       console.log(result)
     })
  }
 
  res.redirect(req.get("referer"));
  // db.products.updateOne({ "subsection.items._id": ObjectId("61f5740f9cb334a8d97657f4") }, { $set: { "subsection.$[i].items.$.cena": "2.99" } }, {arrayFilters: [{"i.items._id": {$eq: ObjectId("61f5740f9cb334a8d97657f4")}}]})
})
router.post("/products/addToPromotion",checkAuthanticatedAdmin, async(req,res,next)=>{
  const collection = db.collection("promotion")
  const editCollection = db.collection("products")
  const url = req.headers.referer.split("/")
  const id = url[7]

const promotionalPrice = Object.entries(req.body)
const nameProm = promotionalPrice[0][0]
const priceProm= promotionalPrice[0][1]

// editCollection.updateOne({"subsection.items._id": ObjectId(id) }, {$set: {[`subsection.$[i].items.${foundIndex}.${nameProm}`]: priceProm} },{arrayFilters: [{"i.items._id": {$eq: ObjectId(id)}}]}, function(err,result){
  const foundCol = await editCollection.findOne({"subsection.items._id": ObjectId(id)})

 let foundIndex = 0
  foundCol.subsection.forEach(item=>{
    item.items.forEach((itemSection, index) => {
      if(itemSection._id == id){
       foundIndex = index
      }
    })
  })
  
async function addingToCollection(){
  const itemFound = await editCollection.findOne({
    "subsection.items._id": new ObjectId(id),
  });
  const itemForProm = {}
  outer: for(const el of itemFound.subsection){
    for(const item of el.items){
    if(item._id == id){
      // console.log("3. Added item");
      // console.log(item);
      itemForProm["foundItem"] = item
      itemForProm["subSec"] = {
        tiput: el.tiput,
        showName: el.nameToDisplay,
        img: el.img,
        _id: el._id
      }
      itemForProm["section"] = {
        name: itemFound.name,
        showName: itemFound.nameToDisplay,
        _id: itemFound._id
      }
      break outer
    }
    }
  }
  // console.log("itemForProm",itemForProm);
  const inserting = collection.insertOne(itemForProm, function(err,result){
    if(err)return console.log(err)
    console.log("4.inserting!");
    // console.log(result)
  })
}
    editCollection.updateOne({"subsection.items._id": ObjectId(id) }, {$set: {[`subsection.$[i].items.${foundIndex}.${nameProm}`]: priceProm} },{arrayFilters: [{"i.items._id": {$eq: ObjectId(id)}}]}, function(err,result){
      if(err) return console.log(err)
      console.log("1. UPDATE FOR Price prom");
      // console.log(result);
    })
   editCollection.updateOne({"subsection.items._id": ObjectId(id) }, {$set: {[`subsection.$[i].items.${foundIndex}.isOnPromotion`]: true} },{arrayFilters: [{"i.items._id": {$eq: ObjectId(id)}}]}, function(err,result){
      if(err) return console.log(err)
console.log("2. UPDATE FOR IS ON PROMOTION");
addingToCollection()
      // console.log(result);
    })


     res.redirect(req.get("referer"));
})
router.get("/promotions", checkAuthanticatedAdmin, async(req,res)=>{

  const promCollection = await db.collection("promotion").find({}).toArray()
  res.render(path.resolve("views/userAuthantication/adminPromotions.ejs"),{
    promCollection
  })
})
router.delete("/deletePromotion/:promotionId/:itemId",async (req,res)=>{
  const productCollection = db.collection("products")
  const collectionProm = db.collection("promotion")
 
  const itemId = req.params.itemId
 const promotionId = req.params.promotionId

 const searchInColl = await productCollection.findOne({"subsection.items._id": ObjectId(itemId)})
 let foundIndex = 0
 for(let searchItem of searchInColl.subsection){
  searchItem.items.forEach((element, index)=>{
    if(element._id == itemId){
      foundIndex= index
    }
  })
 }
 productCollection.updateOne({"subsection.items._id": ObjectId(itemId) }, {$set: {[`subsection.$[i].items.${foundIndex}.promotionalPrice`]: "0"} },{arrayFilters: [{"i.items._id": {$eq: ObjectId(itemId)}}]}, function(err,result){
  if(err) return console.log(err)
  console.log(result);
})
productCollection.updateOne({"subsection.items._id": ObjectId(itemId) }, {$set: {[`subsection.$[i].items.${foundIndex}.isOnPromotion`]: false} },{arrayFilters: [{"i.items._id": {$eq: ObjectId(itemId)}}]}, function(err,result){
  if(err) return console.log(err)
  console.log(result);
})
  collectionProm.deleteOne({
    _id: ObjectId(promotionId)
  })
  
  res.redirect(req.get("referer"))
})
router.post("/products/newSubsection/:sectionId",checkAuthanticatedAdmin, upload.any(),async (req,res)=>{
  const item = Object.entries(req.body.subsection)
  item.forEach((subsecItem, subsecIndex)=>{
    subsecItem[1]["_id"] = new ObjectId()
    if(subsecItem[1].items){
      subsecItem[1].items.forEach(item=>{
        item["_id"] = new ObjectId()
      })
    }
  })
  if(req.files){
    item.forEach((section,index)=>{
  section[1].img = req.files[index]
    })
  }
  const collection = db.collection("products")
  item.forEach(subItem =>{
    collection.updateOne({_id: ObjectId(req.params.sectionId)}, {$push: {subsection: subItem[1] }}, function(err,result){
      if(err) return console.log(err)
      console.log(result);
    })
  })
  res.redirect(req.get("referer"));

} )

async function checkAuthanticatedAdmin(req, res, next) {
  if (req.isAuthenticated()) {
    const Users = require("../models/Users");

    const adminChecker = await Users.findById(req.user);
    const userRole = await adminChecker.role;
    if (userRole != "admin") {
      res.redirect("/account/login");
    }
    return next();
  }
  res.redirect("/account/login");
}

module.exports = router;
