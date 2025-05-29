const express = require('express');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.json());

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
app.get('/price-history/:componentId', async (req, res) => {
  const componentId = req.params.componentId;

  try {
    const { contract, gateway } = await getContract();

    const result = await contract.evaluateTransaction('GetPriceHistory', componentId);

    await gateway.disconnect();

    const parsed = JSON.parse(result.toString());
    res.json(parsed);
  } catch (error) {
    console.error(`Ошибка вызова смарт-контракта: ${error}`);
    res.status(500).json({ error: error.message });
  }
});

// POST /record
// Ожидает JSON с { componentID, batchID, stage, price }
app.post('/record', async (req, res) => {
  const { componentID, batchID, stage, price } = req.body;

  if (!componentID || !batchID || !stage || price === undefined) {
    return res.status(400).json({ error: 'componentID, batchID, stage и price обязательны' });
  }

  try {
    const { contract, gateway } = await getContract();

    // price передаем как строку (как в RecordPrice)
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


app.listen(port, () => {
  console.log(`API сервер запущен на http://localhost:${port}`);
});
