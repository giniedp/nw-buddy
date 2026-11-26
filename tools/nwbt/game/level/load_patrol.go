package level

import (
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
)

// loadPatrolPath reads the AIPathComponent of the entity a point spawner names and its waypoints
// (AIWaypointComponent), nil when the path or its waypoints are missing. Waypoint transforms are in slice space.
func loadPatrolPath(slice *nwt.SliceComponent, ref nwt.LocalEntityRef) *ViewerPatrolPath {
	if ref.EntityId.Id == 0 {
		return nil
	}
	pathEntity := game.FindEntityById(slice, ref.EntityId.Id)
	if pathEntity == nil {
		return nil
	}
	for _, component := range pathEntity.Components.Element {
		path, ok := component.(nwt.AIPathComponent)
		if !ok {
			continue
		}
		facet, ok := path.BaseClass1.M_serverFacetPtr.(nwt.AIPathComponentServerFacet)
		if !ok {
			return nil
		}
		result := ViewerPatrolPath{
			Policy:    int(facet.M_pathTravesalPolicy),
			Waypoints: make([]ViewerPatrolWaypoint, 0, len(facet.M_waypointEntities.Element)),
		}
		for _, waypointRef := range facet.M_waypointEntities.Element {
			entity := game.FindEntityById(slice, waypointRef.EntityId.Id)
			if entity == nil {
				continue
			}
			waypoint := ViewerPatrolWaypoint{
				// m_worldTM, the slice space transform like the other entity transforms
				Transform:   game.FindEntityTransformMat4(entity),
				MinDuration: -1,
				MaxDuration: -1,
			}
			for _, wc := range entity.Components.Element {
				if w, ok := wc.(nwt.AIWaypointComponent); ok {
					if wf, ok := w.BaseClass1.M_serverFacetPtr.(nwt.AIWaypointComponentServerFacet); ok {
						waypoint.Task = string(wf.M_taskName)
						waypoint.MinDuration = float32(wf.M_minDuration)
						waypoint.MaxDuration = float32(wf.M_maxDuration)
						waypoint.MatchAlignment = bool(wf.M_matchAlignment)
					}
				}
			}
			result.Waypoints = append(result.Waypoints, waypoint)
		}
		if len(result.Waypoints) == 0 {
			return nil
		}
		return &result
	}
	return nil
}
