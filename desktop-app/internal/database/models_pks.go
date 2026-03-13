package database

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	"gorm.io/gorm"
)

// MasterProduk represents master data for products in PKS system
type MasterProduk struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	KodeProduk string    `gorm:"uniqueIndex;not null" json:"kode_produk"`
	NamaProduk string    `gorm:"not null" json:"nama_produk"`
	Kategori   string    `json:"kategori"` // TBS, CPO, KERNEL, LAINNYA
	IsActive   bool      `gorm:"default:true" json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Relationships
	TimbangansPKS []TimbanganPKS `gorm:"foreignKey:IDProduk" json:"timbangans_pks,omitempty"`
}

// TableName specifies the table name for MasterProduk
func (MasterProduk) TableName() string {
	return "master_produk"
}

// MasterUnit represents master data for vehicles/units in PKS system
type MasterUnit struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	NomorPolisi    string    `gorm:"uniqueIndex;not null" json:"nomor_polisi"`
	NamaKendaraan  string    `json:"nama_kendaraan"`
	JenisKendaraan string    `json:"jenis_kendaraan"` // TRUK, TRONTON, DLL
	KapasitasMax   float64   `json:"kapasitas_max"`   // kg
	IsActive       bool      `gorm:"default:true" json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Relationships
	TimbangansPKS []TimbanganPKS `gorm:"foreignKey:IDUnit" json:"timbangans_pks,omitempty"`
}

// TableName specifies the table name for MasterUnit
func (MasterUnit) TableName() string {
	return "master_unit"
}

// MasterSupplier represents master data for suppliers in PKS system
type MasterSupplier struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	KodeSupplier  string    `gorm:"uniqueIndex;not null" json:"kode_supplier"`
	NamaSupplier  string    `gorm:"not null" json:"nama_supplier"`
	Alamat        string    `json:"alamat"`
	Kontak        string    `json:"kontak"`
	JenisSupplier string    `json:"jenis_supplier"` // PETANI, PLASMA, AGEN, DLL
	IsActive      bool      `gorm:"default:true" json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	// Relationships
	TimbangansPKS []TimbanganPKS `gorm:"foreignKey:IDSupplier" json:"timbangans_pks,omitempty"`
}

// TableName specifies the table name for MasterSupplier
func (MasterSupplier) TableName() string {
	return "master_supplier"
}

// MasterCustomer represents master data for customers/buyers in PKS system
type MasterCustomer struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	KodeCustomer  string    `gorm:"uniqueIndex;not null" json:"kode_customer"`
	NamaCustomer  string    `gorm:"not null" json:"nama_customer"`
	Alamat        string    `json:"alamat"`
	Telepon       string    `json:"telepon"`
	Email         string    `json:"email"`
	JenisCustomer string    `json:"jenis_customer"` // BUYER_CPO, BUYER_KERNEL, DISTRIBUTOR, DLL
	IsActive      bool      `gorm:"default:true" json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// TableName specifies the table name for MasterCustomer
func (MasterCustomer) TableName() string {
	return "master_customer"
}

// MasterEstate represents master data for estates in PKS system (for TBS)
type MasterEstate struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	KodeEstate string    `gorm:"uniqueIndex;not null" json:"kode_estate"`
	NamaEstate string    `gorm:"not null" json:"nama_estate"`
	Luas       float64   `json:"luas"` // hektar
	Lokasi     string    `json:"lokasi"`
	IsActive   bool      `gorm:"default:true" json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Relationships
	Afdelings     []MasterAfdeling `gorm:"foreignKey:IDEstate" json:"afdelings,omitempty"`
	TimbangansPKS []TimbanganPKS   `gorm:"foreignKey:IDEstate" json:"timbangans_pks,omitempty"`
}

// TableName specifies the table name for MasterEstate
func (MasterEstate) TableName() string {
	return "master_estate"
}

// MasterAfdeling represents master data for afdelings in PKS system (for TBS)
type MasterAfdeling struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	IDEstate     uint      `gorm:"not null" json:"id_estate"`
	KodeAfdeling string    `gorm:"not null" json:"kode_afdeling"`
	NamaAfdeling string    `gorm:"not null" json:"nama_afdeling"`
	Luas         float64   `json:"luas"` // hektar
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	// Relationships
	Estate        MasterEstate   `gorm:"foreignKey:IDEstate" json:"estate"`
	Bloks         []MasterBlok   `gorm:"foreignKey:IDAfdeling" json:"bloks,omitempty"`
	TimbangansPKS []TimbanganPKS `gorm:"foreignKey:IDAfdeling" json:"timbangans_pks,omitempty"`
}

// TableName specifies the table name for MasterAfdeling
func (MasterAfdeling) TableName() string {
	return "master_afdeling"
}

// MasterBlok represents master data for blocks in PKS system (for TBS)
type MasterBlok struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	IDAfdeling uint      `gorm:"not null" json:"id_afdeling"`
	KodeBlok   string    `gorm:"not null" json:"kode_blok"`
	NamaBlok   string    `gorm:"not null" json:"nama_blok"`
	Luas       float64   `json:"luas"` // hektar
	IsActive   bool      `gorm:"default:true" json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Relationships
	Afdeling      MasterAfdeling `gorm:"foreignKey:IDAfdeling" json:"afdeling"`
	TimbangansPKS []TimbanganPKS `gorm:"foreignKey:IDBlok" json:"timbangans_pks,omitempty"`
}

