import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Alert, Card } from 'react-bootstrap';

 export default function Price() {
   const [id, setId]        = useState('');
   const [result, setResult] = useState(null);
   const [error, setError]   = useState('');

  const handle = async e => {
    e.preventDefault();
    try {
      const { data } = await axios.get(
        `/price/${id}`
      );
      setResult(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setResult(null);
    }
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Get Current Price</Card.Title>
        <Form onSubmit={handle}>
          <Form.Group className="mb-3" controlId="componentId">
            <Form.Label>Component ID</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter component ID"
              value={id}
              onChange={e => setId(e.target.value)}
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit">Fetch</Button>
        </Form>
        <hr />
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        {result && (
          <Alert variant="success" className="mt-3">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
}
