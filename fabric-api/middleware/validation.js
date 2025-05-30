// middleware/utils.js

const validateRecordData = (req, res, next) => {
  const { componentID, batchID, stage, price } = req.body;

  if (typeof componentID !== 'string') {
    return res.status(400).json({ error: 'Имя компонента должно быть строкой!' });
  }
  if (typeof batchID !== 'string') {
    return res.status(400).json({ error: 'Партия должна быть строкой!' });
  }
  if (typeof stage !== 'string') {
    return res.status(400).json({ error: 'Стадия должна быть строкой!' });
  }
  if (typeof price !== 'string') { // Ожидаем цену как строку
    return res.status(400).json({ error: 'Цена должна быть строкой!' });
  }

  // Проверяем, что строка цены состоит только из цифр и одной десятичной точки (необязательно)
  const priceRegex = /^\d+(\.\d+)?$/;
  if (!priceRegex.test(price)) {
    return res.status(400).json({ error: 'Цена должна быть строкой, представляющей число!' });
  }

  const parsedPrice = parseFloat(price); // Преобразуем в число с плавающей точкой

  if (isNaN(parsedPrice) || !isFinite(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: 'Цена должна быть положительным дробным числом!' });
  }

  const allowedStages = ['preparation', 'production', 'shipping', 'sale'];
  if (!allowedStages.includes(stage)) {
    return res.status(400).json({ error: `Стадия производства должна быть одним из: ${allowedStages.join(', ')}` });
  }

  req.body.price = parsedPrice; // Заменяем строковое значение цены на числовое в теле запроса
  next();
};

module.exports = { validateRecordData };