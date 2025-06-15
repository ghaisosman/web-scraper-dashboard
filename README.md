
# Professional Web Scraper Application

A complete web scraping solution with React frontend, Express backend, and SQLite database. Features automated daily scraping, target management, and a beautiful dashboard interface.

## Features

### 🎯 **Target Management**
- Add unlimited scraping targets
- Configure CSS selectors for data extraction
- Support for both static and dynamic content (Puppeteer)
- Categorize and organize targets
- Enable/disable individual targets

### 📊 **Dashboard & Analytics**
- Real-time statistics and metrics
- Modern, responsive UI design
- Mobile-friendly interface
- Data visualization and insights

### 🤖 **Automated Scraping**
- Scheduled daily scraping at custom times
- Retry mechanisms for failed requests
- Respectful request delays
- Manual scraping triggers

### 💾 **Data Management**
- SQLite database for reliable storage
- Organized data structure
- Historical data tracking
- Easy data export capabilities

### ⚙️ **Configuration**
- Customizable scraping schedules
- Adjustable timeout settings
- Retry count configuration
- Settings persistence

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone and setup the project:**
```bash
git clone <your-repo-url>
cd web-scraper-app
npm install
```

2. **Create the server directory:**
```bash
mkdir -p server
```

3. **Start the application:**
```bash
npm run dev
```

This will start both the frontend (React) and backend (Express) servers concurrently.

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:5000

## Usage Guide

### Adding Scraping Targets

1. Navigate to the "Scraping Targets" tab
2. Click "Add Target"
3. Fill in the target details:
   - **Name:** Descriptive name for your target
   - **URL:** Website URL to scrape
   - **CSS Selector:** Element selector (e.g., `h1`, `.title`, `#content`)
   - **Type:** Choose "Static Content" or "Dynamic Content (JS)"
   - **Category:** Organize your targets

### CSS Selector Examples

- Headlines: `h1, h2, .headline, .title`
- Product prices: `.price, .cost, [data-price]`
- Article content: `.content, .article-body, main p`
- Links: `a[href], .link`
- Images: `img[src], .image`

### Manual Scraping

- Click the play button (▶️) next to any target
- View real-time scraping results
- Monitor data collection in the "Scraped Data" tab

### Scheduling

1. Go to "Settings" tab
2. Set your preferred daily scraping time
3. Configure timeout and retry settings
4. Save settings

## Technical Architecture

### Backend (Express + Node.js)
- **Scraping Engine:** Puppeteer + Cheerio
- **Database:** SQLite with structured tables
- **Scheduling:** node-cron for automated tasks
- **API:** RESTful endpoints for all operations

### Frontend (React + TypeScript)
- **UI Framework:** shadcn/ui components
- **Styling:** Tailwind CSS
- **State Management:** TanStack Query
- **Responsive Design:** Mobile-first approach

### Database Schema

```sql
-- Scraping targets
CREATE TABLE targets (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  selector TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  category TEXT DEFAULT 'general',
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Scraped data
CREATE TABLE scraped_data (
  id INTEGER PRIMARY KEY,
  target_id INTEGER,
  data TEXT NOT NULL,
  scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (target_id) REFERENCES targets (id)
);

-- Application settings
CREATE TABLE settings (
  id INTEGER PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL
);
```

## API Endpoints

### Targets
- `GET /api/targets` - Get all targets
- `POST /api/targets` - Add new target
- `PUT /api/targets/:id` - Update target
- `DELETE /api/targets/:id` - Delete target

### Data
- `GET /api/data` - Get scraped data
- `GET /api/data?targetId=:id` - Get data for specific target
- `POST /api/scrape/:id` - Manual scrape

### System
- `GET /api/stats` - Dashboard statistics
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

## Deployment Options

### Option 1: Traditional Hosting
1. Build the frontend: `npm run build`
2. Deploy the `dist` folder and `server` directory
3. Set up a process manager (PM2)
4. Configure reverse proxy (nginx)

### Option 2: Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "run", "dev:backend"]
```

### Option 3: Cloud Platforms
- **Heroku:** Add Procfile
- **Railway:** Direct deployment
- **DigitalOcean:** App Platform
- **AWS:** EC2 or Elastic Beanstalk

## Best Practices

### Ethical Scraping
- Respect robots.txt files
- Implement reasonable delays between requests
- Don't overload target servers
- Consider rate limiting

### Performance
- Use appropriate selectors
- Monitor memory usage
- Clean up old data regularly
- Optimize database queries

### Security
- Validate all inputs
- Sanitize scraped data
- Use HTTPS in production
- Implement proper error handling

## Troubleshooting

### Common Issues

**Puppeteer Installation:**
```bash
# Linux dependencies
sudo apt-get install -y libgconf-2-4 libxss1 libxtst6 libxrandr2 libasound2 libpangocairo-1.0-0 libatk1.0-0 libcairo-gobject2 libgtk-3-0 libgdk-pixbuf2.0-0
```

**SQLite Permissions:**
```bash
chmod 664 scraper.db
```

**Port Conflicts:**
- Frontend: Change port in `vite.config.ts`
- Backend: Set `PORT` environment variable

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review common troubleshooting steps

---

**Built with ❤️ using React, Express, and modern web technologies**
