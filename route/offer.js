const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const isAuth = require("../middleware/auth");
const Offer = require("../models/Offer");
const User = require("../models/User");

// Delete
const deleteFunc = async (req, res, next) => {
  const offerInfo = await Offer.findById(req.fields.id);
  if (offerInfo) {
    // On peut pas comparer un objet a un autre objet 🤯🤯🤯🤯🤯
    const idFromPostman = req.user._id.toString();
    const idFromMongo = offerInfo.owner.toString();

    if (idFromPostman === idFromMongo) {
      await Offer.deleteOne({ _id: req.fields.id });
      return next();
    } else {
      res.status(401).json({ error: "This is not your Offer" });
      return next();
    }
  } else {
    res.status(400).json({ error: "Offer not found" });
  }
};

router.delete("/offer/delete", isAuth, deleteFunc, (req, res) => {
  res.json("Successfully deleted");
});

// Put (Modify)
const modifyFunc = async (req, res, next) => {
  const offerInfo = await Offer.findById(req.fields.id);
  if (offerInfo) {
    const idFromMongo = offerInfo.owner.toString();
    const idFromPostman = req.user._id.toString();
    if (idFromMongo === idFromPostman) {
      if (req.fields.title) {
        if (req.fields.title.length <= 50) {
          offerInfo.product_name = req.fields.title;
        }
      }
      if (req.fields.description) {
        if (req.fields.description.length <= 500) {
          offerInfo.product_description = req.fields.description;
        }
      }
      if (req.fields.price) {
        if (req.fields.price <= 100000) {
          offerInfo.product_price = req.fields.price;
        }
      }
      if (req.fields.condition) {
        offerInfo.product_details[2].brand = req.fields.condition;
      }
      if (req.fields.city) {
        offerInfo.product_details[4].city = req.fields.city;
      }
      if (req.fields.brand) {
        offerInfo.product_details[0].brand = req.fields.brand;
      }
      if (req.fields.size) {
        offerInfo.product_details[1].size = req.fields.size;
      }
      if (req.fields.color) {
        offerInfo.product_details[3].color = req.fields.color;
      }
      await offerInfo.save();
      return next();
    } else {
      res
        .status(401)
        .json({ error: "You can only modify offer that you created " });
    }
  } else {
    res.status(400).json({ error: "Offer not found" });
  }
};

router.put("/offer/modify", isAuth, modifyFunc, (req, res) => {
  if (req.fields.title.length > 50) {
    res.status(400).json({ error: "Title is to long" });
  } else if (req.fields.description.length > 500) {
    res.status(400).json({ error: "Description is to long" });
  } else if (req.fields.price > 100000) {
    res.status(400).json({ error: "Price is to high" });
  } else {
    res.json("Update Saved");
  }
});

// Publish
router.post("/offer/publish", isAuth, async (req, res) => {
  if (req.fields.description.length < 500) {
    if (req.fields.title.length < 50) {
      if (req.fields.price < 100000) {
        const newOffer = new Offer({
          product_name: req.fields.title,
          product_description: req.fields.description,
          product_price: req.fields.price,
          product_details: [
            { brand: req.fields.brand },
            { size: req.fields.size },
            { condition: req.fields.condition },
            { color: req.fields.color },
            { city: req.fields.city },
          ],
          owner: req.user,
        });

        await newOffer.save();

        const pictureToUpload = req.files.picture.path;
        const result = await cloudinary.uploader.upload(pictureToUpload, {
          folder: `vinted/offers/${newOffer._id}`,
        });
        newOffer.product_image = result;
        await newOffer.save();
        res.json(result);
      } else {
        res.status(400).json({ error: "price is to high" });
      }
    } else {
      res.status(400).json({ error: "title is to long" });
    }
  } else {
    res.status(400).json({ error: "description is to long" });
  }
});

//  /offers + get
router.get("/offers", async (req, res) => {
  try {
    let query = "Offer.find({";
    // Creating query
    if (req.query.title) {
      query += `product_name : new RegExp("${req.query.title}", "i"),`;
    }
    if (req.query.priceMin || req.query.priceMax) {
      if (!Number(req.query.priceMax)) {
        req.query.priceMax = 100000;
      }
      if (!Number(req.query.priceMin)) {
        req.query.priceMin = 0;
      }
      query += `product_price : { $gte : ${req.query.priceMin}, $lte: ${req.query.priceMax}}`;
    }
    query += "})";

    // Creating Methode
    const resultPerPage = 3;
    let moreMethode = "";
    if (req.query.sort === "price-desc" || req.query.sort === "price-asc") {
      req.query.sort = req.query.sort.replace("price-", "");
    } else {
      req.query.sort = undefined;
    }

    if (req.query.sort) {
      moreMethode += `.sort({product_price :"${req.query.sort}"})`;
    }
    let skipNumber = resultPerPage * (req.query.page - 1);
    if (skipNumber < 0) {
      skipNumber = 0;
    }
    moreMethode += `.limit(${resultPerPage}).skip(${skipNumber}).select("product_name product_price");`;

    if (moreMethode.length === 0) {
      query += `.limit(${resultPerPage}).select("product_name product_price");`;
    }
    const finalQuery = query + moreMethode;
    console.log(finalQuery);
    const result = await eval(finalQuery);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  const offerInfo = await Offer.findById(req.params.id);
  if (offerInfo) {
    res.json(offerInfo);
  } else {
    res.status(400).json({ error: "Offer not found" });
  }
});

module.exports = router;
