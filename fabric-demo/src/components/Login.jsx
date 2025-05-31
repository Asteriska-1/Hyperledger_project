import React, { useState } from 'react';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function Login({ onAuth }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Отправляем токен менеджера в заголовке Authorization
      await axios.post('/manager-login', null, {
        headers: { Authorization: token },
        withCredentials: true,
      });

      onAuth();              // сообщаем App, что менеджер авторизован
      navigate('/record');    // перенаправляем на страницу записи цены
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row className="w-100">
        <Col xs={12} sm={8} md={6} lg={4} className="mx-auto">
          <Card>
            <Card.Header className="text-center">
              <h4>Авторизация</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="managerToken">
                  <Form.Label>Токен</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Секретный токен вашей организации"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    required
                    autoFocus
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading
                      ? <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />{' '}
                          Проверка...
                        </>
                      : 'Войти'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
            <Card.Footer className="text-center text-muted">
              PriceTracker by HOPA, asteriska, vanturos and uselesswastaken © {new Date().getFullYear()}
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
