import express from 'express';
import cors from 'cors';
import axios from 'axios';
import cheerio from 'cheerio';

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// New scraping route
app.get('/scrape', async (req, res) => {
  try {
    const response = await axios.get('https://example.com'); // Replace with real URL
    const $ = cheerio.load(response.data);

    const titles = [];
    $('a').each((_, el) => {
      const title = $(el).text().trim();
      if (title) titles.push(title);
    });

    res.json({ results: titles.slice(0, 10) }); // limit to 10 results
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Render's dynamic port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
