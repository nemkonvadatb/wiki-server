const express = require('express');
const app = express();
const user = require("./routes/users");
const helmet = require('helmet');
const compression = require('compression');
const auth = require('./auth-gates');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

app.use(helmet());
app.use(compression());
app.use(require('cors')());
app.use(express.json());

app.use("/users", user);

app.listen(process.env.PORT || 8080);
