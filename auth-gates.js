const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const userId = jwt.verify(token, process.env.JWT_SECRET).rows[0][9];
    if (userId) {
      req.userId = userId;
      next();
    } else {
      throw "Invalid user ID";
    }
  } catch (e) {
    res.status(401).send("Invalid request!");
  }
};
