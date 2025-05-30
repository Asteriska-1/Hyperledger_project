// middleware/auth.js
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const secretsPath = path.join(__dirname, '../secrets.json');

const authenticateManager = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'Нет токена, авторизация менеджера отклонена' });
  }

  try {
    const secretsRaw = fs.readFileSync(secretsPath, 'utf8');
    const secrets = JSON.parse(secretsRaw);
    const jwtSecret = secrets.jwtSecret;
    const managerTokens = secrets.managerTokens || {};

    const managerInfo = Object.entries(managerTokens).find(([orgId, secretToken]) => secretToken === token);

    if (managerInfo) {
      const [orgId] = managerInfo;
      const payload = { authenticated: true, organization: orgId };
      const jwtToken = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

      // Записываем JWT в HTTP-куку
      res.cookie('authToken', jwtToken, {
        httpOnly: true, // Запрещает доступ к куке через JavaScript в браузере
        secure: process.env.NODE_ENV === 'production', // Отправлять только по HTTPS в production
        maxAge: 60 * 60 * 1000, // Срок действия куки (1 час, как и у JWT)
      });

      res.status(200).json({ message: 'Менеджер авторизован, JWT записан в куку' }); // Изменяем ответ
      // next(); // Не вызываем next() здесь, так как авторизация завершена
    } else {
      return res.status(401).json({ message: 'Недействительный токен менеджера' });
    }
  } catch (error) {
    console.error('Ошибка при проверке токена менеджера:', error);
    return res.status(500).json({ message: 'Ошибка сервера при аутентификации менеджера' });
  }
};


const verifyJWT = (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ message: 'JWT отсутствует в куках, требуется авторизация' });
  }

  try {
    const secretsRaw = fs.readFileSync(secretsPath, 'utf8');
    const secrets = JSON.parse(secretsRaw);
    const jwtSecret = secrets.jwtSecret;

    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        console.error('Ошибка при проверке JWT:', err);
        return res.status(401).json({ message: 'Недействительный JWT' });
      }

      req.user = decoded; // Сохраняем расшифрованную полезную нагрузку в req.user
      next(); // Передаем управление следующему middleware или обработчику маршрута
    });
  } catch (error) {
    console.error('Ошибка при чтении секретов для проверки JWT:', error);
    return res.status(500).json({ message: 'Ошибка сервера при проверке JWT' });
  }
};

module.exports = { authenticateManager, verifyJWT };