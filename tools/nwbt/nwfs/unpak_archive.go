package nwfs

import (
	"io/fs"
	"os"
	"path"
	"path/filepath"

	"github.com/goreleaser/fileglob"
)

type unpackedArchive struct {
	baseFS
	rootDir string
}

type unpackedFile struct {
	archive     *unpackedArchive
	archivePath string
	systemPath  string
}

func (it *unpackedFile) Archive() Archive {
	return it.archive
}

func (it *unpackedFile) Package() string {
	return ""
}

func (it *unpackedFile) Path() string {
	return it.archivePath
}

func (it *unpackedFile) Read() ([]byte, error) {
	return os.ReadFile(it.systemPath)
}

func (it *unpackedFile) Stat() fs.FileInfo {
	res, _ := os.Stat(it.Path())
	return res
}
func (it *unpackedFile) String() string {
	return it.Path()
}

type UnpackArchiveConfig struct {
	// The glob pattern to match files that are inside the root directory.
	GlobPattern string

	// The virtual path to prepend to each entry inside the root directory.
	VirtualPath string

	// Additional files to include in the archive.
	//
	// The key is the archive path and will be prefixed with the virtual path.
	//
	// The value is the system path to the file. Relative paths are assumed
	// to be relative to the root directory.
	FileMap map[string]string
}

type UnpackArchiveOption func(*UnpackArchiveConfig)

func WithVirtualPath(virtualPath string) UnpackArchiveOption {
	return func(c *UnpackArchiveConfig) {
		c.VirtualPath = virtualPath
	}
}

func WithFileMap(fileMap map[string]string) UnpackArchiveOption {
	return func(c *UnpackArchiveConfig) {
		c.FileMap = fileMap
	}
}

func WithConfig(config UnpackArchiveConfig) UnpackArchiveOption {
	return func(c *UnpackArchiveConfig) {
		*c = config
	}
}

func NewUnpackedArchive(rootDir string, options ...UnpackArchiveOption) (Archive, error) {
	if !path.IsAbs(rootDir) {
		rootDir, _ = filepath.Abs(rootDir)
	}
	rootDir = NormalizePath(rootDir)

	fs := &unpackedArchive{
		rootDir: rootDir,
	}
	config := &UnpackArchiveConfig{
		GlobPattern: "**",
	}
	for _, option := range options {
		option(config)
	}

	pattern := path.Join(fs.rootDir, config.GlobPattern)
	files, err := fileglob.Glob(pattern, fileglob.MaybeRootFS)
	if err != nil {
		return nil, err
	}
	for _, file := range files {
		if stat, err := os.Stat(file); err != nil || stat.IsDir() {
			continue
		}

		systemPath, err := filepath.Rel(fs.rootDir, file)
		if err != nil {
			return nil, err
		}
		archivePath := systemPath
		if config.VirtualPath != "" {
			archivePath = path.Join(config.VirtualPath, systemPath)
		}
		systemPath = path.Join(rootDir, systemPath)
		fs.files = append(fs.files, &unpackedFile{
			archive:     fs,
			archivePath: NormalizePath(archivePath),
			systemPath:  NormalizePath(systemPath),
		})
	}
	for archivePath, systemPath := range config.FileMap {
		if config.VirtualPath != "" {
			archivePath = path.Join(config.VirtualPath, archivePath)
		}
		if !filepath.IsAbs(systemPath) {
			systemPath = path.Join(rootDir, systemPath)
		}
		fs.files = append(fs.files, &unpackedFile{
			archive:     fs,
			archivePath: NormalizePath(archivePath),
			systemPath:  NormalizePath(systemPath),
		})
	}
	return fs, nil
}
