package level

import (
	"log/slog"
	"math"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/math/mat4"
	"strings"
)

// sliceDataKey identifies an entry of region.slicedata
type sliceDataKey struct {
	slice   string // see sliceDataName
	variant string // lower case
}

// sliceDataName normalizes slice names of region.slicedata and slice file paths to a common form,
// e.g. 'slices/gatherables/master_tree.dynamicslice' and 'gatherables/master_tree' are both 'gatherables/master_tree'
func sliceDataName(name string) string {
	name = strings.ToLower(name)
	name = strings.ReplaceAll(name, "\\", "/")
	for strings.Contains(name, "//") {
		name = strings.ReplaceAll(name, "//", "/")
	}
	name = strings.TrimPrefix(name, "slices/")
	name = strings.TrimSuffix(name, ".dynamicslice")
	return name
}

// LoadSliceDataLookup reads the region.slicedata file, the slice metadata of the capital and distribution slices
// of the region keyed by slice and variant name.
func (dir *RegionDirectory) LoadSliceDataLookup(assets *game.Assets) map[sliceDataKey]*nwt.SliceMetaData {
	result := make(map[sliceDataKey]*nwt.SliceMetaData)
	file, ok := assets.Archive.Lookup(dir.PathSlicedataFile())
	if !ok {
		return result
	}
	lookup, err := assets.LoadRegionSliceData(file)
	if err != nil || lookup == nil {
		slog.Warn("slicedata not loaded", "file", file.Path(), "error", err)
		return result
	}
	for i := range lookup.SliceMetaDataMap.Element {
		entry := &lookup.SliceMetaDataMap.Element[i]
		key := sliceDataKey{
			slice:   sliceDataName(string(entry.Value1.SliceName)),
			variant: strings.ToLower(string(entry.Value1.VariantName)),
		}
		result[key] = &entry.Value2
	}
	return result
}

// impostorMatchDistance is the tolerance for joining slicedata mesh entries with mesh components by position
const impostorMatchDistance = 0.25

// applyImpostorFlags marks the mesh components of the slice that the slicedata entry flags with m_impostorFarDistance,
// meshes that are baked into the POI impostor of their cell.
//
// Slicedata mesh entries have no entity id, they are joined with the mesh components of the slice by model and
// root relative position. Returns the number of flagged components.
func applyImpostorFlags(assets *game.Assets, slice *ViewerSlice, meta *nwt.SliceMetaData) int {
	root := mat4.Identity()
	if slice.Transform != nil {
		root = *slice.Transform
	}
	count := 0
	for _, mesh := range meta.Meshes.Element {
		if !mesh.M_impostorFarDistance {
			continue
		}
		file, _ := assets.LookupFileByAssetId(mesh.MeshAssetId)
		if file == nil {
			continue
		}
		model := assets.ResolveCgf(file.Path())
		// slice space position of the entry, the slice root sits at the root transform
		position := mat4.PositionOf(mat4.Multiply(root, mat4.FromAzTransform(mesh.RootRelativeTransform)))

		// nearest mesh component with the same model
		entityIndex, componentIndex := -1, -1
		best := impostorMatchDistance
		for i, entity := range slice.Entities {
			for j, component := range entity.Components {
				comp, ok := component.(ViewerMeshComponent)
				if !ok || comp.Model != model {
					continue
				}
				if d := distance(position, mat4.PositionOf(entity.Transfrom)); d < best {
					best = d
					entityIndex, componentIndex = i, j
				}
			}
		}
		if entityIndex < 0 {
			continue
		}
		components := slice.Entities[entityIndex].Components
		comp := components[componentIndex].(ViewerMeshComponent)
		if !comp.Impostor {
			comp.Impostor = true
			components[componentIndex] = comp
			count++
		}
	}
	return count
}

func distance(a, b nwt.AzVec3) float64 {
	dx := float64(a[0] - b[0])
	dy := float64(a[1] - b[1])
	dz := float64(a[2] - b[2])
	return math.Sqrt(dx*dx + dy*dy + dz*dz)
}
