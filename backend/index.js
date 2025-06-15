import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cron from 'node-cron';

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Default route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// ✅ Manual scrape from quotes.toscrape.com
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

// ✅ AUTO SCRAPER: Runs daily at 4AM UTC (8AM Dubai)
cron.schedule('0 4 * * *', async () => {
  console.log('⏰ Running scheduled scrape at 4AM UTC (8AM Dubai)');
  try {
    const response = await axios.get('https://quotes.toscrape.com/');
    const $ = cheerio.load(response.data);

    const titles = [];
    $('a').each((_, el) => {
      const title = $(el).text().trim();
      if (title) titles.push(title);
    });

    console.log(`[Auto Scraper] ✅ Scraped ${titles.length} links`);
  } catch (err) {
    console.error('Scheduled scrape failed:', err.message);
  }
});

// ✅ NEW: Scrape from ProvidentEstate New Projects
app.get('/scrape-provident', async (req, res) => {
  try {
    const response = await axios.get('https://www.providentestate.com/new-projects/');
    const $ = cheerio.load(response.data);

    const projects = [];

    $('.project-block').each((_, el) => {
      const name = $(el).find('.project-title').text().trim();
      const location = $(el).find('.project-location').text().trim();
      const url = 'https://www.providentestate.com' + $(el).find('a').attr('href');
      const image = $(el).find('img').attr('src');

      if (name && url) {
        projects.push({
          name,
          location,
          url,
          image
        });
      }
    });

    res.json({ results: projects.slice(0, 10) }); // limit for demo
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

