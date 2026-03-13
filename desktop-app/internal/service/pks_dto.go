package service

import (
	"time"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
)

// Nested structs for relationships
type EstateNested struct {
	NamaEstate string `json:"nama_estate"`
}

type AfdelingNested struct {
	NamaAfdeling string        `json:"nama_afdeling"`
	Estate       *EstateNested `json:"estate,omitempty"`
}

// EstateResponse is the DTO for estate responses
type EstateResponse struct {
	ID         uint      `json:"id"`
	KodeEstate string    `json:"kode_estate"`
	NamaEstate string    `json:"nama_estate"`
	Luas       float64   `json:"luas"`
	Lokasi     string    `json:"lokasi"`
	IsActive   bool      `json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
}

// AfdelingResponse is the DTO for afdeling responses
type AfdelingResponse struct {
	ID           uint            `json:"id"`
	IDEstate     uint            `json:"id_estate"`
	KodeAfdeling string          `json:"kode_afdeling"`
	NamaAfdeling string          `json:"nama_afdeling"`
	Estate       *EstateNested   `json:"estate,omitempty"`
	Luas         float64         `json:"luas"`
	IsActive     bool            `json:"is_active"`
	CreatedAt    time.Time       `json:"created_at"`
}

// BlockResponse is the DTO for block responses
type BlockResponse struct {
	ID         uint              `json:"id"`
	IDAfdeling uint              `json:"id_afdeling"`
	KodeBlok   string            `json:"kode_blok"`
	NamaBlok   string            `json:"nama_blok"`
	Afdeling   *AfdelingNested   `json:"afdeling,omitempty"`
	Luas       float64           `json:"luas"`
	IsActive   bool              `json:"is_active"`
	CreatedAt  time.Time         `json:"created_at"`
}

// Helper functions to transform database models to DTOs

// ToEstateResponse converts MasterEstate to EstateResponse
func ToEstateResponse(estate *database.MasterEstate) *EstateResponse {
	return &EstateResponse{
		ID:         estate.ID,
		KodeEstate: estate.KodeEstate,
		NamaEstate: estate.NamaEstate,
		Luas:       estate.Luas,
		Lokasi:     estate.Lokasi,
		IsActive:   estate.IsActive,
		CreatedAt:  estate.CreatedAt,
	}
}

// ToEstateResponses converts slice of MasterEstate to slice of EstateResponse
func ToEstateResponses(estates []database.MasterEstate) []EstateResponse {
	// Ensure we return an empty slice, not nil, for proper JSON marshaling
	if len(estates) == 0 {
		return []EstateResponse{}
	}

	responses := make([]EstateResponse, len(estates))
	for i, estate := range estates {
		responses[i] = *ToEstateResponse(&estate)
	}
	return responses
}

// ToAfdelingResponse converts MasterAfdeling to AfdelingResponse
func ToAfdelingResponse(afdeling *database.MasterAfdeling) *AfdelingResponse {
	response := &AfdelingResponse{
		ID:           afdeling.ID,
		IDEstate:     afdeling.IDEstate,
		KodeAfdeling: afdeling.KodeAfdeling,
		NamaAfdeling: afdeling.NamaAfdeling,
		Luas:         afdeling.Luas,
		IsActive:     afdeling.IsActive,
		CreatedAt:    afdeling.CreatedAt,
	}

	// Include estate info if preloaded
	if afdeling.Estate.ID != 0 {
		response.Estate = &EstateNested{
			NamaEstate: afdeling.Estate.NamaEstate,
		}
	}

	return response
}

// ToAfdelingResponses converts slice of MasterAfdeling to slice of AfdelingResponse
func ToAfdelingResponses(afdelings []database.MasterAfdeling) []AfdelingResponse {
	// Ensure we return an empty slice, not nil, for proper JSON marshaling
	if len(afdelings) == 0 {
		return []AfdelingResponse{}
	}

	responses := make([]AfdelingResponse, len(afdelings))
	for i, afdeling := range afdelings {
		responses[i] = *ToAfdelingResponse(&afdeling)
	}
	return responses
}

// ToBlockResponse converts MasterBlok to BlockResponse
func ToBlockResponse(blok *database.MasterBlok) *BlockResponse {
	response := &BlockResponse{
		ID:         blok.ID,
		IDAfdeling: blok.IDAfdeling,
		KodeBlok:   blok.KodeBlok,
		NamaBlok:   blok.NamaBlok,
		Luas:       blok.Luas,
		IsActive:   blok.IsActive,
		CreatedAt:  blok.CreatedAt,
	}

	// Include afdeling info if preloaded
	if blok.Afdeling.ID != 0 {
		afdeling := &AfdelingNested{
			NamaAfdeling: blok.Afdeling.NamaAfdeling,
		}

		// Include estate info if preloaded
		if blok.Afdeling.Estate.ID != 0 {
			afdeling.Estate = &EstateNested{
				NamaEstate: blok.Afdeling.Estate.NamaEstate,
			}
		}

		response.Afdeling = afdeling
	}

	return response
}

// ToBlockResponses converts slice of MasterBlok to slice of BlockResponse
func ToBlockResponses(bloks []database.MasterBlok) []BlockResponse {
	// Ensure we return an empty slice, not nil, for proper JSON marshaling
	if len(bloks) == 0 {
		return []BlockResponse{}
	}

	responses := make([]BlockResponse, len(bloks))
	for i, blok := range bloks {
		responses[i] = *ToBlockResponse(&blok)
	}
	return responses
}
