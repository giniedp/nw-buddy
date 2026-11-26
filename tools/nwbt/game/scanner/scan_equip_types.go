package scanner

import (
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"slices"
	"strings"
)

// ScannedEquipType is the sockets of a weapon's equip type: the weapon in the hand and sheathed, main hand and off
// hand; nil where the type has none
type ScannedEquipType struct {
	ID              string              `json:"id"`
	Drawn           *ScannedEquipSocket `json:"drawn"`
	Sheathed        *ScannedEquipSocket `json:"sheathed"`
	OffHandDrawn    *ScannedEquipSocket `json:"offHandDrawn"`
	OffHandSheathed *ScannedEquipSocket `json:"offHandSheathed"`
}

// ScannedEquipSocket is a socket of an equip type and the offset of the weapon on it (meters, degrees)
type ScannedEquipSocket struct {
	Name     string     `json:"name"`
	Position [3]float32 `json:"position"`
	Rotation [3]float32 `json:"rotation"`
}

// ScanEquipTypes returns the equip types by name
func ScanEquipTypes(assets *game.Assets) ([]ScannedEquipType, error) {
	rows, err := assets.LoadEquipTypes()
	if err != nil {
		return nil, err
	}
	result := make([]ScannedEquipType, 0, len(rows))
	for _, it := range rows {
		result = append(result, ScannedEquipType{
			ID:       string(it.Name),
			Drawn:    equipSocket(it.Attachment, it.Attachment_Offset_Position, it.Attachment_Offset_Rotation__Degrees_),
			Sheathed: equipSocket(it.Sheath_Data, it.Sheath_Offset_Position, it.Sheath_Offset_Rotation__Degrees_),
			OffHandDrawn: equipSocket(
				it.Off_Hand_Attachment,
				it.Off_Hand_Attachment_Offset_Position,
				it.Off_Hand_Attachment_Offset_Rotation__Degrees_,
			),
			OffHandSheathed: equipSocket(
				it.Off_Hand_Sheath_Data,
				it.Off_Hand_Sheath_Offset_Position,
				it.Off_Hand_Sheath_Offset_Rotation__Degrees_,
			),
		})
	}
	slices.SortFunc(result, func(a, b ScannedEquipType) int {
		return strings.Compare(a.ID, b.ID)
	})
	return result, nil
}

func equipSocket(name nwt.AzString, position nwt.AzVec3, rotation nwt.AzVec3) *ScannedEquipSocket {
	if name == "" {
		return nil
	}
	result := &ScannedEquipSocket{Name: string(name)}
	for i := range 3 {
		result.Position[i] = float32(position[i])
		result.Rotation[i] = float32(rotation[i])
	}
	return result
}
