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
var flgRegex bool

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
	Cmd.Flags().StringVar(&flgTempDir, "tmp-dir", env.TempDir(), "temporary directory, used for image conversion")
	Cmd.Flags().IntVarP(&flgWWC, "wcw", "w", 10, "worker count for write operations")
	Cmd.Flags().IntVarP(&flgRWC, "wcr", "r", -1, "worker count for read and transform operations. If < 1 then it will be set to 'wcw' value")
	Cmd.Flags().BoolVarP(&flgDryRun, "dry", "", false, "runs without writing to disk")
	Cmd.Flags().StringVar(&flgDryLog, "dry-log", path.Join(env.NwbtDir(), "dry.log"), "the log file where dry run output will be written")
	Cmd.Flags().BoolVarP(&flgRegex, "reg", "e", false, "whether argument is a regular expression")

	Cmd.Flags().StringVar(&flgFmtDatasheet, "x-datasheet", "", "transforms .datasheet files to given format. Possible values: json, csv")
	Cmd.Flags().StringVar(&flgFmtObjects, "x-objects", "", "transforms object streams to to given format. Possible values: json")
	Cmd.Flags().StringVar(&flgFmtLocales, "x-loc", "", "transforms .loc.xml files to given format. Possible values: json")
	Cmd.Flags().StringVar(&flgFmtDDS, "x-dds", "merge", "transforms .dds files to given format. Possible values: merge, png, webp")

	Cmd.Flags().StringVar(&flgCrcFile, "crc-file", path.Join(env.WorkDir(), "tools/nwbt/rtti/nwt/nwt-crc.json"), "file with crc hashes. Only used for object-stream conversion")
	Cmd.Flags().StringVar(&flgUuidFile, "uuid-file", path.Join(env.WorkDir(), "tools/nwbt/rtti/nwt/nwt-types.json"), "file with uuid hashes. Only used for object-stream conversion")
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
	writerCount := max(flgWWC, 1)
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

	for range writerCount {
		go readWorker(readChan, writeChan)
	}
	for range readerCount {
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

	files, err := listFiles(args, flgRegex)
	if err != nil {
		panic(err)
	}
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

func listFiles(args []string, regex bool) ([]nwfs.File, error) {
	fs := utils.Must(nwfs.NewPackedArchive(flgGameDir))
	if len(args) == 0 {
		return fs.List()
	}
	if regex {
		for i := range args {
			args[i] = strings.ToLower(args[i])
			args[i] = strings.ReplaceAll(args[i], "\\\\", "\\")
		}
		return fs.Match(args...)
	}
	for i := range args {
		args[i] = strings.ToLower(args[i])
	}
	return fs.Glob(args...)
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
		// skip dds parts (.dds.1, .dds.a etc.)
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
