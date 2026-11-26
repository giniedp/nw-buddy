package game

import (
	"nw-buddy/tools/rtti/nwt"
	"testing"

	"github.com/stretchr/testify/require"
)

func testPaperdoll(noEquipTag string, items map[int]string) *nwt.PaperdollComponent {
	result := &nwt.PaperdollComponent{M_noEquipMannequinTag: nwt.AzString(noEquipTag)}
	for slot, item := range items {
		result.M_initPaperdollData.Element = append(result.M_initPaperdollData.Element, nwt.InitPaperdollData{
			M_itemName: nwt.AzString(item),
			M_slotType: nwt.AzInt32(slot),
		})
	}
	return result
}

func testWeaponTables() *weaponTables {
	return &weaponTables{
		statsRefs:      map[string]string{"named_spear": "spear"},
		appearanceRefs: map[string]string{"named_spear": "golden_spear", "shield": "unknown"},
		weapons: map[string]weaponRow{
			"spear":  {tags: []string{"1H_Melee", "Spear"}, offHandTags: []string{"Spear_OH"}, mesh: "spear.cdf", equipType: "RHand"},
			"shield": {tags: []string{"Shield"}, offHandTags: []string{"Shield_OH"}, mesh: "shield.cdf", equipType: "LHand"},
			"dummy":  {},
		},
		appearanceMeshes: map[string]string{"golden_spear": "golden_spear.cdf"},
	}
}

func TestHeldWeapons(t *testing.T) {
	tables := testWeaponTables()
	cases := map[string]struct {
		paperdoll *nwt.PaperdollComponent
		weapons   []HeldWeapon
		tags      []string
	}{
		"main hand, the appearance's mesh wins over the row's": {
			paperdoll: testPaperdoll("Unarmed", map[int]string{mainHandSlot: "Named_Spear"}),
			weapons: []HeldWeapon{
				{Item: "Named_Spear", Tags: []string{"1H_Melee", "Spear"}, Mesh: "golden_spear.cdf", EquipType: "RHand"},
			},
			tags: []string{"1H_Melee", "Spear"},
		},
		"main hand and off hand, an appearance without mesh": {
			paperdoll: testPaperdoll("Unarmed", map[int]string{offHandSlot: "Shield", mainHandSlot: "Spear"}),
			weapons: []HeldWeapon{
				{Item: "Spear", Tags: []string{"1H_Melee", "Spear"}, Mesh: "spear.cdf", EquipType: "RHand"},
				{Item: "Shield", OffHand: true, Tags: []string{"Shield_OH"}, Mesh: "shield.cdf", EquipType: "LHand"},
			},
			tags: []string{"1H_Melee", "Spear", "Shield_OH"},
		},
		"off hand only keeps the no equip tag": {
			paperdoll: testPaperdoll("Unarmed", map[int]string{offHandSlot: "Shield"}),
			weapons:   []HeldWeapon{{Item: "Shield", OffHand: true, Tags: []string{"Shield_OH"}, Mesh: "shield.cdf", EquipType: "LHand"}},
			tags:      []string{"Unarmed", "Shield_OH"},
		},
		"a weapon without tags keeps the no equip tag": {
			paperdoll: testPaperdoll("Unarmed", map[int]string{mainHandSlot: "Dummy"}),
			weapons:   []HeldWeapon{{Item: "Dummy"}},
			tags:      []string{"Unarmed"},
		},
		"an item without weapon row": {
			paperdoll: testPaperdoll("Unarmed", map[int]string{mainHandSlot: "None"}),
			weapons:   []HeldWeapon{},
			tags:      []string{"Unarmed"},
		},
		"other slots and no no equip tag": {
			paperdoll: testPaperdoll("", map[int]string{25: "Spear"}),
			weapons:   []HeldWeapon{},
		},
	}
	for name, it := range cases {
		t.Run(name, func(t *testing.T) {
			weapons := tables.heldWeapons(it.paperdoll)
			require.Equal(t, it.weapons, weapons)
			require.Equal(t, it.tags, HeldWeaponTags(it.paperdoll, weapons))
		})
	}
}

func TestSplitMannequinTags(t *testing.T) {
	require.Equal(t, []string{"1H_Melee", "Cleaver", "Tool"}, splitMannequinTags("1H_Melee, Cleaver+Tool,"))
	require.Empty(t, splitMannequinTags(""))
}
