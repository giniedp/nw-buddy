package extensions

const KHR_materials_ior = "KHR_materials_ior"

type KHRMaterialsIOR struct {
	IOR *float64 `json:"ior,omitempty"`
}
