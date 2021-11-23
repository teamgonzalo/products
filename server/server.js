const path = require("path");
var express = require("express");
var router = require("./routes.js");
//var db = require("./db");

var app = express();
module.exports.app = app;

app.set("port", 5000);
app.use(express.json());
app.use("/", router);

if (!module.parents) {
  app.listen(app.get("port"));
  console.log(`Listening on http`, app.get("port"));
}
