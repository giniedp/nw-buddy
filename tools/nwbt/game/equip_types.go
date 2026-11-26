package game

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/rtti/nwt"
	"sync"
)

const equipTypesFile = "sharedassets/genericassets/items/equiptypesdatabase.equipdb"

type equipTypeTable struct {
	once   sync.Once
	byName map[string]nwt.EquipTypeData
}

// LoadEquipTypes loads the equip types database: the sockets weapons of an equip type are held and sheathed on
func (it *Assets) LoadEquipTypes() ([]nwt.EquipTypeData, error) {
	file, ok := it.Archive.Lookup(equipTypesFile)
	if !ok {
		return nil, fmt.Errorf("equip types database not found: %s", equipTypesFile)
	}
	node, err := LoadObjectStream(file)
	if err != nil {
		return nil, fmt.Errorf("equip types database not loaded: %w", err)
	}
	db, ok := node.(nwt.EquipTypesDatabase)
	if !ok {
		return nil, fmt.Errorf("unexpected equip types database: %s", equipTypesFile)
	}
	return db.Equip_Types.Element, nil
}

// EquipType returns an equip type by name, the database is loaded once. Unknown names give an empty one.
func (it *Assets) EquipType(name string) nwt.EquipTypeData {
	it.equipTypes.once.Do(func() {
		it.equipTypes.byName = make(map[string]nwt.EquipTypeData)
		rows, err := it.LoadEquipTypes()
		if err != nil {
			slog.Warn("no equip types", "err", err)
		}
		for _, row := range rows {
			it.equipTypes.byName[string(row.Name)] = row
		}
	})
	return it.equipTypes.byName[name]
}
