package level

import (
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/math/mat4"
)

// loadEncounterSpawners returns the spawns of the encounter stages (the spawn timelines of the EncounterComponents
// below the manager, e.g. a dungeon boss) as area spawners on the manager entity. The game spawns them when a stage
// runs, the viewer when the encounter slice spawns.
//
// A spawn stands at its own locations, else at the locations of the manager's AreaSpawnerComponent, else at the
// manager entity (as the scanner places them, see game.EncounterSpawnLocations).
func loadEncounterSpawners(
	assets *game.Assets,
	slice *nwt.SliceComponent,
	entity *nwt.AZ__Entity,
	manager nwt.EncounterManagerComponent,
	track TrackSliceAsset,
) []ViewerAreaSpawnerComponent {
	result := make([]ViewerAreaSpawnerComponent, 0)
	for _, spawn := range game.WalkEncounterSpawns(slice, manager.M_stages.Element) {
		list := make([]nwt.AzAsset, 0)
		list = utils.AppendUniqNoZero(list, spawn.M_sliceAsset)
		list = utils.AppendUniqNoZero(list, spawn.M_aliasAsset)
		asset := findSpawnTarget(assets, list)
		if asset == nil || spawn.M_count == 0 {
			continue
		}

		refs := spawn.M_spawnLocations.Element
		if len(refs) == 0 {
			refs = game.AreaSpawnerLocations(entity.Components.Element)
		}
		locations := make([]mat4.Data, 0, len(refs))
		for _, ref := range refs {
			if location := game.FindEntityById(slice, ref.EntityId.Id); location != nil {
				locations = append(locations, game.FindEntityTransformMat4(location))
			}
		}
		if len(locations) == 0 {
			locations = append(locations, game.FindEntityTransformMat4(entity))
		}

		track(asset.AssetId, "")
		result = append(result, ViewerAreaSpawnerComponent{
			Type: AreaSpawnerComponentName,
			Slice: AssetReference{
				Guid:  asset.Guid,
				SubId: asset.SubID,
				Hint:  asset.File,
			},
			Locations:     locations,
			LiveCount:     int(spawn.M_count),
			SpawnOnEnable: true,
		})
	}
	return result
}
