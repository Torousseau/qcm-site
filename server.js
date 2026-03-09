import express from 'express';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'src/storage/questions.json');

app.use(cors());
app.use(express.json());

app.post('/save-questions', (req, res) => {
    const questions = req.body;
    fs.writeFile(filePath, JSON.stringify(questions, null, 2), (err) => {
        if (err) return res.status(500).send("Erreur d'écriture");
        res.send("Questions sauvegardées dans le JSON !");
    });
});

app.listen(3001, () => console.log("Serveur de stockage actif sur http://localhost:3001"));