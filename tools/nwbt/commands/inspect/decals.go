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
	"sort"
	"text/tabwriter"
)

// DecalInspector collects entities with a DecalComponent (projected decals) and SnowComponent.
type DecalInspector struct {
	count int
	rows  []DecalRow
	snow  []DecalRow
}

type DecalRow struct {
	File      string    `json:"file"`
	Entity    string    `json:"entity"`
	Transform mat4.Data `json:"transform"`
	Inactive  bool      `json:"inactive,omitempty"`
	// decal
	Material       string     `json:"material,omitempty"`
	Deferred       bool       `json:"deferred,omitempty"`
	ProjectionType int        `json:"projectionType"`
	Depth          float32    `json:"depth,omitempty"`
	Opacity        float32    `json:"opacity,omitempty"`
	SortPriority   uint32     `json:"sortPriority,omitempty"`
	Color          [4]float32 `json:"color,omitempty"`
	Offset         [3]float32 `json:"offset,omitempty"`
	MaxViewDist    float32    `json:"maxViewDist,omitempty"`
	ViewDistMult   float32    `json:"viewDistMult,omitempty"`
	Visible        bool       `json:"visible"`
	// snow
	Snow any `json:"snow,omitempty"`
}

func NewDecalInspector() *DecalInspector {
	return &DecalInspector{}
}

func (it *DecalInspector) Inspect(assets *game.Assets, file nwfs.File) {
	it.count += 1
	f, err := assets.LoadSliceComponent(file)
	if err != nil || f == nil {
		return
	}
	for i := range f.Entities.Element {
		entity := &f.Entities.Element[i]
		for _, component := range entity.Components.Element {
			switch v := component.(type) {
			case nwt.DecalComponent:
				c := v.DecalConfiguration
				it.rows = append(it.rows, DecalRow{
					File:           file.Path(),
					Entity:         string(entity.Name),
					Transform:      game.FindEntityTransformMat4(entity),
					Inactive:       !bool(entity.IsRuntimeActive),
					Material:       string(c.Material.BaseClass1.AssetPath),
					Deferred:       bool(c.Deferred),
					ProjectionType: int(c.ProjectionType),
					Depth:          float32(c.Depth),
					Opacity:        float32(c.Opacity),
					SortPriority:   uint32(c.SortPriority),
					Color:          [4]float32{float32(c.Color[0]), float32(c.Color[1]), float32(c.Color[2]), float32(c.Color[3])},
					Offset:         [3]float32{float32(c.Offset[0]), float32(c.Offset[1]), float32(c.Offset[2])},
					MaxViewDist:    float32(c.Max_View_Distance),
					ViewDistMult:   float32(c.View_Distance_Multiplier),
					Visible:        bool(c.Visible),
				})
			case nwt.SnowComponent:
				it.snow = append(it.snow, DecalRow{
					File:      file.Path(),
					Entity:    string(entity.Name),
					Transform: game.FindEntityTransformMat4(entity),
					Inactive:  !bool(entity.IsRuntimeActive),
					Snow:      v,
				})
			}
		}
	}
}

func (it *DecalInspector) Print(w io.Writer) {
	fmt.Fprintf(w, "Slices\t%d\n", it.count)
	byMode := map[string]int{}
	files := map[string]int{}
	materials := map[string]int{}
	for _, row := range it.rows {
		byMode[fmt.Sprintf("deferred=%v projection=%d", row.Deferred, row.ProjectionType)]++
		files[row.File]++
		materials[row.Material]++
	}
	tw := tabwriter.NewWriter(w, 0, 0, 1, ' ', 0)
	fmt.Fprintf(tw, "\ndecal entities\t%d\n", len(it.rows))
	for k, v := range byMode {
		fmt.Fprintf(tw, "  %s\t%d\n", k, v)
	}
	fmt.Fprintf(tw, "slices with decals\t%d\n", len(files))
	fmt.Fprintf(tw, "distinct materials\t%d\n", len(materials))
	fmt.Fprintf(tw, "\ntop materials\n")
	keys := make([]string, 0, len(materials))
	for k := range materials {
		keys = append(keys, k)
	}
	sort.Slice(keys, func(a, b int) bool { return materials[keys[a]] > materials[keys[b]] })
	for i, k := range keys {
		if i >= 25 {
			break
		}
		fmt.Fprintf(tw, "  %s\t%d\n", k, materials[k])
	}
	fmt.Fprintf(tw, "\nsnow entities\t%d\n", len(it.snow))
	for _, row := range it.snow {
		fmt.Fprintf(tw, "  %s\t%s\n", row.File, row.Entity)
	}
	tw.Flush()

	if flgDecalsJson != "" {
		data, err := json.MarshalIndent(map[string]any{"decals": it.rows, "snow": it.snow}, "", " ")
		if err == nil {
			err = os.WriteFile(flgDecalsJson, data, os.ModePerm)
		}
		if err != nil {
			fmt.Fprintf(w, "failed to write %s: %v\n", flgDecalsJson, err)
		} else {
			fmt.Fprintf(w, "\nrows written to %s\n", flgDecalsJson)
		}
	}
}
