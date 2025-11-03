const express = require('express');
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
    const outputFile = path.join(__dirname, 'uploads', `output.${format}`);
    fs.writeFileSync(outputFile, response.data);
    res.download(outputFile, `converted.${format}`, () => {
      fs.unlinkSync(filePath);
      fs.unlinkSync(outputFile);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Conversion failed');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));