import React, { useState } from 'react';
import axios from 'axios';

export default function Login({ onAuth }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handle = async e => {
    e.preventDefault();
    try {
      await axios.post(
        `/manager-login`,
        {},
        { headers: { Authorization: token }, withCredentials: true }
      );
      onAuth();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <h2>Manager Login</h2>
      <form onSubmit={handle}>
        <input
          placeholder="Manager secret token"
          value={token}
          onChange={e => setToken(e.target.value)}
          style={{ width: 300 }}
        />
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
