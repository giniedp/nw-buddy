package inspect

import (
	"fmt"
	"io"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"path/filepath"
	"regexp"
	"strings"
)

type CgfInspector struct {
	count int
	files map[string]*CgfFileInfo
}

type CgfFileInfo struct {
	file        string
	lodFiles    []string
	nodeNames   []string
	mtlNames    []string
	dollarNames []string
	shadowproxy bool
}

func baseNameWithoutExt(path string) string {
	base := filepath.Base(path)
	return strings.TrimSuffix(base, filepath.Ext(base))
}

var lodRegex = regexp.MustCompile(`_lod\d+(\.[^.]+)?$`)

func hasLodSuffix(name string) bool {
	return lodRegex.MatchString(name)
}

func stripLod(name string) string {
	return lodRegex.ReplaceAllString(name, "$1")
}

func (it *CgfInspector) Inspect(assets *game.Assets, file nwfs.File) {
	it.count += 1
	f, err := cgf.Load(file)
	if err != nil {
		return
	}

	if it.files == nil {
		it.files = make(map[string]*CgfFileInfo)
	}

	isLOD := false
	parentFile := file.Path()
	if hasLodSuffix(file.Path()) {
		parentFile = stripLod(file.Path())
		isLOD = true
	}

	if _, exists := it.files[parentFile]; !exists {
		it.files[parentFile] = &CgfFileInfo{
			file:     parentFile,
			lodFiles: []string{},
		}
	}
	info := it.files[parentFile]
	if isLOD {
		info.lodFiles = append(info.lodFiles, file.Path())
	}

	nodes := cgf.SelectChunks[cgf.ChunkNode](f)

	for i := range nodes {
		if strings.Contains(nodes[i].Name, "$") {
			info.dollarNames = append(info.dollarNames, nodes[i].Name)
		}
		if strings.Contains(strings.ToLower(nodes[i].Name), "shadowproxy") {
			info.shadowproxy = true
		}
		info.nodeNames = append(info.nodeNames, nodes[i].Name)
	}
}

func (it *CgfInspector) Print(w io.Writer) {

	for _, info := range it.files {
		// if len(info.dollarNames) > 0 {
		fmt.Fprintf(w, "File: %s\n", info.file)
		for _, lod := range info.lodFiles {
			fmt.Fprintf(w, "  LOD: %s\n", lod)
		}
		// for _, name := range info.dollarNames {
		// 	fmt.Fprintf(w, "  $ Name: %s\n", name)
		// }
		for _, name := range info.nodeNames {
			fmt.Fprintf(w, "  Name: %s\n", name)
		}
		// }
	}

}
