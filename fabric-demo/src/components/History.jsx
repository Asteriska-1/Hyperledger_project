import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Card, Form, Button, Alert, Spinner,
  Row, Col, Toast, ToastContainer
} from 'react-bootstrap';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip);

const STAGES = ['preparation','production','shipping','sale'];

export default function History() {
  const [id, setId]           = useState('');
  const [rawData, setRawData] = useState([]);   // полные данные из API
  const [data, setData]       = useState([]);   // отфильтрованный массив
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // фильтры
  const [stageFilter, setStageFilter] = useState('');
  const [fromDate, setFromDate]       = useState('');
  const [toDate, setToDate]           = useState('');

  // переключатель режимов: полная история vs цепочка
  const [showChain, setShowChain] = useState(false);

  // выбранная точка для Toast
  const [selected, setSelected]   = useState(null);

  // Пересчитать данные при изменении фильтров или при очистке цепочки
  useEffect(() => {
    if (showChain) return; // если в цепочке — не фильтруем историю
    let arr = [...rawData];
    if (stageFilter) arr = arr.filter(r => r.stage === stageFilter);
    if (fromDate)     arr = arr.filter(r => r.date >= fromDate);
    if (toDate)       arr = arr.filter(r => r.date <= toDate);
    setData(arr);
  }, [rawData, stageFilter, fromDate, toDate, showChain]);

  const fetchHistory = async e => {
    e.preventDefault();
    setLoading(true); setError(''); setSelected(null);
    try {
      const res = await axios.get(`/price-history/${id}`);
      setRawData(res.data);
      setShowChain(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setRawData([]);
    } finally {
      setLoading(false);
    }
  };

  // Собираем “цепочку” — для каждой стадии берём запись с максимальной датой
  const getChain = () => {
    return STAGES
      .map(stage => {
        const items = rawData.filter(r => r.stage === stage);
        if (!items.length) return null;
        // найти запись с max date
        const last = items.reduce((a, b) => a.date > b.date ? a : b);
        return { stage, price: +last.price, date: last.date, ...last };
      })
      .filter(Boolean);
  };

  // Клик по графику в режиме истории
  const handleHistoryClick = (_, activeEls) => {
    if (!activeEls.length) return;
    const idx = activeEls[0].index;
    setSelected(data[idx]);
  };

  // Клик по графику в режиме цепочки
  const handleChainClick = (_, activeEls) => {
    if (!activeEls.length) return;
    const idx = activeEls[0].index;
    const chain = getChain();
    setSelected(chain[idx]);
  };

  // Скачать JSON отфильтрованных данных
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(showChain ? getChain() : data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${id || 'history'}.json`;
    a.click();
  };

  // Подготовка данных для графика
  const chartLabels = showChain
    ? getChain().map(r => r.stage)
    : data.map(r => r.date);

  const chartValues = showChain
    ? getChain().map(r => r.price)
    : data.map(r => +r.price);

  const chartData = {
    labels: chartLabels,
    datasets: [{
      label: showChain ? 'Последняя цена по стадиям' : 'Цена',
      data: chartValues,
      fill: false,
      tension: 0.3,
      pointRadius: 6,
      pointHoverRadius: 8,
      borderColor: showChain ? '#dc3545' : '#007bff',
      backgroundColor: showChain ? '#dc3545' : '#007bff',
    }]
  };

  const chartOptions = {
    responsive: true,
    onClick: showChain ? handleChainClick : handleHistoryClick,
    plugins: {
      tooltip: {
        callbacks: {
          label: ctx => showChain
            ? `₽ ${ctx.parsed.y}`
            : `₽ ${ctx.parsed.y}`
        }
      }
    },
    scales: {
      x: { title: { display: true, text: showChain ? 'Stage' : 'Date' }},
      y: { title: { display: true, text: 'Price' }}
    }
  };

  return (
    <>
      <Card className="mx-auto w-100" style={{ maxWidth: '1000px', width: '95%' }}>
        <Card.Body>
          <Card.Title>История цен</Card.Title>

          <Form onSubmit={fetchHistory} className="mb-3 d-flex flex-wrap align-items-end">
            <Form.Group className="me-2 mb-2">
              <Form.Label>ID компонента</Form.Label>
              <Form.Control
                value={id}
                onChange={e => setId(e.target.value)}
                required
              />
            </Form.Group>

            {!showChain && (
              <>
                <Form.Group className="me-2 mb-2">
                  <Form.Label>Стадия</Form.Label>
                  <Form.Select
                    value={stageFilter}
                    onChange={e => setStageFilter(e.target.value)}
                  >
                    <option value="">Все</option>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="me-2 mb-2">
                  <Form.Label>С</Form.Label>
                  <Form.Control
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="me-2 mb-2">
                  <Form.Label>По</Form.Label>
                  <Form.Control
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                  />
                </Form.Group>
              </>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="me-2 mb-2"
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Показать'}
            </Button>

            {rawData.length > 0 && (
              <>
                <Button
                  variant={showChain ? 'secondary' : 'danger'}
                  onClick={() => { setShowChain(!showChain); setSelected(null); }}
                  className="me-2 mb-2"
                >
                  {showChain ? 'Показать историю' : 'Показать последнюю цепочку цен'}
                </Button>

                <Button
                  variant="outline-success"
                  onClick={downloadJSON}
                  className="mb-2"
                >
                  Скачать JSON
                </Button>
              </>
            )}
          </Form>

          {error && <Alert variant="danger">{error}</Alert>}

          {(showChain ? getChain().length>0 : data.length>0) && (
            <>
              {!showChain && (
                <Row className="mb-3 text-center">
                  <Col>Исторический минимум: <strong>{Math.min(...chartValues)}</strong></Col>
                  <Col>Исторический максимум: <strong>{Math.max(...chartValues)}</strong></Col>
                </Row>
              )}
              <Line data={chartData} options={chartOptions} />
            </>
          )}
        </Card.Body>
      </Card>

      {/* Toast с деталями выбранной точки */}
      <ToastContainer position="bottom-center" className="p-3">
        {selected && (
          <Toast onClose={() => setSelected(null)} show>
            <Toast.Header>
              <strong className="me-auto">Детали записи</strong>
            </Toast.Header>
            <Toast.Body>
              <pre className="mb-0">
                Организация:  {selected.organization}{"\n"}
                Компонент:    {selected.componentID}{"\n"}
                Партия:       {selected.batchID}{"\n"}
                Стадия:       {selected.stage}{"\n"}
                Цена:         {selected.price}{"\n"}
                Дата:         {selected.date}
              </pre>
            </Toast.Body>
          </Toast>
        )}
      </ToastContainer>
    </>
  );
}
