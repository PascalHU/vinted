const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    // Check si le champ username et email sont remplis
    if (req.fields.username && req.fields.email) {
      // On verifie si l'email existe deja dans la BDD
      const checkMailDuplicate = await User.findOne({
        email: req.fields.email,
      });
      // Si checkMailDuplicate est null c'est qu'il n'a pas trouvé l'email dans la BDD, nous creeons donc un nouveau user
      if (!checkMailDuplicate) {
        const salt = uid2(16);
        //  Hashage du mot de passe
        const hash = SHA256(req.fields.password + salt).toString(encBase64);
        // Creation du nouveau objet User
        const newUser = new User({
          email: req.fields.email,
          account: {
            username: req.fields.username,
            phone: req.fields.phone,
          },
          token: uid2(16),
          hash: hash,
          salt: salt,
        });
        // Sauvegarde BDD
        await newUser.save();
        const picture = await cloudinary.uploader.upload(
          req.files.picture.path,
          { folder: `vinted/profile/${newUser._id}` }
        );
        newUser.account.avatar = picture;
        await newUser.save();

        // Retour Postman
        res.json({
          account: newUser.account,
          _id: newUser._id,
          token: newUser.token,
        });

        // Tous les else
      } else {
        res.status(400).json({ error: { message: "Email already exist" } });
      }
    } else {
      res.status(400).json({ error: { message: " Missing Username / Email" } });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  // On vérifie si les champs email et password
  if (req.fields.email && req.fields.password) {
    // Check si l'email existe dans la BDD
    const checkLog = await User.findOne({ email: req.fields.email });
    if (checkLog) {
      const pw = SHA256(req.fields.password + checkLog.salt).toString(
        encBase64
      );
      if (pw === checkLog.hash) {
        // lecture de la bdd afin de resortir les infos de l'utilisateur
        const result = await User.findOne({
          email: req.fields.email,
        }).select("account _id token");
        // Retour Postman
        res.json(result);
      } else {
        res
          .status(401)
          .json({ error: { Unauthorized: " Incorrect password" } });
      }
    } else {
      res.status(401).json({ error: { Unauthorized: "Email not exist" } });
    }
  } else {
    res.status(400).json({ error: { message: "Missing Email / Password" } });
  }
});
module.exports = router;
