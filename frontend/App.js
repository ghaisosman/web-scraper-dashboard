import React, { useEffect, useState } from 'react';
import './App.css';

const BACKEND_URL = 'https://your-render-backend.onrender.com'; // Replace with your actual backend URL

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/`)
      .then(res => res.text())
      .then(msg => setData([msg]))
      .catch(err => setData([`Error: ${err.message}`]));
  }, []);

  return (
    <div className="App">
      <h1>Dashboard</h1>
      <ul>
        {data.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
// Your React frontend code will go here
