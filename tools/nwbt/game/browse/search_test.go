package browse

import (
	"nw-buddy/tools/formats/catalog"
	"slices"
	"testing"
)

const guidA = "11111111-2222-3333-4444-555555555555"

func searchIndex() *Index {
	files := testFiles(
		"textures/rock.dds",
		"textures/rock.dds.1",
		"textures/rock.dds.2",
		"textures/rock.dds.a",
		"textures/rock.dds.1a",
		"textures/rock.dds.meta",
		"textures/rock_ddn.dds",
		"objects/rock.cgf",
		"objects/tree.cgf",
	)
	tree := testAsset("objects/tree.cgf", "c2869e3b-dda0-4e01-8fe3-6770d788866b", 0)
	tree.Guid = "99999999-8888-7777-6666-555555555555"
	assets := []*catalog.Asset{
		testAsset("textures/rock.dds", catalog.UUIDTexture, 0),
		// the sub id says mip 2, the name says 1: the catalog wins
		testAsset("textures/rock.dds.1", catalog.UUIDTextureMipmap, 2<<16),
		testAsset("textures/rock.dds.2", catalog.UUIDTextureMipmap, 2<<16),
		testAsset("textures/rock.dds.1a", catalog.UUIDTextureMipmap, 1<<16|catalog.SubIdAlpha),
		tree,
	}
	return Build(files, slices.Values(assets))
}

func TestLookup(t *testing.T) {
	index := searchIndex()
	if _, ok := index.Lookup("textures/rock.dds"); !ok {
		t.Error("rock.dds not found")
	}
	if _, ok := index.Lookup("textures/rock"); ok {
		t.Error("a prefix is not a file")
	}
}

func TestSearchPath(t *testing.T) {
	index := searchIndex()
	res := index.Search("  ROCK ", Filter{}, 100)
	// the hidden mip parts are not selected by default, `.dds.a` is a full texture
	want := []string{"objects/rock.cgf", "textures/rock.dds", "textures/rock.dds.a", "textures/rock.dds.meta", "textures/rock_ddn.dds"}
	got := []string{}
	for _, f := range res.Files {
		got = append(got, f.Path)
	}
	if !slices.Equal(got, want) || res.Total != len(want) || res.Query != "rock" {
		t.Errorf("got %v (total %d, query %q), want %v", got, res.Total, res.Query, want)
	}

	limited := index.Search("rock", Filter{}, 2)
	if len(limited.Files) != 2 || limited.Total != len(want) {
		t.Errorf("limit: %d files, total %d", len(limited.Files), limited.Total)
	}
	if empty := index.Search("  ", Filter{}, 100); len(empty.Files) != 0 || empty.Total != 0 {
		t.Errorf("empty query: %+v", empty)
	}
}

func TestSearchAssetId(t *testing.T) {
	index := searchIndex()
	res := index.Search("{99999999-8888-7777-6666-555555555555}:1a", Filter{}, 100)
	if len(res.Files) != 1 || res.Files[0].Path != "objects/tree.cgf" {
		t.Errorf("asset id: %+v", res.Files)
	}
}

func TestStatDdsParts(t *testing.T) {
	index := searchIndex()
	stat, ok := index.Stat("textures/rock.dds")
	if !ok {
		t.Fatal("not found")
	}
	if stat.Catalog == nil || stat.Catalog.Type != catalog.UUIDTexture || stat.Catalog.Guid != guidA {
		t.Errorf("catalog %+v", stat.Catalog)
	}
	want := []DdsPart{
		{Path: "textures/rock.dds.1", Mip: 2, Alpha: false},
		{Path: "textures/rock.dds.1a", Mip: 1, Alpha: true},
		{Path: "textures/rock.dds.2", Mip: 2, Alpha: false},
		{Path: "textures/rock.dds.a", Mip: 0, Alpha: true},
	}
	if !slices.Equal(stat.Parts, want) {
		t.Errorf("parts %+v, want %+v", stat.Parts, want)
	}

	// rock_ddn.dds shares the name prefix but is no part
	other, _ := index.Stat("textures/rock_ddn.dds")
	if len(other.Parts) != 0 || other.Catalog != nil {
		t.Errorf("rock_ddn: %+v", other)
	}
	if _, ok := index.Stat("textures/nope.dds"); ok {
		t.Error("missing file found")
	}
}
