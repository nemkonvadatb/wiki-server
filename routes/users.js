var express = require("express");
var router = express.Router();
const auth = require("../auth-gates");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.get("/:name", auth, async (req, res, next) => {
  try {
    res.send(
      await req.db.collection("user").find({ name: req.params.name }).toArray()
    );
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const user = await req.db
      .collection("user")
      .findOne({ email: req.body.email });
    if (!user) {
      res.sendStatus(400);
    } else {
      await bcrypt.compare(req.body.password, user.password).then((result) => {
        if (result) {
          const token = jwt.sign(user, process.env.JWT_SECRET);
          res.status(200).json({ token });
        } else res.sendStatus(401);
      });
    }
  } catch (e) {
    next(e);
  }
});

router.post("/create", async (req, res, next) => {
  try {
    const checkUser = await req.db
      .collection("user")
      .findOne({ email: req.body.email });

    if (checkUser) {
      res.sendStatus(409);
    } else {
      await bcrypt
        .hash(req.body.password, parseInt(process.env.PASSWORD_SALT))
        .then((hash) => {
          req.body.password = hash;
        });
      await req.db
        .collection("user")
        .insertOne(req.body)
        .then(() => res.sendStatus(201))
        .catch(() => res.sendStatus(409));
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
