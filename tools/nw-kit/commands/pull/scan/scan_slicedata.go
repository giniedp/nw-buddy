package scan

import (
	"fmt"
	"iter"
	"log/slog"
	"nw-buddy/tools/nw-kit/nwfs"
)

func (ctx *Scanner) ScanSlicedata(rootFile nwfs.File) iter.Seq[SpawnNode] {
	return func(yield func(SpawnNode) bool) {
		doc, err := ctx.LoadRegionSliceData(rootFile)
		if err != nil {
			slog.Error("Failed to load region slice data", "error", err)
			return
		}
		if doc == nil {
			slog.Warn("ScanSlicedata got nil for", "file", rootFile.Path())
			return
		}
		for _, it := range doc.Slicemetadatamap.Element {
			sliceName := string(it.Value1.Slicename)
			file := ctx.ResolveDynamicSliceNameToFile(sliceName)
			if file == nil {
				continue
			}
			for spawner := range ctx.ScanFileForSpawners(file, make([]string, 0)) {
				spawner.Trace = append(spawner.Trace, fmt.Sprintf("Slicemetadatamap.Value1.SliceName in %s", rootFile.Path()))
				if !yield(spawner) {
					return
				}
			}
		}
	}
}
