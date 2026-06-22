import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const DATA_DIR = path.join(__dirname, '../data');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');
const TELEMETRY_FILE = path.join(DATA_DIR, 'telemetry.log');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

app.post('/api/telemetry', (req, res) => {
    const event = {
        timestamp: new Date().toISOString(),
        ...req.body
    };
    fs.appendFileSync(TELEMETRY_FILE, JSON.stringify(event) + '\n');
    console.log(`[Telemetry] ${event.eventName || event.event}`);
    res.status(200).send({ success: true });
});

app.post('/api/feedback', (req, res) => {
    const feedback = {
        timestamp: new Date().toISOString(),
        ...req.body
    };
    
    let existing = [];
    if (fs.existsSync(FEEDBACK_FILE)) {
        try {
            existing = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8'));
        } catch (e) {
            existing = [];
        }
    }
    existing.push(feedback);
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(existing, null, 2));
    console.log(`[Feedback] Received ${feedback.rating} star rating.`);
    
    res.status(200).send({ success: true });
});

app.listen(3001, () => {
    console.log('Telemetry and Feedback API server running on port 3001');
});
