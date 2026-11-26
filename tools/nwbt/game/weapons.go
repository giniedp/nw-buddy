package game

import (
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"strings"
	"sync"
)

// The paperdoll slots the spawn action draws and takes the Mannequin tags of
const (
	mainHandSlot = 24 // MAIN_HAND_OPTION_1
	offHandSlot  = 27 // OFF_HAND_OPTION_1
)

// HeldWeapon is the item in a paperdoll hand the spawn action draws
type HeldWeapon struct {
	Item    string
	OffHand bool
	// the Mannequin tags of the weapon in its hand
	Tags []string
	// the MeshOverride of the item's WeaponAppearanceOverride, else of the weapon row; empty for claws and fists
	Mesh string
	// the name of the equip type
	EquipType string
}

// weaponRow is the part of a WeaponItemDefinitions row a held weapon needs
type weaponRow struct {
	// MannequinTag, the tags of the weapon in a main hand
	tags []string
	// OffHandMannequinTag, the tags of the weapon in an off hand
	offHandTags []string
	mesh        string
	equipType   string
}

// weaponTables are the parts of the item tables held weapons need, keys are lower case
type weaponTables struct {
	once sync.Once
	// item id -> ItemStatsRef
	statsRefs map[string]string
	// item id -> WeaponAppearanceOverride
	appearanceRefs map[string]string
	// weapon id
	weapons map[string]weaponRow
	// appearance id -> MeshOverride
	appearanceMeshes map[string]string
}

func (t *weaponTables) load(assets *Assets) {
	t.statsRefs = make(map[string]string)
	t.appearanceRefs = make(map[string]string)
	t.weapons = make(map[string]weaponRow)
	t.appearanceMeshes = make(map[string]string)
	for sheet := range assets.DatasheetsOfSchema("MasterItemDefinitions") {
		for _, row := range sheet.RowsAsJSON() {
			id := strings.ToLower(row.GetString("ItemID"))
			if ref := row.GetString("ItemStatsRef"); ref != "" {
				t.statsRefs[id] = strings.ToLower(ref)
			}
			if ref := row.GetString("WeaponAppearanceOverride"); ref != "" {
				t.appearanceRefs[id] = strings.ToLower(ref)
			}
		}
	}
	for sheet := range assets.DatasheetsOfSchema("WeaponItemDefinitions") {
		for _, row := range sheet.RowsAsJSON() {
			t.weapons[strings.ToLower(row.GetString("WeaponID"))] = weaponRow{
				tags:        splitMannequinTags(row.GetString("MannequinTag")),
				offHandTags: splitMannequinTags(row.GetString("OffHandMannequinTag")),
				mesh:        nwfs.NormalizePath(row.GetString("MeshOverride")),
				equipType:   row.GetString("EquipType"),
			}
		}
	}
	for sheet := range assets.DatasheetsOfSchema("WeaponAppearanceDefinitions") {
		for _, row := range sheet.RowsAsJSON() {
			if mesh := nwfs.NormalizePath(row.GetString("MeshOverride")); mesh != "" {
				t.appearanceMeshes[strings.ToLower(row.GetString("WeaponAppearanceID"))] = mesh
			}
		}
	}
}

// resolve finds the weapon of an item, false without a weapon row
func (t *weaponTables) resolve(item string, offHand bool) (HeldWeapon, bool) {
	id := strings.ToLower(item)
	ref := t.statsRefs[id]
	if ref == "" {
		ref = id
	}
	row, ok := t.weapons[ref]
	if !ok {
		return HeldWeapon{}, false
	}
	result := HeldWeapon{Item: item, OffHand: offHand, Tags: row.tags, Mesh: row.mesh, EquipType: row.equipType}
	if offHand {
		result.Tags = row.offHandTags
	}
	if mesh := t.appearanceMeshes[t.appearanceRefs[id]]; mesh != "" {
		result.Mesh = mesh
	}
	return result, true
}

func (t *weaponTables) heldWeapons(paperdoll *nwt.PaperdollComponent) []HeldWeapon {
	result := make([]HeldWeapon, 0, 2)
	for _, slot := range []int{mainHandSlot, offHandSlot} {
		for _, it := range paperdoll.M_initPaperdollData.Element {
			if int(it.M_slotType) != slot || it.M_itemName == "" {
				continue
			}
			if weapon, ok := t.resolve(string(it.M_itemName), slot == offHandSlot); ok {
				result = append(result, weapon)
				break
			}
		}
	}
	return result
}

// SlicePaperdoll is the paperdoll of a slice, nil without one or with several
func SlicePaperdoll(slice *nwt.SliceComponent) *nwt.PaperdollComponent {
	var result *nwt.PaperdollComponent
	for _, components := range EntitiesOf(slice) {
		for _, component := range components {
			if paperdoll, ok := component.(nwt.PaperdollComponent); ok {
				if result != nil {
					return nil
				}
				result = &paperdoll
			}
		}
	}
	return result
}

// HeldWeapons are the weapons in the hands the spawn action draws, main hand first. Items without a weapon row are
// left out.
func (it *Assets) HeldWeapons(paperdoll *nwt.PaperdollComponent) []HeldWeapon {
	if paperdoll == nil {
		return nil
	}
	it.weapons.once.Do(func() { it.weapons.load(it) })
	return it.weapons.heldWeapons(paperdoll)
}

// HeldWeaponTags are the Mannequin tags of the drawn weapons of a paperdoll: the main hand's MannequinTag
// (m_noEquipMannequinTag without one) and the off hand's OffHandMannequinTag
func HeldWeaponTags(paperdoll *nwt.PaperdollComponent, weapons []HeldWeapon) []string {
	if paperdoll == nil {
		return nil
	}
	result := make([]string, 0)
	mainHand := false
	for _, it := range weapons {
		if !it.OffHand && len(it.Tags) > 0 {
			mainHand = true
		}
		result = append(result, it.Tags...)
	}
	if !mainHand && paperdoll.M_noEquipMannequinTag != "" {
		result = append([]string{string(paperdoll.M_noEquipMannequinTag)}, result...)
	}
	if len(result) == 0 {
		return nil
	}
	return result
}

// splitMannequinTags splits a MannequinTag cell, tags are separated by `,` or `+`
func splitMannequinTags(value string) []string {
	result := make([]string, 0)
	for _, tag := range strings.FieldsFunc(value, func(r rune) bool { return r == ',' || r == '+' }) {
		if tag = strings.TrimSpace(tag); tag != "" {
			result = append(result, tag)
		}
	}
	return result
}
