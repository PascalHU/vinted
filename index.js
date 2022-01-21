require("dotenv").config();
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const app = express();
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
app.use(formidable());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const offerRoute = require("./route/offer");
app.use(offerRoute);
const userRoute = require("./route/user");
app.use(userRoute);

app.all("*", (req, res) => {
  res.status(404).json({ error: "Page not found😭" });
});

app.listen(3000, () => {
  console.log("Server Started 🚀");
});
