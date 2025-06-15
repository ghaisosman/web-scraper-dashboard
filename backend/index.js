import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Basic route to test
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// IMPORTANT: Use the port Render expects
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
