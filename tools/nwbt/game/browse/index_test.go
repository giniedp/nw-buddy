package browse

import (
	"io/fs"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/nwfs"
	"slices"
	"testing"
)

type testFile struct {
	path string
}

func (f *testFile) Archive() nwfs.Archive { return nil }
func (f *testFile) Package() string       { return "" }
func (f *testFile) Path() string          { return f.path }
func (f *testFile) Read() ([]byte, error) { return nil, nil }
func (f *testFile) Stat() fs.FileInfo     { return nil }

func testFiles(paths ...string) []nwfs.File {
	files := make([]nwfs.File, len(paths))
	for i, p := range paths {
		files[i] = &testFile{path: p}
	}
	return files
}

func testAsset(file string, typ string, subId uint) *catalog.Asset {
	return &catalog.Asset{
		AssetId: catalog.ToAssetId("11111111-2222-3333-4444-555555555555", subId),
		Type:    typ,
		File:    file,
	}
}

func typeOf(t *testing.T, index *Index, filePath string) *Type {
	t.Helper()
	for i := 0; i < index.Len(); i++ {
		file, typ, _ := index.File(i)
		if file.Path() == filePath {
			return typ
		}
	}
	t.Fatalf("file %s not in index", filePath)
	return nil
}

const unknownUUID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"

func TestBuildTypes(t *testing.T) {
	files := testFiles(
		"textures/b.dds",
		"textures/a.dds",
		"textures/a.dds.1",
		"sounds/x.wem",
		"data/c.json",
		"data/d.foo",
		"data/e.xyz",
		"data/noext",
		"data/twice.xml",
	)
	assets := []*catalog.Asset{
		// catalog paths are not always lowercase
		testAsset("Textures/A.dds", catalog.UUIDTexture, 0),
		testAsset("textures/b.dds", catalog.UUIDTexture, 0),
		testAsset("textures/a.dds.1", catalog.UUIDTextureMipmap, 1<<16),
		// copy job: null type, typed by the extension
		testAsset("sounds/x.wem", catalog.NullUUID, 0),
		testAsset("data/d.foo", unknownUUID, 0),
		// the typed entry wins over the null typed one, in any order
		testAsset("data/twice.xml", catalog.NullUUID, 0),
		testAsset("data/twice.xml", "6eb56b55-1b58-4ee3-a268-27680338ae56", 1),
	}
	index := Build(files, slices.Values(assets))

	if index.Len() != len(files) {
		t.Fatalf("len %d, want %d", index.Len(), len(files))
	}
	// sorted by path
	for i := 1; i < index.Len(); i++ {
		prev, _, _ := index.File(i - 1)
		file, _, _ := index.File(i)
		if prev.Path() > file.Path() {
			t.Errorf("not sorted: %s before %s", prev.Path(), file.Path())
		}
	}

	cases := []struct {
		file   string
		key    string
		label  string
		group  catalog.TypeGroup
		hidden bool
		known  bool
	}{
		{"textures/a.dds", catalog.UUIDTexture, "Texture", catalog.GroupTexture, false, true},
		{"textures/a.dds.1", catalog.UUIDTextureMipmap, "Texture Mipmap", catalog.GroupHidden, true, true},
		{"sounds/x.wem", "ext:wem", "Wwise Audio", catalog.GroupAudio, false, true},
		{"data/c.json", "ext:json", "JSON", catalog.GroupData, false, true},
		{"data/d.foo", unknownUUID, "Unknown *.foo", catalog.GroupOther, false, false},
		{"data/e.xyz", "ext:xyz", "*.xyz", catalog.GroupOther, false, false},
		{"data/noext", "ext:", "(no extension)", catalog.GroupOther, false, false},
		{"data/twice.xml", "6eb56b55-1b58-4ee3-a268-27680338ae56", "Particle Library", catalog.GroupEffects, false, true},
	}
	for _, c := range cases {
		typ := typeOf(t, index, c.file)
		if typ.Key != c.key || typ.Label != c.label || typ.Group != c.group || typ.Hidden != c.hidden || typ.Known != c.known {
			t.Errorf("%s: got %+v, want key=%s label=%s group=%s hidden=%v known=%v",
				c.file, *typ, c.key, c.label, c.group, c.hidden, c.known)
		}
	}

	if typ := typeOf(t, index, "textures/a.dds"); typ.Count != 2 {
		t.Errorf("texture count %d, want 2", typ.Count)
	}
	total := 0
	for _, typ := range index.Types {
		total += typ.Count
	}
	if total != len(files) {
		t.Errorf("type counts sum to %d, want %d", total, len(files))
	}
}

func TestFileAsset(t *testing.T) {
	index := Build(testFiles("a.dds", "b.txt"), slices.Values([]*catalog.Asset{
		testAsset("a.dds", catalog.UUIDTexture, 0),
	}))
	for i := 0; i < index.Len(); i++ {
		file, _, asset := index.File(i)
		if (file.Path() == "a.dds") != (asset != nil) {
			t.Errorf("%s: asset %v", file.Path(), asset)
		}
	}
}

func TestSubId(t *testing.T) {
	sub := uint32(3<<16 | catalog.SubIdAlpha)
	if catalog.SubIdLevel(sub) != 3 || !catalog.SubIdIsAlpha(sub) || catalog.SubIdIsDiff(sub) {
		t.Errorf("sub id %x: level %d alpha %v diff %v", sub, catalog.SubIdLevel(sub), catalog.SubIdIsAlpha(sub), catalog.SubIdIsDiff(sub))
	}
}
