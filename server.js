// server.js
import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import fs from "fs";
import FormData from "form-data";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

// ✅ ConvertAPI endpoint
const CONVERT_API_URL = "https://v2.convertapi.com/convert/pdf/to/docx";

// ✅ Home route
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

// ✅ PDF → Word conversion
app.post("/convert/pdf-to-word", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send("No file uploaded");

  try {
    console.log("🔄 Attempting ConvertAPI (PDF → DOCX)");

    const formData = new FormData();
    formData.append("File", fs.createReadStream(file.path));
    formData.append("StoreFile", "true");

    const response = await fetch(CONVERT_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CONVERT_API_KEY}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (result?.Files?.[0]?.Url) {
      const downloadUrl = result.Files[0].Url;
      console.log("✅ ConvertAPI succeeded:", downloadUrl);
      return res.json({ downloadUrl });
    } else {
      console.error("⚠️ ConvertAPI failed:", result);
      return res.status(500).send("PDF to Word conversion failed.");
    }
  } catch (error) {
    console.error("❌ Conversion error:", error);
    res.status(500).send("Error converting file");
  } finally {
    fs.unlink(file.path, () => {}); // Cleanup
  }
});

// ✅ Word → PDF (local, working)
app.post("/convert/word-to-pdf", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send("No file uploaded");

  const outputFile = file.path + ".pdf";

  try {
    const { execSync } = await import("child_process");
    execSync(`libreoffice --headless --convert-to pdf "${file.path}" --outdir uploads`);
    const pdfBuffer = fs.readFileSync(outputFile);
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("❌ Word→PDF error:", error);
    res.status(500).send("Error converting Word to PDF");
  } finally {
    fs.unlink(file.path, () => {});
    if (fs.existsSync(outputFile)) fs.unlink(outputFile, () => {});
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
