const express = require("express");
const app = express();
const user = require("./routes/users");
const article = require("./routes/articles");
const helmet = require("helmet");
const compression = require("compression");
const auth = require("./auth-gates");
const MongoClient = require("mongodb").MongoClient;
let dbClient;

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

app.use(helmet());
app.use(compression());
app.use(require("cors")());
app.use(express.json());

app.use((req, res, next) => {
  req.db = dbClient.db("wiki");
  next();
});

app.use("/users", user);
app.use("/articles", article);

MongoClient.connect(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_URI}?retryWrites=true&w=majority`,
  { useUnifiedTopology: true },
  function (err, client) {
    if (err) throw err;
    dbClient = client;
    app.listen(process.env.PORT || 8080);
  }
);