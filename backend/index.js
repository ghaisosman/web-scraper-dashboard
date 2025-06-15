import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cron from 'node-cron';
import puppeteer from 'puppeteer'; // ✅ Added Puppeteer

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Root check
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// ✅ Quote scraper (for testing)
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

// ✅ Daily job 8am Dubai (4am UTC)
cron.schedule('0 4 * * *', async () => {
  console.log('⏰ Running scheduled scrape at 8AM Dubai');
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

// ✅ New Route: Scrape DXBInteract homepage
app.get('/scrape-dxb', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://dxbinteract.com', { waitUntil: 'networkidle2' });

    // Wait for key elements to appear
    await page.waitForSelector('.compare-row'); // Year-to-Year comparison
    await page.waitForSelector('.stat-value');  // Total sales

    // Extract sales & comparison data
    const results = await page.evaluate(() => {
      const format = txt => txt?.replace(/\s+/g, ' ').trim();

      const statBoxes = document.querySelectorAll('.stat-value');
      const salesVolume = format(statBoxes?.[0]?.textContent);
      const transactionCount = format(statBoxes?.[1]?.textContent);

      const compareText = format(document.querySelector('.compare-row')?.textContent);

      return {
        salesVolume,
        transactionCount,
        compareText
      };
    });

    await browser.close();
    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
