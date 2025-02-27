package unpack

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/constants"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"
	"strings"

	"github.com/dustin/go-humanize"
	"github.com/spf13/cobra"
)

var description = fmt.Sprintf("%s%s", constants.NW_BUDDY_BANNER, ``)

var flgGameDir string
var flgUnpackDir string
var flgTempDir string

var flgRWC int
var flgWWC int
var flgDryRun bool
var flgDryLog string
var flgGlobPattern string
var flgRegxPattern string

var flgFmtDatasheet string
var flgFmtLocales string
var flgFmtObjects string
var flgFmtDDS string
var flgCrcFile string
var flgUuidFile string

var Cmd = &cobra.Command{
	Use:           "unpack",
	Short:         "unpacks game data with optional preprocessing (e.g. object-stream to json or image conversion).",
	Long:          description,
	Run:           run,
	SilenceErrors: false,
}

var crcTable rtti.CrcTable
var uuidTable rtti.UuidTable

const (
	FMT_JSON  = "json"  //
	FMT_CSV   = "csv"   //
	FMT_YML   = "yml"   //
	FMT_PNG   = "png"   // for dds
	FMT_WEBP  = "webp"  // for dds
	FMT_MERGE = "merge" // merges dds parts
)

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game-dir", "g", env.GameDir(), "game root directory")
	Cmd.Flags().StringVarP(&flgUnpackDir, "out-dir", "o", env.UnpackDir(), "directory to unpack to")
	Cmd.Flags().StringVar(&flgTempDir, "tmp-dir", ".nwbt/tmp", "temporary directory, used for image conversion")
	Cmd.Flags().IntVarP(&flgWWC, "wcw", "w", 10, "worker count for write operations")
	Cmd.Flags().IntVarP(&flgRWC, "wcr", "r", -1, "worker count for read and transform operations. If < 1 then it will be set to 'wcw' value")
	Cmd.Flags().BoolVarP(&flgDryRun, "dry", "", false, "runs without writing to disk")
	Cmd.Flags().StringVar(&flgDryLog, "dry-log", ".nwbt/dry.log", "the log file where dry run output will be written")
	Cmd.Flags().StringVar(&flgGlobPattern, "glob", "", "file glob pattern. Ignored if --regex is set")
	Cmd.Flags().StringVar(&flgRegxPattern, "regex", "", "regex pattern. If set, --glob is ignored")

	Cmd.Flags().StringVar(&flgFmtDatasheet, "x-datasheet", "", "transforms .datasheet files to given format. Possible values: json, csv")
	Cmd.Flags().StringVar(&flgFmtObjects, "x-objects", "", "transforms object streams to to given format. Possible values: json")
	Cmd.Flags().StringVar(&flgFmtLocales, "x-loc", "", "transforms .loc.xml files to given format. Possible values: json")
	Cmd.Flags().StringVar(&flgFmtDDS, "x-dds", "merge", "transforms .dds files to given format. Possible values: merge, png, webp")

	Cmd.Flags().StringVar(&flgCrcFile, "crc-file", path.Join(env.WorkDir(), "tools/nw-kit/rtti/nwt/nwt-crc.json"), "file with crc hashes. Only used for object-stream conversion")
	Cmd.Flags().StringVar(&flgUuidFile, "uuid-file", path.Join(env.WorkDir(), "tools/nw-kit/rtti/nwt/nwt-types.json"), "file with uuid hashes. Only used for object-stream conversion")
}