// TableName specifies the table name for MasterBlok
func (MasterBlok) TableName() string {
	return "master_blok"
}

// TimbanganPKS represents main PKS weighing transaction table
type TimbanganPKS struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	NoTransaksi string `gorm:"uniqueIndex;not null" json:"no_transaksi"`
	IDProduk    uint   `gorm:"not null" json:"id_produk"`
	IDUnit      uint   `gorm:"not null" json:"id_unit"`
	IDSupplier  *uint  `gorm:"index" json:"id_supplier"` // Nullable: required for non-TBS, null for TBS products
	DriverName  string `gorm:"not null" json:"driver_name"`

	// TBS Specific Fields (nullable for non-TBS products)
	IDEstate   *uint  `json:"id_estate"`
	IDAfdeling *uint  `gorm:"index" json:"id_afdeling"` // Acts as supplier source for TBS products
	IDBlok     *uint  `json:"id_blok"`
	SumberTBS  string `json:"sumber_tbs"`
	Janjang    string `json:"janjang"`
	Grade      string `json:"grade"`

	// Weighing Data
	Bruto  float64 `gorm:"not null" json:"bruto"`
	Tara   float64 `json:"tara"`
	Netto  float64 `json:"netto"`
	Bruto2 float64 `json:"bruto2"` // Second weighing (vehicle exit)
	Tara2  float64 `json:"tara2"`
	Netto2 float64 `json:"netto2"`

	// Status and Dates
	Status        string     `gorm:"default:'timbang1'" json:"status"` // timbang1, timbang2, selesai, batal
	Timbang1Date  time.Time  `gorm:"not null" json:"timbang1_date"`
	Timbang2Date  *time.Time `json:"timbang2_date"`
	CompletedDate *time.Time `json:"completed_date"`

	// Officer Information
	Officer1ID uuid.UUID  `gorm:"not null" json:"officer1_id"`
	Officer2ID *uuid.UUID `json:"officer2_id"`

	// System Fields
	IDSync    *string    `gorm:"uniqueIndex" json:"id_sync"` // For cloud sync
	IsSynced  bool       `gorm:"default:false" json:"is_synced"`
	SyncedAt  *time.Time `json:"synced_at"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`

	// Relationships
	Produk   MasterProduk     `gorm:"foreignKey:IDProduk" json:"produk"`
	Unit     MasterUnit       `gorm:"foreignKey:IDUnit" json:"unit"`
	Supplier *MasterSupplier  `gorm:"foreignKey:IDSupplier" json:"supplier"` // Nullable: populated for non-TBS products only
	Estate   *MasterEstate    `gorm:"foreignKey:IDEstate" json:"estate"`
	Afdeling *MasterAfdeling `gorm:"foreignKey:IDAfdeling" json:"afdeling"`
	Blok     *MasterBlok     `gorm:"foreignKey:IDBlok" json:"blok"`
	Officer1 auth.User       `gorm:"foreignKey:Officer1ID" json:"officer1"`
	Officer2 *auth.User      `gorm:"foreignKey:Officer2ID" json:"officer2"`

	// Sync relationships (disabled - incompatible types: TimbanganPKS.ID is uint but SyncQueue.EntityID is UUID)
	SyncQueueItems []SyncQueue `gorm:"-" json:"sync_queue_items,omitempty"`
}

// TableName specifies the table name for TimbanganPKS
func (TimbanganPKS) TableName() string {
	return "timbangan_pks"
}

// BeforeCreate hook for TimbanganPKS
func (t *TimbanganPKS) BeforeCreate(tx *gorm.DB) error {
	if t.NoTransaksi == "" {
		t.NoTransaksi = generateTransactionNumberPKS(tx)
	}
	return nil
}

// BeforeUpdate hook for TimbanganPKS
func (t *TimbanganPKS) BeforeUpdate(tx *gorm.DB) error {
	if t.Status == "selesai" && t.CompletedDate == nil {
		now := time.Now()
		t.CompletedDate = &now
	}
	return nil
}

// Generate transaction number for PKS system
func generateTransactionNumberPKS(tx *gorm.DB) string {
	today := time.Now().Format("20060102")

	var count int64
	tx.Model(&TimbanganPKS{}).Where("DATE(created_at) = ?", time.Now()).Count(&count)

	sequence := count + 1
	return fmt.Sprintf("TRS-%s-%04d", today, sequence)
}
