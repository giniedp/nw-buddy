package pull

import (
	"log/slog"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"

	"github.com/spf13/cobra"
)

var cmdPullActionlists = &cobra.Command{
	Use:   TASK_ACTIONLISTS,
	Short: "Pulls actionlists",
	Long:  "",
	Run:   runPullActionlists,
}

func runPullActionlists(ccmd *cobra.Command, args []string) {
	ctx := NewPullContext()
	slog.SetDefault(logging.DefaultFileHandler())
	ctx.PullActionlists()
	slog.SetDefault(logging.DefaultTerminalHandler())
	ctx.PrintStats()
}

func pullActionlists(fs nwfs.Archive, outDir string) []nwfs.File {
	result := make([]nwfs.File, 0)
	progress.RunTasks(progress.TasksConfig[nwfs.File, *Blob]{
		Description:   "Actionlists",
		Tasks:         findActionlists(fs),
		ProducerCount: 1,
		Producer: func(file nwfs.File) (output *Blob, err error) {
			result = append(result, file)
			data, err := file.Read()
			if err != nil {
				return
			}
			output = &Blob{
				Path: path.Join(outDir, strings.TrimPrefix(file.Path(), "sharedassets/springboardentitites/")),
				Data: data,
			}
			return
		},
		ConsumerCount: int(flgWorkerCount),
		Consumer:      writeBlob,
	})
	return result
}
