package inspect

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"os"
	"slices"
	"sort"
	"text/tabwriter"
)

// RangeInspector collects the view distances (activation ranges) of mesh and light components in slices
type RangeInspector struct {
	count int
	rows  []RangeRow
}

type RangeRow struct {
	File       string  `json:"file"`
	Type       string  `json:"type"`
	Distance   float32 `json:"distance"`
	Multiplier float32 `json:"multiplier"`
	// Range is Distance * Multiplier for meshes, the view distance cap for lights (0 if not enabled)
	Range     float32 `json:"range"`
	Manual    bool    `json:"manual,omitempty"`
	Instances int     `json:"instances,omitempty"`
}

func NewRangeInspector() *RangeInspector {
	return &RangeInspector{}
}

func (it *RangeInspector) Inspect(assets *game.Assets, file nwfs.File) {
	it.count += 1
	f, err := assets.LoadSliceComponent(file)
	if err != nil {
		return
	}
	for _, entity := range f.Entities.Element {
		for _, component := range entity.Components.Element {
			switch v := component.(type) {
			case nwt.MeshComponent:
				options := v.Static_Mesh_Render_Node.Render_Options
				it.push(RangeRow{
					File:       file.Path(),
					Type:       "Mesh",
					Distance:   float32(options.MaxViewDistance),
					Multiplier: float32(options.ViewDistanceMultiplier),
					Range:      float32(options.MaxViewDistance * options.ViewDistanceMultiplier),
					Manual:     bool(options.UseManualViewDistance),
				})
			case nwt.InstancedMeshComponent:
				options := v.Instanced_Mesh_Render_Node.BaseClass1.Render_Options
				it.push(RangeRow{
					File:       file.Path(),
					Type:       "InstancedMesh",
					Distance:   float32(options.MaxViewDistance),
					Multiplier: float32(options.ViewDistanceMultiplier),
					Range:      float32(options.MaxViewDistance * options.ViewDistanceMultiplier),
					Manual:     bool(options.UseManualViewDistance),
					Instances:  len(v.Instanced_Mesh_Render_Node.Instance_Transforms.Element),
				})
			case nwt.LightComponent:
				config := v.LightConfiguration
				row := RangeRow{
					File:       file.Path(),
					Type:       fmt.Sprintf("Light%v", lightTypeName(uint32(config.LightType))),
					Distance:   float32(config.ViewDistanceCap),
					Multiplier: float32(config.ViewDistanceMultiplier),
				}
				if config.ViewDistanceCapEnabled {
					row.Range = row.Distance
				}
				it.push(row)
			}
		}
	}
}

func (it *RangeInspector) push(row RangeRow) {
	it.rows = append(it.rows, row)
}

func lightTypeName(t uint32) string {
	switch t {
	case 0:
		return "Point"
	case 1:
		return "Area"
	case 2:
		return "Projector"
	case 3:
		return "Probe"
	}
	return fmt.Sprintf("%d", t)
}

// range classes, power of two upper bounds
var rangeClasses = []float32{16, 32, 64, 128, 256, 512, 1024, 2048, 4096, math.MaxFloat32}

func (it *RangeInspector) Print(w io.Writer) {
	fmt.Fprintf(w, "Slices\t%d\n", it.count)
	byType := map[string][]RangeRow{}
	for _, row := range it.rows {
		byType[row.Type] = append(byType[row.Type], row)
	}
	types := make([]string, 0, len(byType))
	for key := range byType {
		types = append(types, key)
	}
	sort.Strings(types)

	tw := tabwriter.NewWriter(w, 0, 0, 1, ' ', 0)
	for _, key := range types {
		rows := byType[key]
		ranges := make([]float32, 0, len(rows))
		multipliers := map[float32]int{}
		manual := 0
		zero := 0
		instances := 0
		for _, row := range rows {
			multipliers[row.Multiplier]++
			instances += row.Instances
			if row.Manual {
				manual++
			}
			if row.Range <= 0 {
				zero++
				continue
			}
			ranges = append(ranges, row.Range)
		}
		slices.Sort(ranges)

		fmt.Fprintf(tw, "\n%s\n", key)
		fmt.Fprintf(tw, "count\t%d\n", len(rows))
		fmt.Fprintf(tw, "no range\t%d\n", zero)
		fmt.Fprintf(tw, "manual\t%d\n", manual)
		if instances > 0 {
			fmt.Fprintf(tw, "instances\t%d\n", instances)
		}
		if len(ranges) == 0 {
			continue
		}
		fmt.Fprintf(tw, "percentiles\t")
		for _, p := range []float64{0.01, 0.05, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99, 0.999} {
			fmt.Fprintf(tw, "p%v=%.1f ", p*100, ranges[min(len(ranges)-1, int(p*float64(len(ranges))))])
		}
		fmt.Fprintf(tw, "max=%.1f\n", ranges[len(ranges)-1])

		hist := make([]int, len(rangeClasses))
		for _, r := range ranges {
			for i, edge := range rangeClasses {
				if r <= edge {
					hist[i]++
					break
				}
			}
		}
		fmt.Fprintf(tw, "classes\t")
		for i, edge := range rangeClasses {
			label := fmt.Sprintf("<=%v", edge)
			if edge == math.MaxFloat32 {
				label = fmt.Sprintf(">%v", rangeClasses[i-1])
			}
			fmt.Fprintf(tw, "%s:%d(%.1f%%) ", label, hist[i], float64(hist[i])/float64(len(ranges))*100)
		}
		fmt.Fprintf(tw, "\n")

		fmt.Fprintf(tw, "top values\t")
		for _, entry := range topValues(ranges, 15) {
			fmt.Fprintf(tw, "%.1f:%d ", entry.value, entry.count)
		}
		fmt.Fprintf(tw, "\n")
		fmt.Fprintf(tw, "multipliers\t")
		for _, entry := range topValues(mapKeysByCount(multipliers), 10) {
			fmt.Fprintf(tw, "%.2f:%d ", entry.value, entry.count)
		}
		fmt.Fprintf(tw, "\n")
	}
	tw.Flush()

	if flgRangesJson != "" {
		data, err := json.Marshal(it.rows)
		if err == nil {
			err = os.WriteFile(flgRangesJson, data, os.ModePerm)
		}
		if err != nil {
			fmt.Fprintf(w, "failed to write %s: %v\n", flgRangesJson, err)
		} else {
			fmt.Fprintf(w, "\nrows written to %s\n", flgRangesJson)
		}
	}
}

type valueCount struct {
	value float32
	count int
}

func topValues(values []float32, n int) []valueCount {
	counts := map[float32]int{}
	for _, v := range values {
		counts[v]++
	}
	result := make([]valueCount, 0, len(counts))
	for value, count := range counts {
		result = append(result, valueCount{value, count})
	}
	sort.Slice(result, func(i, j int) bool {
		if result[i].count == result[j].count {
			return result[i].value < result[j].value
		}
		return result[i].count > result[j].count
	})
	return result[:min(n, len(result))]
}

func mapKeysByCount(counts map[float32]int) []float32 {
	result := make([]float32, 0)
	for value, count := range counts {
		for range count {
			result = append(result, value)
		}
	}
	return result
}
