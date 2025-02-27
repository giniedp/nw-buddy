package pull

import (
	"log/slog"
	"nw-buddy/tools/nw-kit/formats/loc"
	"nw-buddy/tools/nw-kit/nwfs"
	"nw-buddy/tools/nw-kit/utils"
	"nw-buddy/tools/nw-kit/utils/progress"
	"path"
	"strings"
)

func pullLocales(fs nwfs.Archive, outDir string) *utils.Record[*utils.Record[string]] {
	groups := groupLocaleFiles(findLocaleFiles(fs))
	locales := utils.NewRecord[*utils.Record[string]]()
	progress.RunTasks(progress.TasksConfig[[]nwfs.File, *Blob]{
		Description:   "Locales",
		Tasks:         groups.Values(),
		ProducerCount: int(flgWorkerCount),
		Producer: func(files []nwfs.File) (output *Blob, err error) {
			lang := path.Base(path.Dir(files[0].Path()))
			output = &Blob{
				Path: path.Join(outDir, "localization", lang+".json"),
			}
			dict := loadDictionary(files)
			locales.Set(lang, dict)
			output.Data, err = utils.MarshalJSON(dict.ToSortedMap(), "", "\t")
			return
		},
		ConsumerCount: 1,
		Consumer:      writeBlob,
	})
	return locales
}

func groupLocaleFiles(files []nwfs.File) *utils.Record[[]nwfs.File] {
	groups := utils.NewRecord[[]nwfs.File]()
	for _, file := range files {
		lang := path.Base(path.Dir(file.Path()))
		if list, ok := groups.Get(lang); ok {
			groups.Set(lang, append(list, file))
		} else {
			groups.Set(lang, []nwfs.File{file})
		}
	}
	return groups
}

func loadDictionary(files []nwfs.File) *utils.Record[string] {
	dict := utils.NewRecord[string]()
	for _, file := range files {
		doc, err := loc.Load(file)
		if err != nil {
			slog.Warn("Failed to load localization", "file", file, "err", err)
			continue
		}
		for _, entry := range doc.Entries {
			if entry.Key == "" && entry.Value == "" {
				continue
			}
			dict.Set(strings.ToLower(entry.Key), entry.Value)
		}
	}
	return dict
}
