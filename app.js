const express = require("express");
const config = require("./config.json")


const app = express();
const port = process.env.PORT || config.port;

app.get("/", (req, res) => res.send("Welcome to IRE Game..."))

app.listen(port, console.log(`IRE Game Server Started On Port ${port}...`))
