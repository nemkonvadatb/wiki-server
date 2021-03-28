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
      res.status(400).send({ message: "User doesn't exists" });
    } else {
      await bcrypt.compare(req.body.password, user.password).then((result) => {
        if (result) {
          const token = jwt.sign(user, process.env.JWT_SECRET);
          res.status(200).json({ token });
        } else res.status(401).send({ message: "Bad password" });
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
      res.status(409).send({ message: "Existing user" });
    } else {
      await bcrypt
        .hash(req.body.password, parseInt(process.env.PASSWORD_SALT))
        .then((hash) => {
          req.body.password = hash;
        });
      await req.db
        .collection("user")
        .insertOne(req.body)
        .then(() => res.status(201).send({ message: "Everything is fine!" }))
        .catch(() => res.status(409).send({ message: "Something went wrong" }));
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
