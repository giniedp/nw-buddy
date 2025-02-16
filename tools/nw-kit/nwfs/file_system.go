package nwfs

import (
	"fmt"
	"strings"
)

type FileSystem interface {
	List(matcher ...func(string) bool) ([]File, error)
	Glob(patterns ...string) ([]File, error)
	Match(patterns ...string) ([]File, error)
	ReadFile(path string) ([]byte, error)
}

type File interface {
	FS() FileSystem
	Package() string
	Path() string
	Read() ([]byte, error)
}

type baseFS struct {
	files []File
}

func (d *baseFS) ReadFile(path string) ([]byte, error) {
	for _, entry := range d.files {
		if entry.Path() == path {
			return entry.Read()
		}
	}
	return nil, fmt.Errorf("file not found")
}

func (d *baseFS) List(match ...func(string) bool) ([]File, error) {
	switch len(match) {
	case 0:
		return d.files, nil
	case 1:
		return d.list(match[0])
	default:
		return nil, fmt.Errorf("only one matcher is supported")
	}
}

func (d *baseFS) Glob(patterns ...string) (result []File, err error) {
	if match, err := CompileGlob(patterns...); err != nil {
		return nil, err
	} else {
		return d.list(match)
	}
}

func (d *baseFS) Match(patterns ...string) (result []File, err error) {
	if match, err := CompileRegexp(patterns...); err != nil {
		return nil, err
	} else {
		return d.list(match)
	}
}

func (d *baseFS) list(match func(string) bool) (result []File, err error) {
	result = make([]File, 0)
	for _, entry := range d.files {
		if match(entry.Path()) {
			result = append(result, entry)
		}
	}
	return result, nil
}

func NormalizePath(path string) string {
	return strings.ReplaceAll(path, "\\", "/")
}
