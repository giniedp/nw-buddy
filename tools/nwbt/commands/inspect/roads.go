package inspect

import (
	"encoding/json"
	"fmt"
	"io"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/level"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/math/mat4"
	"os"
	"sort"
	"text/tabwriter"
)

// RoadInspector collects entities with road or river components (RoadsAndRivers gem) and their splines
type RoadInspector struct {
	count int
	rows  []RoadRow
}

type RoadRow struct {
	File      string    `json:"file"`
	Entity    string    `json:"entity"`
	EntityId  string    `json:"entityId"`
	Transform mat4.Data `json:"transform"`
	Inactive  bool      `json:"inactive,omitempty"`
	level.ViewerRoadComponent
}

func NewRoadInspector() *RoadInspector {
	return &RoadInspector{}
}

func (it *RoadInspector) Inspect(assets *game.Assets, file nwfs.File) {
	it.count += 1
	f, err := assets.LoadSliceComponent(file)
	if err != nil || f == nil {
		return
	}
	for i := range f.Entities.Element {
		entity := &f.Entities.Element[i]
		road := level.LoadViewerRoad(entity)
		if road == nil {
			continue
		}
		it.rows = append(it.rows, RoadRow{
			File:                file.Path(),
			Entity:              string(entity.Name),
			EntityId:            fmt.Sprintf("%d", entity.Id.Id),
			Transform:           game.FindEntityTransformMat4(entity),
			Inactive:            !bool(entity.IsRuntimeActive),
			ViewerRoadComponent: *road,
		})
	}
}

func (it *RoadInspector) Print(w io.Writer) {
	fmt.Fprintf(w, "Slices\t%d\n", it.count)
	byType := map[string]int{}
	splineTypes := map[string]int{}
	files := map[string]int{}
	materials := map[string]int{}
	for _, row := range it.rows {
		byType[row.Type]++
		splineTypes[row.Type+" "+row.Spline.Type]++
		files[row.File]++
		materials[row.Material]++
	}
	tw := tabwriter.NewWriter(w, 0, 0, 1, ' ', 0)
	fmt.Fprintf(tw, "\nentities\n")
	for k, v := range byType {
		fmt.Fprintf(tw, "  %s\t%d\n", k, v)
	}
	fmt.Fprintf(tw, "\nspline types\n")
	for k, v := range splineTypes {
		fmt.Fprintf(tw, "  %s\t%d\n", k, v)
	}
	fmt.Fprintf(tw, "\nslices with roads/rivers\t%d\n", len(files))
	fmt.Fprintf(tw, "\ntop materials\n")
	keys := make([]string, 0, len(materials))
	for k := range materials {
		keys = append(keys, k)
	}
	sort.Slice(keys, func(a, b int) bool { return materials[keys[a]] > materials[keys[b]] })
	for i, k := range keys {
		if i >= 20 {
			break
		}
		fmt.Fprintf(tw, "  %s\t%d\n", k, materials[k])
	}
	tw.Flush()

	if flgRoadsJson != "" {
		data, err := json.MarshalIndent(it.rows, "", " ")
		if err == nil {
			err = os.WriteFile(flgRoadsJson, data, os.ModePerm)
		}
		if err != nil {
			fmt.Fprintf(w, "failed to write %s: %v\n", flgRoadsJson, err)
		} else {
			fmt.Fprintf(w, "\nrows written to %s\n", flgRoadsJson)
		}
	}
}
