const LocalStrategy = require("passport-local").Strategy;
const passport = require("passport");
const User = require("../models/users");
const config = require("./config.json");
const bcrypt = require("bcryptjs")

module.exports = function (passport) {
  //Local Strategy

  passport.use(new LocalStrategy(
    function(username, password, done) {
      User.findOne({ username: username }, function (err, user) {
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'No user found' });
        }
        bcrypt.compare(password, user.password, (error, isMatch) => {
          if (error) {
            throw error;
          }
          if (isMatch) {
            return done(null, user);
          }
          else {
            return done(null, false, { message: 'Incorrect password.' });
          }
        });
      });
    }
  ));

  
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });
}