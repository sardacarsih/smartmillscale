package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/dto"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/usecases"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/service"
)

// PKSMasterController handles PKS master data operations
type PKSMasterController struct {
	masterService     *service.PKSMasterService
	masterSyncUseCase *usecases.MasterDataSyncUseCase
}

// NewPKSMasterController creates a new PKS master controller
func NewPKSMasterController(masterService *service.PKSMasterService, masterSyncUseCase *usecases.MasterDataSyncUseCase) *PKSMasterController {
	return &PKSMasterController{
		masterService:     masterService,
		masterSyncUseCase: masterSyncUseCase,
	}
}

// === Product Operations ===

// CreateProduct creates a new product
func (c *PKSMasterController) CreateProduct(requestJSON string, creatorID string) (interface{}, error) {
	// Parse creator ID
	creatorUUID, err := uuid.Parse(creatorID)
	if err != nil {
		return nil, fmt.Errorf("invalid creator ID: %w", err)
	}

	// Parse request
	var req service.CreateProductRequest
	if err := json.Unmarshal([]byte(requestJSON), &req); err != nil {
		return nil, fmt.Errorf("invalid request format: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(creatorUUID)

	// Create product
	result, err := c.masterService.CreateProduct(context.Background(), &req)
	if err != nil {
		return nil, fmt.Errorf("failed to create product: %w", err)
	}

	return result, nil
}

// UpdateProduct updates an existing product
func (c *PKSMasterController) UpdateProduct(requestJSON string, updaterID string) (interface{}, error) {
	// Parse updater ID
	updaterUUID, err := uuid.Parse(updaterID)
	if err != nil {
		return nil, fmt.Errorf("invalid updater ID: %w", err)
	}

	// Parse request
	var req struct {
		ID      uint                         `json:"id"`
		Request service.UpdateProductRequest `json:"request"`
	}
	if err := json.Unmarshal([]byte(requestJSON), &req); err != nil {
		return nil, fmt.Errorf("invalid request format: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(updaterUUID)

	// Update product
	result, err := c.masterService.UpdateProduct(context.Background(), req.ID, &req.Request)
	if err != nil {
		return nil, fmt.Errorf("failed to update product: %w", err)
	}

	return result, nil
}

// DeleteProduct deletes a product
func (c *PKSMasterController) DeleteProduct(productID string, deleterID string) error {
	// Parse deleter ID
	deleterUUID, err := uuid.Parse(deleterID)
	if err != nil {
		return fmt.Errorf("invalid deleter ID: %w", err)
	}

	// Parse product ID
	id, err := strconv.ParseUint(productID, 10, 32)
	if err != nil {
		return fmt.Errorf("invalid product ID: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(deleterUUID)

	// Delete product
	return c.masterService.DeleteProduct(context.Background(), uint(id))
}

// GetProducts retrieves products
func (c *PKSMasterController) GetProducts(activeOnly bool) (interface{}, error) {
	result, err := c.masterService.GetProducts(context.Background(), activeOnly)
	if err != nil {
		return nil, fmt.Errorf("failed to get products: %w", err)
	}

	return result, nil
}

// === Unit Operations ===

// CreateUnit creates a new unit
func (c *PKSMasterController) CreateUnit(requestJSON string, creatorID string) (interface{}, error) {
	// Parse creator ID
	creatorUUID, err := uuid.Parse(creatorID)
	if err != nil {
		return nil, fmt.Errorf("invalid creator ID: %w", err)
	}

	// Parse request
	var req service.CreateUnitRequest
	if err := json.Unmarshal([]byte(requestJSON), &req); err != nil {
		return nil, fmt.Errorf("invalid request format: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(creatorUUID)

	// Create unit
	result, err := c.masterService.CreateUnit(context.Background(), &req)
	if err != nil {
		return nil, fmt.Errorf("failed to create unit: %w", err)
	}

	return result, nil
}

// UpdateUnit updates an existing unit
func (c *PKSMasterController) UpdateUnit(requestJSON string, updaterID string) (interface{}, error) {
	// Parse updater ID
	updaterUUID, err := uuid.Parse(updaterID)
	if err != nil {
		return nil, fmt.Errorf("invalid updater ID: %w", err)
	}

	// Parse request
	var req struct {
		ID      uint                      `json:"id"`
		Request service.UpdateUnitRequest `json:"request"`
	}
	if err := json.Unmarshal([]byte(requestJSON), &req); err != nil {
		return nil, fmt.Errorf("invalid request format: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(updaterUUID)

	// Update unit
	result, err := c.masterService.UpdateUnit(context.Background(), req.ID, &req.Request)
	if err != nil {
		return nil, fmt.Errorf("failed to update unit: %w", err)
	}

	return result, nil
}

// DeleteUnit deletes a unit
func (c *PKSMasterController) DeleteUnit(unitID string, deleterID string) error {
	// Parse deleter ID
	deleterUUID, err := uuid.Parse(deleterID)
	if err != nil {
		return fmt.Errorf("invalid deleter ID: %w", err)
	}

	// Parse unit ID
	id, err := strconv.ParseUint(unitID, 10, 32)
	if err != nil {
		return fmt.Errorf("invalid unit ID: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(deleterUUID)

	// Delete unit
	return c.masterService.DeleteUnit(context.Background(), uint(id))
}

// GetUnits retrieves units
func (c *PKSMasterController) GetUnits(activeOnly bool) (interface{}, error) {
	result, err := c.masterService.GetUnits(context.Background(), activeOnly)
	if err != nil {
		return nil, fmt.Errorf("failed to get units: %w", err)
	}

	return result, nil
}

// === Supplier Operations ===

// CreateSupplier creates a new supplier
func (c *PKSMasterController) CreateSupplier(requestJSON string, creatorID string) (interface{}, error) {
	// Parse creator ID
	creatorUUID, err := uuid.Parse(creatorID)
	if err != nil {
		return nil, fmt.Errorf("invalid creator ID: %w", err)
	}

	// Parse request
	var req service.CreateSupplierRequest
	if err := json.Unmarshal([]byte(requestJSON), &req); err != nil {
		return nil, fmt.Errorf("invalid request format: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(creatorUUID)

	// Create supplier
	result, err := c.masterService.CreateSupplier(context.Background(), &req)
	if err != nil {
		return nil, fmt.Errorf("failed to create supplier: %w", err)
	}

	return result, nil
}

// UpdateSupplier updates an existing supplier
func (c *PKSMasterController) UpdateSupplier(requestJSON string, updaterID string) (interface{}, error) {
	// Parse updater ID
	updaterUUID, err := uuid.Parse(updaterID)
	if err != nil {
		return nil, fmt.Errorf("invalid updater ID: %w", err)
	}

	// Parse request
	var req struct {
		ID      uint                          `json:"id"`
		Request service.UpdateSupplierRequest `json:"request"`
	}
	if err := json.Unmarshal([]byte(requestJSON), &req); err != nil {
		return nil, fmt.Errorf("invalid request format: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(updaterUUID)

	// Update supplier
	result, err := c.masterService.UpdateSupplier(context.Background(), req.ID, &req.Request)
	if err != nil {
		return nil, fmt.Errorf("failed to update supplier: %w", err)
	}

	return result, nil
}

// DeleteSupplier deletes a supplier
func (c *PKSMasterController) DeleteSupplier(supplierID string, deleterID string) error {
	// Parse deleter ID
	deleterUUID, err := uuid.Parse(deleterID)
	if err != nil {
		return fmt.Errorf("invalid deleter ID: %w", err)
	}

	// Parse supplier ID
	id, err := strconv.ParseUint(supplierID, 10, 32)
	if err != nil {
		return fmt.Errorf("invalid supplier ID: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(deleterUUID)

	// Delete supplier
	return c.masterService.DeleteSupplier(context.Background(), uint(id))
}

// GetSuppliers retrieves suppliers
func (c *PKSMasterController) GetSuppliers(activeOnly bool) (interface{}, error) {
	result, err := c.masterService.GetSuppliers(context.Background(), activeOnly)
	if err != nil {
		return nil, fmt.Errorf("failed to get suppliers: %w", err)
	}

	return result, nil
}

// === Estate Operations ===

// CreateEstate creates a new estate
func (c *PKSMasterController) CreateEstate(requestJSON string, creatorID string) (interface{}, error) {
	// Parse creator ID
	creatorUUID, err := uuid.Parse(creatorID)
	if err != nil {
		return nil, fmt.Errorf("invalid creator ID: %w", err)
	}

	// Parse request
	var req service.CreateEstateRequest
	if err := json.Unmarshal([]byte(requestJSON), &req); err != nil {
		return nil, fmt.Errorf("invalid request format: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(creatorUUID)

	// Create estate
	result, err := c.masterService.CreateEstate(context.Background(), &req)
	if err != nil {
		return nil, fmt.Errorf("failed to create estate: %w", err)
	}

	return result, nil
}

// GetEstates retrieves estates
func (c *PKSMasterController) GetEstates(activeOnly bool) (interface{}, error) {
	result, err := c.masterService.GetEstates(context.Background(), activeOnly)
	if err != nil {
		return nil, fmt.Errorf("failed to get estates: %w", err)
	}

	return result, nil
}

// UpdateEstate updates an existing estate
func (c *PKSMasterController) UpdateEstate(requestJSON string, updaterID string) (interface{}, error) {
	// Parse updater ID
	updaterUUID, err := uuid.Parse(updaterID)
	if err != nil {
		return nil, fmt.Errorf("invalid updater ID: %w", err)
	}

	// Parse request
	var req struct {
		ID      uint                        `json:"id"`
		Request service.UpdateEstateRequest `json:"request"`
	}
	if err := json.Unmarshal([]byte(requestJSON), &req); err != nil {
		return nil, fmt.Errorf("invalid request format: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(updaterUUID)

	// Update estate
	result, err := c.masterService.UpdateEstate(context.Background(), req.ID, &req.Request)
	if err != nil {
		return nil, fmt.Errorf("failed to update estate: %w", err)
	}

	return result, nil
}

// DeleteEstate deletes an estate
func (c *PKSMasterController) DeleteEstate(estateID string, deleterID string) error {
	// Parse deleter ID
	deleterUUID, err := uuid.Parse(deleterID)
	if err != nil {
		return fmt.Errorf("invalid deleter ID: %w", err)
	}

	// Parse estate ID
	id, err := strconv.ParseUint(estateID, 10, 32)
	if err != nil {
		return fmt.Errorf("invalid estate ID: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(deleterUUID)

	// Delete estate
	return c.masterService.DeleteEstate(context.Background(), uint(id))
}

// === Afdeling Operations ===

// CreateAfdeling creates a new afdeling
func (c *PKSMasterController) CreateAfdeling(requestJSON string, creatorID string) (interface{}, error) {
	// Parse creator ID
	creatorUUID, err := uuid.Parse(creatorID)
	if err != nil {
		return nil, fmt.Errorf("invalid creator ID: %w", err)
	}

	// Parse request
	var req service.CreateAfdelingRequest
	if err := json.Unmarshal([]byte(requestJSON), &req); err != nil {
		return nil, fmt.Errorf("invalid request format: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(creatorUUID)

	// Create afdeling
	result, err := c.masterService.CreateAfdeling(context.Background(), &req)
	if err != nil {
		return nil, fmt.Errorf("failed to create afdeling: %w", err)
	}

	return result, nil
}

// GetAfdelingsByEstate retrieves afdelings by estate ID
func (c *PKSMasterController) GetAfdelingsByEstate(estateID string, activeOnly bool) (interface{}, error) {
	// Parse estate ID
	id, err := strconv.ParseUint(estateID, 10, 32)
	if err != nil {
		return nil, fmt.Errorf("invalid estate ID: %w", err)
	}

	result, err := c.masterService.GetAfdelingsByEstate(context.Background(), uint(id), activeOnly)
	if err != nil {
		return nil, fmt.Errorf("failed to get afdelings: %w", err)
	}

	return result, nil
}

// GetAfdelings retrieves all afdelings
func (c *PKSMasterController) GetAfdelings(activeOnly bool) (interface{}, error) {
	result, err := c.masterService.GetAfdelings(context.Background(), activeOnly)
	if err != nil {
		return nil, fmt.Errorf("failed to get afdelings: %w", err)
	}

	return result, nil
}

// UpdateAfdeling updates an existing afdeling
func (c *PKSMasterController) UpdateAfdeling(requestJSON string, updaterID string) (interface{}, error) {
	// Parse updater ID
	updaterUUID, err := uuid.Parse(updaterID)
	if err != nil {
		return nil, fmt.Errorf("invalid updater ID: %w", err)
	}

	// Parse request
	var req struct {
		ID      uint                          `json:"id"`
		Request service.UpdateAfdelingRequest `json:"request"`
	}
	if err := json.Unmarshal([]byte(requestJSON), &req); err != nil {
		return nil, fmt.Errorf("invalid request format: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(updaterUUID)

	// Update afdeling
	result, err := c.masterService.UpdateAfdeling(context.Background(), req.ID, &req.Request)
	if err != nil {
		return nil, fmt.Errorf("failed to update afdeling: %w", err)
	}

	return result, nil
}

// DeleteAfdeling deletes an afdeling
func (c *PKSMasterController) DeleteAfdeling(afdelingID string, deleterID string) error {
	// Parse deleter ID
	deleterUUID, err := uuid.Parse(deleterID)
	if err != nil {
		return fmt.Errorf("invalid deleter ID: %w", err)
	}

	// Parse afdeling ID
	id, err := strconv.ParseUint(afdelingID, 10, 32)
	if err != nil {
		return fmt.Errorf("invalid afdeling ID: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(deleterUUID)

	// Delete afdeling
	return c.masterService.DeleteAfdeling(context.Background(), uint(id))
}

// === Block Operations ===

// CreateBlok creates a new block
func (c *PKSMasterController) CreateBlok(requestJSON string, creatorID string) (interface{}, error) {
	// Parse creator ID
	creatorUUID, err := uuid.Parse(creatorID)
	if err != nil {
		return nil, fmt.Errorf("invalid creator ID: %w", err)
	}

	// Parse request
	var req service.CreateBlokRequest
	if err := json.Unmarshal([]byte(requestJSON), &req); err != nil {
		return nil, fmt.Errorf("invalid request format: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(creatorUUID)

	// Create block
	result, err := c.masterService.CreateBlok(context.Background(), &req)
	if err != nil {
		return nil, fmt.Errorf("failed to create block: %w", err)
	}

	return result, nil
}

// GetBlokByAfdeling retrieves blocks by afdeling ID
func (c *PKSMasterController) GetBlokByAfdeling(afdelingID string, activeOnly bool) (interface{}, error) {
	// Parse afdeling ID
	id, err := strconv.ParseUint(afdelingID, 10, 32)
	if err != nil {
		return nil, fmt.Errorf("invalid afdeling ID: %w", err)
	}

	result, err := c.masterService.GetBlokByAfdeling(context.Background(), uint(id), activeOnly)
	if err != nil {
		return nil, fmt.Errorf("failed to get blocks: %w", err)
	}

	return result, nil
}

// GetBlok retrieves all blocks
func (c *PKSMasterController) GetBlok(activeOnly bool) (interface{}, error) {
	result, err := c.masterService.GetBlok(context.Background(), activeOnly)
	if err != nil {
		return nil, fmt.Errorf("failed to get blocks: %w", err)
	}

	return result, nil
}

// UpdateBlok updates an existing block
func (c *PKSMasterController) UpdateBlok(requestJSON string, updaterID string) (interface{}, error) {
	// Parse updater ID
	updaterUUID, err := uuid.Parse(updaterID)
	if err != nil {
		return nil, fmt.Errorf("invalid updater ID: %w", err)
	}

	// Parse request
	var req struct {
		ID      uint                      `json:"id"`
		Request service.UpdateBlokRequest `json:"request"`
	}
	if err := json.Unmarshal([]byte(requestJSON), &req); err != nil {
		return nil, fmt.Errorf("invalid request format: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(updaterUUID)

	// Update block
	result, err := c.masterService.UpdateBlok(context.Background(), req.ID, &req.Request)
	if err != nil {
		return nil, fmt.Errorf("failed to update block: %w", err)
	}

	return result, nil
}

// DeleteBlok deletes a block
func (c *PKSMasterController) DeleteBlok(blokID string, deleterID string) error {
	// Parse deleter ID
	deleterUUID, err := uuid.Parse(deleterID)
	if err != nil {
		return fmt.Errorf("invalid deleter ID: %w", err)
	}

	// Parse block ID
	id, err := strconv.ParseUint(blokID, 10, 32)
	if err != nil {
		return fmt.Errorf("invalid block ID: %w", err)
	}

	// Set current user
	c.masterService.SetCurrentUser(deleterUUID)

	// Delete block
	return c.masterService.DeleteBlok(context.Background(), uint(id))
}

// TriggerMasterDataSync triggers master-data synchronization (estate/afdeling/blok).
func (c *PKSMasterController) TriggerMasterDataSync(requestJSON string) (interface{}, error) {
	if c.masterSyncUseCase == nil {
		return nil, fmt.Errorf("master data sync use case is not initialized")
	}

	req := &dto.MasterDataSyncRequest{}
	if requestJSON != "" {
		if err := json.Unmarshal([]byte(requestJSON), req); err != nil {
			return nil, fmt.Errorf("invalid request format: %w", err)
		}
	}

	result, err := c.masterSyncUseCase.TriggerMasterDataSync(context.Background(), req)
	if err != nil {
		return nil, err
	}

	return result, nil
}

// GetMasterDataSyncStatus returns latest master-data sync status.
func (c *PKSMasterController) GetMasterDataSyncStatus() (interface{}, error) {
	if c.masterSyncUseCase == nil {
		return nil, fmt.Errorf("master data sync use case is not initialized")
	}

	status, err := c.masterSyncUseCase.GetMasterDataSyncStatus(context.Background())
	if err != nil {
		return nil, err
	}

	return status, nil
}
