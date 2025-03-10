package pull

import (
	"log/slog"
	"nw-buddy/tools/formats/loc"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"

	"github.com/dustin/go-humanize"
	"github.com/spf13/cobra"
)

var cmdPullLocales = &cobra.Command{
	Use:   TASK_LOCALE,
	Short: "Pulls locale files and converts them to JSON",
	Long:  "",
	Run:   runPullLocales,
}

func runPullLocales(ccmd *cobra.Command, args []string) {
	ctx := NewPullContext()
	slog.SetDefault(logging.DefaultFileHandler())
	ctx.PullLocales()
	slog.SetDefault(logging.DefaultTerminalHandler())
	ctx.PrintStats()
}

func pullLocales(fs nwfs.Archive, outDir string) *maps.SafeDict[*maps.SafeDict[string]] {
	groups := groupLocaleFiles(findLocaleFiles(fs))
	locales := maps.NewSafeDict[*maps.SafeDict[string]]()
	sizes := maps.NewSafeDict[int]()
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
			locales.Store(lang, dict)
			output.Data, err = dict.MarshalJSON()
			sizes.Store(lang, len(output.Data))
			return
		},
		ConsumerCount: 1,
		Consumer:      writeBlob,
	})

	for lang, dict := range locales.Iter() {
		stats.Add("Locale "+lang, "count", dict.Len(), "size", humanize.Bytes(uint64(sizes.Get(lang))))
	}
	return locales
}

func groupLocaleFiles(files []nwfs.File) *maps.SafeDict[[]nwfs.File] {
	groups := maps.NewSafeDict[[]nwfs.File]()
	for _, file := range files {
		lang := path.Base(path.Dir(file.Path()))
		if list, ok := groups.Load(lang); ok {
			groups.Store(lang, append(list, file))
		} else {
			groups.Store(lang, []nwfs.File{file})
		}
	}
	return groups
}

func loadDictionary(files []nwfs.File) *maps.SafeDict[string] {
	dict := maps.NewSafeDict[string]()
	for _, file := range files {
		doc, err := loc.Load(file)
		if err != nil {
			slog.Error("localization not loaded", "file", file, "err", err)
			continue
		}
		for _, entry := range doc.Entries {
			if entry.Key == "" || entry.Value == "" {
				continue
			}

			key := strings.ToLower(entry.Key)
			oldValue, hadValue := dict.LoadOrStore(key, entry.Value)
			if hadValue && !strings.EqualFold(oldValue, entry.Value) {
				slog.Debug("Duplicate key found", "key", entry.Key, "value", oldValue, "value", entry.Value, "file", file.Path())
				continue
			}
		}
	}
	dict.Sort()
	return dict
}
