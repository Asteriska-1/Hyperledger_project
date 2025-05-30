package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract defines the structure of our smart contract.
type SmartContract struct {
	contractapi.Contract
}

// PriceRecord describes the structure of a price record for a component.
type PriceRecord struct {
	ComponentID string  `json:"componentID"`
	BatchID     string  `json:"batchID"`
	Price       float64 `json:"price"`
	Stage       string  `json:"stage"`
	Date        string  `json:"date"`
	Organization string `json:"organization"`
}

// InitLedger adds a few initial price records to the ledger.
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	initialPrices := []PriceRecord{
		{ComponentID: "cpu-123", BatchID: "batch-a", Price: 100.00, Stage: "production", Date: "2025-04-20"},
		{ComponentID: "memory-456", BatchID: "batch-b", Price: 50.50, Stage: "testing", Date: "2025-04-20"},
		{ComponentID: "storage-789", BatchID: "batch-c", Price: 200.75, Stage: "production", Date: "2025-04-20"},
	}

	for _, record := range initialPrices {
		err := s.RecordPrice(ctx, record.ComponentID, record.BatchID, record.Stage, fmt.Sprintf("%.2f", record.Price))
		if err != nil {
			return fmt.Errorf("InitLedger failed: %v", err)
		}
	}
	return nil
}

// RecordPrice records a new price for a component.
func (s *SmartContract) RecordPrice(ctx contractapi.TransactionContextInterface, componentID, batchID, stage string, priceStr string) error {
	price, err := strconv.ParseFloat(priceStr, 64)
	if err != nil {
		return fmt.Errorf("failed to parse price string to float: %v", err)
	}

	counterKey := "priceCounter:" + componentID
	counterBytes, err := ctx.GetStub().GetState(counterKey)
	if err != nil {
		return fmt.Errorf("failed to get counter: %v", err)
	}

	var index int
	if counterBytes != nil {
		index, err = strconv.Atoi(string(counterBytes))
		if err != nil {
			return fmt.Errorf("failed to parse counter: %v", err)
		}
	}
	index++

	err = ctx.GetStub().PutState(counterKey, []byte(strconv.Itoa(index)))
	if err != nil {
		return fmt.Errorf("failed to update counter: %v", err)
	}

	currentDate := time.Now().UTC().Format("2006-01-02")
	org, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get organization MSPID: %v", err)
	}

	record := PriceRecord{
		ComponentID: componentID,
		BatchID:     batchID,
		Price:       price,
		Stage:       stage,
		Date:        currentDate,
		Organization: org,
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return fmt.Errorf("failed to marshal price record: %v", err)
	}

	priceKey, err := ctx.GetStub().CreateCompositeKey("price", []string{componentID, fmt.Sprintf("%06d", index)})
	if err != nil {
		return fmt.Errorf("failed to create composite key: %v", err)
	}

	return ctx.GetStub().PutState(priceKey, recordJSON)
}

// GetCurrentPrice returns the latest price for the given componentID.
func (s *SmartContract) GetCurrentPrice(ctx contractapi.TransactionContextInterface, componentID string) (*PriceRecord, error) {
	fmt.Printf("GetCurrentPrice called for componentID: %s\n", componentID)

	iterator, err := ctx.GetStub().GetStateByPartialCompositeKey("price", []string{componentID})
	if err != nil {
		return nil, fmt.Errorf("failed to get state by partial composite key: %v", err)
	}
	defer iterator.Close()

	var latestRecord *PriceRecord
	var latestIndex string

	for iterator.HasNext() {
		response, err := iterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get next record: %v", err)
		}

		_, keyParts, err := ctx.GetStub().SplitCompositeKey(response.Key)
		if err != nil {
			return nil, fmt.Errorf("failed to split composite key: %v", err)
		}

		index := keyParts[1]
		if index > latestIndex {
			var record PriceRecord
			err = json.Unmarshal(response.Value, &record)
			if err != nil {
				return nil, fmt.Errorf("failed to unmarshal record: %v", err)
			}
			latestRecord = &record
			latestIndex = index
		}
	}

	if latestRecord == nil {
		return nil, fmt.Errorf("price not found for component '%s'", componentID)
	}

	return latestRecord, nil
}

// GetPriceHistory returns all price records for the given componentID.
func (s *SmartContract) GetPriceHistory(ctx contractapi.TransactionContextInterface, componentID string) ([]*PriceRecord, error) {
	fmt.Printf("GetPriceHistory called for componentID: %s\n", componentID)

	iterator, err := ctx.GetStub().GetStateByPartialCompositeKey("price", []string{componentID})
	if err != nil {
		return nil, fmt.Errorf("failed to get price history: %v", err)
	}
	defer iterator.Close()

	var history []*PriceRecord
	for iterator.HasNext() {
		response, err := iterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get next record in history: %v", err)
		}

		var record PriceRecord
		err = json.Unmarshal(response.Value, &record)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal record: %v", err)
		}
		history = append(history, &record)
	}

	if len(history) == 0 {
		return nil, fmt.Errorf("price history not found for component '%s'", componentID)
	}

	return history, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating smart contract: %v", err)
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting smart contract: %v", err)
	}
}
