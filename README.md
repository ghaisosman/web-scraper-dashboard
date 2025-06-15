
# Web Scraper Application

A comprehensive web scraping application with React frontend, Express backend, and SQLite database.

## Project Structure

```
├── backend/                 # Express.js backend
│   ├── index.js            # Main server file
│   ├── package.json        # Backend dependencies
│   └── .gitignore         # Backend gitignore
├── src/                    # React frontend
│   ├── pages/
│   └── components/
├── package.json           # Frontend dependencies
└── README.md
```

## Features

- **Dashboard**: Real-time statistics and data visualization
- **Target Management**: Add, edit, delete, and manage scraping targets
- **Dual Scraping**: Support for both static and dynamic content
- **Scheduled Scraping**: Automatic daily scraping at configurable times
- **Data Storage**: SQLite database for reliable data persistence
- **Modern UI**: Clean, responsive interface built with shadcn/ui

## Local Development

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
The backend will run on `http://localhost:3001`

### Frontend Setup
```bash
npm install
npm run dev
```
The frontend will run on `http://localhost:8080`

## Deployment

### Option 1: Render (Recommended)

#### Deploy Backend:
1. Connect your GitHub repository to Render
2. Create a new **Web Service**
3. Set the **Root Directory** to `backend`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `npm start`
6. Deploy

#### Deploy Frontend:
1. Create another **Static Site** on Render
2. Set **Build Command**: `npm run build`
3. Set **Publish Directory**: `dist`
4. Deploy

### Option 2: Railway
1. Connect GitHub repository
2. Railway will auto-detect the backend in the `backend/` directory
3. Set environment variables if needed
4. Deploy

### Option 3: Vercel + Railway
- **Frontend**: Deploy to Vercel (auto-detects React apps)
- **Backend**: Deploy to Railway or Render

## Environment Variables

For production, you may want to set:
- `PORT`: Backend port (default: 3001)
- `NODE_ENV`: Environment (production/development)

## API Endpoints

- `GET /api/targets` - Get all scraping targets
- `POST /api/targets` - Create new target
- `PUT /api/targets/:id` - Update target
- `DELETE /api/targets/:id` - Delete target
- `GET /api/data` - Get scraped data
- `POST /api/scrape/:id` - Manual scrape trigger
- `GET /api/stats` - Get dashboard statistics

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: SQLite
- **Scraping**: Puppeteer (dynamic), Cheerio + Axios (static)
- **Scheduling**: node-cron

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
