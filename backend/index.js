
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const cron = require('node-cron');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'scraper.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    selector TEXT NOT NULL,
    type TEXT DEFAULT 'static',
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS scraped_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_id INTEGER,
    data TEXT,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (target_id) REFERENCES targets (id)
  )`);
});

// Helper function to scrape static content
async function scrapeStatic(url, selector) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const data = [];
    
    $(selector).each((i, element) => {
      data.push($(element).text().trim());
    });
    
    return data;
  } catch (error) {
    console.error('Static scraping error:', error);
    throw error;
  }
}

// Helper function to scrape dynamic content
async function scrapeDynamic(url, selector) {
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const data = await page.evaluate((sel) => {
      const elements = document.querySelectorAll(sel);
      return Array.from(elements).map(el => el.textContent.trim());
    }, selector);
    
    return data;
  } catch (error) {
    console.error('Dynamic scraping error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// API Routes
app.get('/api/targets', (req, res) => {
  db.all('SELECT * FROM targets ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/targets', (req, res) => {
  const { name, url, selector, type = 'static' } = req.body;
  
  if (!name || !url || !selector) {
    res.status(400).json({ error: 'Name, URL, and selector are required' });
    return;
  }
  
  db.run(
    'INSERT INTO targets (name, url, selector, type) VALUES (?, ?, ?, ?)',
    [name, url, selector, type],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, url, selector, type });
    }
  );
});

app.put('/api/targets/:id', (req, res) => {
  const { id } = req.params;
  const { name, url, selector, type, active } = req.body;
  
  db.run(
    'UPDATE targets SET name = ?, url = ?, selector = ?, type = ?, active = ? WHERE id = ?',
    [name, url, selector, type, active ? 1 : 0, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Target updated successfully' });
    }
  );
});

app.delete('/api/targets/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM targets WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Target deleted successfully' });
  });
});

app.get('/api/data', (req, res) => {
  const query = `
    SELECT sd.*, t.name as target_name, t.url 
    FROM scraped_data sd 
    JOIN targets t ON sd.target_id = t.id 
    ORDER BY sd.scraped_at DESC 
    LIMIT 100
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/scrape/:id', async (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM targets WHERE id = ? AND active = 1', [id], async (err, target) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!target) {
      res.status(404).json({ error: 'Target not found or inactive' });
      return;
    }
    
    try {
      let data;
      if (target.type === 'dynamic') {
        data = await scrapeDynamic(target.url, target.selector);
      } else {
        data = await scrapeStatic(target.url, target.selector);
      }
      
      db.run(
        'INSERT INTO scraped_data (target_id, data) VALUES (?, ?)',
        [target.id, JSON.stringify(data)],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ message: 'Data scraped successfully', data });
        }
      );
    } catch (error) {
      res.status(500).json({ error: 'Scraping failed: ' + error.message });
    }
  });
});

app.get('/api/stats', (req, res) => {
  db.get('SELECT COUNT(*) as total_targets FROM targets', (err, targetCount) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    db.get('SELECT COUNT(*) as total_data FROM scraped_data', (err, dataCount) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({
        totalTargets: targetCount.total_targets,
        totalData: dataCount.total_data
      });
    });
  });
});

// Schedule daily scraping at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running scheduled scraping...');
  
  db.all('SELECT * FROM targets WHERE active = 1', async (err, targets) => {
    if (err) {
      console.error('Error fetching targets:', err);
      return;
    }
    
    for (const target of targets) {
      try {
        let data;
        if (target.type === 'dynamic') {
          data = await scrapeDynamic(target.url, target.selector);
        } else {
          data = await scrapeStatic(target.url, target.selector);
        }
        
        db.run(
          'INSERT INTO scraped_data (target_id, data) VALUES (?, ?)',
          [target.id, JSON.stringify(data)],
          (err) => {
            if (err) {
              console.error('Error saving scraped data:', err);
            } else {
              console.log(`Scraped data for target: ${target.name}`);
            }
          }
        );
      } catch (error) {
        console.error(`Error scraping ${target.name}:`, error);
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
