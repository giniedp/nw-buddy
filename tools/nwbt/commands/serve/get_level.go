package serve

import (
	"net/http"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/level"
	"nw-buddy/tools/nwfs"
	"sync"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func LevelsRouter(r *mux.Router, assets *game.Assets) {
	r.HandleFunc("/list.json", getLevelsListFunc(assets))
	r.HandleFunc("/{coatlicue}/info.json", getLevelInfoFunc(assets))
	r.HandleFunc("/{coatlicue}/{region}/info.json", getRegionInfoFunc(assets))
	r.HandleFunc("/{coatlicue}/{region}/capitals.json", getRegionCapitalsFunc(assets))
	r.HandleFunc("/{coatlicue}/{region}/heightmap.r16", getRegionHeightmap(assets))
	r.HandleFunc("/{coatlicue}/{region}/watermap.r16", getRegionWatermap(assets))
	r.Handle("/{coatlicue}/{region}/distribution.json", handlers.CompressHandler(getRegionDistribution(assets)))
	r.Handle("/{coatlicue}/{region}/distribution.bin", handlers.CompressHandler(getRegionDistributionData(assets)))
	r.Handle("/{coatlicue}/{region}/vegetation.json", handlers.CompressHandler(getRegionVegetation(assets)))
	r.HandleFunc("/{coatlicue}/{region}/vegetation.bin", getRegionVegetationData(assets))
}

func getLevelsListFunc(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		serveJson(level.ListLevelIndex(assets), w)
	}
}

func getLevelInfoFunc(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		coatName := nwfs.NormalizePath(vars["coatlicue"])

		dir := level.NewCoatlicueDirectory(coatName)
		if !dir.Exists(assets) {
			http.NotFound(w, r)
			return
		}

		result := dir.LoadInfo(assets)
		if result == nil {
			http.NotFound(w, r)
			return
		}

		serveJson(result, w)
	}
}

func getRegionInfoFunc(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		coatName := nwfs.NormalizePath(vars["coatlicue"])
		regionName := nwfs.NormalizePath(vars["region"])
		directory := level.NewRegionDirectory(coatName, regionName)

		result := directory.LoadRegionInfo(assets)
		if result == nil {
			http.NotFound(w, r)
			return
		}

		serveJson(result, w)
	}
}

func getRegionHeightmap(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		coatName := nwfs.NormalizePath(vars["coatlicue"])
		regionName := nwfs.NormalizePath(vars["region"])
		directory := level.NewRegionDirectory(coatName, regionName)

		heightmap := directory.LoadHeightMap(assets)
		if heightmap == nil {
			http.NotFound(w, r)
			return
		}

		result := heightmap.ToFloat16Bytes()
		if result == nil {
			http.NotFound(w, r)
			return
		}

		serveContent(result, w, "application/octet-stream")
	}
}

func getRegionWatermap(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		coatName := nwfs.NormalizePath(vars["coatlicue"])
		regionName := nwfs.NormalizePath(vars["region"])
		directory := level.NewRegionDirectory(coatName, regionName)

		watermap := directory.LoadWaterMap(assets)
		if watermap == nil {
			http.NotFound(w, r)
			return
		}

		result := watermap.ToFloat16Bytes()
		if result == nil {
			http.NotFound(w, r)
			return
		}

		serveContent(result, w, "application/octet-stream")
	}
}

func getRegionCapitalsFunc(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		coatName := nwfs.NormalizePath(vars["coatlicue"])
		regionName := nwfs.NormalizePath(vars["region"])
		directory := level.NewRegionDirectory(coatName, regionName)

		result := directory.LoadRuntimeCapitals(assets)
		if result == nil {
			http.NotFound(w, r)
			return
		}

		serveJson(result, w)
	}
}

type distributionCacheEntry struct {
	once   sync.Once
	header *level.RegionDistributionData
	data   []byte
}

var distributionCache sync.Map

func loadRegionDistribution(assets *game.Assets, r *http.Request) *distributionCacheEntry {
	vars := mux.Vars(r)
	coatName := nwfs.NormalizePath(vars["coatlicue"])
	regionName := nwfs.NormalizePath(vars["region"])

	value, _ := distributionCache.LoadOrStore(coatName+"/"+regionName, &distributionCacheEntry{})
	entry := value.(*distributionCacheEntry)
	entry.once.Do(func() {
		directory := level.NewRegionDirectory(coatName, regionName)
		entry.header, entry.data = directory.LoadDistribution(assets)
	})
	return entry
}

func getRegionDistribution(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		entry := loadRegionDistribution(assets, r)
		if entry.header == nil {
			http.NotFound(w, r)
			return
		}
		serveJson(entry.header, w)
	}
}

func getRegionDistributionData(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		entry := loadRegionDistribution(assets, r)
		if entry.header == nil {
			http.NotFound(w, r)
			return
		}
		serveContent(entry.data, w, "application/octet-stream")
	}
}

var vegetationCache sync.Map

type vegetationCacheEntry struct {
	once sync.Once
	data *level.RegionVegetationData
}

// getRegionVegetation serves the header and the resolved asset table of the region.vegetation file
func getRegionVegetation(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		coatName := nwfs.NormalizePath(vars["coatlicue"])
		regionName := nwfs.NormalizePath(vars["region"])
		value, _ := vegetationCache.LoadOrStore(coatName+"/"+regionName, &vegetationCacheEntry{})
		entry := value.(*vegetationCacheEntry)
		entry.once.Do(func() {
			directory := level.NewRegionDirectory(coatName, regionName)
			entry.data = directory.LoadVegetation(assets)
		})
		if entry.data == nil {
			http.NotFound(w, r)
			return
		}
		serveJson(entry.data, w)
	}
}

// getRegionVegetationData serves the original region.vegetation file
func getRegionVegetationData(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		coatName := nwfs.NormalizePath(vars["coatlicue"])
		regionName := nwfs.NormalizePath(vars["region"])
		directory := level.NewRegionDirectory(coatName, regionName)
		file, ok := assets.Archive.Lookup(directory.PathVegetationmapFile())
		if !ok {
			http.NotFound(w, r)
			return
		}
		data, err := file.Read()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		serveContent(data, w, "application/octet-stream")
	}
}
