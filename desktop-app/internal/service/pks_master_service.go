package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
)

var (
	ErrMasterDataExists = errors.New("master data already exists")
	ErrMasterDataInUse  = errors.New("master data is in use and cannot be deleted")
)

// PaginationRequest represents pagination parameters
type PaginationRequest struct {
	Page     int    `json:"page"`
	PageSize int    `json:"pageSize"`
	Search   string `json:"search"`
	Active   *bool  `json:"active"`
}

// PaginatedResponse represents paginated response
type PaginatedResponse[T any] struct {
	Data       []T   `json:"data"`
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	PageSize   int   `json:"pageSize"`
	TotalPages int   `json:"totalPages"`
}

// SearchFilters represents advanced search filters
type SearchFilters struct {
	Query   string                 `json:"query"`
	Filters map[string]interface{} `json:"filters"`
	Sort    map[string]string      `json:"sort"`
}

// PKSMasterService handles PKS master data operations
type PKSMasterService struct {
	db          *gorm.DB
	currentUser uuid.UUID
}

// NewPKSMasterService creates a new PKS master service
func NewPKSMasterService(db *gorm.DB) *PKSMasterService {
	return &PKSMasterService{
		db: db,
	}
}

// SetCurrentUser sets the current user for the service operations
func (s *PKSMasterService) SetCurrentUser(userID uuid.UUID) {
	s.currentUser = userID
}

func isServerMasterRecord(source string) bool {
	return strings.EqualFold(strings.TrimSpace(source), database.MasterDataSourceServer)
}

// === Product Operations ===

// CreateProduct creates a new product
func (s *PKSMasterService) CreateProduct(ctx context.Context, req *CreateProductRequest) (*database.MasterProduk, error) {
	// Check if product code already exists
	var existing database.MasterProduk
	if err := s.db.WithContext(ctx).Where("kode_produk = ?", req.KodeProduk).First(&existing).Error; err == nil {
		return nil, ErrMasterDataExists
	}

	// Create product
	product := &database.MasterProduk{
		KodeProduk: req.KodeProduk,
		NamaProduk: req.NamaProduk,
		Kategori:   req.Kategori,
		IsActive:   true,
	}

	if err := s.db.WithContext(ctx).Create(product).Error; err != nil {
		return nil, fmt.Errorf("failed to create product: %w", err)
	}

	return product, nil
}

// GetProducts retrieves all active products
func (s *PKSMasterService) GetProducts(ctx context.Context, activeOnly bool) ([]database.MasterProduk, error) {
	var products []database.MasterProduk

	query := s.db.WithContext(ctx)
	if activeOnly {
		query = query.Where("is_active = ?", true)
	}

	if err := query.Order("kode_produk").Find(&products).Error; err != nil {
		return nil, fmt.Errorf("failed to get products: %w", err)
	}

	return products, nil
}

