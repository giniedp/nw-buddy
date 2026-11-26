package scanner

import (
	"iter"
	"nw-buddy/tools/nwfs"
)

// ScanVitals returns the vitals of a slice and of everything it spawns
func (ctx *Scanner) ScanVitals(file nwfs.File) iter.Seq[VitalsEntry] {
	return func(yield func(VitalsEntry) bool) {
		for spawn := range ctx.ScanSlice(file) {
			if entry, ok := spawn.(*VitalsEntry); ok {
				if !yield(*entry) {
					return
				}
			}
		}
	}
}
