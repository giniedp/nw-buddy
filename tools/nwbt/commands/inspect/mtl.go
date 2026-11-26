package inspect

import (
	"fmt"
	"io"
	"maps"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"slices"
	"strings"
	"text/tabwriter"
)

type MtlInspector struct {
	count  int
	shader map[string]*MtlShaderInfo
	masks  map[string]int
	maps   map[string]int
}

type MtlShaderInfo struct {
	count        int
	attrCount    map[string]int
	maskCount    map[string]int
	paramCount   map[string]int
	paramIsFloat map[string]bool
	paramIsVec2  map[string]bool
	paramIsVec3  map[string]bool
	paramIsVec4  map[string]bool
	mapCount     map[string]int
	modCount     map[string]int
}

var mapOrder = []string{
	"Diffuse",
	"Bumpmap",
	"Specular",
	"Environment",
	"Detail",
	"SecondSmoothness",
	"Heightmap",
	"Decal",
	"SubSurface",
	"Custom",
	"[1] Custom",
	"Opacity",
	"Smoothness",
	"Emittance",
	"Occlusion",
	"Specular2",
	"[2] Custom",
	"[3] Custom",
	"[4] Custom",
	"[5] Custom",
	"[5] Smoothness",
}

func NewMtlInspector() *MtlInspector {
	return &MtlInspector{
		shader: make(map[string]*MtlShaderInfo),
		masks:  make(map[string]int),
		maps:   make(map[string]int),
	}
}

func (it *MtlInspector) Inspect(assets *game.Assets, file nwfs.File) {
	it.count += 1
	f, err := mtl.Load(file)
	if err != nil {
		return
	}

	for _, m := range f.Collection() {
		shader := strings.ToLower(m.Shader)
		if it.shader[shader] == nil {
			it.shader[shader] = &MtlShaderInfo{
				attrCount:    make(map[string]int),
				maskCount:    make(map[string]int),
				paramCount:   make(map[string]int),
				paramIsFloat: make(map[string]bool),
				paramIsVec2:  make(map[string]bool),
				paramIsVec3:  make(map[string]bool),
				paramIsVec4:  make(map[string]bool),
				mapCount:     make(map[string]int),
				modCount:     make(map[string]int),
			}
		}
		info := it.shader[shader]
		info.count += 1

		masks := strings.Split(m.StringGenMask, "%")
		masks = slices.DeleteFunc(masks, func(it string) bool {
			return it == ""
		})
		slices.Sort(masks)

		for _, mask := range masks {
			it.masks[mask] += 1
			info.maskCount[mask] += 1
		}

		params := m.PublicParamsMap()
		paramKeys := slices.Collect(maps.Keys(params))
		slices.Sort(paramKeys)
		for _, paramKey := range paramKeys {
			info.paramCount[paramKey] += 1
			value := m.Params.Get(paramKey)
			componentCount := strings.Count(value, ",") + 1
			switch componentCount {
			case 1:
				info.paramIsFloat[paramKey] = true
			case 2:
				info.paramIsVec2[paramKey] = true
			case 3:
				info.paramIsVec3[paramKey] = true
			case 4:
				info.paramIsVec4[paramKey] = true
			}
		}

		for texture := range m.IterTextures() {
			it.maps[string(texture.Map)] += 1
			info.mapCount[string(texture.Map)] += 1
			if texture.TexMod != nil {
				info.modCount[string(texture.Map)] += 1
			}
		}
	}

}

