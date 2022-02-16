const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const db = mongoose.connection;
const collection = db.collection("users");

function initialize(passport, getUserByEmail, getUserById) {
  const authanticateUser = async (email, password, done) => {
    const user = await collection.findOne({ email: email });
    // console.log(user);
    if (user == null) {
      return done(null, false, { message: "Не съществуващ имейл" });
    }
    if(!user.isVerifed){
      return done(null,false, {message: "Не ви е потвърден имейла"})
    }
    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Грешна парола" });
      }
    } catch (e) {
      return done(e);
    }
  };
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
      },
      authanticateUser
    )
  );
  // passport.serializeUser((user, done) => done(null, user.id));
  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser(async (_id, done) => {
    try {
      const user = await collection.findOne({ _id });
      // console.log(`id: ${user}`);
      done(null, _id);
      console.log("success");
    } catch (e) {
      done(e);
      console.log("fak");
    }
  });
}
module.exports = initialize;
