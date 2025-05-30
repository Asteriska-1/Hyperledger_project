import React, { useState } from 'react';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';

import Login   from './components/Login';
import Price   from './components/Price';
import History from './components/History';
import Record  from './components/Record';

function App() {
  const [authed, setAuthed] = useState(false);

  return (
    <BrowserRouter>
       <Navbar bg="light" expand="md">
         <Container>
           <Navbar.Brand as={Link} to="/">Fabric Demo</Navbar.Brand>
           <Navbar.Toggle aria-controls="main-nav" />
           <Navbar.Collapse id="main-nav">
             <Nav className="me-auto">
               <Nav.Link as={Link} to="/price">Price</Nav.Link>
               <Nav.Link as={Link} to="/history">History</Nav.Link>
               <Nav.Link as={Link} to="/record">Record</Nav.Link>
             </Nav>
             <Nav>
               {!authed
                 ? <Nav.Link as={Link} to="/login">Manager Login</Nav.Link>
                 : <Nav.Item className="navbar-text">✔️ Authenticated</Nav.Item>}
             </Nav>
           </Navbar.Collapse>
         </Container>
       </Navbar>
      <Routes>
        <Route path="/" element={<h2>Welcome to Fabric Demo UI</h2>} />
        <Route path="/login" element={<Login onAuth={() => setAuthed(true)} />} />
        <Route path="/price" element={<Price />} />
        <Route path="/history" element={<History />} />
        <Route path="/record" element={
          authed
            ? <Record />
            : <Navigate to="/login" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
