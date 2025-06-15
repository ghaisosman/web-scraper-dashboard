
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize SQLite Database
const db = new sqlite3.Database('./scraper.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Scraping targets table
  db.run(`
    CREATE TABLE IF NOT EXISTS targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      selector TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      category TEXT DEFAULT 'general',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Scraped data table
  db.run(`
    CREATE TABLE IF NOT EXISTS scraped_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_id INTEGER,
      data TEXT NOT NULL,
      scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (target_id) REFERENCES targets (id)
    )
  `);

  // Settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    )
  `);

  // Insert default settings
  db.run(`
    INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('scrape_time', '09:00'),
    ('max_retries', '3'),
    ('timeout', '30000')
  `);

  // Insert sample targets
  db.run(`
    INSERT OR IGNORE INTO targets (name, url, selector, type, category) VALUES 
    ('Hacker News Top Story', 'https://news.ycombinator.com', '.titleline > a', 'text', 'news'),
    ('Reddit Programming', 'https://www.reddit.com/r/programming', '.Post h3', 'text', 'programming')
  `);
}

// Scraping function
async function scrapeTarget(target) {
  try {
    console.log(`Scraping: ${target.name}`);
    
    if (target.type === 'dynamic') {
      // Use Puppeteer for dynamic content
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(target.url, { waitUntil: 'networkidle2' });
      
      const data = await page.evaluate((selector) => {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).map(el => el.textContent.trim()).filter(text => text);
      }, target.selector);
      
      await browser.close();
      return data;
    } else {
      // Use Axios + Cheerio for static content
      const response = await axios.get(target.url, { timeout: 30000 });
      const $ = cheerio.load(response.data);
      
      const data = [];
      $(target.selector).each((i, element) => {
        const text = $(element).text().trim();
        if (text) data.push(text);
      });
      
      return data;
    }
  } catch (error) {
    console.error(`Error scraping ${target.name}:`, error.message);
    return [];
  }
}

// Save scraped data to database
function saveScrapedData(targetId, data) {
  const dataString = JSON.stringify(data);
  db.run(
    'INSERT INTO scraped_data (target_id, data) VALUES (?, ?)',
    [targetId, dataString],
    function(err) {
      if (err) {
        console.error('Error saving scraped data:', err);
      } else {
        console.log(`Saved data for target ${targetId}`);
      }
    }
  );
}

// Scrape all active targets
async function scrapeAllTargets() {
  console.log('Starting scheduled scraping...');
  
  db.all('SELECT * FROM targets WHERE active = 1', async (err, targets) => {
    if (err) {
      console.error('Error fetching targets:', err);
      return;
    }

    for (const target of targets) {
      const data = await scrapeTarget(target);
      if (data.length > 0) {
        saveScrapedData(target.id, data);
      }
      // Add delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('Scraping completed');
  });
}

// Schedule scraping
db.get('SELECT value FROM settings WHERE key = "scrape_time"', (err, row) => {
  if (!err && row) {
    const [hour, minute] = row.value.split(':');
    const cronExpression = `${minute} ${hour} * * *`;
    
    cron.schedule(cronExpression, () => {
      scrapeAllTargets();
    });
    
    console.log(`Scheduled scraping at ${row.value} daily`);
  }
});

// API Routes

// Get all targets
app.get('/api/targets', (req, res) => {
  db.all('SELECT * FROM targets ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Add new target
app.post('/api/targets', (req, res) => {
  const { name, url, selector, type, category } = req.body;
  
  db.run(
    'INSERT INTO targets (name, url, selector, type, category) VALUES (?, ?, ?, ?, ?)',
    [name, url, selector, type || 'text', category || 'general'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, message: 'Target added successfully' });
      }
    }
  );
});

// Update target
app.put('/api/targets/:id', (req, res) => {
  const { name, url, selector, type, category, active } = req.body;
  const targetId = req.params.id;
  
  db.run(
    'UPDATE targets SET name = ?, url = ?, selector = ?, type = ?, category = ?, active = ? WHERE id = ?',
    [name, url, selector, type, category, active, targetId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: 'Target updated successfully' });
      }
    }
  );
});

// Delete target
app.delete('/api/targets/:id', (req, res) => {
  const targetId = req.params.id;
  
  db.run('DELETE FROM targets WHERE id = ?', [targetId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Target deleted successfully' });
    }
  });
});

// Get scraped data
app.get('/api/data', (req, res) => {
  const { targetId, limit = 50 } = req.query;
  
  let query = `
    SELECT sd.*, t.name as target_name, t.category 
    FROM scraped_data sd 
    JOIN targets t ON sd.target_id = t.id 
  `;
  let params = [];
  
  if (targetId) {
    query += ' WHERE sd.target_id = ?';
    params.push(targetId);
  }
  
  query += ' ORDER BY sd.scraped_at DESC LIMIT ?';
  params.push(parseInt(limit));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      const processedRows = rows.map(row => ({
        ...row,
        data: JSON.parse(row.data)
      }));
      res.json(processedRows);
    }
  });
});

// Manual scrape
app.post('/api/scrape/:id', async (req, res) => {
  const targetId = req.params.id;
  
  db.get('SELECT * FROM targets WHERE id = ?', [targetId], async (err, target) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!target) {
      res.status(404).json({ error: 'Target not found' });
    } else {
      const data = await scrapeTarget(target);
      if (data.length > 0) {
        saveScrapedData(target.id, data);
        res.json({ message: 'Scraping completed', dataCount: data.length });
      } else {
        res.json({ message: 'No data scraped', dataCount: 0 });
      }
    }
  });
});

// Get settings
app.get('/api/settings', (req, res) => {
  db.all('SELECT * FROM settings', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      const settings = {};
      rows.forEach(row => {
        settings[row.key] = row.value;
      });
      res.json(settings);
    }
  });
});

// Update settings
app.put('/api/settings', (req, res) => {
  const settings = req.body;
  
  const promises = Object.entries(settings).map(([key, value]) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });
  
  Promise.all(promises)
    .then(() => res.json({ message: 'Settings updated successfully' }))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Dashboard stats
app.get('/api/stats', (req, res) => {
  Promise.all([
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM targets', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    }),
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM targets WHERE active = 1', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    }),
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM scraped_data WHERE DATE(scraped_at) = DATE("now")', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    }),
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM scraped_data', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    })
  ])
  .then(([totalTargets, activeTargets, todayData, totalData]) => {
    res.json({
      totalTargets,
      activeTargets,
      todayData,
      totalData
    });
  })
  .catch(err => res.status(500).json({ error: err.message }));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
