package dto

import (
	"time"

	"github.com/google/uuid"
)

// CreateTimbanganRequest represents request to create a timbangan
type CreateTimbanganRequest struct {
	NomorKendaraan string `json:"nomorKendaraan" validate:"required"`
	BeratKotor     int    `json:"beratKotor" validate:"required,min=0"`
	BeratBersih    int    `json:"beratBersih" validate:"required,min=0"`
	WeighingType   string `json:"weighingType" validate:"omitempty,one=GROSS,TARE,NET"`
	QualityGrade   string `json:"qualityGrade"`
	SupplierID     *uuid.UUID `json:"supplierId"`
	Notes          string `json:"notes"`
	SessionID      *uuid.UUID `json:"sessionId"`
	VehicleType    string `json:"vehicleType"`
	TareWeight     int    `json:"tareWeight"`
	PhotoPath      string `json:"photoPath"`
	IsBatch        bool   `json:"isBatch"`
	BatchNumber    string `json:"batchNumber"`
}

// UpdateTimbanganRequest represents request to update a timbangan
type UpdateTimbanganRequest struct {
	IDLocal        uuid.UUID `json:"idLocal" validate:"required"`
	NomorKendaraan string    `json:"nomorKendaraan" validate:"required"`
	BeratKotor     int       `json:"beratKotor" validate:"required,min=0"`
	BeratBersih    int       `json:"beratBersih" validate:"required,min=0"`
	WeighingType   string    `json:"weighingType" validate:"omitempty,one=GROSS,TARE,NET"`
	QualityGrade   string    `json:"qualityGrade"`
	SupplierID     *uuid.UUID `json:"supplierId"`
	Notes          string    `json:"notes"`
	VehicleType    string    `json:"vehicleType"`
	TareWeight     int       `json:"tareWeight"`
	PhotoPath      string    `json:"photoPath"`
	IsBatch        bool      `json:"isBatch"`
	BatchNumber    string    `json:"batchNumber"`
}

// TimbanganResponse represents timbangan response
type TimbanganResponse struct {
	IDLocal        uuid.UUID  `json:"idLocal"`
	IDPusat        *uuid.UUID `json:"idPusat"`
	NomorKendaraan string     `json:"nomorKendaraan"`
	BeratKotor     int        `json:"beratKotor"`
	BeratBersih    int        `json:"beratBersih"`
	WeighingType   string     `json:"weighingType"`
	QualityGrade   string     `json:"qualityGrade"`
	SupplierID     *uuid.UUID `json:"supplierId"`
	Notes          string     `json:"notes"`
	OperatorID     uuid.UUID  `json:"operatorId"`
	SessionID      *uuid.UUID `json:"sessionId"`
	VehicleType    string     `json:"vehicleType"`
	TareWeight     int        `json:"tareWeight"`
	PhotoPath      string     `json:"photoPath"`
	IsBatch        bool       `json:"isBatch"`
	BatchNumber    string     `json:"batchNumber"`
	Tanggal        time.Time  `json:"tanggal"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
	SyncedAt       *time.Time `json:"syncedAt"`
	StatusSync     string     `json:"statusSync"`
	SyncVersion    int        `json:"syncVersion"`
	ErrorMessage   *string    `json:"errorMessage"`
	DeviceID       string     `json:"deviceId"`
}

// TimbanganSearchRequest represents search request for timbangans
type TimbanganSearchRequest struct {
	Query        string `json:"query" form:"query"`
	WeighingType string `json:"weighingType" form:"weighingType"`
	VehicleType  string `json:"vehicleType" form:"vehicleType"`
	StartDate    string `json:"startDate" form:"startDate"`
	EndDate      string `json:"endDate" form:"endDate"`
	Limit        int    `json:"limit" form:"limit"`
	Page         int    `json:"page" form:"page"`
}

// TimbanganListResponse represents list response for timbangans
type TimbanganListResponse struct {
	Data       []TimbanganResponse `json:"data"`
	Total      int                 `json:"total"`
	Page       int                 `json:"page"`
	Limit      int                 `json:"limit"`
	TotalPages int                 `json:"totalPages"`
}

// PendingWeighingResponse represents pending weighing item
type PendingWeighingResponse struct {
	IDLocal        uuid.UUID  `json:"idLocal"`
	NomorKendaraan string     `json:"nomorKendaraan"`
	BeratKotor     int        `json:"beratKotor"`
	BeratBersih    int        `json:"beratBersih"`
	Tanggal        time.Time  `json:"tanggal"`
	CreatedAt      time.Time  `json:"createdAt"`
	StatusSync     string     `json:"statusSync"`
	WeighingType   string     `json:"weighingType"`
	QualityGrade   string     `json:"qualityGrade"`
	VehicleType    string     `json:"vehicleType"`
	OperatorID     uuid.UUID  `json:"operatorId"`
	DeviceID       string     `json:"deviceId"`
}

// SyncTimbanganRequest represents request to sync timbangan
type SyncTimbanganRequest struct {
	IDLocal     uuid.UUID `json:"idLocal" validate:"required"`
	ServerID    uuid.UUID `json:"serverId" validate:"required"`
	IsSuccess   bool      `json:"isSuccess"`
	ErrorMessage *string  `json:"errorMessage,omitempty"`
}

// WeighingStatisticsResponse represents weighing statistics
type WeighingStatisticsResponse struct {
	TotalWeighings     int   `json:"totalWeighings"`
	PendingWeighings   int   `json:"pendingWeighings"`
	FailedWeighings    int   `json:"failedWeighings"`
	TotalWeight        int   `json:"totalWeight"`
	AverageWeight      int   `json:"averageWeight"`
	TodayWeighings     int   `json:"todayWeighings"`
	TodayWeight        int   `json:"todayWeight"`
	SuccessRate        float64 `json:"successRate"`
}

// TimbanganValidationRequest represents validation request
type TimbanganValidationRequest struct {
	NomorKendaraan string `json:"nomorKendaraan" validate:"required"`
	BeratKotor     int    `json:"beratKotor" validate:"required,min=0"`
	BeratBersih    int    `json:"beratBersih" validate:"required,min=0"`
	VehicleType    string `json:"vehicleType"`
	WeighingType   string `json:"weighingType"`
	TareWeight     int    `json:"tareWeight"`
}

// TimbanganValidationResponse represents validation response
type TimbanganValidationResponse struct {
	IsValid   bool     `json:"isValid"`
	Warnings  []string `json:"warnings"`
	Errors    []string `json:"errors"`
	CanProceed bool    `json:"canProceed"`
}