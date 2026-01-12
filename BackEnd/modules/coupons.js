const express = require("express");
const router = express.Router();
const db = require("./db");

const COUPONS = {
  SUMMER26: { discount: 0.26, description: "Nyári kedvezmény 26%" },
  WINTER26: { discount: 0.26, description: "Téli kedvezmény 26%" }
};

router.post("/validate", (req, res) => {
  const { code, amount } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: "Kuponkód megadása kötelező" });
  }
  
  const upperCode = code.toUpperCase();
  const coupon = COUPONS[upperCode];
  
  if (!coupon) {
    return res.status(400).json({ error: "Érvénytelen kuponkód" });
  }
  
  const discountAmount = Math.round(amount * coupon.discount);
  const finalAmount = Math.round(amount * (1 - coupon.discount));
  
  res.json({
    valid: true,
    code: upperCode,
    discount: coupon.discount,
    discountAmount,
    finalAmount,
    description: coupon.description
  });
});

router.get("/list", (req, res) => {
  const couponList = Object.keys(COUPONS).map(code => ({
    code,
    discount: COUPONS[code].discount,
    description: COUPONS[code].description
  }));
  
  res.json(couponList);
});

module.exports = router;
