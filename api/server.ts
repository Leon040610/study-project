import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { authRouter } from './routes/auth';
import { planRouter } from './routes/plans';
import { taskRouter } from './routes/tasks';
import { reminderRouter } from './routes/reminders';
import { resourceRouter } from './routes/resources';
import { goalRouter } from './routes/goals';
import { postRouter } from './routes/posts';
import { announcementRouter } from './routes/announcements';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/plans', planRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/reminders', reminderRouter);
app.use('/api/resources', resourceRouter);
app.use('/api/goals', goalRouter);
app.use('/api/posts', postRouter);
app.use('/api/announcements', announcementRouter);

app.use(express.static(path.join(__dirname, '..')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
