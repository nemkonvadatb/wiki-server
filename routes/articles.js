  var express = require("express");
  var router = express.Router();
  const auth = require("../auth-gates");
  var ObjectId = require('mongodb').ObjectId;

  // teljesen új cikket hoz létre az article_detailsbe és felveszi ugyanezt az ID-t az article táblába plusz a felhasználóhoz aki létrehozta
  router.post("/create", auth, async (req, res, next) => {
      try {
        const checkArticleId = await req.db
        .collection("article")
        .findOne({article_id: req.body.article_id});

        const checkArticle = await req.db
        .collection("article_details")
        .findOne({article_id: req.body.article_id, lang: req.body.lang});

        if (!checkArticle){
          if(!req.body.context || !req.body.title || !req.body.lang || !req.body.article_id) {
            res.status(400).send({ message: "Missing data!" });
          } else {
            console.log("articles: " + req.userId)
            await req.db
              .collection("article_details")
              .insertOne(req.body)
              .then(() => {
                res.status(200).send({ message: "new record in article_details!" });
                console.log("cikk_id: ", req.body._id);

                if (!checkArticleId){
                  req.db
                  .collection("article")
                  .insertOne({"article_id":req.body.article_id, "author_id":req.userId, "lang_id": [req.body.lang]})
                  .then(() => console.log("ok" ))
                  .catch((e) => console.log(e));

                  req.db
                  .collection("user")
                  .updateOne({ "_id": ObjectId(req.userId)}, {"$push": {"article_participant": String(req.body.article_id)}})
                  .then(() => console.log("ok" ))
                  .catch((e) => console.log(e));
                }
                else if (checkArticleId && !checkArticleId.lang_id.includes(req.body.lang)){
                  req.db
                  .collection("article")
                  .updateOne({ "article_id": req.body.article_id}, {"$push": {"lang_id": req.body.lang}})
                  .then(() => console.log("ok" ))
                  .catch((e) => console.log(e));
                }
                else{
                  console.log("Exsisting article on given lang.")
                }
              })
              .catch(() => res.status(400).send({ message: "Something went wrong article_details!" }));
          }
        } else {
          res.status(400).send({ message: "Existing article_detail" });
        }

      } catch (e) {
        next(e);
      }
    });

  // cikket frissít az ID alapján az article_detailsbe
  router.put("/update", auth, async (req, res, next) => {
    try {
      const checkArticle = await req.db
        .collection("article_details")
        .findOne({ lang: req.body.lang, article_id: req.body.article_id });

      if (!req.body.lang || !req.body.article_id){
        res.status(400).send({ message: "Lang or article_id is missing"});
      } else if (!checkArticle) {
        res.status(400).send({ message: "Not existing article_details"});
      } else if(!req.body.context || !req.body.title || !req.body.lang) {
        res.status(400).send({ message: "Missing data!" });
    } else {
        await req.db
          .collection("article_details")
          .updateOne({ "_id": checkArticle._id}, { $set: {"context": req.body.context, "lang":req.body.lang, "title": req.body.title}})
          .then(() => res.status(200).send({ message: "Everything is fine! article_details updated" }))
          .catch((e) => res.status(400).send({ message: "Something went wrong!" + e }));
      }
    } catch (e) {
      next(e);
    }
  });
    
  // 1 db cikk keresése article_id és nyelv alapján
  router.get("/find_by_id_lang", async (req, res, next) => {
    await req.db
      .collection("article_details")
      .findOne({"article_id":req.body.article_id, "lang":req.body.lang})        
      .then((result) => {
        res.status(200).send(result);
      })
      .catch((e) => res.status(400).send({ message: "Something went wrong!" + e }));
  });

  // több cikk keresése csak article_id alapján
  router.get("/find_by_id", async (req, res, next) => {
    await req.db
      .collection("article")
      .find({"article_id":req.body.article_id}).toArray()     
      .then((result) => {
        res.status(200).send(result);
      })
      .catch((e) => res.status(400).send({ message: "Something went wrong!" + e }));
  });

  // több cikk keresése tag alapján (a tag space-el elválasztva: "alma kutya levél")
  router.get("/find_tag", async (req, res, next) => {
    var sea = req.body.tag.split(" ");
    var regex = [];
    for (var i = 0; i < sea.length; i++) {
        regex[i] = new RegExp(sea[i]);
    }

    await req.db
      .collection("article_details")
      .find({ context: {$in: regex}}).toArray()
      .then((result) => {
        res.status(200).send(result);
      })
      .catch((e) => res.status(400).send({ message: "Something went wrong!" + e }));
  });



  module.exports = router;