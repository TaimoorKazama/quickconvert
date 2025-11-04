import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import dotenv from "dotenv";
import FormData from "form-data";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;
const CONVERT_API_KEY = process.env.CONVERT_API_KEY;

// Setup multer for uploads
const upload = multer({ dest: "uploads/" });

// Serve static files from /public
app.use(express.static("public"));

// Utility: convert locally using LibreOffice (fallback)
function localConvert(inputPath, outputPath, format) {
  return new Promise((resolve, reject) => {
    const command = `libreoffice --headless --convert-to ${format} "${inputPath}" --outdir "${path.dirname(
      outputPath
    )}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Local conversion error:", stderr);
        return reject(error);
      }
      console.log("Local conversion done:", stdout);
      resolve(outputPath);
    });
  });
}

// ✅ Word → PDF conversion
app.post("/convert/docx-to-pdf", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;

  try {
    console.log("🔄 Attempting ConvertAPI (DOCX → PDF)");
    const formData = new FormData();
    formData.append("File", fs.createReadStream(filePath));
    formData.append("StoreFile", "false");

    const response = await fetch("https://v2.convertapi.com/convert/docx/to/pdf", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CONVERT_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error("ConvertAPI failed");

    res.setHeader("Content-Disposition", "attachment; filename=converted.pdf");
    response.body.pipe(res);
  } catch (error) {
    console.warn("⚠️ ConvertAPI failed, switching to local LibreOffice:", error.message);
    try {
      const outputPath = filePath.replace(".docx", ".pdf");
      await localConvert(filePath, outputPath, "pdf");
      res.download(outputPath, "converted.pdf", () => {
        fs.unlinkSync(filePath);
        fs.unlinkSync(outputPath);
      });
    } catch (fallbackError) {
      res.status(500).send("Conversion failed. Try again later.");
    }
  }
});

// ✅ PDF → Word conversion
app.post("/convert/pdf-to-docx", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;

  try {
    console.log("🔄 Attempting ConvertAPI (PDF → DOCX)");
    const formData = new FormData();
    formData.append("File", fs.createReadStream(filePath));
    formData.append("StoreFile", "false");

    const response = await fetch("https://v2.convertapi.com/convert/pdf/to/docx", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CONVERT_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error("ConvertAPI failed");

    res.setHeader("Content-Disposition", "attachment; filename=converted.docx");
    response.body.pipe(res);
  } catch (error) {
    console.warn("⚠️ ConvertAPI failed, switching to local LibreOffice:", error.message);
    try {
      const outputPath = filePath.replace(".pdf", ".docx");
      await localConvert(filePath, outputPath, "docx");
      res.download(outputPath, "converted.docx", () => {
        fs.unlinkSync(filePath);
        fs.unlinkSync(outputPath);
      });
    } catch (fallbackError) {
      res.status(500).send("Conversion failed. Try again later.");
    }
  }
});

app.listen(PORT, () =>
  console.log(`✅ QuickConvert server running on port ${PORT}`)
);
