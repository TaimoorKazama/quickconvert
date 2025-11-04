import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));

// Multer setup for uploads
const upload = multer({ dest: "uploads/" });

// Convert DOCX → PDF
app.post("/convert-docx-to-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");

    const inputPath = req.file.path;
    const outputPath = path.join("converted", `${Date.now()}.pdf`);

    // Convert DOCX → HTML using Mammoth
    const { value: html } = await mammoth.convertToHtml({ path: inputPath });

    // Generate PDF from HTML using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({ path: outputPath, format: "A4" });
    await browser.close();

    // Send the PDF file to client
    res.download(outputPath, "converted.pdf", async (err) => {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    console.error("Conversion error:", error);
    res.status(500).send("Conversion failed");
  }
});

// Serve main HTML
app.get("/", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
