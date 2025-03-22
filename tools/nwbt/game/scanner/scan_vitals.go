package scanner

import (
	"iter"
	"log/slog"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
)

func (ctx *Scanner) ScanVitals(file nwfs.File) iter.Seq[VitalsEntry] {
	return func(yield func(VitalsEntry) bool) {
		slice, err := ctx.LoadSliceComponent(file)
		if err != nil {
			slog.Error("slice component not loaded", "error", err)
			return
		}
		for _, data := range ctx.ScanSliceComponentForData(slice, file.Path()) {
			if data.VitalsID == "" {
				continue
			}
			entry := VitalsEntry{
				Encounter:    game.FindEncounterType(slice),
				Level:        data.Level,
				VitalsID:     data.VitalsID,
				NpcID:        data.NpcID,
				CategoryID:   data.CategoryID,
				GatherableID: data.GatherableID,
				DamageTable:  data.DamageTable,
				ModelFile:    data.ModelFile,
				MtlFile:      data.MtlFile,
				AdbFile:      data.AdbFile,
				Tags:         data.Tags,
				Trace:        data.Trace,
			}
			if !yield(entry) {
				return
			}
		}
	}
}
