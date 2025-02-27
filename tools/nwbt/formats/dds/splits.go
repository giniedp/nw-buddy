package dds

import (
	"fmt"
	"nw-buddy/tools/nwfs"
	"path"
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
	splits, err := f.Archive().Glob(fmt.Sprintf("%s.*", f.Path()))
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
