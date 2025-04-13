package nwfs

import (
	"fmt"
	"io/fs"
	"log/slog"
	"nw-buddy/tools/formats/pak"
	"nw-buddy/tools/utils/json"
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
	archive *pakArchive
}

func (it *pakFile) MarshalJSON() ([]byte, error) {
	return json.MarshalJSON(it.Path())
}

func (it *pakFile) Stat() fs.FileInfo {
	return it
}

func (it *pakFile) Archive() Archive {
	return it.archive
}

func (it *pakFile) Name() string {
	return path.Base(it.Path())
}

func (it *pakFile) Size() int64 {
	return int64(it.UncompressedSize())
}

func (it *pakFile) Mode() os.FileMode {
	return os.ModeIrregular
}

func (it *pakFile) IsDir() bool {
	return false
}

func (it *pakFile) Sys() any {
	return it.Entry
}

func (it *pakFile) String() string {
	return it.Path()
}

// NewPackedArchive creates a new file system using pak files from the given game directory.
func NewPackedArchive(gameDir string) (Archive, error) {
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

	bar := progress.Bar(len(files), "Loading archive")

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
					Entry:   entry,
					archive: fs,
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
