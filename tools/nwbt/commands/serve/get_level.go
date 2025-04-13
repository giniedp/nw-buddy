package serve

import (
	"image/png"
	"log/slog"
	"net/http"
	"nw-buddy/tools/formats/heightmap"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/maps"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

func GetLevelNamesHandler(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		result := game.ListLevelNames(assets.Archive)
		serveJson(result, w)
	}
}

func GetLevelHandler(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		vars := mux.Vars(r)
		levelName := nwfs.NormalizePath(vars["level"])
		level := game.LoadLevel(assets.Archive, levelName)
		if level.Name == "" {
			http.NotFound(w, r)
			return
		}
		content, err := json.MarshalJSON(level, "", "\t")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)
	}
}

func GetLevelRegionHandler(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		levelName := nwfs.NormalizePath(vars["level"])
		regionName := nwfs.NormalizePath(vars["region"])

		result := game.LoadLevelRegion(assets.Archive, levelName, regionName)
		if result.Name == "" {
			http.NotFound(w, r)
			return
		}
		content, err := json.MarshalJSON(result, "", "\t")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)
	}
}

func GetLevelHeightmapHandler(assets *game.Assets) http.HandlerFunc {
	maps := maps.NewSafeDict[heightmap.Mipmaps]()
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		levelName := vars["level"]
		varZ := vars["z"]
		varX := vars["x"]
		varY := vars["y"]
		mips, _ := maps.LoadOrStoreFn(levelName, func() heightmap.Mipmaps {
			startAt := time.Now()
			slog.Info("Loading level terrain", "level", levelName)
			terrain := game.LoadLevelTerrain(assets.Archive, levelName)
			slog.Info("Loaded level terrain", "level", levelName, "duration", time.Since(startAt).Milliseconds())
			return terrain.MipmapsDefaultSize()
		})

		if varZ == "" {
			serveJson(map[string]any{
				"name":       levelName,
				"tileSize":   mips.TileSize,
				"mipCount":   len(mips.Levels),
				"width":      mips.Levels[0].Width,
				"height":     mips.Levels[0].Height,
				"regionsX":   mips.Levels[0].RegionsX,
				"regionsY":   mips.Levels[0].RegionsY,
				"regionSize": mips.Levels[0].RegionSize,
			}, w)
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

		tile := mips.TileAt(z, x, y)
		img := mips.TileHeightmap(tile)
		if img == nil {
			http.NotFound(w, r)
			return
		}

		w.Header().Set("Content-Type", "image/png")
		png.Encode(w, img)
	}
}
