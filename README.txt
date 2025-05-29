
Проект разворачивается с использованием официального репозитория Hyperledger fabric-samples, в частности,
с помощью тестовой сети test-network.
Необходим установленный Docker и Go.
Проект разрабатывался и тестировался на ОС Linux (но вполне может работать и на других ОС, главное сеть поднять)
-------------------------------------------------------
1. Пусть корневая папка называется blockchain_sources (непринципиально), внутри должны быть следующие папки:
- скачанный репозиторий fabric-samples
  (подробнее под каждую ОС см. туториал https://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html,
  можно установить через скрипт);
- chaincode (c кодом нашего смартконтракта: pricing_cc.go и списком зависимостей: go.mod и go.sum);
- fabric-api (веб-сервер);

- опционально (для ручного вызова методов в терминале):
  файлы import_org1 и import_org2 (пока пустые, в них позднее можно будет записать переменные окружения).


2. Для поднятия тестовой сети с двумя основными организациями, orderer'ом и CA необходимо:
- запустить docker (engine);
- перейти в fabric-samples/test-network;
- запустить скрипт, выполнив команду:
  ./network.sh up createChannel -ca


3. После успешного поднятия сети деплоим код на оба пира (а также коммитим его) командой:
./network.sh deployCC -ccn pricing_cc -ccp ../../chaincode/ -ccl go

/* Нужно подождать */

После успешного деплоя можно вызывать методы через api или ручной вызов в терминале через peer (показано ниже)


Уничтожить всю сеть можно: ./network.sh down
  
-------------------------------------------------------
Разворачивание бэкэнда API (только после поднятия сети).

1. Убедиться, что папки fabric-samples и fabric-api должны лежать рядом.

2. Перейти в fabric-api и запустить команду запуска контейнеров со сборкой образов:
docker compose up --build

После этого на http://localhost:3000 будет запущен веб-сервер.
Сначала в блокчейн нужно добавить какие-нибудь записи о компонентах, потом можно запрашивать сведения о них.
/* Если вручную вызывать методы смарт-контракта, то там есть метод инициализации начальными записями */

Сделать POST запрос на внесение нового компонента в блокчейн (ручка /record):
curl -X POST http://localhost:3000/record   -H "Content-Type: application/json"   -d '{
    "componentID": "SSD",
    "batchID": "batch-d",
    "stage": "production",
    "price": "300.00"
  }'

Запрос текущей цены компонента:
curl http://localhost:3000/price/<name_of_component>
Например:
curl http://localhost:3000/price/SSD

Запрос истории компонента:
curl http://localhost:3000/price-history/<name_of_component>
Например:
curl http://localhost:3000/price-history/SSD

-------------------------------------------------------
Ручной вызов методов смарт-контракта в терминале (только после поднятия сети).

Определение переменных:
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/

Установка переменных окружения, чтобы действовать от имени организации 1:
source ../../import_org1

содержимое import_org1:
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

Действовать от имени организации 2:
source ../../import_org2

содержимое import_org2:
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

/* Вводить обе команды выше не имеет смысла, выбрать одно */


Рабочие вызовы методов смартконтракта из консоли (взято в основном из https://hyperledger-fabric.readthedocs.io/en/latest/test_network.html):
Все вызываемые методы, определенные в смарт-контракте, с параметрами пишутся после флага -c

Инициализация начальных записей в блокчейне (их можно отредактировать в смарт-контракте):
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C mychannel -n pricing_cc --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"InitLedger","Args":[]}'

Запрос текущей цены (в function указать GetCurrentPrice) и запрос истории цен (в function указать GetPriceHistory)
peer chaincode query   --peerAddresses localhost:7051   --tlsRootCertFiles "$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"   -C mychannel   -n pricing_cc   -c '{"function":"GetCurrentPrice","Args":["cpu-123"]}'

Добавление новой записи:
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C mychannel -n pricing_cc --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"RecordPrice","Args":["SSD","batch-d","production","205.75"]}'


