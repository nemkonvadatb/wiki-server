var express = require("express");
const db = require("../db-connect");
var router = express.Router();
const auth = require("../auth-gates");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.get("/:name", auth, async (req, res, next) => {
  try {
    const asd = await db("SELECT * FROM users WHERE name=:value", [
      req.params.name,
    ]);
    res.send(asd);
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const user = await db("SELECT * FROM users WHERE email=:email", [
      req.body.email,
    ]);

    if (!user.rows.length) {
      res.sendStatus(400);
    } else {
      await bcrypt
        .compare(req.body.password, user.rows[0][1])
        .then((result) => {
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
    const checkUser = await db("SELECT id FROM users WHERE email=:email", [
      req.body.email,
    ]);
    if (checkUser.rows.length) {
      res.sendStatus(409);
    } else {
      await bcrypt
        .hash(req.body.password, parseInt(process.env.PASSWORD_SALT))
        .then((hash) => {
          req.body.password = hash;
        });

      await db(
        "INSERT INTO users(name, password, email, role, specialization, institution, academic_degree_id)" +
          "VALUES (:name, :password, :email, :role, :specialization, :institution, :academic_degree_id)",
        [
          req.body.name,
          req.body.password,
          req.body.email,
          req.body.role || null,
          req.body.specialization || null,
          req.body.institution || null,
          req.body.academic_degree_id || null,
        ]
      ).then(() =>
        res.status(201).send({ message: "Successful registration!" })
      );
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
