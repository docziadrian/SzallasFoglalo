const express = require("express");
const router = express.Router();
const db = require("./db");

// Új AI chat üzenet
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Üzenet szükséges!" });
    }

    // TODO: Ide jön az AI logika (OpenAI API, stb.)
    // Egyelőre egy egyszerű válasz:
    const responses = [
      "Köszönöm a kérdésed! Jelenleg a szállások foglalásával kapcsolatban tudok segíteni.",
      "Érdekes kérdés! Nézzük meg, hogyan tudok segíteni.",
      "A FoglaljLe rendszerében számos szállás közül választhatsz.",
      "Szívesen segítek a foglalásodban!"
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    res.json({ response: randomResponse });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({ error: "Hiba történt a válasz generálásakor!" });
  }
});

module.exports = router;