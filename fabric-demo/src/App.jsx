import React from 'react';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';

import Login   from './components/Login';
import Price   from './components/Price';
import History from './components/History';
import Record  from './components/Record';
import Home    from './components/Home';

export default function App() {
  const [authed, setAuthed] = React.useState(false);

  return (
    <BrowserRouter>
      <Navbar bg="primary" variant="dark" expand="md">
        <Container>
          <Navbar.Brand as={Link} to="/">PriceTracker</Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/price">Текущие цены</Nav.Link>
              <Nav.Link as={Link} to="/history">История цен</Nav.Link>
              {authed && (
                <Nav.Link as={Link} to="/record">Добавить запись</Nav.Link>
              )}
            </Nav>
            <Nav>
              {!authed
                ? <Nav.Link as={Link} to="/login">Менеджерам</Nav.Link>
                : <Nav.Item className="navbar-text text-light">✔️ Авторизован</Nav.Item>
              }
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="py-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login"   element={<Login onAuth={() => setAuthed(true)} />} />
          <Route path="/price"   element={<Price />} />
          <Route path="/history" element={<History />} />
          <Route path="/record"  element={
            authed
              ? <Record />
              : <Navigate to="/login" replace />
          } />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}
