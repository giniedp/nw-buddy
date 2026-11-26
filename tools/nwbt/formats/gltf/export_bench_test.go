package gltf_test

// Export benchmark and baseline writer on real game data.
//
// Needs the packed game (NW_GAME / NW_GAME_LIVE); skips otherwise.
//
//	go test ./formats/gltf -run XXX -bench BenchmarkExportGeometry -benchmem
//	GLTF_SAMPLES=<cgf-sample.json> adds the geometry parity sample (map of category → model paths)
//	GLTF_BASELINE_OUT=<dir> go test ./formats/gltf -run TestExportBaseline writes <dir>/<name>.<yup|zup>.glb

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/formats/gltf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/game"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/math"
	"os"
	"path"
	"sort"
	"strings"
	"sync"
	"testing"
)

type exportSample struct {
	Model    string
	Material string
}

// sample models (cdf, caf and slices are checked through the server)
var exportSamples = []exportSample{
	{"objects/crafting/architecture/crafting_structures/baseframe/jav_struc_craft_t1_pavilion_abc.cgf", ""},
	{"objects/climax/models/ships/climax_merchant_ship_wreck_backmast.cgf", "objects/climax/models/ships/climax_merchantship_altcolour_matgroup.mtl"},
	{"objects/climax/models/ships/climax_merchant_ship_wreck_rear_altcolour.cgf", ""},
	{"objects/crafting/architecture/living_structures/dunwood/crypt/dunwood_crypt_stonewall_4800x6000_b.cgf", ""},
	{"objects/characters/player/mounts/mountattach/sextant/sextant.cgf", ""},
	{"objects/crafting/architecture/living_structures/dunwood/living/dunwood_living_ceiling_600x600_b.cgf", ""},
	{"objects/climax/models/vegetation/ftue_msh_widgeongrass_a_group.cgf", "objects/climax/models/vegetation/ftue_watergrass_matgroup.mtl"},
	{"objects/crafting/architecture/basilica_structures/basilica_rosewindow_a.cgf", "objects/crafting/architecture/basilica_structures/basilica_rosewindow_mat.mtl"},
	{"objects/crafting/architecture/defensive_structures/marauder/marauder_floor_logo.cgf", "objects/crafting/architecture/defensive_structures/marauder/maruader_stonework_emblem.mtl"},
	{"objects/climax/models/trees/ftue_fst_poplartree_dead_b.cgf", "objects/climax/models/trees/jav_fst_poplartree_dead_a_mat.mtl"},
	{"objects/crafting/props/props_firstlight/elemental_pylons/fl_prp_frost_pylon_a.cgf", "objects/crafting/props/props_firstlight/elemental_pylons/fl_prp_frost_pylon_mat.mtl"},
	{"objects/vfx/mesh/fx_fogcard_02.cgf", "objects/volumetrics/fogsheet_ghost_close_mat.mtl"},
	{"objects/characters/player/male/dynasty_spearman/male_dynasty_spearman_chest.skin", "objects/characters/player/male/dynasty_spearman/male_dynasty_spearman_chest_matgroup.mtl"},
	{"objects/characters/player/female/naked_american_south/female_naked_head_american_south.skin", "objects/characters/player/female/naked_american_south/female_naked_head_american_south_d1_matgroup.mtl"},
	{"objects/characters/player/female/occultist/female_occultist_helmet.skin", "objects/characters/player/female/occultist/female_occultist_helmet_matgroup.mtl"},
	{"objects/characters/player/male/clotht4/male_clotht4_helmet_mesh.cgf", ""},
}

var exportAssets = sync.OnceValues(func() (*game.Assets, error) {
	dir := env.GameDir()
	if dir == "" {
		return nil, fmt.Errorf("NW_GAME is not set")
	}
	return game.InitPackedAssets(dir)
})

type loadedSample struct {
	name  string
	asset importer.GeometryAsset
	file  *cgf.File
	heap  []byte
	mtls  []mtl.Material
}

var exportSamplesLoaded []loadedSample
var exportSamplesOnce sync.Once

func loadExportSamples(tb testing.TB) []loadedSample {
	assets, err := exportAssets()
	if err != nil {
		tb.Skip(err)
	}
	exportSamplesOnce.Do(func() {
		// missing textures are expected (no image loader), keep the benchmark output readable
		slog.SetDefault(slog.New(slog.NewTextHandler(io.Discard, nil)))
		samples := append([]exportSample{}, exportSamples...)
		if file := os.Getenv("GLTF_SAMPLES"); file != "" {
			samples = append(samples, readSampleJson(tb, file)...)
		}
		seen := map[string]bool{}
		for _, s := range samples {
			model, material := assets.ResolveCgfAndMtl(s.Model, s.Material)
			if model == "" || seen[model+"#"+material] {
				continue
			}
			seen[model+"#"+material] = true
			asset := importer.GeometryAsset{GeometryFile: model, MaterialFile: material}
			file, heap, mtls := assets.LoadAsset(asset)
			if file == nil {
				tb.Logf("sample not loaded: %s", s.Model)
				continue
			}
			exportSamplesLoaded = append(exportSamplesLoaded, loadedSample{
				name:  sampleName(model),
				asset: asset,
				file:  file,
				heap:  heap,
				mtls:  mtls,
			})
		}
	})
	return exportSamplesLoaded
}

