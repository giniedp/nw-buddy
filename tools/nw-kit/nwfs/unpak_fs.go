package nwfs

import (
	"fmt"
	"log/slog"
	"os"
	"path"
	"path/filepath"
	"time"

	"github.com/goreleaser/fileglob"
)

type unpakFileSystem struct {
	baseFS
	rootDir string
}

type unpakFile struct {
	fs   *unpakFileSystem
	name string
}

func (it *unpakFile) FS() FileSystem {
	return it.fs
}

func (it *unpakFile) Package() string {
	return ""
}

func (it *unpakFile) Path() string {
	return it.name
}

func (it *unpakFile) Read() ([]byte, error) {
	return os.ReadFile(path.Join(it.fs.rootDir, it.name))
}

func NewUnpackedFS(rootDir string) (FileSystem, error) {
	rootDir = NormalizePath(rootDir)
	fs := &unpakFileSystem{rootDir: rootDir}
	pattern := path.Join(fs.rootDir, "**")
	timeStart := time.Now()
	files, err := fileglob.Glob(pattern, fileglob.MaybeRootFS)
	elapsed := time.Since(timeStart)
	if elapsed > time.Second {
		slog.Warn(fmt.Sprintf("Glob took %s", elapsed))
	}
	if err != nil {
		return nil, err
	}
	for _, file := range files {
		if stat, err := os.Stat(file); err != nil || stat.IsDir() {
			continue
		}
		name, err := filepath.Rel(rootDir, file)
		if err != nil {
			return nil, err
		}
		fs.files = append(fs.files, &unpakFile{
			fs:   fs,
			name: NormalizePath(name),
		})
	}
	return fs, nil
}
