const express = require("express");
const router = express.Router();
const db = require("./db");
require("dotenv").config();

// Új AI chat üzenet
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Üzenet szükséges!" });
    }

    // OpenRouter API integráció
    const OPENROUTER_API_KEY = process.env.OPENROUTER_KEY;
    const OPENROUTER_MODEL =
      process.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo";

    if (!OPENROUTER_API_KEY) {
      console.error("OpenRouter API key nincs beállítva!");
      return res
        .status(500)
        .json({ error: "AI szolgáltatás konfiguráció hiba!" });
    }

    // System prompt a szállás foglaláshoz
    const systemPrompt = `Te egy magyar nyelvű, barátságos AI asszisztens vagy a FoglaljLe.hu szállásfoglaló weboldalon.
    
    Feladataid:
    - Segíts a felhasználóknak szállások keresésében és foglalásában
    - Adj információkat a szállásokról, szolgáltatásokról
    - Válaszolj kérdésekre a foglalási folyamatról
    - Légy udvarias, segítőkész és barátságos
    - Mindig magyarul válaszolj
    - Ha nem tudod a választ, mondd el őszintén
    
    A weboldal funkcióit:
    - Szállások böngészése és keresése
    - Foglalás létrehozása dátumok alapján
    - Vélemények olvasása
    - Térképes megjelenítés
    - Wellness és gyógyfürdő ajánlatok
    
    Tartsd röviden a válaszaidat (max 2-3 mondat), és légy természetes!`;

    // OpenRouter API hívás
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:4200", // A frontend URL
          "X-Title": "FoglaljLe Szállásfoglaló",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API error:", errorData);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    res.json({ response: aiResponse });
  } catch (error) {
    console.error("AI chat error:", error);

    // Fallback válaszok hiba esetén
    const fallbackResponses = [
      "Sajnálom, jelenleg technikai problémák merültek fel. Kérlek, próbáld újra később!",
      "Hoppá! Valami hiba történt. Próbáld meg újra pár másodperc múlva!",
      "Úgy tűnik, kapcsolódási hiba lépett fel. Kérlek, frissítsd az oldalt!",
    ];

    const randomFallback =
      fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    res.json({
      response: randomFallback,
      error: true,
    });
  }
});

module.exports = router;
