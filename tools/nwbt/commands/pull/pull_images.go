package pull

import (
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/loc"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"
	"regexp"
	"strings"
)

func pullImages(fs nwfs.Archive, outDir string, update bool) {

	imageSet := utils.NewRecord[bool]()
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
						imageSet.Set(img, true)
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
					imageSet.Set(img, true)
				}
			}
			return
		},
	})

	images := imageSet.Keys()
	tiles, _ := fs.Glob("lyshineui/worldtiles/**.dds")
	for _, tile := range tiles {
		images = append(images, tile.Path())
	}

	skipped := 0
	missing := utils.NewRecord[bool]()
	progress.RunTasks(progress.TasksConfig[string, *Blob]{
		Description:   "pull images",
		ProducerCount: int(flgWorkerCount),
		ConsumerCount: int(flgWorkerCount),
		Tasks:         images,
		Producer: func(img string) (output *Blob, err error) {
			output = &Blob{Path: img}

			img = nwfs.NormalizePath(img)
			f, ok := fs.Lookup(img)
			if !ok {
				img = utils.ReplaceExt(img, ".dds")
				f, ok = fs.Lookup(img)
			}
			if !ok {
				missing.Set(img, true)
				return
			}
			ext := path.Ext(img)
			if ext != ".dds" {
				return
			}

			output.Path = utils.ReplaceExt(path.Join(outDir, img), ".webp")
			if !update && utils.FileExists(output.Path) {
				skipped++
				return
			}
			output.Data, err = image.ConvertDDSFile(
				f,
				image.WEBP,
				image.WithTempDir(env.TempDir()),
				image.WithSilent(true),
				image.WithNormalMap(dds.IsNormalMap(f.Path())),
			)
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

	stats.Add("Images", "total", len(images), "skipped", skipped, "missed", missing.Len())
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
