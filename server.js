if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
//test
const hostname = "localhost" || "127.0.0.1";
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const bodyParser = require("body-parser");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const expressHbs = require("express-handlebars");
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

  // console.log(req.session);
  res.locals.session = req.session;
  next();
});
// Main page

app.get("/", async (req, res) => {
  const promotions = await promotionCollection.find({}).toArray()
  // console.log(promotions);
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
  res.render(path.resolve("views/otherPages/contactUs.ejs"));
});
app.post("/contactUs", (req, res, next) => {
  // console.log(req.body);
  // const transporter = nodemailer.createTransport({
  //   secure: true,
  //   service: "abv",
  //   auth: {
  //     user: `emilzlatinov1@gmail.bg`,
  //     pass: `nqmamBrat`,
  //   },
  //   tls: {
  //     rejectUnauthorized: false,
  //   },
  // });

  // const mailOptions = {
  //   from: req.body.email,
  //   to: `emilzlatinov1@gmail.bg`,
  //   subject: `Message from ${req.body.email}: ${req.body.problem}`,
  //   text: req.body.message,
  // };
  // transporter.sendMail(mailOptions, (error, info) => {
  //   if (error) {
  //     console.log(error);
  //     res.send("error");
  //   } else {
  //     console.log(`Email send: ${info.response}`);
  //     res.send("success");
  //   }
  // });
});
//Cart
app.get("/cart/:id/:qty", async (req, res, next) => {
  try {
    const productQty = req.params.qty;
    const productId = req.params.id;
    console.log(productQty)
    console.log(productId)
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
   cart.add(
    matched,
          matched.typeSection._id,
          productQty
        );
        req.session.cart = cart;
        // console.log(req.session.cart)
        res.redirect(req.get("referer"));
  } catch (e) {
    console.log(e.error);
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
    this.totalCheckout = 0
  }
  req.session.cart = cart;
  res.redirect(req.get("referer"));
});
app.get("/removeItem/:id", (req, res, next) => {
  const productId = req.params.id;
  const cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.removeItem(productId);
  
  req.session.cart = cart;
  res.redirect("/cart");
});
app.get("/cart", (req, res, next) => {
  if (!req.session.cart) {
    return res.render(path.resolve("views/products/shopping-cart.ejs"), {
      products: null,
    });
  }
  
  let cart = new Cart(req.session.cart);
  // console.log(cart)
  res.render(path.resolve("views/products/shopping-cart.ejs"), {
    cart: cart,
    products: cart.generateArray(),
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
    console.log(order);
  } catch (e) {
    console.log(e.error);
  }
});
app.post("/getProductsSearch", async (req, res) => {
  let payload = req.body.payload.trim();
  // console.log("Nodejs payload",payload)
  let search = await Products.find({
    nameToDisplay: { $regex: new RegExp("^" + payload + ".*", "i") },
  }).exec();

  // let search = await Products.find({nameToDisplay: {payload}}).exec()
  //Limit search results to 10
  search = search.slice(0, 4);
  res.send({ payload: search });
  // console.log(search)
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
