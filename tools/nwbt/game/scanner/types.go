package scanner

import (
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/math/transform"
)

// func NewScanContext() context.Context {
//   ctx := context.Background()
//   ctx = context.WithCancel(ctx)
// }

type SliceData struct {
	Entity         *nwt.AZ__Entity
	Name           string
	Transform      transform.Node
	VitalsID       string
	NpcID          string
	CategoryID     string
	Level          int
	TerritoryLevel bool
	DamageTable    string
	AdbFile        string
	ModelFile      string
	MtlFile        string
	Tags           []string
	VariantID      string
	GatherableID   string
	LoreIDs        []string
	HouseType      string
	StationID      string
	StructureType  string
	Trace          []any
}

type GatherableEntry struct {
	Position     nwt.AzVec3
	MapID        string
	GatherableID string
	Encounter    string
	Trace        []any
}

type VariantEntry struct {
	Position  nwt.AzVec3
	MapID     string
	VariantID string
	Encounter string
	Trace     []any
}
type NpcEntry struct {
	Position nwt.AzVec3
	MapID    string
	NpcID    string
	Trace    []any
}

type TerritoryEntry struct {
	Position    nwt.AzVec3
	TerritoryID string
	Shape       []nwt.AzVec2
	Trace       []any
}

type LorenoteEntry struct {
	Position nwt.AzVec3
	LoreID   string
	MapID    string
	Trace    []any
}

type HouseEntry struct {
	Position nwt.AzVec3
	HouseID  string
	MapID    string
	Trace    []any
}

type StationEntry struct {
	Position  nwt.AzVec3
	StationID string
	MapID     string
	Name      string
	Trace     []any
}

type StructureEntry struct {
	Position nwt.AzVec3
	TypeID   string
	MapID    string
	Name     string
	Trace    []any
}

type VitalsEntry struct {
	Position     nwt.AzVec3
	VitalsID     string
	NpcID        string
	MapID        string
	CategoryID   string
	GatherableID string
	Level        int
	Encounter    string
	DamageTable  string
	ModelFile    string
	MtlFile      string
	AdbFile      string
	Tags         []string
	UseZoneLevel bool
	Trace        []any
}

type ScanResults struct {
	Npcs        []NpcEntry
	Gatherables []GatherableEntry
	Variants    []VariantEntry
	Territories []TerritoryEntry
	Lorenotes   []LorenoteEntry
	Houses      []HouseEntry
	Stations    []StationEntry
	Structures  []StructureEntry
	Vitals      []VitalsEntry
}
