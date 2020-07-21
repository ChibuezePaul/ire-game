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
const port = process.env.PORT || config.PORT;
const dbUrl = process.env.DB_URL || config.DB_URL;
const secretKey = process.env.SECRET_KEY || config.SECRET_KEY;
const BASE_URL = "/api/user/";

//Database Connection
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Database connected successfully"))
  .catch(() => console.log("Database connection error"));
mongoose.connection.on('error', error => console.log(`Database connection error: ${error.message}`));

//Middlewares
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');  return next();
});
app.use(express.static(path.join(__dirname, 'public/doc')));
app.use(function (req, res, next) {
  if (req.headers['x-forwarded-proto'] === 'https') {
    return res.redirect('http://' + req.hostname + req.url);
  } else {
    return next();
  }
});

//App Resources
app.get("/", (req, res) => res.render("index"));

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
    console.log(`Bad Details sent for user with username: ${username}`);
    return res.status(400).json(sendErrorMessage(error.message.replace("User validation failed:", "").split(",")));
  }
  bcrypt.genSalt(10, (error, salt) => {
    bcrypt.hash(password, salt, (error, hash) => {
      if (error) {
        console.log(`Error occurred hashing password for new user with email: ${email}`);
        return res.status(400).json(sendErrorMessage(error));
      }
      newUser.password = hash;
      newUser.save(error => {
          if (error) {
            console.log(`Error occurred saving new user with email ${email}: ${error}`);
            return res.status(400).json(sendErrorMessage(error));
          }
          return res.status(200).json(sendSuccessMessage(filterUerInfo(newUser)));
        });
    });
  })
});

app.post(BASE_URL + "login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (!username || !password) {
    return res.status(400).json(sendErrorMessage());
  }

  User.findOne({ username: username, delFlag: "N" }, function (error, user) {
    if (error) { return res.status(400).json(sendErrorMessage(error, 400)); }
    if (!user) {
      return res.status(404).json(sendErrorMessage(`User not found with username: ${username}`, 404));
    }
    bcrypt.compare(password, user.password, (error, isMatch) => {
      if (error) {
        throw error;
      }
      if (isMatch) {
        jwt.sign({ user }, secretKey, (error, token) => {
          return res.status(200).json(sendSuccessMessage("Bearer " + token));
        })
      }
      return res.status(400).json(sendErrorMessage('Incorrect password'));
    });
  });
});

app.get(BASE_URL + ":id", verifyToken, (req, res, next) => {
  jwtVerify(req, res, next);
  const id = req.params.id;
  User.findOne({ _id: id, delFlag: "N" }, (error, user) => {
    if (error) {
      console.log(`Error occured fetching user with id ${id}: ${error}`);
      return res.status(400).json(sendErrorMessage(error, 400));
    }
    if (!user) {
      return res.status(404).json(sendErrorMessage(`User not found with id: ${id}`, 404));
    }
    return res.status(200).json(sendSuccessMessage(filterUerInfo(user)));
  });
});

app.put(BASE_URL + ":id", verifyToken, (req, res, next) => {
  jwtVerify(req, res);
  const { username, email, phone, location, avatarId } = req.body;
  const id = req.params.id;
  User.findOneAndUpdate(
    { _id: id, delFlag: "N" },
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
      return res.status(200).json(sendSuccessMessage(filterUerInfo(user)));
    }
  );
});

app.delete(BASE_URL + ":id", verifyToken, (req, res, next) => {
  jwtVerify(req, res, next);
  const id = req.params.id;
  User.findOneAndUpdate(
    { _id: id, delFlag: "N" },
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
      return res.status(200).json(sendSuccessMessage(filterUerInfo(user)));
    }
  )
});

app.get(BASE_URL, verifyToken, (req, res, next) => {
  jwtVerify(req, res, next);
  User.find({ delFlag: "N" }, (error, users) => {
    if (error) {
      console.log(`Error occurred fetching users: ${error}`);
      return res.status(400).json(sendErrorMessage(error, 400));
    }
    if (users.length === 0) {
      return res.status(404).json(sendErrorMessage("No user found in database", 404));
    }
    return res.status(200).json(sendSuccessMessage(users.map(user => filterUerInfo(user))));
  })
});

function verifyToken(req, res, next) {
  const url = req.url;
  if ((url != BASE_URL || url != BASE_URL + "login") && req.method == "POST") {
    const bearerHeader = req.headers["authorization"];
    if (!bearerHeader) {
      return res.status(403).json(sendErrorMessage('Missing Header Token', 403));
    }
    const token = bearerHeader.split(" ")[1];
    req.token = token;
    return next();
  } else {
    next();
  }

}

function jwtVerify(req, res, next) {
  const url = req.url;
  if ((url != BASE_URL || url != BASE_URL + "login") && req.method == "POST") {
    jwt.verify(req.token, secretKey, (error, authData) => {
      if (error) {
        return res.status(403).json(sendErrorMessage("Unauthorized Request", 403))
      }
    })
  }
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

function filterUerInfo(user) {
  return user.toObject({
    versionKey: false,
    transform: (doc, ret, options) => {
      delete ret.password;
      delete ret.delFlag;
      return ret;
    }
  })
}

//Server Startup
app.listen(port, console.log(`IRE Game Server Started On Port ${port}...`));
