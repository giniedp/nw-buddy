package nwfs

import (
	"fmt"
	"io/fs"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/str"
	"strings"
	"sync"
)

type Archive interface {
	List(matcher ...func(string) bool) ([]File, error)
	Glob(patterns ...string) ([]File, error)
	Match(patterns ...string) ([]File, error)
	ReadFile(path string) ([]byte, error)
	Lookup(path string) (File, bool)
	LookupBySuffix(suffix string) (File, bool)
}

type File interface {
	Archive() Archive
	Package() string
	Path() string
	Read() ([]byte, error)
	Stat() fs.FileInfo
}

// baseFS is read-only once constructed: `files` is filled by the archive constructors only.
// The lazily built lookup index and glob cache are initialized once, so all methods are safe for
// concurrent use without locking (a re-entrant RWMutex here deadlocked under concurrent first use).
type baseFS struct {
	files      []File
	index      map[string]File
	indexOnce  sync.Once
	sa         *str.SuffixArray
	globChache *maps.SafeMap[string, []File]
	globOnce   sync.Once
}

func (d *baseFS) initSuffix() {
	files := make([]string, len(d.files))
	for i, entry := range d.files {
		files[i] = entry.Path()
	}
	d.sa = str.NewSuffixArray(files)
}

func (d *baseFS) Lookup(path string) (File, bool) {
	d.indexOnce.Do(func() {
		index := make(map[string]File, len(d.files))
		for _, entry := range d.files {
			index[entry.Path()] = entry
		}
		d.index = index
	})
	if entry, ok := d.index[NormalizePath(path)]; ok {
		return entry, true
	}
	return nil, false
}

func (d *baseFS) LookupBySuffix(suffix string) (File, bool) {
	res, ok := d.sa.Lookup(suffix)
	if ok {
		return d.Lookup(res)
	}
	return nil, false
}
func (d *baseFS) ReadFile(path string) ([]byte, error) {
	if entry, ok := d.Lookup(path); ok {
		return entry.Read()
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
	d.globOnce.Do(func() {
		d.globChache = maps.NewSafeMap[string, []File]()
	})
	key := strings.Join(patterns, ",")
	if cached, ok := d.globChache.Load(key); ok {
		return cached, nil
	}
	if match, err := CompileGlob(patterns...); err != nil {
		return nil, err
	} else {
		result, err := d.list(match)
		d.globChache.Store(key, result)
		return result, err
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

func NormalizePath(filePath string) string {
	filePath = strings.TrimSpace(filePath)
	filePath = strings.ToLower(filePath)
	filePath = strings.ReplaceAll(filePath, "\\", "/")
	for strings.Contains(filePath, "//") {
		filePath = strings.ReplaceAll(filePath, "//", "/")
	}
	filePath = strings.TrimPrefix(filePath, "/")
	return filePath
}
