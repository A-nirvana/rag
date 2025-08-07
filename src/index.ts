import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

import pdfParse from 'pdf-parse';
const app = express();
const upload = multer({ dest: 'uploads/' }); // Destination folder for uploaded files

// Initialize the Generative AI client (replace with your API key or environment variable)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);


app.get('/', (req, res) => {
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}!`);
});

app.post('/api/vectorize', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    let fileContent: string;

    if (req.file.mimetype === 'application/pdf') {
      const data = await pdfParse(fs.readFileSync(req.file.path));
      fileContent = data.text;
    } else {
      fileContent = fs.readFileSync(req.file.path, 'utf-8');
    }
    const result = await model.embedContent(fileContent);
    fs.unlinkSync(req.file.path); // Clean up the uploaded file
    res.json(result.embedding.values);
  } catch (error) {
    console.error('Error vectorizing file:', error);
    res.status(500).send('Error vectorizing file.');
  }
});

const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});