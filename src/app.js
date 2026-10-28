import express from 'express';
import { router as TransactionsRoute } from './routes/transactions.route.js';

const app = express();

app.use(express.json())


app.get('/', (_, res) => {
    res.status(200).json({ message: 'Welcome to the DevFinance API', status: res.statusCode })
})

app.use('/', TransactionsRoute);

export default app;