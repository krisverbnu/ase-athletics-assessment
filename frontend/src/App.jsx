import { useEffect, useState } from 'react';

// Where the API lives: localhost on your Mac, the Render URL when deployed
const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [status, setStatus] = useState('checking...');

  // Runs once when the page loads: ask the API if it's alive
  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('API not reachable'));
  }, []);

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>ASE Athletics</h1>
      <p>API status: <strong>{status}</strong></p>
    </main>
  );
}

export default App;
