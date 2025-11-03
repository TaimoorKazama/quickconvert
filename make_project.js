// make_project.js — QuickConvert Project Builder
// Run: node make_project.js

const fs = require("fs");
const path = require("path");

const files = {
  "package.json": `{
  "name": "quickconvert",
  "version": "1.0.0",
  "description": "Convert Word to PDF and vice versa instantly online",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "axios": "^1.6.7",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "form-data": "^4.0.0",
    "multer": "^1.4.5-lts.1"
  }
}`,
  ".gitignore": `node_modules
.env`,
  "server.js": `const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.static('public'));

app.post('/api/convert', upload.single('file'), async (req, res) => {
  const { format } = req.body;
  const filePath = req.file.path;
  const formData = new FormData();
  formData.append('input', fs.createReadStream(filePath));
  formData.append('outputformat', format === 'pdf' ? 'pdf' : 'docx');

  try {
    const response = await axios.post('https://api.libreconvert.com/convert', formData, {
      headers: formData.getHeaders(),
      responseType: 'arraybuffer'
    });
    const outputFile = path.join(__dirname, 'uploads', \`output.\${format}\`);
    fs.writeFileSync(outputFile, response.data);
    res.download(outputFile, \`converted.\${format}\`, () => {
      fs.unlinkSync(filePath);
      fs.unlinkSync(outputFile);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Conversion failed');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));`,
  "README_DEPLOY.md": `# QuickConvert Deployment Guide

### 🚀 Deploy on Render
1. Push this folder to GitHub.
2. Go to [https://render.com](https://render.com) → New Web Service.
3. Connect your GitHub repo.
4. Build command: \`npm install\`
5. Start command: \`npm start\`
6. Done! Visit your live URL.

### 🧩 Features
- Convert DOCX ⇆ PDF
- SEO meta + sitemap ready
- No API key needed (uses LibreConvert)
`,
  "public/index.html": `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>QuickConvert | Word to PDF & PDF to Word Converter</title>
<meta name="description" content="Free online converter that lets you turn Word files into PDF and PDF into Word instantly — no signup required." />
<meta name="robots" content="index, follow" />
<link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div class="container">
    <h1>QuickConvert</h1>
    <p>Convert Word ⇆ PDF instantly — free and simple</p>
    <form id="convertForm">
      <input type="file" id="fileInput" required />
      <select id="formatSelect">
        <option value="pdf">Word → PDF</option>
        <option value="docx">PDF → Word</option>
      </select>
      <button type="submit">Convert</button>
    </form>
    <p id="status"></p>
  </div>
  <footer>Made with ❤️ by Novacraft Studio</footer>
  <script src="js/app.js"></script>
</body>
</html>`,
  "public/css/style.css": `body {
  font-family: Arial, sans-serif;
  background: #f8fbff;
  color: #333;
  margin: 0;
  padding: 0;
}
.container {
  max-width: 500px;
  margin: 80px auto;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.1);
  text-align: center;
}
h1 {
  color: #0078ff;
}
input, select, button {
  margin: 10px 0;
  padding: 10px;
  width: 100%;
}
button {
  background: #0078ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
button:hover {
  background: #005fcc;
}
footer {
  text-align: center;
  padding: 15px;
  color: #888;
  font-size: 0.9em;
}`,
  "public/js/app.js": `document.getElementById('convertForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('fileInput').files[0];
  const format = document.getElementById('formatSelect').value;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', format);
  const status = document.getElementById('status');
  status.innerText = 'Converting... please wait.';
  try {
    const response = await fetch('/api/convert', { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Conversion failed');
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'converted.' + format;
    link.click();
    status.innerText = 'Conversion successful!';
  } catch {
    status.innerText = 'Conversion failed. Try again.';
  }
});`,
  "public/privacy-policy.html": `<html><head><title>Privacy Policy | QuickConvert</title></head><body><h2>Privacy Policy</h2><p>We do not store any uploaded files. All conversions are processed securely and deleted immediately after.</p></body></html>`,
  "public/sitemap.xml": `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://quickconvert.onrender.com/</loc></url>
</urlset>`,
  "public/robots.txt": `User-agent: *
Allow: /
Sitemap: https://quickconvert.onrender.com/sitemap.xml`
};

function ensureDir(file) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
}

for (const [filename, content] of Object.entries(files)) {
  ensureDir(filename);
  fs.writeFileSync(filename, content);
}

console.log("✅ QuickConvert project created successfully!");
console.log("Now run:");
console.log("npm install");
console.log("npm start");
