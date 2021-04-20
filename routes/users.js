var express = require("express");
var router = express.Router();
const auth = require("../auth-gates");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var ObjectId = require('mongodb').ObjectId; 

router.get("/:id", auth, async (req, res, next) => {
  try {
    res.send(
      await req.db.collection("user").find({ "_id": ObjectId(req.params.id)}).toArray()
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
          res.status(200).json({ token: token, id: user._id });
        } else res.status(400).send({ message: "Bad password" });
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
      res.status(400).send({ message: "Existing user" });
    } else {
      await bcrypt
        .hash(req.body.password, parseInt(process.env.PASSWORD_SALT))
        .then((hash) => {
          req.body.password = hash;
        });
      req.body.role="user";
      req.body.article_participant = []
      await req.db
        .collection("user")
        .insertOne(req.body)
        .then((e) => res.status(200).send({ message: "Everything is fine!"}))
        .catch(() => res.status(400).send({ message: "Something went wrong" }));
    }
  } catch (e) {
    next(e);
  }
});

router.put("/update", auth, async (req, res, next) => {
  try {
    const checkUser = await req.db
    .collection("user")
    .findOne({ email: req.body.email });

    await req.db
      .collection("user")
      .updateOne({ "email": checkUser.email}, {$set: {"name":req.body.name, "specialization":req.body.specialization, "institution":req.body.institution, "academic_degree":req.body.academic_degree, "lang":req.body.lang.split(" ")}})
      .then(() => res.status(200).send({ message: "Everything is fine! user updated" }))
      .catch((e) => res.status(400).send({ message: "Something went wrong!" + e }));
  } catch (e) {
    next(e);
  }
});

module.exports = router;