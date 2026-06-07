import express from 'express';
import morgan from 'morgan';

const app = express();

// middleware
app.use(morgan('combined'));
app.use(express.json());

// routes
app.get('/api/ai/healthz', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

export default app;