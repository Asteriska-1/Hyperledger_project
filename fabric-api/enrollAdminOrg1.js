const fs = require('fs');
const path = require('path');
const { Wallets, X509WalletMixin } = require('fabric-network');

async function main() {
  try {
    // Путь к крипто-материалам admin'а Org1
    const credPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'Admin@org1.example.com', 'msp');

    const cert = fs.readFileSync(path.join(credPath, 'signcerts', 'cert.pem')).toString();
    const key = fs.readFileSync(path.join(credPath, 'keystore', fs.readdirSync(path.join(credPath, 'keystore'))[0])).toString();

    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = {
      credentials: {
        certificate: cert,
        privateKey: key,
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };

    await wallet.put('admin', identity);
    console.log('Admin успешно добавлен в кошелек');
  } catch (error) {
    console.error(`Ошибка добавления admin в кошелек: ${error}`);
    process.exit(1);
  }
}

main();