// GetProdukPaginated retrieves products with pagination and search
func (s *PKSMasterService) GetProdukPaginated(ctx context.Context, req *PaginationRequest) (*PaginatedResponse[database.MasterProduk], error) {
	var products []database.MasterProduk
	var total int64

	// Build query
	query := s.db.WithContext(ctx).Model(&database.MasterProduk{})

	// Apply search filter
	if req.Search != "" {
		searchPattern := "%" + req.Search + "%"
		query = query.Where("kode_produk LIKE ? OR nama_produk LIKE ? OR kategori LIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	// Apply active filter
	if req.Active != nil {
		query = query.Where("is_active = ?", *req.Active)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count products: %w", err)
	}

	// Apply pagination
	offset := (req.Page - 1) * req.PageSize
	if err := query.Offset(offset).Limit(req.PageSize).Order("kode_produk").Find(&products).Error; err != nil {
		return nil, fmt.Errorf("failed to get products: %w", err)
	}

	totalPages := int((total + int64(req.PageSize) - 1) / int64(req.PageSize))

	return &PaginatedResponse[database.MasterProduk]{
		Data:       products,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}, nil
}

// SearchProduk performs advanced search on products
func (s *PKSMasterService) SearchProduk(ctx context.Context, filters *SearchFilters) ([]database.MasterProduk, error) {
	var products []database.MasterProduk

	query := s.db.WithContext(ctx)

	// Apply search query
	if filters.Query != "" {
		searchPattern := "%" + filters.Query + "%"
		query = query.Where("kode_produk LIKE ? OR nama_produk LIKE ? OR kategori LIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	// Apply additional filters
	for key, value := range filters.Filters {
		switch key {
		case "kategori":
			query = query.Where("kategori = ?", value)
		case "is_active":
			if active, ok := value.(bool); ok {
				query = query.Where("is_active = ?", active)
			}
		}
	}

	// Apply sorting
	orderBy := "kode_produk"
	if sortField, ok := filters.Sort["field"]; ok {
		orderBy = sortField
		if sortDir, ok := filters.Sort["direction"]; ok && sortDir == "desc" {
			orderBy += " DESC"
		}
	}

	if err := query.Order(orderBy).Find(&products).Error; err != nil {
		return nil, fmt.Errorf("failed to search products: %w", err)
	}

	return products, nil
}

// UpdateProduct updates an existing product
func (s *PKSMasterService) UpdateProduct(ctx context.Context, id uint, req *UpdateProductRequest) (*database.MasterProduk, error) {
	var product database.MasterProduk
	if err := s.db.WithContext(ctx).First(&product, id).Error; err != nil {
		return nil, fmt.Errorf("product not found: %w", err)
	}

	// Update fields
	product.NamaProduk = req.NamaProduk
	product.Kategori = req.Kategori
	if req.IsActive != nil {
		product.IsActive = *req.IsActive
	}

	if err := s.db.WithContext(ctx).Save(&product).Error; err != nil {
		return nil, fmt.Errorf("failed to update product: %w", err)
	}

	return &product, nil
}

// DeleteProduct soft deletes a product
func (s *PKSMasterService) DeleteProduct(ctx context.Context, id uint) error {
	// Check if product is in use
	var count int64
	if err := s.db.WithContext(ctx).Model(&database.TimbanganPKS{}).Where("id_produk = ?", id).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check product usage: %w", err)
	}
	if count > 0 {
		return fmt.Errorf("Produk tidak dapat dihapus karena sudah digunakan di %d transaksi penimbangan", count)
	}

	// Soft delete
	if err := s.db.WithContext(ctx).Model(&database.MasterProduk{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete product: %w", err)
	}

	return nil
}

// === Unit Operations ===

// CreateUnit creates a new unit
func (s *PKSMasterService) CreateUnit(ctx context.Context, req *CreateUnitRequest) (*database.MasterUnit, error) {
	// Check if unit already exists
	var existing database.MasterUnit
	if err := s.db.WithContext(ctx).Where("nomor_polisi = ?", req.NomorPolisi).First(&existing).Error; err == nil {
		return nil, ErrMasterDataExists
	}

	// Create unit
	unit := &database.MasterUnit{
		NomorPolisi:    req.NomorPolisi,
		NamaKendaraan:  req.NamaKendaraan,
		JenisKendaraan: req.JenisKendaraan,
		KapasitasMax:   req.KapasitasMax,
		IsActive:       true,
	}

	if err := s.db.WithContext(ctx).Create(unit).Error; err != nil {
		return nil, fmt.Errorf("failed to create unit: %w", err)
	}

	return unit, nil
}

// GetUnits retrieves all active units
func (s *PKSMasterService) GetUnits(ctx context.Context, activeOnly bool) ([]database.MasterUnit, error) {
	var units []database.MasterUnit

	query := s.db.WithContext(ctx)
	if activeOnly {
		query = query.Where("is_active = ?", true)
	}

	if err := query.Order("nomor_polisi").Find(&units).Error; err != nil {
		return nil, fmt.Errorf("failed to get units: %w", err)
	}

	return units, nil
}

// GetUnitPaginated retrieves units with pagination and search
func (s *PKSMasterService) GetUnitPaginated(ctx context.Context, req *PaginationRequest) (*PaginatedResponse[database.MasterUnit], error) {
	var units []database.MasterUnit
	var total int64

	// Build query
	query := s.db.WithContext(ctx).Model(&database.MasterUnit{})

	// Apply search filter
	if req.Search != "" {
		searchPattern := "%" + req.Search + "%"
		query = query.Where("nomor_polisi LIKE ? OR nama_kendaraan LIKE ? OR jenis_kendaraan LIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	// Apply active filter
	if req.Active != nil {
		query = query.Where("is_active = ?", *req.Active)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count units: %w", err)
	}

	// Apply pagination
	offset := (req.Page - 1) * req.PageSize
	if err := query.Offset(offset).Limit(req.PageSize).Order("nomor_polisi").Find(&units).Error; err != nil {
		return nil, fmt.Errorf("failed to get units: %w", err)
	}

	totalPages := int((total + int64(req.PageSize) - 1) / int64(req.PageSize))

	return &PaginatedResponse[database.MasterUnit]{
		Data:       units,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}, nil
}

// SearchUnit performs advanced search on units
func (s *PKSMasterService) SearchUnit(ctx context.Context, filters *SearchFilters) ([]database.MasterUnit, error) {
	var units []database.MasterUnit

	query := s.db.WithContext(ctx)

	// Apply search query
	if filters.Query != "" {
		searchPattern := "%" + filters.Query + "%"
		query = query.Where("nomor_polisi LIKE ? OR nama_kendaraan LIKE ? OR jenis_kendaraan LIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	// Apply additional filters
	for key, value := range filters.Filters {
		switch key {
		case "jenis_kendaraan":
			query = query.Where("jenis_kendaraan = ?", value)
		case "is_active":
			if active, ok := value.(bool); ok {
				query = query.Where("is_active = ?", active)
			}
		}
	}

	// Apply sorting
	orderBy := "nomor_polisi"
	if sortField, ok := filters.Sort["field"]; ok {
		orderBy = sortField
		if sortDir, ok := filters.Sort["direction"]; ok && sortDir == "desc" {
			orderBy += " DESC"
		}
	}

	if err := query.Order(orderBy).Find(&units).Error; err != nil {
		return nil, fmt.Errorf("failed to search units: %w", err)
	}

	return units, nil
}

// UpdateUnit updates an existing unit
func (s *PKSMasterService) UpdateUnit(ctx context.Context, id uint, req *UpdateUnitRequest) (*database.MasterUnit, error) {
	var unit database.MasterUnit
	if err := s.db.WithContext(ctx).First(&unit, id).Error; err != nil {
		return nil, fmt.Errorf("unit not found: %w", err)
	}

	// Update fields
	unit.NamaKendaraan = req.NamaKendaraan
	unit.JenisKendaraan = req.JenisKendaraan
	unit.KapasitasMax = req.KapasitasMax
	if req.IsActive != nil {
		unit.IsActive = *req.IsActive
	}

	if err := s.db.WithContext(ctx).Save(&unit).Error; err != nil {
		return nil, fmt.Errorf("failed to update unit: %w", err)
	}

	return &unit, nil
}

// DeleteUnit soft deletes a unit
func (s *PKSMasterService) DeleteUnit(ctx context.Context, id uint) error {
	// Check if unit is in use
	var count int64
	if err := s.db.WithContext(ctx).Model(&database.TimbanganPKS{}).Where("id_unit = ?", id).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check unit usage: %w", err)
	}
	if count > 0 {
		return fmt.Errorf("Kendaraan/Unit tidak dapat dihapus karena sudah digunakan di %d transaksi penimbangan", count)
	}

	// Soft delete
	if err := s.db.WithContext(ctx).Model(&database.MasterUnit{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete unit: %w", err)
	}

	return nil
}

// === Supplier Operations ===

// CreateSupplier creates a new supplier
func (s *PKSMasterService) CreateSupplier(ctx context.Context, req *CreateSupplierRequest) (*database.MasterSupplier, error) {
	// Check if supplier code already exists
	var existing database.MasterSupplier
	if err := s.db.WithContext(ctx).Where("kode_supplier = ?", req.KodeSupplier).First(&existing).Error; err == nil {
		return nil, ErrMasterDataExists
	}

	// Create supplier
	supplier := &database.MasterSupplier{
		KodeSupplier:  req.KodeSupplier,
		NamaSupplier:  req.NamaSupplier,
		Alamat:        req.Alamat,
		Kontak:        req.Kontak,
		JenisSupplier: req.JenisSupplier,
		IsActive:      true,
	}

	if err := s.db.WithContext(ctx).Create(supplier).Error; err != nil {
		return nil, fmt.Errorf("failed to create supplier: %w", err)
	}

	return supplier, nil
}

// GetSuppliers retrieves all active suppliers
func (s *PKSMasterService) GetSuppliers(ctx context.Context, activeOnly bool) ([]database.MasterSupplier, error) {
	var suppliers []database.MasterSupplier

	query := s.db.WithContext(ctx)
	if activeOnly {
		query = query.Where("is_active = ?", true)
	}

	if err := query.Order("kode_supplier").Find(&suppliers).Error; err != nil {
		return nil, fmt.Errorf("failed to get suppliers: %w", err)
	}

	return suppliers, nil
}

// GetSupplierPaginated retrieves suppliers with pagination and search
func (s *PKSMasterService) GetSupplierPaginated(ctx context.Context, req *PaginationRequest) (*PaginatedResponse[database.MasterSupplier], error) {
	var suppliers []database.MasterSupplier
	var total int64

	// Build query
	query := s.db.WithContext(ctx).Model(&database.MasterSupplier{})

	// Apply search filter
	if req.Search != "" {
		searchPattern := "%" + req.Search + "%"
		query = query.Where("kode_supplier LIKE ? OR nama_supplier LIKE ? OR alamat LIKE ? OR kontak LIKE ? OR jenis_supplier LIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
	}

	// Apply active filter
	if req.Active != nil {
		query = query.Where("is_active = ?", *req.Active)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count suppliers: %w", err)
	}

	// Apply pagination
	offset := (req.Page - 1) * req.PageSize
	if err := query.Offset(offset).Limit(req.PageSize).Order("kode_supplier").Find(&suppliers).Error; err != nil {
		return nil, fmt.Errorf("failed to get suppliers: %w", err)
	}

	totalPages := int((total + int64(req.PageSize) - 1) / int64(req.PageSize))

	return &PaginatedResponse[database.MasterSupplier]{
		Data:       suppliers,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}, nil
}

// SearchSupplier performs advanced search on suppliers
func (s *PKSMasterService) SearchSupplier(ctx context.Context, filters *SearchFilters) ([]database.MasterSupplier, error) {
	var suppliers []database.MasterSupplier

	query := s.db.WithContext(ctx)

	// Apply search query
	if filters.Query != "" {
		searchPattern := "%" + filters.Query + "%"
		query = query.Where("kode_supplier LIKE ? OR nama_supplier LIKE ? OR alamat LIKE ? OR kontak LIKE ? OR jenis_supplier LIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
	}

	// Apply additional filters
	for key, value := range filters.Filters {
		switch key {
		case "jenis_supplier":
			query = query.Where("jenis_supplier = ?", value)
		case "is_active":
			if active, ok := value.(bool); ok {
				query = query.Where("is_active = ?", active)
			}
		}
	}

	// Apply sorting
	orderBy := "kode_supplier"
	if sortField, ok := filters.Sort["field"]; ok {
		orderBy = sortField
		if sortDir, ok := filters.Sort["direction"]; ok && sortDir == "desc" {
			orderBy += " DESC"
		}
	}

	if err := query.Order(orderBy).Find(&suppliers).Error; err != nil {
		return nil, fmt.Errorf("failed to search suppliers: %w", err)
	}

	return suppliers, nil
}

// UpdateSupplier updates an existing supplier
func (s *PKSMasterService) UpdateSupplier(ctx context.Context, id uint, req *UpdateSupplierRequest) (*database.MasterSupplier, error) {
	var supplier database.MasterSupplier
	if err := s.db.WithContext(ctx).First(&supplier, id).Error; err != nil {
		return nil, fmt.Errorf("supplier not found: %w", err)
	}

	// Update fields
	supplier.NamaSupplier = req.NamaSupplier
	supplier.Alamat = req.Alamat
	supplier.Kontak = req.Kontak
	supplier.JenisSupplier = req.JenisSupplier
	if req.IsActive != nil {
		supplier.IsActive = *req.IsActive
	}

	if err := s.db.WithContext(ctx).Save(&supplier).Error; err != nil {
		return nil, fmt.Errorf("failed to update supplier: %w", err)
	}

	return &supplier, nil
}

// DeleteSupplier soft deletes a supplier
func (s *PKSMasterService) DeleteSupplier(ctx context.Context, id uint) error {
	// Check if supplier is in use
	var count int64
	if err := s.db.WithContext(ctx).Model(&database.TimbanganPKS{}).Where("id_supplier = ?", id).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check supplier usage: %w", err)
	}
	if count > 0 {
		return fmt.Errorf("Supplier tidak dapat dihapus karena sudah digunakan di %d transaksi penimbangan", count)
	}

	// Soft delete
	if err := s.db.WithContext(ctx).Model(&database.MasterSupplier{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete supplier: %w", err)
	}

	return nil
}

// === Estate Operations ===

// CreateEstate creates a new estate
func (s *PKSMasterService) CreateEstate(ctx context.Context, req *CreateEstateRequest) (*EstateResponse, error) {
	// Check if estate code already exists
	var existing database.MasterEstate
	if err := s.db.WithContext(ctx).Where("kode_estate = ?", req.KodeEstate).First(&existing).Error; err == nil {
		return nil, ErrMasterDataExists
	}

	// Create estate
	estate := &database.MasterEstate{
		KodeEstate: req.KodeEstate,
		NamaEstate: req.NamaEstate,
		Luas:       req.Luas,
		Lokasi:     req.Lokasi,
		IsActive:   true,
		DataSource: database.MasterDataSourceManual,
	}

	if err := s.db.WithContext(ctx).Create(estate).Error; err != nil {
		return nil, fmt.Errorf("failed to create estate: %w", err)
	}

	return ToEstateResponse(estate), nil
}

// GetEstates retrieves all active estates
func (s *PKSMasterService) GetEstates(ctx context.Context, activeOnly bool) ([]EstateResponse, error) {
	var estates []database.MasterEstate

	query := s.db.WithContext(ctx).Preload("Afdelings")
	if activeOnly {
		query = query.Where("is_active = ?", true)
	}

	if err := query.Order("kode_estate").Find(&estates).Error; err != nil {
		return nil, fmt.Errorf("failed to get estates: %w", err)
	}

	return ToEstateResponses(estates), nil
}

// UpdateEstate updates an existing estate
func (s *PKSMasterService) UpdateEstate(ctx context.Context, id uint, req *UpdateEstateRequest) (*EstateResponse, error) {
	var estate database.MasterEstate
	if err := s.db.WithContext(ctx).First(&estate, id).Error; err != nil {
		return nil, fmt.Errorf("estate not found: %w", err)
	}

	if isServerMasterRecord(estate.DataSource) {
		return nil, fmt.Errorf("estate sumber server bersifat read-only di lokal")
	}

	// Update fields
	estate.NamaEstate = req.NamaEstate
	estate.Luas = req.Luas
	if req.Lokasi != nil {
		estate.Lokasi = *req.Lokasi
	}
	if req.IsActive != nil {
		estate.IsActive = *req.IsActive
	}

	if err := s.db.WithContext(ctx).Save(&estate).Error; err != nil {
		return nil, fmt.Errorf("failed to update estate: %w", err)
	}

	return ToEstateResponse(&estate), nil
}

// DeleteEstate soft deletes an estate
func (s *PKSMasterService) DeleteEstate(ctx context.Context, id uint) error {
	var estate database.MasterEstate
	if err := s.db.WithContext(ctx).First(&estate, id).Error; err != nil {
		return fmt.Errorf("estate not found: %w", err)
	}
	if isServerMasterRecord(estate.DataSource) {
		return fmt.Errorf("estate sumber server bersifat read-only di lokal")
	}

	// Check if estate is in use (e.g. has afdelings)
	var count int64
	if err := s.db.WithContext(ctx).Model(&database.MasterAfdeling{}).Where("id_estate = ?", id).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check estate usage: %w", err)
	}
	if count > 0 {
		return fmt.Errorf("Estate tidak dapat dihapus karena masih memiliki %d afdeling yang terdaftar", count)
	}

	// Check if used in transactions
	if err := s.db.WithContext(ctx).Model(&database.TimbanganPKS{}).Where("id_estate = ?", id).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check estate usage in transactions: %w", err)
	}
	if count == 0 {
		if err := s.db.WithContext(ctx).Model(&database.TimbanganPKSTBSBlockDetail{}).Where("id_estate = ?", id).Count(&count).Error; err != nil {
			return fmt.Errorf("failed to check estate usage in block details: %w", err)
		}
	}
	if count > 0 {
		return fmt.Errorf("Estate tidak dapat dihapus karena sudah digunakan di %d transaksi penimbangan", count)
	}

	// Soft delete
	if err := s.db.WithContext(ctx).Model(&database.MasterEstate{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete estate: %w", err)
	}

	return nil
}

// GetEstatePaginated retrieves estates with pagination and search
func (s *PKSMasterService) GetEstatePaginated(ctx context.Context, req *PaginationRequest) (*PaginatedResponse[database.MasterEstate], error) {
	var estates []database.MasterEstate
	var total int64

	// Build query
	query := s.db.WithContext(ctx).Model(&database.MasterEstate{})

	// Apply search filter
	if req.Search != "" {
		searchPattern := "%" + req.Search + "%"
		query = query.Where("kode_estate LIKE ? OR nama_estate LIKE ?",
			searchPattern, searchPattern)
	}

	// Apply active filter
	if req.Active != nil {
		query = query.Where("is_active = ?", *req.Active)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count estates: %w", err)
	}

	// Apply pagination with relationships
	offset := (req.Page - 1) * req.PageSize
	if err := query.Preload("Afdelings").Offset(offset).Limit(req.PageSize).Order("kode_estate").Find(&estates).Error; err != nil {
		return nil, fmt.Errorf("failed to get estates: %w", err)
	}

	totalPages := int((total + int64(req.PageSize) - 1) / int64(req.PageSize))

	return &PaginatedResponse[database.MasterEstate]{
		Data:       estates,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}, nil
}

// SearchEstate performs advanced search on estates
func (s *PKSMasterService) SearchEstate(ctx context.Context, filters *SearchFilters) ([]database.MasterEstate, error) {
	var estates []database.MasterEstate

	query := s.db.WithContext(ctx)

	// Apply search query
	if filters.Query != "" {
		searchPattern := "%" + filters.Query + "%"
		query = query.Where("kode_estate LIKE ? OR nama_estate LIKE ?",
			searchPattern, searchPattern)
	}

	// Apply additional filters
	for key, value := range filters.Filters {
		switch key {
		case "is_active":
			if active, ok := value.(bool); ok {
				query = query.Where("is_active = ?", active)
			}
		}
	}

	// Apply sorting
	orderBy := "kode_estate"
	if sortField, ok := filters.Sort["field"]; ok {
		orderBy = sortField
		if sortDir, ok := filters.Sort["direction"]; ok && sortDir == "desc" {
			orderBy += " DESC"
		}
	}

	if err := query.Preload("Afdelings").Order(orderBy).Find(&estates).Error; err != nil {
		return nil, fmt.Errorf("failed to search estates: %w", err)
	}

	return estates, nil
}

// === Afdeling Operations ===

// CreateAfdeling creates a new afdeling
func (s *PKSMasterService) CreateAfdeling(ctx context.Context, req *CreateAfdelingRequest) (*AfdelingResponse, error) {
	// Validate estate exists
	var estate database.MasterEstate
	if err := s.db.WithContext(ctx).Where("id = ? AND is_active = ?", req.IDEstate, true).First(&estate).Error; err != nil {
		return nil, fmt.Errorf("estate not found or inactive: %w", err)
	}

	// Check if afdeling code already exists for this estate
	var existing database.MasterAfdeling
	if err := s.db.WithContext(ctx).Where("id_estate = ? AND kode_afdeling = ?", req.IDEstate, req.KodeAfdeling).First(&existing).Error; err == nil {
		return nil, ErrMasterDataExists
	}

	// Create afdeling
	afdeling := &database.MasterAfdeling{
		IDEstate:     req.IDEstate,
		KodeAfdeling: req.KodeAfdeling,
		NamaAfdeling: req.NamaAfdeling,
		Luas:         req.Luas,
		IsActive:     true,
		DataSource:   database.MasterDataSourceManual,
	}

	if err := s.db.WithContext(ctx).Create(afdeling).Error; err != nil {
		return nil, fmt.Errorf("failed to create afdeling: %w", err)
	}

	// Load estate relationship
	if err := s.db.WithContext(ctx).Preload("Estate").First(afdeling, afdeling.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load afdeling details: %w", err)
	}

	return ToAfdelingResponse(afdeling), nil
}

// GetAfdelingsByEstate retrieves afdelings by estate ID
func (s *PKSMasterService) GetAfdelingsByEstate(ctx context.Context, estateID uint, activeOnly bool) ([]AfdelingResponse, error) {
	var afdelings []database.MasterAfdeling

	query := s.db.WithContext(ctx).Preload("Estate").Where("id_estate = ?", estateID)
	if activeOnly {
		query = query.Where("is_active = ?", true)
	}

	if err := query.Order("kode_afdeling").Find(&afdelings).Error; err != nil {
		return nil, fmt.Errorf("failed to get afdelings: %w", err)
	}

	return ToAfdelingResponses(afdelings), nil
}

// GetAfdelings retrieves all active afdelings
func (s *PKSMasterService) GetAfdelings(ctx context.Context, activeOnly bool) ([]AfdelingResponse, error) {
	var afdelings []database.MasterAfdeling

	query := s.db.WithContext(ctx).Preload("Estate")
	if activeOnly {
		query = query.Where("is_active = ?", true)
	}

	if err := query.Order("kode_afdeling").Find(&afdelings).Error; err != nil {
		return nil, fmt.Errorf("failed to get afdelings: %w", err)
	}

	return ToAfdelingResponses(afdelings), nil
}

// UpdateAfdeling updates an existing afdeling
func (s *PKSMasterService) UpdateAfdeling(ctx context.Context, id uint, req *UpdateAfdelingRequest) (*AfdelingResponse, error) {
	var afdeling database.MasterAfdeling
	if err := s.db.WithContext(ctx).First(&afdeling, id).Error; err != nil {
		return nil, fmt.Errorf("afdeling not found: %w", err)
	}

	if isServerMasterRecord(afdeling.DataSource) {
		return nil, fmt.Errorf("afdeling sumber server bersifat read-only di lokal")
	}

	// Update fields
	afdeling.NamaAfdeling = req.NamaAfdeling
	afdeling.Luas = req.Luas
	if req.IsActive != nil {
		afdeling.IsActive = *req.IsActive
	}

	if err := s.db.WithContext(ctx).Save(&afdeling).Error; err != nil {
		return nil, fmt.Errorf("failed to update afdeling: %w", err)
	}

	// Load relationships
	if err := s.db.WithContext(ctx).Preload("Estate").First(&afdeling, id).Error; err != nil {
		return nil, fmt.Errorf("failed to load afdeling details: %w", err)
	}

	return ToAfdelingResponse(&afdeling), nil
}

// DeleteAfdeling soft deletes an afdeling
func (s *PKSMasterService) DeleteAfdeling(ctx context.Context, id uint) error {
	var afdeling database.MasterAfdeling
	if err := s.db.WithContext(ctx).First(&afdeling, id).Error; err != nil {
		return fmt.Errorf("afdeling not found: %w", err)
	}
	if isServerMasterRecord(afdeling.DataSource) {
		return fmt.Errorf("afdeling sumber server bersifat read-only di lokal")
	}

	// Check if afdeling is in use (e.g. has blocks)
	var count int64
	if err := s.db.WithContext(ctx).Model(&database.MasterBlok{}).Where("id_afdeling = ?", id).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check afdeling usage: %w", err)
	}
	if count > 0 {
		return fmt.Errorf("Afdeling tidak dapat dihapus karena masih memiliki %d blok yang terdaftar", count)
	}

	// Check if used in transactions
	if err := s.db.WithContext(ctx).Model(&database.TimbanganPKS{}).Where("id_afdeling = ?", id).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check afdeling usage in transactions: %w", err)
	}
	if count == 0 {
		if err := s.db.WithContext(ctx).Model(&database.TimbanganPKSTBSBlockDetail{}).Where("id_afdeling = ?", id).Count(&count).Error; err != nil {
			return fmt.Errorf("failed to check afdeling usage in block details: %w", err)
		}
	}
	if count > 0 {
		return fmt.Errorf("Afdeling tidak dapat dihapus karena sudah digunakan di %d transaksi penimbangan", count)
	}

	// Soft delete
	if err := s.db.WithContext(ctx).Model(&database.MasterAfdeling{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete afdeling: %w", err)
	}

	return nil
}

// GetAfdelingPaginated retrieves afdelings with pagination and search
func (s *PKSMasterService) GetAfdelingPaginated(ctx context.Context, req *PaginationRequest) (*PaginatedResponse[database.MasterAfdeling], error) {
	var afdelings []database.MasterAfdeling
	var total int64

	// Build query
	query := s.db.WithContext(ctx).Model(&database.MasterAfdeling{})

	// Apply search filter
	if req.Search != "" {
		searchPattern := "%" + req.Search + "%"
		query = query.Where("kode_afdeling LIKE ? OR nama_afdeling LIKE ?",
			searchPattern, searchPattern)
	}

	// Apply active filter
	if req.Active != nil {
		query = query.Where("is_active = ?", *req.Active)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count afdelings: %w", err)
	}

	// Apply pagination with relationships
	offset := (req.Page - 1) * req.PageSize
	if err := query.Preload("Estate").Offset(offset).Limit(req.PageSize).Order("kode_afdeling").Find(&afdelings).Error; err != nil {
		return nil, fmt.Errorf("failed to get afdelings: %w", err)
	}

	totalPages := int((total + int64(req.PageSize) - 1) / int64(req.PageSize))

	return &PaginatedResponse[database.MasterAfdeling]{
		Data:       afdelings,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}, nil
}

// SearchAfdeling performs advanced search on afdelings
func (s *PKSMasterService) SearchAfdeling(ctx context.Context, filters *SearchFilters) ([]database.MasterAfdeling, error) {
	var afdelings []database.MasterAfdeling

	query := s.db.WithContext(ctx)

	// Apply search query
	if filters.Query != "" {
		searchPattern := "%" + filters.Query + "%"
		query = query.Where("kode_afdeling LIKE ? OR nama_afdeling LIKE ?",
			searchPattern, searchPattern)
	}

	// Apply additional filters
	for key, value := range filters.Filters {
		switch key {
		case "id_estate":
			if estateID, ok := value.(float64); ok { // JSON numbers come as float64
				query = query.Where("id_estate = ?", uint(estateID))
			}
		case "is_active":
			if active, ok := value.(bool); ok {
				query = query.Where("is_active = ?", active)
			}
		}
	}

	// Apply sorting
	orderBy := "kode_afdeling"
	if sortField, ok := filters.Sort["field"]; ok {
		orderBy = sortField
		if sortDir, ok := filters.Sort["direction"]; ok && sortDir == "desc" {
			orderBy += " DESC"
		}
	}

	if err := query.Preload("Estate").Order(orderBy).Find(&afdelings).Error; err != nil {
		return nil, fmt.Errorf("failed to search afdelings: %w", err)
	}

	return afdelings, nil
}

// === Block Operations ===

// CreateBlok creates a new block
func (s *PKSMasterService) CreateBlok(ctx context.Context, req *CreateBlokRequest) (*BlockResponse, error) {
	// Validate afdeling exists
	var afdeling database.MasterAfdeling
	if err := s.db.WithContext(ctx).Where("id = ? AND is_active = ?", req.IDAfdeling, true).First(&afdeling).Error; err != nil {
		return nil, fmt.Errorf("afdeling not found or inactive: %w", err)
	}

	// Check if block code already exists for this afdeling
	var existing database.MasterBlok
	if err := s.db.WithContext(ctx).Where("id_afdeling = ? AND kode_blok = ?", req.IDAfdeling, req.KodeBlok).First(&existing).Error; err == nil {
		return nil, ErrMasterDataExists
	}

	// Create block
	blok := &database.MasterBlok{
		IDAfdeling: req.IDAfdeling,
		KodeBlok:   req.KodeBlok,
		NamaBlok:   req.NamaBlok,
		Luas:       req.Luas,
		IsActive:   true,
		DataSource: database.MasterDataSourceManual,
	}

	if err := s.db.WithContext(ctx).Create(blok).Error; err != nil {
		return nil, fmt.Errorf("failed to create block: %w", err)
	}

	// Load afdeling relationship
	if err := s.db.WithContext(ctx).Preload("Afdeling").First(blok, blok.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load block details: %w", err)
	}

	return ToBlockResponse(blok), nil
}

// GetBlokByAfdeling retrieves blocks by afdeling ID
func (s *PKSMasterService) GetBlokByAfdeling(ctx context.Context, afdelingID uint, activeOnly bool) ([]BlockResponse, error) {
	var bloks []database.MasterBlok

	query := s.db.WithContext(ctx).Preload("Afdeling").Preload("Afdeling.Estate").Where("id_afdeling = ?", afdelingID)
	if activeOnly {
		query = query.Where("is_active = ?", true)
	}

	if err := query.Order("kode_blok").Find(&bloks).Error; err != nil {
		return nil, fmt.Errorf("failed to get blocks: %w", err)
	}

	return ToBlockResponses(bloks), nil
}

// GetBlok retrieves all active blocks
func (s *PKSMasterService) GetBlok(ctx context.Context, activeOnly bool) ([]BlockResponse, error) {
	var bloks []database.MasterBlok

	query := s.db.WithContext(ctx).Preload("Afdeling").Preload("Afdeling.Estate")
	if activeOnly {
		query = query.Where("is_active = ?", true)
	}

	if err := query.Order("kode_blok").Find(&bloks).Error; err != nil {
		return nil, fmt.Errorf("failed to get blocks: %w", err)
	}

	return ToBlockResponses(bloks), nil
}

// UpdateBlok updates an existing block
func (s *PKSMasterService) UpdateBlok(ctx context.Context, id uint, req *UpdateBlokRequest) (*BlockResponse, error) {
	var blok database.MasterBlok
	if err := s.db.WithContext(ctx).First(&blok, id).Error; err != nil {
		return nil, fmt.Errorf("block not found: %w", err)
	}

	if isServerMasterRecord(blok.DataSource) {
		return nil, fmt.Errorf("blok sumber server bersifat read-only di lokal")
	}

	// Update fields
	blok.NamaBlok = req.NamaBlok
	blok.Luas = req.Luas
	if req.IsActive != nil {
		blok.IsActive = *req.IsActive
	}

	if err := s.db.WithContext(ctx).Save(&blok).Error; err != nil {
		return nil, fmt.Errorf("failed to update block: %w", err)
	}

	// Load relationships
	if err := s.db.WithContext(ctx).Preload("Afdeling").Preload("Afdeling.Estate").First(&blok, id).Error; err != nil {
		return nil, fmt.Errorf("failed to load block details: %w", err)
	}

	return ToBlockResponse(&blok), nil
}

// DeleteBlok soft deletes a block
func (s *PKSMasterService) DeleteBlok(ctx context.Context, id uint) error {
	var blok database.MasterBlok
	if err := s.db.WithContext(ctx).First(&blok, id).Error; err != nil {
		return fmt.Errorf("block not found: %w", err)
	}
	if isServerMasterRecord(blok.DataSource) {
		return fmt.Errorf("blok sumber server bersifat read-only di lokal")
	}

	// Check if block is in use in transactions
	var count int64
	if err := s.db.WithContext(ctx).Model(&database.TimbanganPKS{}).Where("id_blok = ?", id).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check block usage: %w", err)
	}
	if count == 0 {
		if err := s.db.WithContext(ctx).Model(&database.TimbanganPKSTBSBlockDetail{}).Where("id_blok = ?", id).Count(&count).Error; err != nil {
			return fmt.Errorf("failed to check block usage in block details: %w", err)
		}
	}
	if count > 0 {
		return fmt.Errorf("Blok tidak dapat dihapus karena sudah digunakan di %d transaksi penimbangan", count)
	}

	// Soft delete
	if err := s.db.WithContext(ctx).Model(&database.MasterBlok{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete block: %w", err)
	}

	return nil
}

// GetBlokPaginated retrieves blocks with pagination and search
func (s *PKSMasterService) GetBlokPaginated(ctx context.Context, req *PaginationRequest) (*PaginatedResponse[database.MasterBlok], error) {
	var bloks []database.MasterBlok
	var total int64

	// Build query
	query := s.db.WithContext(ctx).Model(&database.MasterBlok{})

	// Apply search filter
	if req.Search != "" {
		searchPattern := "%" + req.Search + "%"
		query = query.Where("kode_blok LIKE ? OR nama_blok LIKE ?",
			searchPattern, searchPattern)
	}

	// Apply active filter
	if req.Active != nil {
		query = query.Where("is_active = ?", *req.Active)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count blocks: %w", err)
	}

	// Apply pagination with relationships
	offset := (req.Page - 1) * req.PageSize
	if err := query.Preload("Afdeling").Preload("Afdeling.Estate").Offset(offset).Limit(req.PageSize).Order("kode_blok").Find(&bloks).Error; err != nil {
		return nil, fmt.Errorf("failed to get blocks: %w", err)
	}

	totalPages := int((total + int64(req.PageSize) - 1) / int64(req.PageSize))

	return &PaginatedResponse[database.MasterBlok]{
		Data:       bloks,
		Total:      total,
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
	}, nil
}

// SearchBlok performs advanced search on blocks
func (s *PKSMasterService) SearchBlok(ctx context.Context, filters *SearchFilters) ([]database.MasterBlok, error) {
	var bloks []database.MasterBlok

	query := s.db.WithContext(ctx)

	// Apply search query
	if filters.Query != "" {
		searchPattern := "%" + filters.Query + "%"
		query = query.Where("kode_blok LIKE ? OR nama_blok LIKE ?",
			searchPattern, searchPattern)
	}

	// Apply additional filters
	for key, value := range filters.Filters {
		switch key {
		case "id_afdeling":
			if afdelingID, ok := value.(float64); ok { // JSON numbers come as float64
				query = query.Where("id_afdeling = ?", uint(afdelingID))
			}
		case "is_active":
			if active, ok := value.(bool); ok {
				query = query.Where("is_active = ?", active)
			}
		}
	}

	// Apply sorting
	orderBy := "kode_blok"
	if sortField, ok := filters.Sort["field"]; ok {
		orderBy = sortField
		if sortDir, ok := filters.Sort["direction"]; ok && sortDir == "desc" {
			orderBy += " DESC"
		}
	}

	if err := query.Preload("Afdeling").Preload("Afdeling.Estate").Order(orderBy).Find(&bloks).Error; err != nil {
		return nil, fmt.Errorf("failed to search blocks: %w", err)
	}

	return bloks, nil
}

// Request/Response DTOs

type CreateProductRequest struct {
	KodeProduk string `json:"kodeProduk"`
	NamaProduk string `json:"namaProduk"`
	Kategori   string `json:"kategori"`
}

type UpdateProductRequest struct {
	NamaProduk string `json:"namaProduk"`
	Kategori   string `json:"kategori"`
	IsActive   *bool  `json:"isActive"`
}

type CreateUnitRequest struct {
	NomorPolisi    string  `json:"nomorPolisi"`
	NamaKendaraan  string  `json:"namaKendaraan"`
	JenisKendaraan string  `json:"jenisKendaraan"`
	KapasitasMax   float64 `json:"kapasitasMax"`
}

type UpdateUnitRequest struct {
	NamaKendaraan  string  `json:"namaKendaraan"`
	JenisKendaraan string  `json:"jenisKendaraan"`
	KapasitasMax   float64 `json:"kapasitasMax"`
	IsActive       *bool   `json:"isActive"`
}

type CreateEstateRequest struct {
	KodeEstate string  `json:"kodeEstate"`
	NamaEstate string  `json:"namaEstate"`
	Luas       float64 `json:"luas"`
	Lokasi     string  `json:"lokasi"`
}

type CreateAfdelingRequest struct {
	IDEstate     uint    `json:"idEstate"`
	KodeAfdeling string  `json:"kodeAfdeling"`
	NamaAfdeling string  `json:"namaAfdeling"`
	Luas         float64 `json:"luas"`
}

type CreateBlokRequest struct {
	IDAfdeling uint    `json:"idAfdeling"`
	KodeBlok   string  `json:"kodeBlok"`
	NamaBlok   string  `json:"namaBlok"`
	Luas       float64 `json:"luas"`
}

type CreateSupplierRequest struct {
	KodeSupplier  string `json:"kodeSupplier"`
	NamaSupplier  string `json:"namaSupplier"`
	Alamat        string `json:"alamat"`
	Kontak        string `json:"kontak"`
	JenisSupplier string `json:"jenisSupplier"`
}

type UpdateSupplierRequest struct {
	NamaSupplier  string `json:"namaSupplier"`
	Alamat        string `json:"alamat"`
	Kontak        string `json:"kontak"`
	JenisSupplier string `json:"jenisSupplier"`
	IsActive      *bool  `json:"isActive"`
}

type UpdateEstateRequest struct {
	NamaEstate string  `json:"namaEstate"`
	Luas       float64 `json:"luas"`
	Lokasi     *string `json:"lokasi"`
	IsActive   *bool   `json:"isActive"`
}

type UpdateAfdelingRequest struct {
	NamaAfdeling string  `json:"namaAfdeling"`
	Luas         float64 `json:"luas"`
	IsActive     *bool   `json:"isActive"`
}

type UpdateBlokRequest struct {
	NamaBlok string  `json:"namaBlok"`
	Luas     float64 `json:"luas"`
	IsActive *bool   `json:"isActive"`
}
