const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const PDFDocument = require("pdfkit");
const pdfParse = require("pdf-parse");
const { Document, Packer, Paragraph, TextRun } = require("docx");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));
app.use(express.json());

// Set up file uploads
const upload = multer({ dest: "uploads/" });

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ DOCX → PDF
app.post("/convert/docx-to-pdf", upload.single("file"), async (req, res) => {
  try {
    const docxPath = req.file.path;
    const { value: html } = await mammoth.convertToHtml({ path: docxPath });

    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    const pdfPath = path.join("uploads", `${Date.now()}.pdf`);
    const pdfDoc = new PDFDocument();
    pdfDoc.pipe(fs.createWriteStream(pdfPath));
    pdfDoc.font("Times-Roman").fontSize(12).text(text, { align: "left" });
    pdfDoc.end();

    pdfDoc.on("finish", () => {
      res.download(pdfPath, "converted.pdf", (err) => {
        fs.unlinkSync(docxPath);
        fs.unlinkSync(pdfPath);
        if (err) console.error("Download error:", err);
      });
    });
  } catch (error) {
    console.error("DOCX → PDF failed:", error);
    res.status(500).send("DOCX → PDF conversion failed.");
  }
});

// ✅ PDF → DOCX
app.post("/convert/pdf-to-docx", upload.single("file"), async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: pdfData.text.split("\n").map(
            (line) =>
              new Paragraph({
                children: [new TextRun(line)],
              })
          ),
        },
      ],
    });

    const docxBuffer = await Packer.toBuffer(doc);
    const docxPath = path.join("uploads", `${Date.now()}.docx`);
    fs.writeFileSync(docxPath, docxBuffer);

    res.download(docxPath, "converted.docx", (err) => {
      fs.unlinkSync(pdfPath);
      fs.unlinkSync(docxPath);
      if (err) console.error("Download error:", err);
    });
  } catch (error) {
    console.error("PDF → DOCX failed:", error);
    res.status(500).send("PDF → DOCX conversion failed.");
  }
});

// Start server
app.listen(PORT, () => console.log(`✅ QuickConvert server running on port ${PORT}`));
