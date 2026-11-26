package serve

import (
	"net/http/httptest"
	"net/url"
	"path"
	"strings"
	"testing"
)

func TestGetCacheKey(t *testing.T) {
	short := httptest.NewRequest("GET", "/files/objects/props/chair.cgf.glb?yup=&download=1", nil)
	if got, want := getCacheKey(short), "v4/files/objects/props/chair.cgf"+url.QueryEscape("yup=")+".glb"; got != want {
		t.Errorf("short query: %q, want %q", got, want)
	}

	animations := func(name string) string {
		list := `[{"name":"` + name + `","file":"animations/gameplay/character/npc/supernatural/soulharvester/navigation/` + name + `.caf"}]`
		return "/files/objects/characters/npc/supernatural/lostsoulharvester/lostsoulharvester.cdf.glb?textures=embed&yup=&animations=" + url.QueryEscape(list)
	}
	idle := getCacheKey(httptest.NewRequest("GET", animations("soulharvester_idle"), nil))
	walk := getCacheKey(httptest.NewRequest("GET", animations("soulharvester_walk_f"), nil))
	if name := path.Base(idle); len(name) > maxCacheNameLength || !strings.HasPrefix(name, "lostsoulharvester.cdf~") || !strings.HasSuffix(name, ".glb") {
		t.Errorf("long query: file name %q (%d characters)", name, len(name))
	}
	if idle == walk {
		t.Errorf("different animations share the key %q", idle)
	}
}

func TestDownloadFileName(t *testing.T) {
	cases := map[string]string{
		"/files/objects/props/chair.cgf.glb":                      "chair.glb",
		"/files/objects/textures/x_diff.dds.png":                  "x_diff.png",
		"/files/objects/textures/x_ddna.dds.a.png":                "x_ddna_a.png",
		"/files/objects/textures/x_diff.dds":                      "x_diff.dds",
		"/files/objects/textures/x_ddna.dds.a":                    "x_ddna.dds.a",
		"/files/slices/poi/campfire.dynamicslice.glb":             "campfire.glb",
		"/files/objects/props/chair.mtl":                          "chair.mtl",
		"/files/objects/props/chair.cgf.gltf.zip":                 "chair.gltf.zip",
		"/files/objects/props/chair.cgf.raw.zip":                  "chair.raw.zip",
		"/files/sharedassets/musicsheets/a_hard.musicsheetc.json": "a_hard.json",
		// raw json files and json of other conversions keep their name
		"/files/client.json":                 "client.json",
		"/files/datatables/x.datasheet.json": "x.datasheet.json",
	}
	for in, want := range cases {
		if got := downloadFileName(in); got != want {
			t.Errorf("downloadFileName(%q) = %q, want %q", in, got, want)
		}
	}
}
