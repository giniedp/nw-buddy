package chrparams

import (
	"encoding/xml"
	"log/slog"
	"nw-buddy/tools/formats/adb"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/maps"
	"path"
	"slices"
	"strings"
)

type Document struct {
	XMLName         xml.Name          `xml:"Params" json:"-"`
	AnimationList   AnimationList     `xml:"AnimationList"`
	BBoxIncludeList []BBoxIncludeList `xml:"BBoxIncludeList"`
}

type AnimationList struct {
	XMLName   xml.Name    `xml:"AnimationList" json:"-"`
	Animation []Animation `xml:"Animation"`
}

type Model struct {
	XMLName xml.Name `xml:"Model" json:"-"`
	File    string   `xml:"File,attr"`
}

type Animation struct {
	XMLName xml.Name `xml:"Animation" json:"-"`
	Name    string   `xml:"name,attr"`
	Path    string   `xml:"path,attr"`
}

type Joint struct {
	XMLName xml.Name `xml:"Joint" json:"-"`
	Name    string   `xml:"name,attr"`
}

type BBoxIncludeList struct {
	XMLName xml.Name `xml:"BBoxIncludeList" json:"-"`
	Joints  []Joint  `xml:"Joint"`
}

func Load(file nwfs.File) (*Document, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

func Parse(data []byte) (*Document, error) {
	var document Document
	err := xml.Unmarshal(data, &document)
	return &document, err
}

func (it *Document) AnimationGlobPaths() []string {
	result := make([]string, 0)
	var filepath string
	for _, anim := range it.AnimationList.Animation {
		if anim.Name == "#filepath" {
			filepath = anim.Path
			continue
		}
		if filepath == "" {
			continue
		}
		extname := strings.ToLower(path.Ext(anim.Path))
		if extname == ".caf" || extname == ".bspace" || extname == ".comb" {
			result = append(result, strings.ToLower(path.Join(filepath, anim.Path)))
		}
	}
	return result
}

func (it *Document) AnimationIncludePaths() []string {
	result := make([]string, 0)
	for _, anim := range it.AnimationList.Animation {
		if anim.Name == "$Include" {
			result = append(result, anim.Path)
		}
	}
	return result
}

// LoadAnimationList resolves the animations of a skeleton's animation list, as the game builds its animation set:
//
//   - lists in reverse dependency order: a list comes before the lists it includes, a list met again adds nothing
//   - per list: its single entries in order, then the files its wildcard entries match, entry by entry
//     (sorted by path, the game scans folders in directory order)
//   - an animation is named after the file's stem, the first file with a stem keeps it
func (it *Document) LoadAnimationList(archive nwfs.Archive) ([]adb.AnimationFile, error) {
	result := make([]adb.AnimationFile, 0)
	names := maps.NewDict[bool]()
	add := func(file nwfs.File) {
		filePath := file.Path()
		var fileType adb.AnimationFileType
		switch strings.ToLower(path.Ext(filePath)) {
		case ".caf":
			fileType = adb.Caf
		case ".bspace":
			fileType = adb.Bspace
		case ".comb":
			fileType = adb.Comb
		default:
			return
		}
		name := utils.ReplaceExt(path.Base(filePath), "")
		key := strings.ToLower(name)
		if names.Has(key) {
			return
		}
		names.Store(key, true)
		result = append(result, adb.AnimationFile{
			Name: name,
			File: filePath,
			Type: fileType,
		})
	}

	for _, doc := range it.animationLists(archive) {
		patterns := doc.AnimationGlobPaths()
		for _, pattern := range patterns {
			if isWildcard(pattern) {
				continue
			}
			if file, ok := archive.Lookup(pattern); ok {
				add(file)
			}
		}
		wildcards := make([]string, 0, len(patterns))
		matchers := make([]func(string) bool, 0, len(patterns))
		for _, pattern := range patterns {
			if !isWildcard(pattern) {
				continue
			}
			match, err := compileAnimationPattern(pattern)
			if err != nil {
				slog.Warn("invalid animation pattern", "pattern", pattern, "err", err)
				continue
			}
			wildcards = append(wildcards, pattern)
			matchers = append(matchers, match)
		}
		if len(wildcards) == 0 {
			continue
		}
		// every animation file of the archive (one archive pass, cached by the archive), then each file goes to the
		// first entry that matches it
		files, err := archive.Glob(animationFilePatterns...)
		if err != nil {
			slog.Warn("failed to glob animation files", "err", err)
			continue
		}
		byEntry := make([][]nwfs.File, len(wildcards))
		for _, file := range files {
			filePath := file.Path()
			for i, match := range matchers {
				if match(filePath) {
					byEntry[i] = append(byEntry[i], file)
					break
				}
			}
		}
		for _, entryFiles := range byEntry {
			slices.SortFunc(entryFiles, func(a, b nwfs.File) int {
				return strings.Compare(strings.ToLower(a.Path()), strings.ToLower(b.Path()))
			})
			for _, file := range entryFiles {
				add(file)
			}
		}
	}
	return result, nil
}

// animationLists returns this list and the lists it includes in the order the game adds their animations:
// the reverse of a dependency first walk, so each list comes before the lists it includes
func (it *Document) animationLists(archive nwfs.Archive) []*Document {
	visited := maps.NewDict[bool]()
	postOrder := make([]*Document, 0)
	var walk func(doc *Document)
	walk = func(doc *Document) {
		for _, filePath := range doc.AnimationIncludePaths() {
			filePath = nwfs.NormalizePath(filePath)
			if visited.Has(filePath) {
				continue
			}
			visited.Store(filePath, true)
			file, ok := archive.Lookup(filePath)
			if !ok {
				slog.Warn("Animation include not found", "file", filePath)
				continue
			}
			included, err := Load(file)
			if err != nil {
				slog.Warn("Animation include not loaded", "file", filePath, "err", err)
				continue
			}
			walk(included)
		}
		postOrder = append(postOrder, doc)
	}
	walk(it)
	slices.Reverse(postOrder)
	return postOrder
}

// AnimEventDatabase is the `$AnimEventDatabase` (.animevents) of the skeleton: the first one in the order the game
// reads the lists (see LoadAnimationList), empty without one
func (it *Document) AnimEventDatabase(archive nwfs.Archive) string {
	for _, doc := range it.animationLists(archive) {
		for _, anim := range doc.AnimationList.Animation {
			if strings.EqualFold(anim.Name, "$AnimEventDatabase") && anim.Path != "" {
				return nwfs.NormalizePath(anim.Path)
			}
		}
	}
	return ""
}

// animationFilePatterns match every file an animation list can name
var animationFilePatterns = []string{"**.caf", "**.bspace", "**.comb"}

// compileAnimationPattern matches files like the game expands a wildcard entry (LY ParamLoader.cpp, "expand
// wildcards"): with a wildcard in the folder part, every file in the folder before the first wildcard or in any folder
// below it matches by its file name alone, e.g. `turkey/*/*.caf` takes `turkey/a.caf` and `turkey/x/y/b.caf`. Without
// one, the file must be in that folder. Patterns and paths are lower case.
func compileAnimationPattern(pattern string) (func(string) bool, error) {
	dir, file := path.Split(pattern)
	first := strings.IndexAny(pattern, "*?")
	if first < 0 || first >= len(dir) {
		return nwfs.CompileGlob(pattern)
	}
	matchFile, err := nwfs.CompileGlob(file)
	if err != nil {
		return nil, err
	}
	prefix := pattern[:first]
	return func(filePath string) bool {
		fileDir, fileName := path.Split(filePath)
		return len(fileDir) >= len(prefix) && strings.HasPrefix(fileDir, prefix) && matchFile(fileName)
	}, nil
}

func isWildcard(pattern string) bool {
	return strings.ContainsAny(pattern, "*?")
}
