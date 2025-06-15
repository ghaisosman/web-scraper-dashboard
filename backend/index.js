import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.get('/scrape', async (req, res) => {
  try {
    const response = await axios.get('https://quotes.toscrape.com/');
    const $ = cheerio.load(response.data);

    const titles = [];
    $('a').each((_, el) => {
      const title = $(el).text().trim();
      if (title) titles.push(title);
    });

    res.json({ results: titles.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
