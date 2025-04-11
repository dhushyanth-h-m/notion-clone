import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("Backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});