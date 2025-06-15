import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer'; // ✅ puppeteer, not puppeteer-core
import cron from 'node-cron';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// 🧪 Test route
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

// 🏗️ DXBInteract Scraper
app.get('/scrape-dxb', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://dxbinteract.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForSelector('.compare-row');
    await page.waitForSelector('.stat-value');

    const results = await page.evaluate(() => {
      const format = txt => txt?.replace(/\s+/g, ' ').trim();
      const statBoxes = document.querySelectorAll('.stat-value');
      const salesVolume = format(statBoxes?.[0]?.textContent);
      const transactionCount = format(statBoxes?.[1]?.textContent);
      const compareText = format(document.querySelector('.compare-row')?.textContent);
      return { salesVolume, transactionCount, compareText };
    });

    await browser.close();
    res.json({ results });
  } catch (err) {
    console.error('❌ Error during scrape:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🕗 Daily auto-scrape at 8AM Dubai (4AM UTC)
cron.schedule('0 4 * * *', async () => {
  console.log('⏰ Running scheduled DXB scrape...');
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://dxbinteract.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForSelector('.compare-row');
    await page.waitForSelector('.stat-value');
    console.log('✅ Daily scrape succeeded');
    await browser.close();
  } catch (err) {
    console.error('❌ Daily scrape failed:', err.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

