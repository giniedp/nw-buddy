package scanner

import (
	"fmt"
	"iter"
	"log/slog"
	"nw-buddy/tools/formats/capitals"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
)

func (ctx *Scanner) ScanCapitalFile(rootFile nwfs.File) iter.Seq[SpawnNode] {

	return func(yield func(SpawnNode) bool) {
		doc, err := capitals.Load(rootFile)
		if err != nil {
			slog.Warn("capital document not loaded", "file", rootFile.Path(), "err", err)
			return
		}
		for _, capital := range doc.Capitals {
			if capital.VariantName != "" {
				item := SpawnNode{}
				item.VariantID = capital.VariantName
				item.Trace = append(item.Trace, fmt.Sprintf("Capitals.VariantName %s", rootFile.Path()))
				if capital.Position != nil {
					item.Position[0] = nwt.AzFloat32(capital.Position.X)
					item.Position[1] = nwt.AzFloat32(capital.Position.Y)
					item.Position[2] = nwt.AzFloat32(capital.Position.Z)
				}
				if !yield(item) {
					return
				}
			} else if capital.SliceName != "" {
				transform := capital.Transform()
				file := ctx.ResolveDynamicSliceByName(capital.SliceName)

				for entry := range ctx.ScanSlice(file) {
					// for entry := range ctx.ScanFileForSpawners(file, make([]string, 0)) {
					entry.Position = transform.TransformPoint(entry.Position)
					if !yield(entry) {
						return
					}
				}
			}

		}

	}
}
