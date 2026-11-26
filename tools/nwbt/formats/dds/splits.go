package dds

import (
	"fmt"

	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"path"
	"strconv"
	"strings"
)

type Splits struct {
	Base  SplitFile
	Alpha SplitFile
}

type SplitFile struct {
	Header nwfs.File
	Files  []nwfs.File
}

// maxSplitParts is the highest part number that FindSplits looks up (the game splits 7 mips at most)
const maxSplitParts = 16

// FindSplits finds the split parts of a DDS file by name: the mips `<file>.1` … `<file>.N` (larger number = larger
// mip), the attached alpha `<file>.a` and its mips `<file>.1a` … `<file>.Na`. For an alpha file (`<file>.a`) the
// result has the alpha parts only. The parts are in ascending order.
func FindSplits(f nwfs.File) (Splits, error) {
	res := Splits{}
	res.Base.Header = f
	archive := f.Archive()
	base := f.Path()
	isAlpha := IsDDSAlpha(base)
	if isAlpha {
		base = utils.ReplaceExt(base, "")
	}
	if alpha, ok := archive.Lookup(base + ".a"); ok {
		res.Alpha.Header = alpha
	}
	for i := 1; i <= maxSplitParts; i++ {
		if !isAlpha {
			if part, ok := archive.Lookup(fmt.Sprintf("%s.%d", base, i)); ok {
				res.Base.Files = append(res.Base.Files, part)
			}
		}
		if part, ok := archive.Lookup(fmt.Sprintf("%s.%da", base, i)); ok {
			res.Alpha.Files = append(res.Alpha.Files, part)
		}
	}
	return res, nil
}

// SplitPartNumber is the mip number of a split part (`.3` and `.3a` are 3), 0 for the header files
func SplitPartNumber(file string) int {
	ext := strings.TrimSuffix(strings.TrimPrefix(path.Ext(file), "."), "a")
	number, err := strconv.Atoi(ext)
	if err != nil {
		return 0
	}
	return number
}

func IsDDS(file string) bool {
	return strings.EqualFold(path.Ext(file), ".dds")
}

func IsDDSAlpha(file string) bool {
	ext := path.Ext(file)
	return IsDDSSplitPart(file) && strings.HasSuffix(ext, "a")
}

func IsDDSSplitPart(file string) bool {
	return IsDDS(strings.TrimSuffix(file, path.Ext(file)))
}

func IsNormalMap(file string) bool {
	basename := path.Base(file)
	for path.Ext(basename) != "" {
		basename = strings.TrimSuffix(basename, path.Ext(basename))
	}
	return strings.HasSuffix(basename, "_ddna") || strings.HasSuffix(basename, "_ddn")
}
