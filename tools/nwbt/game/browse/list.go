package browse

import (
	"path"
	"sort"
	"strings"
)

// Filter selects files by type. The zero value selects every type that is not hidden.
type Filter struct {
	// per type index, nil selects every type that is not hidden
	types []bool
}

// NewFilter selects the given type indices. An empty list selects every type that is not hidden.
// Unknown indices are ignored.
func (index *Index) NewFilter(types []int) Filter {
	if len(types) == 0 {
		return Filter{}
	}
	selected := make([]bool, len(index.Types))
	for _, t := range types {
		if t >= 0 && t < len(selected) {
			selected[t] = true
		}
	}
	return Filter{types: selected}
}

func (index *Index) matches(filter Filter, i int) bool {
	t := index.fileType[i]
	if filter.types == nil {
		return !index.Types[t].Hidden
	}
	return filter.types[t]
}

// ListFile is one file of a listing or a search
type ListFile struct {
	Name string `json:"name"`
	Path string `json:"path"`
	Size int64  `json:"size"`
	// index into Index.Types
	Type      int  `json:"type"`
	InCatalog bool `json:"inCatalog"`
}

// ListResult is the content of one folder
type ListResult struct {
	Dir string `json:"dir"`
	// names of the child folders that contain a selected file, sorted
	Dirs []string `json:"dirs"`
	// the selected files directly in the folder, sorted, at most the limit
	Files []ListFile `json:"files"`
	// number of selected files directly in the folder
	Total     int  `json:"total"`
	Truncated bool `json:"truncated"`
}

// List returns the child folders and the files of a folder ("" is the root). Folders are listed
// only if they contain a selected file somewhere below. At most limit files are returned.
func (index *Index) List(dir string, filter Filter, limit int) ListResult {
	dir = strings.Trim(dir, "/")
	prefix := ""
	if dir != "" {
		prefix = dir + "/"
	}
	result := ListResult{Dir: dir, Dirs: []string{}, Files: []ListFile{}}

	lo, hi := index.prefixRange(prefix, 0, len(index.files))
	for i := lo; i < hi; {
		rest := index.files[i].Path()[len(prefix):]
		slash := strings.IndexByte(rest, '/')
		if slash < 0 {
			if index.matches(filter, i) {
				result.Total++
				if len(result.Files) < limit {
					result.Files = append(result.Files, index.listFile(i))
				}
			}
			i++
			continue
		}
		// a child folder: its files are the contiguous block with its prefix
		child := rest[:slash]
		_, end := index.prefixRange(prefix+child+"/", i, hi)
		for j := i; j < end; j++ {
			if index.matches(filter, j) {
				result.Dirs = append(result.Dirs, child)
				break
			}
		}
		i = end
	}
	// path order differs from name order: "x-y/..." sorts before "x/..." but "x" before "x-y"
	sort.Strings(result.Dirs)
	result.Truncated = result.Total > len(result.Files)
	return result
}

// prefixRange is the range of files in [lo, hi) whose path starts with prefix. The files are sorted, so
// they form one block.
func (index *Index) prefixRange(prefix string, lo, hi int) (int, int) {
	files := index.files
	start := lo + sort.Search(hi-lo, func(k int) bool {
		return files[lo+k].Path() >= prefix
	})
	end := start + sort.Search(hi-start, func(k int) bool {
		return !strings.HasPrefix(files[start+k].Path(), prefix)
	})
	return start, end
}

func (index *Index) listFile(i int) ListFile {
	file := index.files[i]
	var size int64
	if stat := file.Stat(); stat != nil {
		size = stat.Size()
	}
	return ListFile{
		Name:      path.Base(file.Path()),
		Path:      file.Path(),
		Size:      size,
		Type:      int(index.fileType[i]),
		InCatalog: index.asset[i] != nil,
	}
}
