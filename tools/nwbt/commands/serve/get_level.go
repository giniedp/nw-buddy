package serve

import (
	"bytes"
	"image/png"
	"net/http"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/level"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/json"
	"strconv"

	"github.com/gorilla/mux"
)

func LevelsRouter(r *mux.Router, assets *game.Assets) {
	levels := level.NewCollectionLoader(assets)

	r.HandleFunc("", GetLevelNamesFunc(assets))
	r.HandleFunc("/{level}", getLevelInfoFunc(levels))
	r.HandleFunc("/{level}/mission", getLevelMissionEntitiesFunc(levels))

	r.HandleFunc("/{level}/heightmap", getLevelHeitmapInfoFunc(levels))
	r.HandleFunc("/{level}/heightmap/{z}_{y}_{x}.png", getLevelHeitmapTileFunc(levels))

	r.HandleFunc("/{level}/region/{region}", getLevelRegionInfoFunc(levels))
	r.HandleFunc("/{level}/region/{region}/entities", getLevelRegionEntitiesFunc(levels))
	r.HandleFunc("/{level}/region/{region}/distribution", getLevelRegionDistributionFunc(levels))

}

func GetLevelNamesFunc(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		result := level.ListLevels(assets)
		serveJson(result, w)
	}
}

func getLevelInfoFunc(collection level.CollectionLoader) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		levelName := nwfs.NormalizePath(vars["level"])
		level := collection.Level(levelName)
		if level == nil {
			http.NotFound(w, r)
			return
		}

		info := level.Info()
		if data, err := json.MarshalJSON(info, "", "\t"); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		} else {
			serveContent(data, w, "application/json")
		}
	}
}

func getLevelMissionEntitiesFunc(collection level.CollectionLoader) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		levelName := nwfs.NormalizePath(vars["level"])
		level := collection.Level(levelName)
		if level == nil {
			http.NotFound(w, r)
			return
		}

		result := level.MissionEntities()
		if data, err := json.MarshalJSON(result, "", "\t"); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		} else {
			serveContent(data, w, "application/json")
		}
	}
}

func getLevelRegionInfoFunc(collection level.CollectionLoader) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		levelName := nwfs.NormalizePath(vars["level"])
		regionName := nwfs.NormalizePath(vars["region"])
		level := collection.Level(levelName)
		if level == nil {
			http.NotFound(w, r)
			return
		}
		region := level.Region(regionName)
		if region == nil {
			http.NotFound(w, r)
			return
		}

		info := region.Info()
		if data, err := json.MarshalJSON(info, "", "\t"); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		} else {
			serveContent(data, w, "application/json")
		}
	}
}

func getLevelRegionEntitiesFunc(collection level.CollectionLoader) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		levelName := nwfs.NormalizePath(vars["level"])
		regionName := nwfs.NormalizePath(vars["region"])
		level := collection.Level(levelName)
		if level == nil {
			http.NotFound(w, r)
			return
		}
		region := level.Region(regionName)
		if region == nil {
			http.NotFound(w, r)
			return
		}

		result := region.Entities()
		if data, err := json.MarshalJSON(result, "", "\t"); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		} else {
			serveContent(data, w, "application/json")
		}
	}
}

func getLevelRegionDistributionFunc(collection level.CollectionLoader) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		levelName := nwfs.NormalizePath(vars["level"])
		regionName := nwfs.NormalizePath(vars["region"])
		level := collection.Level(levelName)
		if level == nil {
			http.NotFound(w, r)
			return
		}
		region := level.Region(regionName)
		if region == nil {
			http.NotFound(w, r)
			return
		}

		result := region.Distribution()
		if data, err := json.MarshalJSON(result, "", "\t"); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		} else {
			serveContent(data, w, "application/json")
		}
	}
}

func getLevelHeitmapInfoFunc(collection level.CollectionLoader) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		levelName := vars["level"]
		level := collection.Level(levelName)
		if level == nil {
			http.NotFound(w, r)
			return
		}
		result := level.TerrainInfo()
		if data, err := json.MarshalJSON(result, "", "\t"); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		} else {
			serveContent(data, w, "application/json")
		}
	}
}

func getLevelHeitmapTileFunc(collection level.CollectionLoader) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		levelName := vars["level"]
		varZ := vars["z"]
		varX := vars["x"]
		varY := vars["y"]
		level := collection.Level(levelName)
		if level == nil {
			http.NotFound(w, r)
			return
		}

		z, err := strconv.Atoi(varZ)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		x, err := strconv.Atoi(varX)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		y, err := strconv.Atoi(varY)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		mips := level.Terrain()
		tile := mips.TileAt(z, x, y)
		img := mips.TileHeightmap(tile)
		if img == nil {
			http.NotFound(w, r)
			return
		}

		buf := &bytes.Buffer{}
		png.Encode(buf, img)
		serveContent(buf.Bytes(), w, "image/png")
	}
}
