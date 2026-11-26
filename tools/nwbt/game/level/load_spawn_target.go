package level

import (
	"log/slog"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"strings"
)

// findSpawnTarget resolves the slice a spawner spawns. An alias asset holds weighted slice options, the viewer takes
// the first one that exists (deterministic, the game draws one at random).
func findSpawnTarget(assets *game.Assets, list []nwt.AzAsset) *catalog.Asset {
	asset := findAsset(assets, list)
	if asset == nil || !strings.HasSuffix(strings.ToLower(asset.File), ".aliasasset") {
		return asset
	}
	file, ok := assets.Archive.Lookup(asset.File)
	if !ok {
		return nil
	}
	alias, err := assets.LoadAliasAsset(file)
	if err != nil || alias == nil {
		slog.Warn("alias not loaded", "file", asset.File, "error", err)
		return nil
	}
	for _, tag := range alias.Tags.Element {
		for _, option := range tag.Slices.Element {
			if slice := findDynamicSlice(assets, option.Slice); slice != nil {
				return slice
			}
		}
	}
	return nil
}

// findDynamicSlice looks up a slice asset, a .slice reference resolves to its .dynamicslice
func findDynamicSlice(assets *game.Assets, ref nwt.AzAsset) *catalog.Asset {
	asset := assets.Catalog.Find(ref.Guid, ref.Subid, ref.Type, ref.Hint)
	if asset == nil {
		return nil
	}
	if !strings.HasSuffix(strings.ToLower(asset.File), ".slice") {
		return asset
	}
	if dynamic := assets.Catalog.FindByFile(utils.ReplaceExt(asset.File, ".dynamicslice")); dynamic != nil {
		return dynamic
	}
	return nil
}

// spawnerTimeOfDay reads the TimeOfDayConstraintComponent of a spawner entity: the phases of the day in which the
// spawner spawns. Nil without a constraint.
func spawnerTimeOfDay(entity *nwt.AZ__Entity) *ViewerSpawnTimeOfDay {
	for _, component := range entity.Components.Element {
		constraint, ok := component.(nwt.TimeOfDayConstraintComponent)
		if !ok {
			continue
		}
		facet, ok := constraint.BaseClass1.M_serverFacetPtr.(nwt.TimeOfDayConstraintComponentServerFacet)
		if !ok {
			continue
		}
		return &ViewerSpawnTimeOfDay{
			Dawn:  bool(facet.M_dawn),
			Day:   bool(facet.M_day),
			Dusk:  bool(facet.M_dusk),
			Night: bool(facet.M_night),
		}
	}
	return nil
}

// spawnerOnGround tells whether the entity's spawners stand their spawn on the ground (NavMeshConstraintComponent
// without m_optOut or m_useOriginalHeight). Without a server facet the settings are the defaults.
func spawnerOnGround(entity *nwt.AZ__Entity) bool {
	for _, component := range entity.Components.Element {
		constraint, ok := component.(nwt.NavMeshConstraintComponent)
		if !ok {
			continue
		}
		facet, ok := constraint.BaseClass1.M_serverFacetPtr.(nwt.NavMeshConstraintComponentServerFacet)
		if !ok {
			return true
		}
		return !bool(facet.M_optOut) && !bool(facet.M_useOriginalHeight)
	}
	return false
}
