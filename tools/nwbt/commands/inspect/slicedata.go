package inspect

import (
	"encoding/json"
	"fmt"
	"io"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/math/mat4"
	"os"
	"text/tabwriter"
)

// SliceDataInspector reads region.slicedata files (RegionSliceDataLookup) and collects the mesh entries per slice
type SliceDataInspector struct {
	count    int
	meshes   int
	impostor int
	rows     []SliceDataRow
}

type SliceDataRow struct {
	File    string             `json:"file"`
	Slice   string             `json:"slice"`
	Variant string             `json:"variant,omitempty"`
	Static  bool               `json:"static,omitempty"`
	SkipMid bool               `json:"skipMidRangeImpostors,omitempty"`
	Meshes  []SliceDataMeshRow `json:"meshes"`
}

type SliceDataMeshRow struct {
	Model           string    `json:"model"`
	Impostor        bool      `json:"impostor"`
	MaxViewDistance float32   `json:"maxViewDistance"`
	Transform       mat4.Data `json:"transform"`
	Instances       int       `json:"instances,omitempty"`
}

func NewSliceDataInspector() *SliceDataInspector {
	return &SliceDataInspector{}
}

func (it *SliceDataInspector) Inspect(assets *game.Assets, file nwfs.File) {
	it.count += 1
	lookup, err := assets.LoadRegionSliceData(file)
	if err != nil || lookup == nil {
		return
	}
	for _, entry := range lookup.SliceMetaDataMap.Element {
		meta := entry.Value2
		row := SliceDataRow{
			File:    file.Path(),
			Slice:   string(entry.Value1.SliceName),
			Variant: string(entry.Value1.VariantName),
			Static:  bool(meta.IsStaticSlice),
			SkipMid: bool(meta.SkipMidRangeImpostors),
			Meshes:  make([]SliceDataMeshRow, 0, len(meta.Meshes.Element)),
		}
		for _, mesh := range meta.Meshes.Element {
			model := ""
			if f, _ := assets.LookupFileByAssetId(mesh.MeshAssetId); f != nil {
				model = f.Path()
			}
			row.Meshes = append(row.Meshes, SliceDataMeshRow{
				Model:           model,
				Impostor:        bool(mesh.M_impostorFarDistance),
				MaxViewDistance: float32(mesh.MaxViewDistance),
				Transform:       mat4.FromAzTransform(mesh.RootRelativeTransform),
				Instances:       len(mesh.RootRelativeInstanceTransforms.Element),
			})
			it.meshes++
			if mesh.M_impostorFarDistance {
				it.impostor++
			}
		}
		it.rows = append(it.rows, row)
	}
}

func (it *SliceDataInspector) Print(w io.Writer) {
	tw := tabwriter.NewWriter(w, 0, 0, 1, ' ', 0)
	fmt.Fprintf(tw, "slicedata files\t%d\n", it.count)
	fmt.Fprintf(tw, "slices\t%d\n", len(it.rows))
	fmt.Fprintf(tw, "meshes\t%d\n", it.meshes)
	fmt.Fprintf(tw, "impostor meshes\t%d\n", it.impostor)
	tw.Flush()

	if flgSliceDataJson == "" {
		return
	}
	data, err := json.MarshalIndent(it.rows, "", "  ")
	if err != nil {
		fmt.Fprintf(w, "json not written: %v\n", err)
		return
	}
	if err := os.WriteFile(flgSliceDataJson, data, 0644); err != nil {
		fmt.Fprintf(w, "json not written: %v\n", err)
		return
	}
	fmt.Fprintf(w, "json written to %s\n", flgSliceDataJson)
}

// SliceMetaInspector prints the meshes and spawners of .slice.meta files (SliceMetaData)
type SliceMetaInspector struct {
	lines []string
}

func (it *SliceMetaInspector) Inspect(assets *game.Assets, file nwfs.File) {
	node, err := assets.LoadObjectStream(file)
	if err != nil {
		it.lines = append(it.lines, fmt.Sprintf("%s: %v", file.Path(), err))
		return
	}
	meta, ok := node.(nwt.SliceMetaData)
	if !ok {
		return
	}
	it.lines = append(it.lines, file.Path())
	for _, mesh := range meta.Meshes.Element {
		model := ""
		if f, _ := assets.LookupFileByAssetId(mesh.MeshAssetId); f != nil {
			model = f.Path()
		}
		it.lines = append(it.lines, fmt.Sprintf("  mesh %s impostor=%v", model, bool(mesh.M_impostorFarDistance)))
	}
	for _, spawner := range meta.Spawners.Element {
		it.lines = append(it.lines, fmt.Sprintf("  spawner %s variant=%s guid=%s", spawner.SliceName, spawner.VariationName, spawner.SliceAssetId.Guid))
	}
	for _, id := range meta.ChildSpawnSliceIds.Element {
		slice := ""
		if f, _ := assets.LookupFileByAssetId(id); f != nil {
			slice = f.Path()
		}
		it.lines = append(it.lines, fmt.Sprintf("  child %s", slice))
	}
}

func (it *SliceMetaInspector) Print(w io.Writer) {
	for _, line := range it.lines {
		fmt.Fprintln(w, line)
	}
}
