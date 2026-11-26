package inspect

import (
	"encoding/json"
	"fmt"
	"io"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/math/mat4"
	"os"
	"sort"
	"strings"
	"text/tabwriter"
)

// WaterInspector collects entities with water related components (water volumes, ocean, ...)
type WaterInspector struct {
	count int
	rows  []WaterRow
}

type WaterRow struct {
	File       string    `json:"file"`
	Entity     string    `json:"entity"`
	EntityId   string    `json:"entityId"`
	Transform  mat4.Data `json:"transform"`
	Inactive   bool      `json:"inactive,omitempty"`
	Water      []string  `json:"water"`
	Components []string  `json:"components"`
	// Data holds the water components as is
	Data []any `json:"data"`
}

func NewWaterInspector() *WaterInspector {
	return &WaterInspector{}
}

func isWaterComponentType(name string) bool {
	lower := strings.ToLower(name)
	return strings.Contains(lower, "water") || strings.Contains(lower, "ocean")
}

func (it *WaterInspector) Inspect(assets *game.Assets, file nwfs.File) {
	it.count += 1
	f, err := assets.LoadSliceComponent(file)
	if err != nil || f == nil {
		return
	}
	for i := range f.Entities.Element {
		entity := &f.Entities.Element[i]
		row := WaterRow{}
		for _, component := range entity.Components.Element {
			name := strings.TrimPrefix(fmt.Sprintf("%T", component), "nwt.")
			row.Components = append(row.Components, name)
			if isWaterComponentType(name) {
				row.Water = append(row.Water, name)
				row.Data = append(row.Data, component)
			}
		}
		if len(row.Water) == 0 {
			continue
		}
		row.File = file.Path()
		row.Entity = string(entity.Name)
		row.EntityId = fmt.Sprintf("%d", entity.Id.Id)
		row.Transform = game.FindEntityTransformMat4(entity)
		row.Inactive = !bool(entity.IsRuntimeActive)
		it.rows = append(it.rows, row)
	}
}

func (it *WaterInspector) Print(w io.Writer) {
	fmt.Fprintf(w, "Slices\t%d\n", it.count)
	byType := map[string]int{}
	shapes := map[string]int{}
	files := map[string]int{}
	for _, row := range it.rows {
		files[row.File]++
		for _, t := range row.Water {
			byType[t]++
			for _, c := range row.Components {
				if strings.Contains(strings.ToLower(c), "shape") {
					shapes[t+" + "+c]++
				}
			}
		}
	}
	tw := tabwriter.NewWriter(w, 0, 0, 1, ' ', 0)
	fmt.Fprintf(tw, "\nwater components\n")
	for _, k := range sortedKeys(byType) {
		fmt.Fprintf(tw, "  %s\t%d\n", k, byType[k])
	}
	fmt.Fprintf(tw, "\nwith shapes\n")
	for _, k := range sortedKeys(shapes) {
		fmt.Fprintf(tw, "  %s\t%d\n", k, shapes[k])
	}
	fmt.Fprintf(tw, "\nslices with water\t%d\n", len(files))
	tw.Flush()

	if flgWaterJson == "" {
		return
	}
	out, err := os.Create(flgWaterJson)
	if err != nil {
		fmt.Fprintf(w, "failed to write %s: %v\n", flgWaterJson, err)
		return
	}
	defer out.Close()
	enc := json.NewEncoder(out)
	enc.SetIndent("", "  ")
	if err := enc.Encode(it.rows); err != nil {
		fmt.Fprintf(w, "failed to write %s: %v\n", flgWaterJson, err)
	}
}

func sortedKeys(m map[string]int) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}
