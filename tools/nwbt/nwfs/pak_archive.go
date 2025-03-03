package nwfs

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/pak"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"
	"path/filepath"
	"slices"
	"strings"

	"github.com/goreleaser/fileglob"
)

var ExcludedPacks = []string{
	"shadercachestartup.pak",
	"shadersbin_d3d11.pak",
	//"shadersbin_d3d12.pak",
}

type pakArchive struct {
	baseFS
	rootDir string
}

type pakFile struct {
	pak.Entry
	fs *pakArchive
}

func (it *pakFile) Archive() Archive {
	return it.fs
}

// NewPakFS creates a new file system using pak files from the given game directory.
func NewPakFS(gameDir string) (Archive, error) {
	gameDir = path.Clean(gameDir)
	if !strings.HasSuffix(gameDir, "assets") {
		gameDir = path.Join(gameDir, "assets")
	}
	d := &pakArchive{
		rootDir: gameDir,
	}
	err := d.init()

	return d, err
}

func (fs *pakArchive) init() error {
	stat, err := os.Stat(fs.rootDir)
	if err != nil {
		return err
	}
	if !stat.IsDir() {
		return fmt.Errorf("'%v' is not a directory", fs.rootDir)
	}

	pattern := path.Join(fs.rootDir, "**.pak")
	files, err := fileglob.Glob(pattern, fileglob.MaybeRootFS)
	if err != nil {
		return err
	}

	bar := progress.Bar(len(files), "Initialize fs")

	fs.files = make([]File, 0)
	for _, file := range files {
		if slices.Contains(ExcludedPacks, filepath.Base(file)) {
			bar.Add(1)
			continue
		}
		rel, _ := filepath.Rel(fs.rootDir, file)
		rel = strings.ReplaceAll(rel, "\\", "/")
		it := pak.New(fs.rootDir, rel)

		entries, err := it.ListFiles()
		if err != nil {
			slog.Warn(fmt.Sprintf("Failed to list files in pak '%v': %v", it.Path(), err))
		} else {
			for _, entry := range entries {
				file := &pakFile{
					Entry: entry,
					fs:    fs,
				}
				fs.files = append(fs.files, file)
			}
		}
		bar.Add(1)
		bar.Detail(fmt.Sprintf("%v paks %v files", len(files), len(fs.files)))
	}
	bar.Close()

	_, err = fs.List()
	if err != nil {
		return err
	}
	fs.initSuffix()
	return nil
}
