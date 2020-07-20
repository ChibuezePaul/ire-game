//Dependencies Declaration
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require('path');
const config = require("./core/config.json");
const User = require("./models/users");

//App init
const app = express();
const port = process.env.PORT || config.port;
mongoose.connect(config.dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {
  console.log("Database connected successfully");
});

//Middlewares
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  return next();
});
app.use(express.static(path.join(__dirname, 'public/doc')));
app.use(function (req, res, next) {
  if (req.headers['x-forwarded-proto'] === 'https') {
    return res.redirect('http://' + req.hostname + req.url);
  } else {
    return next();
  }
});

const BASE_URL = "/api/user/"
const UserQuery = User.find({ delFlag: "N" });


//App Resources
app.get("/", (req, res) => res.render("index"))

app.post(BASE_URL, (req, res) => {
  if (!req.body) {
    return res.status(400).json(sendErrorMessage("Missing User Details"));
  }
  const { username, password, email, phone, gender, location, avatarId } = req.body;

  const newUser = new User({
    username: username,
    password: password,
    email: email,
    phone: phone,
    gender: gender,
    location: location,
    avatarId: avatarId
  });

  const error = newUser.validateSync();

  if (error) {
    console.log(`Bad Detais sent for user with email: ${email}`);
    return res.status(400).json(sendErrorMessage(error.message.replace("User validation failed:", "").split(",")));
  }
  else {
    bcrypt.genSalt(10, (error, salt) => {
      bcrypt.hash(password, salt, (error, hash) => {
        if (error) {
          console.log(`Error occured hashing password for new user with email: ${email}`);
          return res.status(400).json(sendErrorMessage(error));
        }
        else {
          newUser.password = hash;
          newUser.save(error => {
            if (error) {
              console.log(`Error occured saving new user with email ${email}: ${error}`);
              return res.status(400).json(sendErrorMessage(error));
            }
            else {
              return res.status(200).json(sendSuccessMessage(filterUerInfo(newUser)));
            }
          })
        }
      })
    })
  }
})

app.post(BASE_URL + "login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (!username || !password) {
    return res.status(400).json(sendErrorMessage());
  }

  UserQuery.findOne({ username: username }, function (error, user) {
    if (error) { return res.status(400).json(sendErrorMessage(error, 400)); }
    if (!user) {
      return res.status(404).json(sendErrorMessage(`User not found with username: ${username}`, 404));
    }
    bcrypt.compare(password, user.password, (error, isMatch) => {
      if (error) {
        throw error;
      }
      if (isMatch) {
        jwt.sign({ user }, config.secretKey, (error, token) => {
          return res.status(200).json(sendSuccessMessage("Bearer " + token));
        })
      }
      else {
        return res.status(400).json(sendErrorMessage('Incorrect password'));
      }
    });
  });
})

app.get(BASE_URL + ":id", verifyToken, (req, res) => {
  jwtVerify(req, res);
  const id = req.params.id;
  UserQuery.findOne({ _id: id }, (error, user) => {
    if (error) {
      console.log(`Error occured fetching user with id ${id}: ${error}`);
      return res.status(400).json(sendErrorMessage(error, 400));
    }
    if (!user) {
      return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
    }
    else {
      return res.status(200).json(sendSuccessMessage(filterUerInfo(user)));
    }
  });
})

app.put(BASE_URL + ":id", verifyToken, (req, res) => {
  jwtVerify(req, res);
  const { username, email, phone, location, avatarId } = req.body;
  const id = req.params.id;
  UserQuery.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        username, email, phone, location, avatarId
      }
    },
    {
      new: true,
      useFindAndModify: false
    },
    (error, user) => {
      if (error) {
        console.log(`Error occured fetching user with id ${id}: ${error}`);
        return res.status(400).json(sendErrorMessage(error, 400));
      }
      if (!user) {
        return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
      }
      else {
        return res.status(200).json(sendSuccessMessage(filterUerInfo(user)));
      }
    }
  )
})

app.delete(BASE_URL + ":id", verifyToken, (req, res) => {
  jwtVerify(req, res);
  const id = req.params.id;
  UserQuery.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        delFlag: "Y"
      }
    },
    {
      new: true,
      useFindAndModify: false
    },
    (error, user) => {
      if (error) {
        console.log(`Error occured fetching user with id ${id}: ${error}`);
        return res.status(400).json(sendErrorMessage(error, 400));
      }
      if (!user) {
        return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
      }
      else {
        return res.status(200).json(sendSuccessMessage(filterUerInfo(user)));
      }
    }
  )
})

app.get(BASE_URL, verifyToken, (req, res) => {
  jwtVerify(req, res);
  UserQuery.find({}, (error, users) => {
    if (error) {
      console.log(`Error occured fetching users: ${error}`);
      return res.status(400).json(sendErrorMessage(error, 400));
    }
    if (users.length == 0) {
      return res.status(404).json(sendErrorMessage("No user found in database", 404));
    }
    else {
      return res.status(200).json(sendSuccessMessage(users.map(user => filterUerInfo(user))));
    }
  })
})

function verifyToken(req, res, next) {
  if ((!req.url == BASE_URL || !req.url == BASE_URL + "login") && + req.method == "POST") {
    const bearerHeader = req.headers["authorization"];
    if (!bearerHeader) {
      return res.status(403).json(sendErrorMessage('Missing Header Token', 403));
    }
    const token = bearerHeader.split(" ")[1];
    req.token = token;
    return next();
  }
  return next();
}

function jwtVerify(req, res) {
  jwt.verify(req.token, config.secretKey, (error, authData) => {
    if (error) {
      return res.status(403).json(sendErrorMessage("Unauthorized Request", 403))
    }
  })
}

function sendErrorMessage(message, code = 400) {
  return {
    code, message: `${message || 'Bad Request'}`
  }
}

function sendSuccessMessage(message, code = 200) {
  return {
    code: `${code}`, message
  }
}

function filterUerInfo(doc) {
  return doc.toObject({
    versionKey: false,
    transform: (doc, ret, options) => {
      delete ret.password;
      delete ret.delFlag;
      return ret;
    }
  })
}
//Server Startup
app.listen(port, console.log(`IRE Game Server Started On Port ${port}...`))
