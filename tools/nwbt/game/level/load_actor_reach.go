package level

// applyActorReach sets ViewerSlice.ActorReach of every slice in the map: the largest view distance of the characters
// the slice shows itself or spawns through its nested spawners. The game shows a character within the AOI radius of
// its slice, while the slices that spawn it often have a much smaller spawn radius (a point spawner
// capital has 26 m). The viewer stands a slice within max(spawnRadius, actorReach).
func applyActorReach(slices map[string]ViewerSlice) {
	memo := make(map[string]float32, len(slices))
	visiting := make(map[string]bool)

	var reach func(key string) float32
	reach = func(key string) float32 {
		if value, ok := memo[key]; ok {
			return value
		}
		if visiting[key] {
			// a slice that spawns itself through its nested slices
			return 0
		}
		slice, ok := slices[key]
		if !ok {
			return 0
		}
		visiting[key] = true
		value := slice.characterReach
		for _, entity := range slice.Entities {
			for _, component := range entity.Components {
				if ref, ok := spawnedSlice(component); ok {
					value = max(value, reach(ref.Key()))
				}
			}
		}
		delete(visiting, key)
		memo[key] = value
		return value
	}

	for key, slice := range slices {
		slice.ActorReach = reach(key)
		slices[key] = slice
	}
}

// spawnedSlice is the slice a spawner component spawns
func spawnedSlice(component any) (AssetReference, bool) {
	switch spawner := component.(type) {
	case ViewerPrefabSpawnerComponent:
		return spawner.Slice, true
	case ViewerPointSpawnerComponent:
		return spawner.Slice, true
	case ViewerAreaSpawnerComponent:
		return spawner.Slice, true
	case ViewerSpawnerComponent:
		return spawner.Slice, true
	}
	return AssetReference{}, false
}
