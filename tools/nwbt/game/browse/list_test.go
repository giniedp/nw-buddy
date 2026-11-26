package browse

import (
	"nw-buddy/tools/formats/catalog"
	"slices"
	"testing"
)

func listIndex() *Index {
	files := testFiles(
		"readme.txt",
		"a/x.y",
		"a/x/1.json",
		"a/x-y/2.json",
		"a/x0",
		"a/x/deep/3.dds",
		"b/only.dds.1",
		"c/c.json",
		"c/d.json",
		"c/e.json",
	)
	assets := []*catalog.Asset{
		testAsset("a/x/deep/3.dds", catalog.UUIDTexture, 0),
		testAsset("b/only.dds.1", catalog.UUIDTextureMipmap, 1<<16),
	}
	return Build(files, slices.Values(assets))
}

func typeIndex(t *testing.T, index *Index, key string) int {
	t.Helper()
	for i, typ := range index.Types {
		if typ.Key == key {
			return i
		}
	}
	t.Fatalf("type %s not in index", key)
	return -1
}

func names(files []ListFile) []string {
	result := make([]string, len(files))
	for i, f := range files {
		result[i] = f.Name
	}
	return result
}

func TestListRoot(t *testing.T) {
	index := listIndex()
	res := index.List("", Filter{}, 100)
	// b has only a hidden mip part, so it is not listed by default
	if !slices.Equal(res.Dirs, []string{"a", "c"}) {
		t.Errorf("dirs %v", res.Dirs)
	}
	if !slices.Equal(names(res.Files), []string{"readme.txt"}) || res.Total != 1 || res.Truncated {
		t.Errorf("files %v total %d truncated %v", names(res.Files), res.Total, res.Truncated)
	}
}

func TestListFolder(t *testing.T) {
	index := listIndex()
	// trailing and leading slashes are ignored
	res := index.List("/a/", Filter{}, 100)
	if res.Dir != "a" {
		t.Errorf("dir %q", res.Dir)
	}
	// sorted by name, not by path ("a/x-y/" sorts before "a/x/")
	if !slices.Equal(res.Dirs, []string{"x", "x-y"}) {
		t.Errorf("dirs %v", res.Dirs)
	}
	if !slices.Equal(names(res.Files), []string{"x.y", "x0"}) {
		t.Errorf("files %v", names(res.Files))
	}
	nested := index.List("a/x", Filter{}, 100)
	if !slices.Equal(nested.Dirs, []string{"deep"}) || !slices.Equal(names(nested.Files), []string{"1.json"}) {
		t.Errorf("a/x: dirs %v files %v", nested.Dirs, names(nested.Files))
	}
	file := nested.Files[0]
	if file.Path != "a/x/1.json" || file.InCatalog || index.Types[file.Type].Key != "ext:json" {
		t.Errorf("file %+v", file)
	}
}

func TestListFilter(t *testing.T) {
	index := listIndex()
	json := typeIndex(t, index, "ext:json")
	res := index.List("", index.NewFilter([]int{json}), 100)
	// readme.txt is not json, b has no json
	if !slices.Equal(res.Dirs, []string{"a", "c"}) || len(res.Files) != 0 {
		t.Errorf("json: dirs %v files %v", res.Dirs, names(res.Files))
	}
	deep := index.List("a/x", index.NewFilter([]int{json}), 100)
	if !slices.Equal(deep.Dirs, []string{}) {
		t.Errorf("a/x json: dirs %v, deep has no json", deep.Dirs)
	}

	// hidden types are listed when asked for
	hidden := index.List("", index.NewFilter([]int{typeIndex(t, index, catalog.UUIDTextureMipmap)}), 100)
	if !slices.Equal(hidden.Dirs, []string{"b"}) {
		t.Errorf("mipmaps: dirs %v", hidden.Dirs)
	}
}

func TestListLimit(t *testing.T) {
	index := listIndex()
	res := index.List("c", Filter{}, 2)
	if !slices.Equal(names(res.Files), []string{"c.json", "d.json"}) || res.Total != 3 || !res.Truncated {
		t.Errorf("files %v total %d truncated %v", names(res.Files), res.Total, res.Truncated)
	}
}

func TestListMissing(t *testing.T) {
	index := listIndex()
	res := index.List("nope", Filter{}, 100)
	if len(res.Dirs) != 0 || len(res.Files) != 0 || res.Total != 0 {
		t.Errorf("missing folder: %+v", res)
	}
	// a file is not a folder, and a name prefix is not a folder
	if res := index.List("a/x0", Filter{}, 100); len(res.Files) != 0 || len(res.Dirs) != 0 {
		t.Errorf("file as folder: %+v", res)
	}
	if res := index.List("rea", Filter{}, 100); len(res.Files) != 0 || len(res.Dirs) != 0 {
		t.Errorf("name prefix as folder: %+v", res)
	}
}