func run(ccmd *cobra.Command, args []string) {
	if _, err := os.Stat(flgTempDir); err != nil && os.IsNotExist(err) {
		os.MkdirAll(flgTempDir, os.ModePerm)
	}

	if flgFmtObjects != "" {
		crcTable = utils.Must(rtti.LoadCrcTable(flgCrcFile))
		uuidTable = utils.Must(rtti.LoadUuIdTable(flgUuidFile))
	}

	unpackDir := flgUnpackDir
	writerCount := flgWWC
	if writerCount < 1 {
		writerCount = 1
	}
	readerCount := flgRWC
	if readerCount < 1 {
		readerCount = writerCount
	}
	slog.Info("worker", "reader", readerCount, "writer", writerCount)
	readChan := make(chan Task)
	writeChan := make(chan Task)
	doneChan := make(chan progress.ProgressMessage)
	var dryOut *os.File

	if flgDryRun {
		dryOut = utils.Must(os.OpenFile(flgDryLog, os.O_CREATE|os.O_TRUNC, 0666))
	}

	for w := 0; w < writerCount; w++ {
		go readWorker(readChan, writeChan)
	}
	for w := 0; w < readerCount; w++ {
		go writeWorker(writerOpts{
			unpackDir: unpackDir,
			tasks:     writeChan,
			results:   doneChan,
			dryOut:    dryOut,
		})
		if flgDryRun {
			break
		}
	}

	files := listFiles()
	bar := progress.Group(len(files), "Unpacking", doneChan)
	for _, entry := range files {
		readChan <- Task{Input: entry}
	}
	bar.Wait()

	close(readChan)
	close(writeChan)
	close(doneChan)

	if flgDryRun {
		slog.Info("Dry run output written to", slog.String("file", flgDryLog))
	}
}

func listFiles() []nwfs.File {
	fs := utils.Must(nwfs.NewPakFS(flgGameDir))
	var files []nwfs.File
	if flgRegxPattern != "" {
		flgRegxPattern = strings.ToLower(flgRegxPattern)
		flgRegxPattern = strings.ReplaceAll(flgRegxPattern, "\\\\", "\\")
		slog.Info("listing files with", "regex", flgRegxPattern)
		files = utils.Must(fs.Match(strings.Split(flgRegxPattern, ";")...))
	} else if flgGlobPattern != "" {
		flgGlobPattern = strings.ToLower(flgGlobPattern)
		slog.Info("listing files with", "glob", flgGlobPattern)
		files = utils.Must(fs.Glob(strings.Split(flgGlobPattern, ";")...))
	} else {
		slog.Info("listing all files")
		files = utils.Must(fs.List())
	}
	return files
}

type Task struct {
	Input  nwfs.File
	Output []*TaskOutput
	Error  error
}

type TaskOutput struct {
	Path  string
	Data  []byte
	Error error
}

func readWorker(jobs <-chan Task, results chan<- Task) {
	for task := range jobs {
		processTask(&task)
		results <- task
	}
}

type writerOpts struct {
	unpackDir string
	tasks     <-chan Task
	results   chan<- progress.ProgressMessage
	dryOut    *os.File
}

func writeWorker(opts writerOpts) {
	for task := range opts.tasks {
		msg := task.Input.Path()
		if task.Error == nil {
			for i, output := range task.Output {
				if i == 0 {
					msg = fmt.Sprintf("%s -> %s", msg, path.Ext(output.Path))
				} else {
					msg = fmt.Sprintf("%s,%s", msg, path.Ext(output.Path))
				}
				if opts.dryOut != nil {
					size := len(output.Data)
					opts.dryOut.WriteString(fmt.Sprintf("%s (%s)\n", output.Path, humanize.Bytes(uint64(size))))
					continue
				}
				outFile := path.Join(opts.unpackDir, output.Path)
				outDir := path.Dir(outFile)
				if _, err := os.Stat(outDir); os.IsNotExist(err) {
					os.MkdirAll(outDir, os.ModePerm)
				}
				err := os.WriteFile(outFile, output.Data, os.ModePerm)
				if err != nil {
					task.Error = err
				}
			}
		}

		if opts.dryOut != nil {
			msg = fmt.Sprintf("DRY: %s", msg)
		}

		opts.results <- progress.ProgressMessage{Err: task.Error, Msg: msg}
	}
}

func processTask(task *Task) {
	if dds.IsDDSSplitPart(task.Input.Path()) && flgFmtDDS != "" {
		// skio dds parts (.dds.1, .dds.a etc.)
		// they will be automatically merged into the .dds file below
		return
	}

	ext := strings.ToLower(path.Ext(task.Input.Path()))
	switch ext {
	case ".datasheet":
		processDatasheet(task, flgFmtDatasheet)
		return
	case ".dds":
		processDDS(task, flgFmtDDS)
		return
	case ".xml":
		if strings.HasSuffix(task.Input.Path(), ".loc.xml") {
			processLocale(task, flgFmtLocales)
			return
		}
	}

	processAny(task)
}
