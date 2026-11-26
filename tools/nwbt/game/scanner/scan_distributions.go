package scanner

import (
	"iter"
	"log/slog"
	"nw-buddy/tools/formats/distribution"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/math/mat4"
)

func (ctx *Scanner) ScanDistributionFile(file nwfs.File) iter.Seq[Spawn] {
	return func(yield func(Spawn) bool) {
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

			x, y := distribution.ConvertPosition(rec.Region, position)
			// the slice stands turned and scaled at the placement, the height is not stored
			placement := mat4.FromRotationScaleTranslation(
				distribution.UnpackRotation(rec.Rotations[i]),
				distribution.PlacementScale(rec.Scales[i]),
				[3]float32{x, y, 0},
			)

			if variantId != "" {
				item := &VariantEntry{
					VariantID: variantId,
					spawn: spawn{
						Position: nwt.AzVec3{nwt.AzFloat32(x), nwt.AzFloat32(y), 0},
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
				spawn.SetPosition(mat4.TransformPoint(placement, spawn.GetPosition()))
				switch v := spawn.(type) {
				case *GatherableEntry:
					if !yield(v) {
						return
					}
				case *VariantEntry:
					if !yield(v) {
						return
					}
					// TODO: do we need this?
					// without: Gatherables rows=495 positions=87678 size="2.5 MB"
					// with:    Gatherables rows=498 positions=136543 size="3.8 MB"
					// gatherable variations in datasheets have a gatherable entry ID.
					// but some entries here have different gatherable ID.
					if v.GatherableID != "" {
						if !yield(&GatherableEntry{
							spawn:        v.spawn,
							GatherableID: v.GatherableID,
						}) {
							return
						}
					}
				}
			}
		}
	}
}
