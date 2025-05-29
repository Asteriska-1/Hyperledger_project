// middleware/validation.js

const validateRecordData = (req, res, next) => {
  const { componentID, batchID, stage, цена } = req.body;

  if (typeof componentID !== 'string') {
    return res.status(400).json({ error: 'Имя компонента должно быть строкой!' });
  }
  if (typeof batchID !== 'string') {
    return res.status(400).json({ error: 'Партия должна быть строкой!' });
  }
  if (typeof stage !== 'string') {
    return res.status(400).json({ error: 'Стадия должна быть строкой!' });
  }
  if (typeof цена !== 'number') {
    return res.status(400).json({ error: 'Цена должна быть числом!' });
  }
  if (isNaN(цена) || цена <= 0) {
    return res.status(400).json({ error: 'Цена должна быть положительным числом!' });
  }

  const allowedStages = ['preparation', 'production', 'shipping', 'sale'];
  if (!allowedStages.includes(stage)) {
    return res.status(400).json({ error: `Стадия производства должна быть одним из: ${allowedStages.join(', ')}` });
  }

  next();
};

module.exports = { validateRecordData };