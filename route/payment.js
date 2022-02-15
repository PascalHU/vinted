const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cors = require("cors");

router.use(cors());

router.post("/payment", async (req, res) => {
  try {
    console.log(req.fields);

    const response = await stripe.charges.create({
      source: req.fields.token,
      amount: req.fields.amount * 100,
      currency: "eur",
      description: `Paiement pour ${req.fields.title}`,
    });
    console.log(response);
    if (response.status === "succeeded") {
      res.status(200).json({ message: "Paiement validé" });
    } else {
      res.status(400).json({ message: "An error occured" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
module.exports = router;
