// src/components/Record.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';

const STAGES = [
  { value: 'preparation', label: 'Preparation' },
  { value: 'production',  label: 'Production'  },
  { value: 'shipping',    label: 'Shipping'    },
  { value: 'sale',        label: 'Sale'        },
];

export default function Record() {
  const [form, setForm]     = useState({ componentID:'', batchID:'', stage:'production', price:'' });
  const [msg, setMsg]       = useState(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setMsg(null); setError('');
    try {
      const { data } = await axios.post('/record', form, { withCredentials:true });
      setMsg(data.message);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto" style={{ maxWidth: 500 }}>
      <Card.Body>
        <Card.Title>Добавить запись</Card.Title>

        {msg   && <Alert variant="success">{msg}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Component ID</Form.Label>
            <Form.Control
              name="componentID"
              value={form.componentID}
              onChange={handleChange}
              required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Batch ID</Form.Label>
            <Form.Control
              name="batchID"
              value={form.batchID}
              onChange={handleChange}
              required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Stage</Form.Label>
            <Form.Select
              name="stage"
              value={form.stage}
              onChange={handleChange}>
              {STAGES.map(s =>
                <option key={s.value} value={s.value}>{s.label}</option>
              )}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Price</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              name="price"
              value={form.price}
              onChange={handleChange}
              required />
          </Form.Group>

          <div className="d-grid">
            <Button variant="success" type="submit" disabled={loading}>
              {loading
                ? <Spinner animation="border" size="sm" />
                : 'Сохранить'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
