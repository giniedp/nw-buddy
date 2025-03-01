package pull

import (
	"log/slog"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/loc"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"
	"regexp"
	"strings"
	"sync/atomic"

	"github.com/dustin/go-humanize"
)

func pullImages(fs nwfs.Archive, outDir string, update bool) {

	images := maps.NewSafeSet[string]()
	progress.RunTasks(progress.TasksConfig[nwfs.File, string]{
		Description:   "img scan (tables)",
		ProducerCount: int(flgWorkerCount),
		Tasks:         findDatasheets(fs),
		Producer: func(file nwfs.File) (msg string, err error) {
			msg = file.Path()
			sheet, err := datasheet.Load(file)
			if err != nil {
				return
			}
			for _, row := range sheet.Rows {
				for _, cell := range row {
					if img, ok := cell.(string); ok && isPossiblyImage(img) {
						images.Store(img)
					}
				}
			}
			return
		},
	})
	progress.RunTasks(progress.TasksConfig[nwfs.File, string]{
		Description:   "img scan (locales)",
		ProducerCount: int(flgWorkerCount),
		Tasks:         findLocaleFiles(fs),
		Producer: func(file nwfs.File) (msg string, err error) {
			msg = file.Path()
			doc, err := loc.Load(file)
			if err != nil {
				return
			}
			for _, entry := range doc.Entries {
				for _, img := range scanForHtmlImages(entry.Value) {
					images.Store(img)
				}
			}
			return
		},
	})

	tiles, _ := fs.Glob("lyshineui/worldtiles/**.dds")
	for _, tile := range tiles {
		images.Store(tile.Path())
	}

	failed := uint32(0)
	skipped := uint32(0)
	converted := uint32(0)
	missing := uint32(0)
	totalSize := uint64(0)
	progress.RunTasks(progress.TasksConfig[string, *Blob]{
		Description:   "pull images",
		ProducerCount: int(flgWorkerCount),
		ConsumerCount: int(flgWorkerCount),
		Tasks:         images.Values(),
		Producer: func(source string) (output *Blob, err error) {
			output = &Blob{Path: source}

			path1 := nwfs.NormalizePath(source)
			path2 := utils.ReplaceExt(path1, ".dds")

			file, found := fs.Lookup(path1)
			if !found {
				file, found = fs.Lookup(path2)
			}
			if !found {
				slog.Debug("Image not found", "file", source, "tried", []string{path1, path2})
				atomic.AddUint32(&missing, 1)
				return
			}

			output.Path = utils.ReplaceExt(path.Join(outDir, file.Path()), ".webp")
			if !update {
				if stat, e := os.Stat(output.Path); e == nil {
					atomic.AddUint64(&totalSize, uint64(stat.Size()))
					atomic.AddUint32(&skipped, 1)
					return
				}
			}
			output.Data, err = image.ConvertFile(
				file,
				image.FormatWEBP,
				image.WithTempDir(env.TempDir()),
				image.WithSilent(true),
				image.WithNormalMap(dds.IsNormalMap(file.Path())),
			)
			if err != nil {
				atomic.AddUint32(&failed, 1)
				atomic.AddUint32(&converted, 1)
			} else {
				atomic.AddUint64(&totalSize, uint64(len(output.Data)))
			}
			return
		},
		Consumer: func(value *Blob, e error) (msg string, err error) {
			msg = value.Path
			if value.Data != nil {
				outFile := value.Path
				os.MkdirAll(path.Dir(outFile), os.ModePerm)
				err = os.WriteFile(outFile, value.Data, os.ModePerm)
			}
			return
		},
	})

	stats.Add("Images",
		"total", images.Len(),
		"converted", converted,
		"skipped", skipped,
		"missing", missing,
		"failed", failed,
		"size", humanize.Bytes(totalSize),
	)
}

func isPossiblyImage(name string) bool {
	if !strings.HasPrefix(name, "lyshineui") {
		return false
	}
	if strings.Contains(name, "{") && strings.Contains(name, "}") {
		return false
	}
	return true
}

func scanForHtmlImages(text string) []string {
	result := make([]string, 0)
	reg := regexp.MustCompile(`src="([^"]+)"`)
	for _, str := range scanForHtml(text) {
		if !strings.HasPrefix(str, "<img") {
			continue
		}
		match := reg.FindStringSubmatch(str)
		if len(match) > 1 {
			img := match[1]
			if isPossiblyImage(img) {
				result = append(result, match[1])
			}
		}
	}
	return result
}

func scanForHtml(text string) []string {
	outside := true
	result := make([]string, 0)
	start := 0
	for i := 0; i < len(text); i++ {
		if outside && text[i] == '<' {
			start = i
			outside = !outside
		}
		if !outside && text[i] == '>' {
			result = append(result, text[start:i+1])
			outside = !outside
		}
	}
	return result
}
