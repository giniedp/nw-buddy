package inspect

import (
	"bufio"
	"encoding/json"
	"log/slog"
	"nw-buddy/tools/formats/pak"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/progress"
	"os"
	"strings"
	"sync"

	"github.com/spf13/cobra"
)

// asset statistics subcommands (inspect models|textures|levels), see assets_*.go
// each of them writes one json row per item to the --out file for later aggregation

var flgOut string
var flgWorkers int

func init() {
	for _, cmd := range []*cobra.Command{cmdModels, cmdTextures, cmdLevels, cmdMaterials, cmdCatalog} {
		cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
		cmd.Flags().StringVarP(&flgOut, "out", "o", "", "output file (json lines), or directory for the catalog command")
		cmd.Flags().IntVarP(&flgWorkers, "workers", "w", env.PreferredWorkerCount(), "number of workers")
		cmd.MarkFlagRequired("out")
		Cmd.AddCommand(cmd)
	}
}

// compressedSize returns the size of the file inside its pak
func compressedSize(f nwfs.File) int64 {
	if f == nil {
		return 0
	}
	if e, ok := f.Stat().Sys().(pak.Entry); ok {
		return int64(e.CompressedSize())
	}
	return f.Stat().Size()
}

func fileSize(f nwfs.File) int64 {
	if f == nil {
		return 0
	}
	return f.Stat().Size()
}

// topDir returns the first n segments of a path
func topDir(p string, n int) string {
	parts := strings.Split(p, "/")
	if len(parts) <= n {
		return strings.Join(parts[:len(parts)-1], "/")
	}
	return strings.Join(parts[:n], "/")
}

// processRows runs fn for each item in parallel and writes the resulting rows to the output file
func processRows[T any, R any](title string, items []T, fn func(T) *R) {
	out, err := os.Create(flgOut)
	if err != nil {
		panic(err)
	}
	defer out.Close()
	w := bufio.NewWriter(out)
	defer w.Flush()
	enc := json.NewEncoder(w)

	jobs := make(chan T)
	rows := make(chan *R)
	wg := sync.WaitGroup{}
	for range max(1, flgWorkers) {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for item := range jobs {
				rows <- safeCall(fn, item)
			}
		}()
	}
	go func() {
		for _, item := range items {
			jobs <- item
		}
		close(jobs)
		wg.Wait()
		close(rows)
	}()

	bar := progress.Bar(len(items), title)
	for row := range rows {
		if row != nil {
			enc.Encode(row)
		}
		bar.Add(1)
	}
	bar.Close()
}

func safeCall[T any, R any](fn func(T) *R, item T) (res *R) {
	defer func() {
		if r := recover(); r != nil {
			slog.Warn("inspect failed", "item", item, "error", r)
			res = nil
		}
	}()
	return fn(item)
}
