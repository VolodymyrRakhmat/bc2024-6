const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Command } = require('commander');

const app = express();
const upload = multer();

// Програма Commander для обробки CLI-параметрів
const program = new Command();
program
  .requiredOption('-h, --host <host>', 'Server host')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <cacheDir>', 'Cache directory path');

program.parse(process.argv);
const options = program.opts();

// Перевірка чи існує кеш-директорія
const cacheDir = path.resolve(options.cache);
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Маршрут GET /notes/<ім’я нотатки>
app.get('/notes/:noteName', (req, res) => {
  const notePath = path.join(cacheDir, req.params.noteName);

  if (!fs.existsSync(notePath)) {
    return res.status(404).send({ error: 'Note not found' });
  }

  const noteText = fs.readFileSync(notePath, 'utf8');
  res.send(noteText);
});

// Маршрут PUT /notes/<ім’я нотатки>
app.put('/notes/:noteName', express.text(), (req, res) => {
  const notePath = path.join(cacheDir, req.params.noteName);

  if (!fs.existsSync(notePath)) {
    return res.status(404).send({ error: 'Note not found' });
  }

  fs.writeFileSync(notePath, req.body, 'utf8');
  res.send({ message: 'Note updated successfully' });
});

// Маршрут DELETE /notes/<ім’я нотатки>
app.delete('/notes/:noteName', (req, res) => {
  const notePath = path.join(cacheDir, req.params.noteName);

  if (!fs.existsSync(notePath)) {
    return res.status(404).send({ error: 'Note not found' });
  }

  fs.unlinkSync(notePath);
  res.send({ message: 'Note deleted successfully' });
});

// Маршрут GET /notes
app.get('/notes', (req, res) => {
  const notes = fs.readdirSync(cacheDir).map((fileName) => {
    const filePath = path.join(cacheDir, fileName);
    const noteText = fs.readFileSync(filePath, 'utf8');
    return { name: fileName, text: noteText };
  });

  res.send(notes);
});

// Маршрут POST /write
app.post('/write', upload.none(), (req, res) => {
  const { note_name: noteName, note: noteText } = req.body;

  if (!noteName || !noteText) {
    return res.status(400).send({ error: 'Missing note_name or note' });
  }

  const notePath = path.join(cacheDir, noteName);

  if (fs.existsSync(notePath)) {
    return res.status(400).send({ error: 'Note already exists' });
  }

  fs.writeFileSync(notePath, noteText, 'utf8');
  res.status(201).send({ message: 'Note created successfully' });
});

// Маршрут GET /UploadForm.html
app.get('/UploadForm.html', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Upload Note</title>
    </head>
    <body>
      <h1>Upload a Note</h1>
      <form action="/write" method="POST" enctype="multipart/form-data">
        <label for="note_name">Note Name:</label>
        <input type="text" id="note_name" name="note_name" required>
        <br><br>
        <label for="note">Note Text:</label>
        <textarea id="note" name="note" required></textarea>
        <br><br>
        <button type="submit">Upload</button>
      </form>
    </body>
    </html>
  `;
  res.send(html);
});

// Запуск сервера
app.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
/**
 * @swagger
 * /notes:
 *   get:
 *     description: Отримати всі нотатки
 *     responses:
 *       200:
 *         description: Успішна відповідь
 */
app.get('/notes', (req, res) => {
  res.send([]);
});
