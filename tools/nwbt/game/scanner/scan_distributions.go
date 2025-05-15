package scanner

import (
	"iter"
	"log/slog"
	"nw-buddy/tools/formats/distribution"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
)

type DistributionOutput struct {
	Variant    *VariantEntry
	Gatherable *GatherableEntry
}

func (ctx *Scanner) ScanDistributionFile(file nwfs.File) iter.Seq[DistributionOutput] {
	return func(yield func(DistributionOutput) bool) {
		rec, err := distribution.Load(file)
		if err != nil {
			slog.Error("distribution not loaded", "file", file.Path(), "err", err)
			return
		}
		for i := range rec.Positions {
			position := rec.Positions[i]
			index := rec.Indices[i]
			sliceName := rec.Slices[index]
			variantId := rec.Variants[index]

			x, y, _, _ := distribution.ConvertPosition(rec.Region, position)

			if variantId != "" {
				item := DistributionOutput{
					Variant: &VariantEntry{
						VariantID: variantId,
						Position:  nwt.AzVec3{nwt.AzFloat32(x), nwt.AzFloat32(y), 0},
					},
				}
				if !yield(item) {
					return
				}
				continue
			}
			if sliceName == "" {
				continue
			}
			sliceFile := ctx.ResolveDynamicSliceByName(sliceName)
			if sliceFile == nil {
				continue
			}
			for spawn := range ctx.ScanSlice(sliceFile) {
				// for spawn := range ctx.ScanFileForSpawners(sliceFile, make([]string, 0)) {
				item := DistributionOutput{}
				if spawn.VariantID != "" {
					item.Variant = &VariantEntry{
						VariantID: spawn.VariantID,
						Position:  nwt.AzVec3{spawn.Position[0] + nwt.AzFloat32(x), spawn.Position[1] + nwt.AzFloat32(y), 0},
					}
				}
				if spawn.GatherableID != "" {
					item.Gatherable = &GatherableEntry{
						GatherableID: spawn.GatherableID,
						Position:     nwt.AzVec3{spawn.Position[0] + nwt.AzFloat32(x), spawn.Position[1] + nwt.AzFloat32(y), 0},
					}
				}
				if !yield(item) {
					return
				}
			}
		}
	}
}
