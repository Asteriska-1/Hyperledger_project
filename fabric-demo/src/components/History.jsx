import React, { useState } from 'react';
import axios from 'axios';

export default function History() {
  const [id, setId]       = useState('');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  const handle = async e => {
    e.preventDefault();
    try {
      const { data } = await axios.get(
        `/price-history/${id}`
      );
      setResult(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setResult(null);
    }
  };

  return (
    <div>
      <h2>Price History</h2>
      <form onSubmit={handle}>
        <input
          placeholder="Component ID"
          value={id}
          onChange={e => setId(e.target.value)}
        />
        <button type="submit">Fetch</button>
      </form>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {error  && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
