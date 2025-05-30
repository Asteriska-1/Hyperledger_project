# Blockchain Pricing Sample with Hyperledger Fabric

[![Go Version](https://img.shields.io/badge/go-%3E%3D1.16-blue)](https://golang.org/) [![Docker](https://img.shields.io/badge/docker-supported-blue)](https://www.docker.com/) [![Hyperledger Fabric](https://img.shields.io/badge/fabric-samples-orange)](https://github.com/hyperledger/fabric-samples)

**Описание:**
Руководство описывает развертывание тестовой сети Hyperledger Fabric, деплой смарт-контракта "pricing\_cc" на Go, а также развертывание веб‑API для взаимодействия со смарт-контрактом и клиентской части на React.

## 📂 Структура проекта

```
blockchain/
├── fabric-samples/         # Официальный репозиторий Hyperledger Fabric (с test-network)
├── chaincode/              # Код смарт-контракта на Go (pricing_cc.go, go.mod, go.sum)
├── fabric-api/             # Веб‑сервер API (Node.js + Docker Compose)
├── fabric-frontend/        # Клиентская часть (React)
└── import_org{1,2}         # (опционально) скрипты ENV-переменных для ручного вызова методов
```

## 🔧 Требования

* Docker Engine
* Go (>=1.16)
* Linux (рекомендуется, но можно и другие ОС)
* (Опционально) cURL для тестовых запросов

> Подробности установки см. [Prerequisites](https://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html).

---

## 🚀 Quick Start

### 1. Запуск тестовой сети

Перейдите в папку `fabric-samples/test-network` и поднимите сеть с двумя организациями, ordering сервисом и CA:

```bash
cd fabric-samples/test-network
./network.sh up createChannel -ca
```

### 2. Деплой смарт-контракта

Выполните в той же директории:

```bash
./network.sh deployCC \
  -ccn pricing_cc \
  -ccp ../../chaincode/ \
  -ccl go
```

После деплоя смарт-контракт доступен на канале `mychannel`.

> Чтобы избавиться от всех компонентов сети: `./network.sh down`

---

## 🌐 Запуск API Backend

1. Убедитесь, что папки `fabric-samples` и `fabric-api` лежат рядом.
2. Перейдите в `fabric-api` и запустите Docker Compose:

```bash
cd ../../fabric-api
docker compose up --build
```

API будет доступен по адресу:  `http://localhost:3000`

### Тестирование API с помощью cURL (опционально)

* **Авторизация и получение JWT-токена** `/manager-login` (POST):

  ```bash
  curl -X POST \
  -H "Authorization: secret-token-for-org1-1234567" \
  http://localhost:3000/manager-login -v
  ```
* **Добавить запись** `/record` (POST):

  ```bash
  curl -X POST http://localhost:3000/record \
    -H "Content-Type: application/json" \
    -H "Cookie: authToken=eyJhbGciOiJIUzI..." \
    -d '{
      "componentID": "SSD",
      "batchID": "batch-d",
      "stage": "production",
      "price": "300.00"
    }'
  ```
* **Запросить последнюю цену** `/price/:componentID` (GET):

  ```bash
  curl http://localhost:3000/price/SSD
  ```
* **Запросить историю цен** `/price-history/:componentID` (GET):

  ```bash
  curl http://localhost:3000/price-history/SSD
  ```

---

## 🛠️ Ручной вызов методов смарт-контракта в консоли

1. Настройка окружения:

   ```bash
   export PATH=${PWD}/../bin:$PATH
   export FABRIC_CFG_PATH=$PWD/../config/
   ```

2. Подготовьте скрипты `import_org1` и `import_org2` с такими переменными:

   **import\_org1:**

   ```bash
   export CORE_PEER_TLS_ENABLED=true
   export CORE_PEER_LOCALMSPID=Org1MSP
   export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
   export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
   export CORE_PEER_ADDRESS=localhost:7051
   ```

   **import\_org2:**

   ```bash
   export CORE_PEER_TLS_ENABLED=true
   export CORE_PEER_LOCALMSPID=Org2MSP
   export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
   export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
   export CORE_PEER_ADDRESS=localhost:9051
   ```

   Выберите одну организацию и выполните:

   ```bash
   source import_org1   # или source import_org2
   ```

3. Примеры вызовов:

   * **InitLedger:**

     ```bash
     peer chaincode invoke \
       -o localhost:7050 \
       --ordererTLSHostnameOverride orderer.example.com \
       --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
       -C mychannel -n pricing_cc \
       --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
       --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
       -c '{"function":"InitLedger","Args":[]}'
     ```

   * **Query Current Price:**

     ```bash
     peer chaincode query \
       --peerAddresses localhost:7051 \
       --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
       -C mychannel -n pricing_cc \
       -c '{"function":"GetCurrentPrice","Args":["cpu-123"]}'
     ```

   * **RecordPrice:**

     ```bash
     peer chaincode invoke \
       -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
       -C mychannel -n pricing_cc \
       --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
       --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
       -c '{"function":"RecordPrice","Args":["SSD","batch-d","production","205.75"]}'
     ```

