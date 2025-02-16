package scan

import "nw-buddy/tools/nw-kit/nwfs"

type ScanContext struct {
	FS     nwfs.FileSystem
	Result ScanResult
}

func NewScanContext() *ScanContext {
	return &ScanContext{}
}

type ScanResult struct {
	Npcs        []ScannedNpcEntry
	Gatherables []ScannedGatherableEntry
	Territories []ScannedTerritoryEntry
	LoreEntries []ScannedLoreEntry
	Houses      []ScannedHouseEntry
	Stations    []ScannedStationEntry
	Structures  []ScannedStructureEntry
}

type ScannedGatherableEntry struct {
	MapID        string
	GatherableID string
	Encounter    string
	Position     [3]float64
}

type ScannedVariantEntry struct {
	MapID     string
	VariantID string
	Encounter string
	Position  [3]float64
}
type ScannedNpcEntry struct {
	MapID    string
	NpcID    string
	Position [3]float64
}

type ScannedTerritoryEntry struct {
	TerritoryID string
	Position    [3]float64
	Shape       [][]float64
}

type ScannedLoreEntry struct {
	MapID    string
	LoreID   string
	Position [3]float64
}

type ScannedHouseEntry struct {
	HouseID  string
	MapID    string
	Position [3]float64
}

type ScannedStationEntry struct {
	StationID string
	MapID     string
	Position  [3]float64
	Name      string
}

type ScannedStructureEntry struct {
	TypeID   string
	MapID    string
	Position [3]float64
	Name     string
}
