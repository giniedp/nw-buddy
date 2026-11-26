package scanner

import (
	"nw-buddy/tools/rtti/nwt"
)

type spawn struct {
	Position  nwt.AzVec3
	MapID     string
	TileID    string
	Encounter string
}

type Spawn interface {
	Move(x, y nwt.AzFloat32)
	GetPosition() nwt.AzVec3
	SetPosition(p nwt.AzVec3)
}

func (it *spawn) Move(x, y nwt.AzFloat32) {
	it.Position[0] += x
	it.Position[1] += y
}

func (it *spawn) GetPosition() nwt.AzVec3 {
	return it.Position
}

func (it *spawn) SetPosition(v nwt.AzVec3) {
	it.Position = v
}

type ZoneConfigEntry struct {
	spawn
	Config string
	Shape  []nwt.AzVec2
}

type GatherableEntry struct {
	spawn
	GatherableID string
}

type VariantEntry struct {
	spawn
	VariantID    string
	GatherableID string
}
type NpcEntry struct {
	spawn
	NpcID string
}

type TerritoryEntry struct {
	spawn
	TerritoryID string
	Shape       []nwt.AzVec2
}

type LorenoteEntry struct {
	spawn
	LoreID string
}

type HouseEntry struct {
	spawn
	HouseID string
}

type StationEntry struct {
	spawn
	StationID string
	Name      string
}

type StructureEntry struct {
	spawn
	TypeID string
	Name   string
}

type VitalsEntry struct {
	spawn

	VitalsID     string
	NpcID        string
	CategoryID   string
	GatherableID string
	Level        int
	Encounter    string
	DamageTable  string
	Model        *VitalModel
	UseZoneLevel bool
	Luck         *float32
	Tod          string
	// found by walking a slice that no map of the scan places
	Template bool
}

type EncounterEntry struct {
	spawn
	Tag         string           `json:"tag"`
	Name        string           `json:"name"`
	EncounterID string           `json:"encounterID"`
	Stages      []EncounterStage `json:"stages"`
}

type EncounterStage struct {
	Name       string           `json:"name"`
	Stages     []EncounterStage `json:"stages"`
	Objectives []any            `json:"objectives"`
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
	ZoneConfigs []ZoneConfigEntry
	Encounter   []EncounterEntry
}
