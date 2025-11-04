const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const PDFDocument = require("pdfkit");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

// --- WORD (.docx) ➜ PDF ---
app.post("/convert/docx-to-pdf", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const outputPath = filePath + ".pdf";

    const result = await mammoth.extractRawText({ path: filePath });
    const pdf = new PDFDocument();
    const writeStream = fs.createWriteStream(outputPath);
    pdf.pipe(writeStream);
    pdf.font("Times-Roman").fontSize(12).text(result.value, { align: "left" });
    pdf.end();

    writeStream.on("finish", () => {
      res.download(outputPath, "converted.pdf", () => {
        fs.unlinkSync(filePath);
        fs.unlinkSync(outputPath);
      });
    });
  } catch (err) {
    console.error("Conversion error:", err);
    res.status(500).send("Conversion failed");
  }
});

// --- PDF ➜ Word (.docx) ---
app.post("/convert/pdf-to-docx", upload.single("file"), async (req, res) => {
  const pdfParse = require("pdf-parse");
  try {
    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    const outputPath = filePath + ".docx";
    const { Document, Packer, Paragraph } = require("docx");

    const paragraphs = pdfData.text.split("\n").map(line => new Paragraph(line));
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);

    res.download(outputPath, "converted.docx", () => {
      fs.unlinkSync(filePath);
      fs.unlinkSync(outputPath);
    });
  } catch (err) {
    console.error("Conversion error:", err);
    res.status(500).send("Conversion failed");
  }
});

app.listen(PORT, () => console.log(`✅ QuickConvert server running on port ${PORT}`));
