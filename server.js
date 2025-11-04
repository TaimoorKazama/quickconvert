import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import mammoth from "mammoth";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

// ✅ Convert Word → PDF
app.post("/convert/docx-to-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");

    const filePath = req.file.path;
    const result = await mammoth.extractRawText({ path: filePath });

    const pdfBuffer = await new Promise((resolve) => {
      const pdfDoc = new PDFDocument();
      const chunks = [];
      pdfDoc.on("data", (chunk) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));

      pdfDoc.font("Helvetica").fontSize(12).text(result.value || "Empty document");
      pdfDoc.end();
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=converted.pdf",
    });
    res.send(pdfBuffer);

    fs.unlinkSync(filePath); // Cleanup uploaded file
  } catch (err) {
    console.error("Conversion error:", err);
    res.status(500).send("❌ Failed to convert Word to PDF");
  }
});

// ✅ Root route
app.get("/", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

app.listen(PORT, () => console.log(`✅ QuickConvert running on port ${PORT}`));
