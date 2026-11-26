package game

import (
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/math/mat4"
)

// LocationTransform places a location entity of the node's slice. Locations are in slice space, like the spawner.
func (it *SliceNode) LocationTransform(ref nwt.LocalEntityRef) (mat4.Data, bool) {
	entity := FindEntityById(it.Slice, ref.EntityId.Id)
	if entity == nil {
		return mat4.Identity(), false
	}
	return mat4.Multiply(it.SliceTransform, FindEntityTransformMat4(entity)), true
}

// WalkAt runs walk with the node placed at transform, so that spawns walked inside stand there
func (it *SliceNode) WalkAt(transform mat4.Data, walk func()) {
	saved := it.Transform
	it.Transform = transform
	walk()
	it.Transform = saved
}

// AreaSpawnerLocations returns the locations of the AreaSpawnerComponent in components
func AreaSpawnerLocations(components []any) []nwt.LocalEntityRef {
	for _, component := range components {
		if v, ok := component.(nwt.AreaSpawnerComponent); ok {
			if facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.AreaSpawnerComponentServerFacet); ok {
				return facet.M_locations.Element
			}
		}
	}
	return nil
}

// HasSpawner reports whether components spawn slices
func HasSpawner(components []any) bool {
	for _, component := range components {
		switch component.(type) {
		case nwt.SpawnerComponent, nwt.PointSpawnerComponent, nwt.PrefabSpawnerComponent, nwt.AreaSpawnerComponent,
			nwt.EncounterManagerComponent, nwt.ProjectileComponent, nwt.ProjectileSpawnerComponent:
			return true
		}
	}
	return false
}

// SpawnVariantProvider returns the vitals variant the node's spawns take: the node's own AIVariantProviderComponent,
// else the only one in its slice. Several in the slice give none.
func SpawnVariantProvider(node *SliceNode) (nwt.AIVariantProviderComponentServerFacet, bool) {
	if facet, ok := findVariantProvider(node.Components); ok {
		return facet, true
	}
	var result nwt.AIVariantProviderComponentServerFacet
	count := 0
	for _, components := range EntitiesOf(node.Slice) {
		if facet, ok := findVariantProvider(components); ok {
			result = facet
			count++
		}
	}
	if count != 1 {
		return nwt.AIVariantProviderComponentServerFacet{}, false
	}
	return result, true
}

func findVariantProvider(components []any) (nwt.AIVariantProviderComponentServerFacet, bool) {
	for _, component := range components {
		if v, ok := component.(nwt.AIVariantProviderComponent); ok {
			if facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.AIVariantProviderComponentServerFacet); ok {
				return facet, true
			}
		}
	}
	return nwt.AIVariantProviderComponentServerFacet{}, false
}

// EncounterSpawnLocations returns where an encounter spawn may stand. Waves spawn through the area spawner on the
// manager entity: at the spawn's own locations, else at the area spawner's. None means the manager itself.
func EncounterSpawnLocations(manager *SliceNode, spawn nwt.SpawnDefinition) []nwt.LocalEntityRef {
	if len(spawn.M_spawnLocations.Element) > 0 {
		return spawn.M_spawnLocations.Element
	}
	return AreaSpawnerLocations(manager.Components)
}
