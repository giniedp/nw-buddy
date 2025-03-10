package pull

import (
	"context"
	"log/slog"
	"nw-buddy/tools/commands/pull/ts"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"

	"github.com/spf13/cobra"
)

var cmdPullTables = &cobra.Command{
	Use:   TASK_TABLES,
	Short: "Pulls datasheets",
	Long:  "",
	Run:   runPullTables,
}

func runPullTables(ccmd *cobra.Command, args []string) {
	ctx := NewPullContext()
	slog.SetDefault(logging.DefaultFileHandler())
	ctx.PullTables()
	slog.SetDefault(logging.DefaultTerminalHandler())
	ctx.PrintStats()
}

func pullTables(fs nwfs.Archive, outDir string) []*datasheet.Document {
	result := maps.NewSyncDict[*datasheet.Document]()

	progress.RunTasks(progress.TasksConfig[nwfs.File, string]{
		Description:   "Datasheets (read)",
		Tasks:         findDatasheets(fs),
		ProducerCount: 1,
		Producer: func(file nwfs.File) (output string, err error) {
			sheet, err := datasheet.Load(file)
			if err != nil {
				return
			}
			result.Store(file.Path(), &sheet)
			return
		},
	})

	datasheets := result.SortedValues()
	progress.RunTasks(progress.TasksConfig[*datasheet.Document, *Blob]{
		Description:   "Datasheets (work)",
		Tasks:         datasheets,
		ProducerCount: int(flgWorkerCount),
		Producer: func(sheet *datasheet.Document) (output *Blob, err error) {
			output = &Blob{
				Path: path.Join(outDir, strings.TrimPrefix(sheet.File, "sharedassets/springboardentitites/")),
			}
			ctx := context.Background()
			ctx = nwfs.WithArchive(ctx, fs)
			ctx = datasheet.WithDocument(ctx, sheet)
			ctx = datasheet.WithDocumentList(ctx, datasheets)

			if err = ts.TransformTable(sheet, ctx); err != nil {
				return
			}

			output.Path = utils.ReplaceExt(output.Path, ".json")
			output.Data, err = sheet.RowsToJSON("", "\t")
			return
		},
		ConsumerCount: int(flgWorkerCount),
		Consumer:      writeBlob,
	})

	return datasheets
}
