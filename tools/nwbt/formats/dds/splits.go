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

func FindSplits(f nwfs.File) (Splits, error) {
	res := Splits{}
	res.Base.Header = f
	pattern := fmt.Sprintf("%s.*", f.Path())
	if IsDDSAlpha(f.Path()) {
		pattern = utils.ReplaceExt(f.Path(), ".*a")
	}

	splits, err := f.Archive().Glob(pattern)
	if err != nil {
		return res, err
	}
	for _, split := range splits {
		ext := path.Ext(split.Path())
		if ext == ".a" {
			res.Alpha.Header = split
			continue
		}
		if strings.HasSuffix(ext, "a") {
			res.Alpha.Files = append(res.Alpha.Files, split)
			continue
		}
		res.Base.Files = append(res.Base.Files, split)
	}
	return res, nil
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

func DDSSplitPart(file string) (bool, uint) {
	ext := path.Ext(file)
	if !IsDDSSplitPart(file) {
		return false, 0
	}
	ext = strings.TrimLeft(ext, ".")
	face, _ := strconv.Atoi(ext)
	return true, uint(face)
}

func IsNormalMap(file string) bool {
	basename := path.Base(file)
	for path.Ext(basename) != "" {
		basename = strings.TrimSuffix(basename, path.Ext(basename))
	}
	return strings.HasSuffix(basename, "_ddna") || strings.HasSuffix(basename, "_ddn")
}
