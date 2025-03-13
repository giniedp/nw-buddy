package nwfs

import (
	"bytes"
	"fmt"
	"io/fs"
	"nw-buddy/tools/utils/maps"
	"strings"
	"time"
)

type FS struct {
	Archive
}

func (f *FS) Open(name string) (fs.File, error) {
	name = NormalizePath(name)
	if file, ok := f.Lookup(name); ok {
		return &fsFile{file: file}, nil
	}

	name = strings.TrimSuffix(name, "index.html")
	name = strings.TrimRight(name, "./")
	return &fsDir{f.Archive, name, 0}, nil
}

type fsDir struct {
	archive Archive
	name    string
	index   int
}

func (f *fsDir) Name() string {
	return f.name
}

func (f *fsDir) Size() int64 {
	return 0
}

func (f *fsDir) Mode() fs.FileMode {
	return fs.ModeDir
}

func (f *fsDir) Type() fs.FileMode {
	return fs.ModeDir
}

func (f *fsDir) ModTime() time.Time {
	return time.Time{}
}

func (f *fsDir) IsDir() bool {
	return true
}
func (f *fsDir) Sys() any {
	return nil
}

func (f *fsDir) Stat() (fs.FileInfo, error) {
	return f, nil
}

func (f *fsDir) Info() (fs.FileInfo, error) {
	return f, nil
}

func (f *fsDir) Read(p []byte) (int, error) {
	return 0, fmt.Errorf("not implemented")
}

func (f *fsDir) Close() error {
	return nil
}

func (f *fsDir) ReadDir(n int) ([]fs.DirEntry, error) {

	index := maps.NewDict[fs.DirEntry]()
	index.Store("..", &fsDir{archive: f.archive, name: ".."})

	files, _ := f.archive.List()
	for _, file := range files {
		filePath := file.Path()
		if f.Name() == "" {
			// ok
		} else if strings.HasPrefix(filePath, f.name+"/") {
			filePath = strings.TrimPrefix(filePath, f.name+"/")
		} else {
			continue
		}

		if strings.Contains(filePath, "/") {
			dirname := strings.SplitN(filePath, "/", 2)[0]
			if _, ok := index.Load(dirname); !ok {
				index.Store(dirname, &fsDir{archive: f.archive, name: dirname})
			}
		} else {
			index.Store(file.Path(), &fsFile{
				file: file,
				name: filePath,
			})
		}
	}

	values := index.Values()
	if n <= 0 {
		return values, nil
	}

	result := make([]fs.DirEntry, 0)
	for n > 0 {
		if f.index >= len(values) {
			break
		}
		result = append(result, values[f.index])
		f.index++
		n--
	}
	return result, nil
}

type fsFile struct {
	file File
	name string
	r    *bytes.Reader
}

func (f *fsFile) Name() string {
	return f.name
}

func (f *fsFile) IsDir() bool {
	return false
}

func (f *fsFile) Type() fs.FileMode {
	return fs.ModeIrregular
}

func (f *fsFile) Stat() (fs.FileInfo, error) {
	return f.file.Stat(), nil
}

func (f *fsFile) Info() (fs.FileInfo, error) {
	return f.file.Stat(), nil
}

func (f *fsFile) Read(p []byte) (int, error) {
	if f.r == nil {
		data, err := f.file.Read()
		if err != nil {
			return 0, err
		}
		f.r = bytes.NewReader(data)
	}
	return f.r.Read(p)
}

func (f *fsFile) Close() error {
	if f.r != nil {
		f.r = nil
	}
	return nil
}

func (f *fsFile) Seek(offset int64, whence int) (int64, error) {
	if f.r == nil {
		return 0, fmt.Errorf("file not open")
	}
	return f.r.Seek(offset, whence)
}
