import React, { useEffect, useState } from 'react';
import './App.css';

const BACKEND_URL = 'https://web-scraper-dashboard-three.vercel.app/'; // ← Replace this!

function App() {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${BACKEND_URL}/scrape`)
      .then(res => res.json())
      .then(json => {
        if (json.results) {
          setData(json.results);
        } else {
          setError('No data received.');
        }
      })
      .catch(err => setError(`Fetch error: ${err.message}`));
  }, []);

  return (
    <div className="App">
      <h1>Scraped Data</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {data.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
