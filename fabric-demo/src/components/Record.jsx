import React, { useState } from 'react';
import axios from 'axios';

export default function Record() {
  const [form, setForm]   = useState({ componentID:'', batchID:'', stage:'', price:'' });
  const [msg, setMsg]     = useState('');
  const [error, setError] = useState('');

  const handle = async e => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        `/record`,
        form,
        { withCredentials: true }
      );
      setMsg(data.message);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setMsg('');
    }
  };

  const onChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  return (
    <div>
      <h2>Record New Price</h2>
      <form onSubmit={handle}>
        <input name="componentID" placeholder="Component ID" onChange={onChange} /><br/>
        <input name="batchID"     placeholder="Batch ID"     onChange={onChange} /><br/>
        <input name="stage"       placeholder="Stage"        onChange={onChange} /><br/>
        <input name="price"       placeholder="Price"        onChange={onChange} /><br/>
        <button type="submit">Submit</button>
      </form>
      {msg   && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
