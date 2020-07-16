//Dependencies Declaration
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const path = require('path');
const config = require("./core/config.json");
const User = require("./models/users");

//App init
const app = express();
const port = process.env.PORT || config.port;
mongoose.connect(config.dbUrl, { useNewUrlParser: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {
  console.log("Database connected successfully");
});

//Middlewares
app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});
app.use(express.static(path.join(__dirname, 'public/doc')));
app.use(function (req, res, next) {
  if (req.headers['x-forwarded-proto'] === 'https') {
    res.redirect('http://' + req.hostname + req.url);
  } else {
    next();
  }
});
// require("./core/passport")(passport);
// app.use(passport.initialize());

const BASE_URL = "/api/user/"


//App Resources
app.get("/", (req, res) => res.render("index"))

// app.all("*", (req, res, next) => {
//   res.status(400).json(sendError());
// })

app.get(BASE_URL+":id", (req, res) => {
  let id = req.params.id;

  User.findById({ "_id":id }, (error, user) => {
    if (error) {
      console.log(`Error occured fetching user with id ${id}: ${error}`);
      res.status(404).json(sendError(`User not found with id: ${id}`));
    }
    else {
      res.status(200).json(user);
    }
  })
})

app.put(BASE_URL+":id", (req, res) => {

  const { username, email, phone } = req.body;
  // const identifiers = [];
  // if (username) identifiers.push(username);
  // if (email) identifiers.push(email);
  // if (phone) identifiers.push(phone);

  const id = req.params.id;
  User.findOneAndUpdate(
    { "_id": req.params.id },
    {
      $set: {
        username, email, phone
      }
    },
    {
      new: true
    },
    (error, user) => {
      if (error) {
        console.log(`Error occured updating user with id ${id}: ${error}`);
        res.status(404).json(sendError(`User not found with id: ${id}`));
      }
      else {
        res.status(200).json(user);
      }
    }
  )
})

app.get(BASE_URL, (req, res) => {
  User.find({}, (error, users) => {
    if (error) {
      console.log(`Error occured fetching users: ${error}`);
      res.status(400).json(sendError(`No user found in database: ${error}`));
    }
    else {
      res.status(200).json(users);
    }
  })
})

app.post(BASE_URL, (req, res) => {
  if (!req.body) {
    res.status(400).json(sendError("Missing User Details"));
    return;
  }
  let { username, password, email, phone, gender } = req.body;

  const newUser = new User({
    username: username,
    password: password,
    email: email,
    phone: phone,
    gender: gender
  });

  const error = newUser.validateSync();

  if (error) {
    console.log(`Bad Detais sent for user with email: ${email}`);
    return res.status(400).json(sendError(error.message.replace("User validation failed:", "").split(",")));
  }
  else {
    bcrypt.genSalt(10, (error, salt) => {
      bcrypt.hash(password, salt, (error, hash) => {
        if (error) {
          console.log(`Error occured hashing password for new user with email: ${email}`);
          res.status(400).json(sendError(error));
          return;
        }
        else {
          newUser.password = hash;
          newUser.save(error => {
            if (error) {
              console.log(`Error occured saving new user with email ${email}: ${error}`);
              res.status(400).json(sendError(error));
              return;
            }
            else {
              res.status(200).json(newUser);
            }
          })
        }
      })
    })
  }
})

// app.post("/users/login", verifyToken, (req, res, next) => {
  
// })

app.post(BASE_URL+"/login", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  if (!username) {
    return res.status(400).json(sendError());
  }

  User.findOne({ username: username }, function (error, user) {
    if (error) { return res.status(400).json(sendError(error)); }
    if (!user) {
      return res.status(404).json(sendError(`User not found with username: ${username}`));
    }
    bcrypt.compare(password, user.password, (error, isMatch) => {
      if (error) {
        throw error;
      }
      if (isMatch) {
        return res.sendStatus(200);
        // jwt.sign({ user }, config.secretKey, (error, token) => {
        //   return res.status(200).json("Login Successful");
        // })
      }
      else {
        return res.status(400).json(sendError('Incorrect password'));
      }
    });
  });
})

// function verifyToken(req, res, next) {
//   const bearerHeader = req.headers["authorization"];
//   if (!bearerHeader) {
//     return res.status(403).json(sendError('Missing Bearer token'));
//   }
//   const token = bearerHeader.split(" ")[1];
//   req.token = token;
//   return next();
// }

function sendError(message) {
  return {"Error Occured": `${message || 'Bad Request'}`}
}

//Server Startup
app.listen(port, console.log(`IRE Game Server Started On Port ${port}...`))