func readSampleJson(tb testing.TB, file string) []exportSample {
	data, err := os.ReadFile(file)
	if err != nil {
		tb.Fatal(err)
	}
	groups := map[string][]string{}
	if err := json.Unmarshal(data, &groups); err != nil {
		tb.Fatal(err)
	}
	keys := make([]string, 0, len(groups))
	for k := range groups {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	result := []exportSample{}
	for _, k := range keys {
		for _, model := range groups[k] {
			result = append(result, exportSample{Model: model})
		}
	}
	return result
}

func sampleName(model string) string {
	return strings.TrimSuffix(path.Base(model), path.Ext(model)) + path.Ext(model)
}

// GLTF_QUANTIZE=1 exports normals and tangents as snorm16 (KHR_mesh_quantization)
var exportQuantize = os.Getenv("GLTF_QUANTIZE") == "1"

// exportSampleGlb runs the geometry import and encodes a glb. No image loader: materials carry no textures.
func exportSampleGlb(s loadedSample, yup bool, w *countWriter) error {
	doc := gltf.NewDocument()
	doc.Options = gltf.ImportOptions{
		Quantize: exportQuantize,
		Base:     math.GetBase(yup),
		LoadGeometry: func(importer.GeometryAsset) (*cgf.File, []byte, []mtl.Material) {
			return s.file, s.heap, s.mtls
		},
		SkipLod:    true,
		SkipHelper: true,
		// the baseline has the NoDraw subsets, keep them for the geometry parity
		KeepNoDraw: true,
	}
	doc.ImportAssetGeometry(s.asset)
	doc.ProcessMaterials()
	return doc.Encode(w, true)
}

type countWriter struct {
	n    int64
	data []byte
	keep bool
}

func (w *countWriter) Write(p []byte) (int, error) {
	w.n += int64(len(p))
	if w.keep {
		w.data = append(w.data, p...)
	}
	return len(p), nil
}

func BenchmarkExportGeometry(b *testing.B) {
	samples := loadExportSamples(b)
	for _, s := range samples {
		b.Run(s.name, func(b *testing.B) {
			b.ReportAllocs()
			b.ResetTimer()
			var size int64
			for i := 0; i < b.N; i++ {
				w := &countWriter{}
				if err := exportSampleGlb(s, true, w); err != nil {
					b.Fatal(err)
				}
				size = w.n
			}
			b.ReportMetric(float64(size), "glb-bytes")
		})
	}
}

// BenchmarkExportGeometryAll exports all samples per op, the single number to compare old and new
func BenchmarkExportGeometryAll(b *testing.B) {
	samples := loadExportSamples(b)
	b.ReportAllocs()
	b.ResetTimer()
	var size int64
	for i := 0; i < b.N; i++ {
		size = 0
		for _, s := range samples {
			w := &countWriter{}
			if err := exportSampleGlb(s, true, w); err != nil {
				b.Fatal(err)
			}
			size += w.n
		}
	}
	b.ReportMetric(float64(size), "glb-bytes")
	b.ReportMetric(float64(len(samples)), "files")
}

// TestExportBaselineTextured writes self-contained glbs (png textures embedded, old material defaults of the
// server) for the Babylon sandbox: GLTF_BASELINE_OUT=<dir> go test ./formats/gltf -run TestExportBaselineTextured
func TestExportBaselineTextured(t *testing.T) {
	out := os.Getenv("GLTF_BASELINE_OUT")
	if out == "" {
		t.Skip("GLTF_BASELINE_OUT is not set")
	}
	assets, err := exportAssets()
	if err != nil {
		t.Skip(err)
	}
	samples := loadExportSamples(t)
	if err := os.MkdirAll(out, os.ModePerm); err != nil {
		t.Fatal(err)
	}
	for _, s := range samples {
		doc := gltf.NewDocument()
		doc.ImageLoader = image.LoaderWithConverter{
			Archive: assets.Archive,
			Catalog: assets.Catalog,
			Converter: image.BasicConverter{
				Format:  image.FormatPNG,
				MaxSize: 1024,
			},
		}
		doc.Options = gltf.ImportOptions{
			Quantize: exportQuantize,
			Base:     math.GetBase(true),
			LoadGeometry: func(importer.GeometryAsset) (*cgf.File, []byte, []mtl.Material) {
				return s.file, s.heap, s.mtls
			},
			SkipLod:    true,
			SkipHelper: true,
		}
		doc.ImportAssetGeometry(s.asset)
		// bake like the downloads: roughness and emissive need pixels
		doc.ProcessMaterials(gltf.WithTextureBaking(true))
		w := &countWriter{keep: true}
		if err := doc.Encode(w, true); err != nil {
			t.Errorf("%s: %v", s.name, err)
			continue
		}
		if err := os.WriteFile(path.Join(out, s.name+".tex.glb"), w.data, 0o644); err != nil {
			t.Fatal(err)
		}
	}
	t.Logf("%d textured samples written to %s", len(samples), out)
}

func TestExportBaseline(t *testing.T) {
	out := os.Getenv("GLTF_BASELINE_OUT")
	if out == "" {
		t.Skip("GLTF_BASELINE_OUT is not set")
	}
	samples := loadExportSamples(t)
	if err := os.MkdirAll(out, os.ModePerm); err != nil {
		t.Fatal(err)
	}
	for _, s := range samples {
		for _, yup := range []bool{true, false} {
			suffix := ".zup.glb"
			if yup {
				suffix = ".yup.glb"
			}
			w := &countWriter{keep: true}
			if err := exportSampleGlb(s, yup, w); err != nil {
				t.Errorf("%s: %v", s.name, err)
				continue
			}
			if err := os.WriteFile(path.Join(out, s.name+suffix), w.data, 0o644); err != nil {
				t.Fatal(err)
			}
		}
	}
	t.Logf("%d samples written to %s", len(samples), out)
}
