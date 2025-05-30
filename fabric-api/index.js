const express = require('express');
const cookieParser = require('cookie-parser');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const { validateRecordData } = require('./middleware/validation');
const { authenticateManager, verifyJWT } = require('./middleware/auth');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());

// Путь к connection profile
const ccpPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
const walletPath = path.join(__dirname, 'wallet');

// Вынесенная функция для подключения и получения контракта
async function getContract() {
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const identity = await wallet.get('admin');
  if (!identity) {
    throw new Error('Admin identity not found in wallet');
  }

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: 'admin',
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork('mychannel');
  const contract = network.getContract('pricing_cc');

  return { contract, gateway };
}

// GET /price-history/:componentId
app.post('/record', verifyJWT, validateRecordData, async (req, res) => {
  const { componentID, batchID, stage, price } = req.body;

  try {
    const { contract, gateway } = await getContract();

    // цену передаем как строку (как в RecordPrice)
    await contract.submitTransaction('RecordPrice', componentID, batchID, stage, price.toString());

    await gateway.disconnect();

    res.json({ message: 'Цена успешно записана' });
  } catch (error) {
    console.error(`Ошибка записи цены: ${error}`);
    res.status(500).json({ error: error.message });
  }
});


// POST /record
// Ожидает JSON с { componentID, batchID, stage, price }
app.post('/record', validateRecordData, async (req, res) => {
  const { componentID, batchID, stage, price } = req.body; // 'price' теперь 'цена' после валидации

  try {
    const { contract, gateway } = await getContract();

    // цена передаем как строку (как в RecordPrice)
    await contract.submitTransaction('RecordPrice', componentID, batchID, stage, price.toString());

    await gateway.disconnect();

    res.json({ message: 'Цена успешно записана' });
  } catch (error) {
    console.error(`Ошибка записи цены: ${error}`);
    res.status(500).json({ error: error.message });
  }
});

// GET /price/:componentId — получить текущую цену компонента
app.get('/price/:componentId', async (req, res) => {
  const componentId = req.params.componentId;

  try {
    const { contract, gateway } = await getContract();

    const result = await contract.evaluateTransaction('GetCurrentPrice', componentId);

    await gateway.disconnect();

    const parsed = JSON.parse(result.toString());
    res.json(parsed);
  } catch (error) {
    console.error(`Ошибка получения текущей цены: ${error}`);
    res.status(500).json({ error: error.message });
  }
});


// POST /manager-login
app.post('/manager-login', authenticateManager, (req, res) => {
  // authenticateManager обрабатывает установку куки и отправку ответа
  // Этот обработчик может быть пустым или отправлять дополнительное сообщение
});


app.listen(port, () => {
  console.log(`API сервер запущен на http://localhost:${port}`);
});