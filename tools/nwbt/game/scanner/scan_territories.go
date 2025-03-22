package scanner

import (
	"fmt"
	"iter"
	"log/slog"
	"nw-buddy/tools/formats/vshapec"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"path"
	"slices"
)

func (ctx *Scanner) ScanTerritories(file nwfs.File) iter.Seq[TerritoryEntry] {
	return func(yield func(TerritoryEntry) bool) {
		slice, err := ctx.LoadSliceComponent(file)
		if err != nil {
			slog.Error("slice component not loaded", "error", err)
			return
		}
		for e, components := range game.EntitiesOf(slice) {
			entry := TerritoryEntry{
				Trace: []any{file.Path()},
			}
			transform := game.FindTransform(e)
			var vshape []nwt.AzVec2
			var shape []nwt.AzVec2

			for _, component := range components {
				switch v := component.(type) {
				case nwt.TerritoryDataProviderComponent:
					entry.TerritoryID = string(v.Territory_id)
				case nwt.PolygonPrismShapeComponent:
					prism := v.Configuration.PolygonPrism.Element.VertexContainer.Vertices.Element
					if len(prism) > 0 {
						shape = slices.Clone(prism)
					}

					file, err := ctx.LookupFileByAssetId(v.Polygon_Shape_Asset_Id)
					if err != nil {
						slog.Warn("pulygon shape asset not found", "err", err)
						continue
					}
					if file == nil || path.Ext(file.Path()) != ".vshapec" {
						continue
					}
					vshapeRec, err := vshapec.Load(file)
					if err != nil {
						slog.Warn(fmt.Sprintf("%v", err))
						continue
					}
					for _, v := range vshapeRec.Vertices {
						vshape = append(vshape, nwt.AzVec2{nwt.AzFloat32(v[0]), nwt.AzFloat32(v[1])})
					}
				}
			}
			if transform != nil {
				entry.Position = transform.Translation()
			}
			if vshape != nil {
				entry.Shape = vshape
			} else if shape != nil {
				entry.Shape = shape
			}

			if entry.TerritoryID != "" && (transform != nil || entry.Shape != nil) {
				if !yield(entry) {
					return
				}
			}
		}
	}
}
