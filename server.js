import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startServer(conn) {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));

  app.post("/api/pair", async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.json({ success: false, message: "Numéro manquant." });

    try {
      let codeBot = await conn.requestPairingCode(phone.replace(/\D/g, ""));
      codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
      res.json({ success: true, code: codeBot });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: "Erreur lors du pairing." });
    }
  });

  app.listen(PORT, () => {
    console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
  });
}
