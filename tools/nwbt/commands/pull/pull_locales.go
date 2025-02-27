package pull

import (
	"log/slog"
	"nw-buddy/tools/formats/loc"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/progress"
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
				Path: path.Join(outDir, lang+".json"),
			}
			dict := loadDictionary(files)
			locales.Set(lang, dict)
			output.Data, err = utils.MarshalJSON(dict.ToSortedMap(), "", "\t")
			return
		},
		ConsumerCount: 1,
		Consumer:      writeBlob,
	})

	for lang, dict := range locales.Iter() {
		stats.Add(lang, "count", dict.Len())
	}
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
			slog.Error("Failed to load localization", "file", file, "err", err)
			continue
		}
		for _, entry := range doc.Entries {
			if entry.Key == "" && entry.Value == "" {
				continue
			}
			key := strings.ToLower(entry.Key)
			value := strings.ToLower(entry.Value)
			if value == "" {
				continue
			}

			oldValue, hasValue := dict.Get(key)
			if hasValue && !strings.EqualFold(oldValue, entry.Value) {
				slog.Debug("Duplicate key found", "key", entry.Key, "value", oldValue, "value", entry.Value, "file", file.Path())
				continue
			}
			dict.Set(key, entry.Value)
		}
	}
	return dict
}
