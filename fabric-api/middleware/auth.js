// middleware/auth.js
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const secretsPath = path.join(__dirname, '../config/secrets.json');

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
      req.authToken = jwtToken;
      next();
    } else {
      return res.status(401).json({ message: 'Недействительный токен менеджера' });
    }
  } catch (error) {
    console.error('Ошибка при проверке токена менеджера:', error);
    return res.status(500).json({ message: 'Ошибка сервера при аутентификации менеджера' });
  }
};

module.exports = { authenticateManager };