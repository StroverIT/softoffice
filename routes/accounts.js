const express = require("express");
const router = express.Router();
const path = require("path");
const passport = require("passport");
const session = require("express-session");
const methodOverride = require("method-override");
const initiliazePassport = require("../views/userAuthantication/passport-config");
const flash = require("express-flash");
const bcrypt = require("bcrypt");

const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const assert = require("assert");

// Mongo db
const db = mongoose.connection;
const ObjectId = require("mongodb").ObjectId;

// Models

const Users = require("../models/Users");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
// Collections
const collection = db.collection("users");
const products = db.collection("products");
const users = db.collection("users")
// const Person = new User();
const Token = require("../models/token");
const crypto = require("crypto")
const sendEmail = require("../utils/email")
initiliazePassport(
  passport,
  (email) => collection.findOne((user) => user.email === email),
  (id) => collection.findOne((user) => user.id === id)
);

router.use(bodyParser.json());

router.use(passport.initialize());
router.use(passport.session());
router.use(flash());

router.use(bodyParser.urlencoded({ extended: true }));
router.use(methodOverride("_method"));

router.get("/", checkAuthanticated, async (req, res) => {
  try {
    let name = await Users.findById(req.user);
    let role = await name.role;
   Order.find({ user:req.user }, function (err, orders) {
      if (err) {
        return res.write("Error");
      }
      var cart;
      orders.forEach(function (order) {
        cart = new Cart(order.cart);
        order.items = cart.generateArray();
      });
        // User
    if (role == "admin") {
      const totalCollections = mongoose.connections[0].collections;
      const currentCollections = [];
      Object.keys(totalCollections).forEach(function (k) {
        currentCollections.push(k);
      });
      res.render(path.resolve("views/userAuthantication/admin.ejs"), {
        name: name.username,
        collections: currentCollections,
        collectionType: "",
        orders: orders,
      });
    } else {
      res.render(path.resolve("views/userAuthantication/account.ejs"), {
        user: name,
        name: name.username,
        orders: orders,
      });
    }
    });

  
  } catch (error) {
    console.error(error);
    res.status(500).send("Oopss...");
  }

  console.log("You enter account section");
});

// Login
router.get("/login", checkNotAuthenticated, (req, res) => {

  res.render(path.resolve("views/userAuthantication/login.ejs"));
});
router.post("/login",checkNotAuthenticated,passport.authenticate("local", {
    failureRedirect: "/account/login",
    failureFlash: true,
  }),
  function (req, res, next) {
    if (req.session.oldUrl) {
      const oldUrl = req.session.oldUrl;
      req.session.oldUrl = null;
      res.redirect(`/account${oldUrl}`);
    } else {
      res.redirect("/account");
    }
  }
);
// Register

router.get("/register", checkNotAuthenticated, (req, res) => {
  res.render(path.resolve("views/userAuthantication/register.ejs"));
  // console.log(req.body.name);
});

router.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    console.log(req.body);
    let user = await Users.findOne({ email: req.body.email });
    if (user)
      return res.status(400).send("Вече същестува такъв имейл!");

     user = await new Users({
      email: req.body.email,
      username: req.body.name,
      password: req.body.password,
      role: "user",
    }).save()
    let token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex")
    }).save()
    // bug
    const message = `
    <h3>За потвърждаване на имейла в softoffice.bg, цъкнете линка:</h2>
    <br>
    <a href="https://${process.env.BASE_URL}/account/verify/${user._id}/${token.token}">Цъкни тук</a>
    `
await sendEmail("softofficepayment@gmail.com",user.email, "verify email", message)

    res.redirect("/account/login");
 
    // console.log(req.session);
    console.log("success");
  } catch(error) {
    console.log(error);
    res.redirect("/account/register");
    console.log("fail");
  }
});
router.delete("/logout", (req, res) => {
  req.logOut();
  
  res.redirect("/account/login");
});
router.get("/verify/:id/:token", checkNotAuthenticated, async(req,res)=>{
  try {
    const user = await Users.findOne({_id: req.params.id})
    if(!user) return res.status(400).send("Невалиден линк")

    const token = await Token.findOne({userId: user._id, token: req.params.token})
    if(!token) return res.status(400).send("Невалиден линк.")

    await Users.updateOne({_id: user._id}, {$set: {isVerifed: true}})
    await Token.findByIdAndDelete(token._id)
    res.redirect("/account/login")

  } catch (error) {
    console.log(error);
    res.status(400).send("Възникна проблем")
  }
})
router.get("/forgotenPassword",checkNotAuthenticated,(req,res)=>{
  const forgottenPassMess = req.flash("forgottenPass")
  const isFound = req.flash("isFound")
  res.render(path.resolve("views/userAuthantication/forgotenPassword.ejs"), {forgottenPassMess, isFound})
})
router.post("/forgotenPassword",checkNotAuthenticated, async(req,res)=>{
  const email = req.body.email
  const isFound = await users.findOne({email})

  if(isFound){
    req.flash("forgottenPass", "Заявката беше изпратена успешно!")
    req.flash("isFound", "true")
    let token = await new Token({
      userId: isFound._id,
      token: crypto.randomBytes(32).toString("hex")
    }).save()
    const message = `
    <h3>За връщане на паролата цъкнете линка:</h2>
    <br>
    <a href="https://${process.env.BASE_URL}/account/resetPassword/${isFound._id}/${token.token}">Цъкни тук</a>
    `
  await sendEmail("softofficepayment@gmail.com",isFound.email, "verify email", message)

  }else{
    req.flash("forgottenPass", "Не беше намерен такъв имейл!")
    req.flash("isFound", "false")
  }

  res.redirect("/account/forgotenPassword")
})
router.get("/resetPassword/:id/:token", checkNotAuthenticated, async(req,res)=>{
  const isSame = req.flash("isSame")
  const id = req.params.id
  const token = req.params.token
  res.render(path.resolve("views/userAuthantication/resetPassword.ejs"), {isSame, id,token})
})
router.post("/resetPassword/:id/:token", checkNotAuthenticated, async(req,res)=>{
  const user = await Users.findOne({_id: req.params.id})
  if(!user) return res.status(400).send("Невалиден линк")

  const token = await Token.findOne({userId: user._id, token: req.params.token})
  if(!token) return res.status(400).send("Невалиден линк.")

  const firstPass = req.body.firstpassword
  const secondPass = req.body.secondpassword

  if(firstPass != secondPass){
    req.flash("isSame", "Паролите трябва да съвпадат")
    return res.redirect(req.get("referer"));
  }
  try{
  const salt = await bcrypt.genSalt(10);
  let hashedPass = await bcrypt.hash(secondPass, salt);
  users.updateOne({_id: ObjectId(req.params.id)}, {$set: {password: hashedPass}})
  await Token.findByIdAndDelete(token._id)

  console.log(hashedPass);
  res.redirect("/account/login")
}catch(e){
  return console.log(e)
}

})
function checkAuthanticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/account/login");
}
function checkNotAuthenticated(req, res, next) {
  // console.log("Login status:", req.isAuthenticated());
  if (req.isAuthenticated()) {
    return res.redirect("/account");
  }
  req.session.oldUrl = req.url;

  next();
}
module.exports = router;
