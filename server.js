import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));

// Ensure folders exist
const uploadDir = "uploads";
const outputDir = "converted";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const upload = multer({ dest: uploadDir });

// Word → PDF conversion using LibreOffice
app.post("/convert-docx-to-pdf", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  const inputPath = path.resolve(req.file.path);
  const outputPath = path.resolve(outputDir);

  console.log(`Converting: ${inputPath}`);

  // LibreOffice command
  const command = `libreoffice --headless --convert-to pdf --outdir "${outputPath}" "${inputPath}"`;

  exec(command, (error) => {
    if (error) {
      console.error("Conversion error:", error);
      return res.status(500).send("Conversion failed.");
    }

    const outputFile = path.join(
      outputPath,
      path.basename(inputPath, ".docx") + ".pdf"
    );

    res.download(outputFile, "converted.pdf", (err) => {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputFile);
    });
  });
});

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

app.listen(PORT, () => console.log(`✅ QuickConvert running on port ${PORT}`));
