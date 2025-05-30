import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Alert, Card, ListGroup, Spinner } from 'react-bootstrap';

export default function Price() {
  const [id, setId]        = useState('');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.get(`/price/${id}`);
      setResult(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <Card.Body>
        <Card.Title>Получить текущую цену</Card.Title>

        <Form onSubmit={handle} className="mb-3">
          <Form.Group controlId="componentId">
            <Form.Label>ID компонента</Form.Label>
            <Form.Control
              type="text"
              value={id}
              onChange={e => setId(e.target.value)}
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Показать'}
          </Button>
        </Form>

        {error && <Alert variant="danger">{error}</Alert>}

        {result && (
          <Card className="border-success">
            <Card.Header>
              <strong>Организация:</strong> {result.organization}
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>ID компонента:</strong> {result.componentID}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Batch:</strong> {result.batchID}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Стадия:</strong> {result.stage}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Дата:</strong> {result.date}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Цена:</strong> ${result.price.toFixed(2)}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        )}
      </Card.Body>
    </Card>
  );
}
