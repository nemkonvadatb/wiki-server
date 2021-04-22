var express = require("express");
var router = express.Router();
const auth = require("../auth-gates");
var ObjectId = require('mongodb').ObjectId;

// article_id, context, title, land_id kötelező
// {"article_id": 1618948513168, "context": "proba 999 + 1", "title":"P999 + 1", "lang_id": "hu"}
router.post("/create", auth, async (req, res, next) => {
  try {
    const checkArticleId = await req.db
      .collection("article")
      .findOne({ _id: req.body.article_id });

    const checkUserRole = await req.db
      .collection("user")
      .findOne({ _id: ObjectId(req.userId) });

    if (checkArticleId) {
      if (checkUserRole.role === "lector") {
        req.body.state = "accepted";
        req.body.reviewer_id = req.userId;
        archiveArtDetH(req);
        createArticleDetailsHistory(req);
        updateUserArticles(req, req.body.author_id);
        updateArticleLang(req);
        updateArtDet(req);
      } else {
        req.body.state = "underConsideration";
        req.body.reviewer_id = undefined;
        createArticleDetailsHistory(req);
      }
      res.status(200).send({ message: "new article_details_history created" });
    }
    else if (!checkArticleId && checkUserRole.role === "lector") {
      req.body.state = "accepted";
      req.body.reviewer_id = req.userId;

      await req.db
        .collection("article")
        .insertOne({ "_id": req.body.article_id, "author_id": req.userId, "lang_id": [req.body.lang_id] });

      createArticleDetailsHistory(req);
      createArticleDetails(req);
      updateUserArticles(req, ObjectId(req.userId));

      res.status(200).send({ message: "new article, article_details_history, article_detail created by lektor" });
    }
    else {
      res.status(400).send({ message: "article id not exists and only lector can create it" });
    }
  } catch (e) {
    next(e);
  }
});

// csak lektor fogadhat el cikket: state amit meg kell adni, a többi a kapott cikk adatai
// {"_id": "607f34f30f48ce4c2487d0b4", "article_id": 1618948513168, "state": "accepted", "context": "proba 999 + 1", "title":"P999 + 1", "lang_id": "hu"}
router.put("/stateChange", auth, async (req, res, next) => {
  try {
    req.body.reviewer_id = req.userId;

    if (req.body.state === "accepted") {
      archiveArtDetH(req);
      updateArtDHState(req);
      updateUserArticles(req, req.body.author_id);
      updateArticleLang(req);
      updateArtDet(req);

      res.status(200).send({ message: "updated userArticle, article_det_h, article, " });
    } else {
      updateArtDHState(req);
      res.status(200).send({ message: "article_det_h changed status to rejected" });
    }
  } catch (e) {
    next(e);
  }
});

// csak lektor listázhatja a nem elbírélt cikkeket
router.get("/listUnderCons", auth, async (req, res, next) => {
  try {
    res.status(200).send(
      await req.db.collection("article_details_history")
        .find({ "state": "underConsideration" }).toArray()
    );
  } catch (e) {
    next(e);
  }
});

router.get("/:id/:lang", async (req, res, next) => {
  try {
    res.status(200).send(
      await req.db.collection("article_details")
        .findOne({ "article_id": req.params.id, "lang_id": req.params.lang })
    );
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    res.status(200).send(
      await req.db.collection("article")
        .findOne({ "_id": req.params.id })
    );
  } catch (e) {
    next(e);
  }
});

const createArticleDetailsHistory = async (req) => {
  req.body.author_id = req.userId;
  await req.db
    .collection("article_details_history")
    .insertOne(req.body);
};

const createArticleDetails = async (req) => {
  await req.db
    .collection("article_details")
    .insertOne({
      "article_id": req.body.article_id, "lang_id": req.body.lang_id,
      "context": req.body.context, "title": req.body.title
    });
};

const updateUserArticles = async (req, u_id) => {
  await req.db
    .collection("user")
    .updateOne({ "_id": u_id }, { "$addToSet": { "article_participant": String(req.body.article_id) } });
};

const updateArticleLang = async (req) => {
  await req.db
    .collection("article")
    .updateOne({ "_id": req.body.article_id }, { "$addToSet": { "lang_id": req.body.lang_id } })
};

const updateArtDHState = async (req) => {
  await req.db
    .collection("article_details_history")
    .updateOne({ "_id": ObjectId(req.body._id) },
      { "$set": { "reviewer_id": req.userId, "state": req.body.state } });
};

const archiveArtDetH = async (req) => {
  await req.db
    .collection("article_details_history")
    .updateOne({ "article_id": req.body.article_id, "lang_id": req.body.lang_id, "state": "accepted" },
      { "$set": { "state": "archived" } });
};

const updateArtDet = async (req) => {
  await req.db
    .collection("article_details")
    .updateOne({ "article_id": req.body.article_id, "lang_id": req.body.lang_id },
      { "$set": { "context": req.body.context, "title": req.body.title } }, { upsert: true })
};

module.exports = router;