func (it *MtlInspector) Print(w io.Writer) {
	tw := tabwriter.NewWriter(w, 0, 0, 1, ' ', 0)

	fmt.Fprintf(w, "# Materials: %d\n", it.count)

	// Maps
	{
		mapNames := slices.Collect(maps.Keys(it.maps))
		slices.SortFunc(mapNames, func(a, b string) int {
			return slices.Index(mapOrder, a) - slices.Index(mapOrder, b)
			// return it.maps[b] - it.maps[a]
		})
		if len(mapNames) > 0 {
			fmt.Fprintf(w, "\n")
			fmt.Fprintf(w, "## Maps (%d)\n", len(mapNames))

			fmt.Fprintf(tw, "| Name\t| Count\t|\n")
			fmt.Fprintf(tw, "|---\t|---\t|\n")
			for _, mapName := range mapNames {
				fmt.Fprintf(tw, "| %s\t| %d\t|\n", mapName, it.maps[mapName])
			}
			tw.Flush()
		}
	}
	// Masks
	{
		masks := slices.Collect(maps.Keys(it.masks))
		slices.SortFunc(masks, func(a, b string) int {
			return it.masks[b] - it.masks[a]
		})
		if len(masks) > 0 {
			fmt.Fprintf(w, "\n")
			fmt.Fprintf(w, "## Masks (%d)\n", len(masks))

			fmt.Fprintf(tw, "| Mask\t| Count\t|\n")
			fmt.Fprintf(tw, "|---\t|---\t|\n")
			for _, mask := range masks {
				fmt.Fprintf(tw, "| %s\t| %d\t|\n", mask, it.masks[mask])
			}
			tw.Flush()
		}
	}

	// Shaders
	shader := slices.Collect(maps.Keys(it.shader))
	slices.Sort(shader)

	for _, shader := range shader {
		info := it.shader[shader]
		fmt.Fprintf(w, "\n\n")
		fmt.Fprintf(w, "## Shader: %s (%d)\n", shader, info.count)

		masks := slices.Collect(maps.Keys(info.maskCount))
		slices.SortFunc(masks, func(a, b string) int {
			return info.maskCount[b] - info.maskCount[a]
		})
		if len(masks) > 0 {
			fmt.Fprintf(w, "\n")
			fmt.Fprintf(w, "### Masks (%d)\n", len(masks))

			fmt.Fprintf(tw, "| Mask\t| Count\t|\n")
			fmt.Fprintf(tw, "|---\t|---\t|\n")
			for _, mask := range masks {
				fmt.Fprintf(tw, "| %s\t| %d\t|\n", mask, info.maskCount[mask])
			}
			tw.Flush()
		}

		params := slices.Collect(maps.Keys(info.paramCount))
		slices.SortFunc(params, func(a, b string) int {
			return info.paramCount[b] - info.paramCount[a]
		})
		if len(params) > 0 {
			fmt.Fprintf(w, "\n")
			fmt.Fprintf(w, "### Public Params (%d)\n", len(params))

			fmt.Fprintf(tw, "| Name\t| Type\t| Count\t|\n")
			fmt.Fprintf(tw, "|---\t|---\t|---\t|\n")
			for _, param := range params {
				t := make([]string, 0)
				switch {
				case info.paramIsFloat[param]:
					t = utils.AppendUniq(t, "number")
				case info.paramIsVec2[param]:
					t = utils.AppendUniq(t, "vec2")
				case info.paramIsVec3[param]:
					t = utils.AppendUniq(t, "vec3")
				case info.paramIsVec4[param]:
					t = utils.AppendUniq(t, "vec4")
				default:
					t = utils.AppendUniq(t, "unknown")
				}
				fmt.Fprintf(tw, "| %s\t| %s\t| %d\t|\n", param, strings.Join(t, " "), info.paramCount[param])
			}
			tw.Flush()
		}

		mapNames := slices.Collect(maps.Keys(info.mapCount))
		slices.SortFunc(mapNames, func(a, b string) int {
			return slices.Index(mapOrder, a) - slices.Index(mapOrder, b)
			// return info.mapCount[b] - info.mapCount[a]
		})
		if len(mapNames) > 0 {
			fmt.Fprintf(w, "\n")
			fmt.Fprintf(w, "### Maps (%d)\n", len(mapNames))

			fmt.Fprintf(tw, "| Name\t| Count\t| Mod count\t|\n")
			fmt.Fprintf(tw, "|---\t|---\t|---\t|\n")
			for _, mapName := range mapNames {
				fmt.Fprintf(tw, "| %s\t| %d\t| %d\t|\n", mapName, info.mapCount[mapName], info.modCount[mapName])
			}
			tw.Flush()
		}
	}

}
