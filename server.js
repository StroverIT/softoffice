if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
const hostname = "localhost" || "127.0.0.1";
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const bodyParser = require("body-parser");
// const logger = require("morgan");  
// const cookieParser = require("cookie-parser");
const path = require("path");
const ejs = require("ejs");
const fs = require("fs")
const http = require("http");
const server = http.createServer(app);
var io = require("socket.io")(server);

const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const ObjectId = require("mongodb").ObjectId;
const db = mongoose.connection;
// Routes
const accounts = require("./routes/accounts");
const products = require("./routes/products");
const admin = require("./routes/admin.router");

// Models
const Cart = require("./models/Cart");
const Order = require("./models/Order");
const Products = require("./models/Products");
const Token = require("./models/token")
const { array_jsonSchema } = require("mongoose-schema-jsonschema/lib/types");
//Collections
const promotionCollection = db.collection("promotion")
//Functions
const sendEmail = require("./utils/email")
// Public
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysupersecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
    }),
    cookie: { maxAge: 180 * 60 * 1000 },
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("layout", "layouts/layout");
app.use(express.static(__dirname + "/public"));
// app.use("/", express.static(__dirname + "public"))
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.path}`);
  console.log(`${__dirname}`)
  next();
});
app.use(passport.initialize());
app.use(passport.session());
app.use(flash())
app.use(async function (req, res, next) {
  if(req.session &&req.session.passport && req.session.passport ){
    const userId = req.session.passport.user
    const userInfo = await db.collection("users").findOne({_id: ObjectId(userId)})
    if(userInfo){

    if(userInfo.role == "admin" && req.session.cookie._expires){
     req.session.cookie._expires= 9999999 * 60 * 1000
     req.session.cookie.maxAge = 9999999 * 60 * 1000
    }
  }
  }

  res.locals.session = req.session;
  next();
});
// Main page

app.get("/", async (req, res) => {
  const promotions = await promotionCollection.find({}).toArray()
  res.render(path.resolve("views/index.ejs"), {
    promotions,
  });
});
app.get("/allPromotions", async (req,res)=>{
  const promotions = await promotionCollection.find({}).toArray()
  res.render(path.resolve("views/otherPages/allPromotions.ejs"), {
    promotions,
  });
})

//-----Routes-----\\
// Accounts
app.use("/account", accounts);
//Admin
app.use("/admin", admin);
//Products
app.use("/products", products);
// About us
app.get("/aboutUs", (req, res, next) => {
  res.render(path.resolve("views/otherPages/aboutUs.ejs"));
});
app.get("/contactUs", (req, res, next) => {
  const contactMess = req.flash("contactMess")
  res.render(path.resolve("views/otherPages/contactUs.ejs"), {contactMess});
});
app.post("/contactUs", async (req, res, next) => {  
  try{

  const message = `от ${req.body.user} - ${req.body.message}`
    await sendEmail( req.body.email, "softofficepayment@gmail.com", req.body.problem , message)
    req.flash("contactMess", "Съобщението ви беше изпратено успешно")
    res.redirect("/contactUs")
  }catch(e){
    if(e) console.log(e);
  }
});
//Cart
app.get("/cart/:id/:qty/:multiplePrice?", async (req, res, next) => {
  try {

    const productQty = req.params.qty;
    const productId = req.params.id;
  
    const cart = new Cart(req.session.cart ? req.session.cart : {});
    const productCollection = db.collection("products");

    const item = await productCollection.findOne({
      "subsection.items._id": new ObjectId(productId),
    });
   const name = item.name
   const displayName = item.nameToDisplay

    let matched = {}
    const subsectionLen = item.subsection.length
 for(let i = 0; i < subsectionLen; i++){
   let subsection = item.subsection[i]
   subsection.items.forEach((item,index)=>{
     if(item._id == productId){
    
      matched["typeSection"]=  item
      if(req.params.multiplePrice){
      let typesToAdd = ""
      let mPrices= []
        const types =  item.tipove.split(";")
        for(let type of types){
          if(type.includes("Цена")){
            mPrices.push(type)
            continue
          }

          typesToAdd+= `${type};`
        }
        
        outer: for(let currItem of mPrices){
          if(currItem.includes(productQty)){
          currItem = currItem.split(":")
          const price = currItem[1].trim()
          typesToAdd+= currItem
          matched["typeSection"].cena = price
            break outer
          }
        }

        matched["typeSection"].tipove= typesToAdd
      }
      matched["subSection"] = {
        tiput: subsection.tiput,
        nameToDisplay: subsection.nameToDisplay,
        img: subsection.img,
        _id: subsection._id
      }
      matched["headSection"] = {
        name:name,
        nameToDisplay: displayName,
      }
      return
     }
   })
 }
 if(req.session.passport.user){
  const userId = req.session.passport.user
  const user = await db.collection("users").findOne({_id: ObjectId(userId)})
  const promotions = user.promotions
      if( !matched.typeSection.isOnPromotion && promotions){
        if(promotions.includes(matched.headSection.name)){
          console.log("Found promotion", matched.typeSection._id, matched.headSection.name);
          cart.addPromotionsList(matched.typeSection._id)
        }
       
      }

}
   cart.add(
    matched,
          matched.typeSection._id,
          req.params.multiplePrice ? 1 :productQty
        );
       
        req.session.cart = cart;
        res.redirect(req.get("referer"));
  } catch (e) {
    console.log(e);
    console.log("error found!");
  }
});
app.get("/reduce/:id/:qty", (req, res, next) => {
  const quanityProudct = req.params.qty;
  const productId = req.params.id;
  const cart = new Cart(req.session.cart ? req.session.cart : {});
  
  cart.reduceItem(productId, quanityProudct);
  if (cart.totalQty <= 0) {
    cart.totalQty = 0;
    cart.totalPrice = 0;
    cart.ddsPrice = 0
    cart.totalCheckout = 0
    cart.promotionPrice = 0
    cart.promotionsItems = []

  }
  req.session.cart = cart;
  res.redirect(req.get("referer"));
});
app.get("/removeItem/:id", (req, res, next) => {
  const productId = req.params.id;
  const cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.removeItem(productId);
  if (cart.totalQty <= 0) {
    cart.totalQty = 0;
    cart.totalPrice = 0;
    cart.ddsPrice = 0
    cart.totalCheckout = 0
    cart.promotionPrice = 0
    cart.promotionsItems = []
  }
  req.session.cart = cart;
  res.redirect("/cart");
});
app.get("/cart", async(req, res, next) => {
  if (!req.session.cart) {
    return res.render(path.resolve("views/products/shopping-cart.ejs"), {
      products: null,
    });
  }
  
  let cart = new Cart(req.session.cart);
  let cartArray = cart.generateArray()
  res.render(path.resolve("views/products/shopping-cart.ejs"), {
    cart: cart,
    products: cartArray,
    totalPrice: cart.totalPrice,
  });
});

app.get("/checkout", checkAuthanticated, (req, res, next) => {
  if (!req.session.cart) {
    return res.redirect("cart");
  }
  const cart = new Cart(req.session.cart);
  res.render(path.resolve("views/products/checkoutPage.ejs"), {
    cart
  });
});
app.get("/checkoutcard", async (req, res, next) => {
  const cart = new Cart(req.session.cart);
  const itemsValues = Object.values(cart.items);
  // const items =
  res.render(path.resolve("views/products/checkoutCard.ejs"), {
    total: cart.totalPrice,
  });
});
app.post("/makeDelivery", async (req, res) => {
  try {
    const cart = new Cart(req.session.cart);

    const itemsValues = Object.values(cart.items);
    const order = new Order({
      user: req.user,
      cart: cart,
      name: req.body.name,
      telephone: req.body.telephone,
      city: req.body.city,
      address: req.body.address,
      description: req.body.description,
      orderStatus: "waiting",
    });
    order.save(function (err, result) {
      if (err) return console.log(err);
      req.session.cart = null;
      res.redirect("/account");
    });
  } catch (e) {
    console.log(e.error);
  }
});
app.post("/getProductsSearch", async (req, res) => {
  let payload = req.body.payload.trim();
  let search = await Products.find({
    nameToDisplay: { $regex: new RegExp("^" + payload + ".*", "i") },
    "subsection.items.katNomer":  { $regex: new RegExp("^" + payload + ".*", "i") },
  }).exec();
  let subsectionFound = await Products.find({
    "subsection.items.katNomer": payload
  })
  const foundItems = []
 if(subsectionFound.length > 0){
  //  Section
    outer: for(const searchedItem of subsectionFound){
      // subsection
      inner: for(const subItem of searchedItem.subsection){
        // Items
        innerItems: for(const items of subItem.items){
            if(items.katNomer == payload){
              foundItems.push({
                section: searchedItem.name,
                subsection: subItem.tiput,
                secDisplay: searchedItem.nameToDisplay,
                subSecDisplay: subItem.nameToDisplay
              })
            }
        }
      }
    }
 }


  //Limit search results to 10
  search = search.slice(0, 6);
  res.send({ payload: search, subsection: foundItems });
});


// Connect to mongodb
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Mongoose"));

mongoose
  // .connect("mongodb://localhost:27017/mybrary", {
  .connect("mongodb://localhost:27017/mybrary", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    server.listen(port, "0.0.0.0", () => {
      console.log(`Application worker ${process.pid} started...`);
      console.log(`Server running at http://${hostname}${port}/`);
      // console.dir(ip.address());
    });
  })
  .catch((error) => {
    console.log(error);
  });
function checkAuthanticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/account/login");
}
