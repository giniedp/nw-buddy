package serve

import (
	"log/slog"
	"net/http"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"path"
	"strings"
)

func GetFileHandler(assets *game.Assets) http.HandlerFunc {
	archive := assets.Archive
	return func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()

		filePath := nwfs.NormalizePath(r.URL.Path)
		uuid := utils.ExtractUUID(filePath)
		if uuid != "" {
			asset := assets.Catalog[strings.ToLower(uuid)]
			if asset != nil {
				filePath = asset.File
			}
		}

		file, ok := archive.Lookup(filePath)
		targetType := path.Ext(filePath)

		if ok && !query.Has("merge") {
			serveFile(file, w)
			return
		}

		if !ok {
			filePath = strings.TrimSuffix(filePath, targetType)
			file, ok = archive.Lookup(filePath)
			slog.Debug("file lookup", "path", filePath, "ext", targetType, "ok", ok)
		}

		if !ok && targetType == ".png" {
			file, ok = archive.Lookup(filePath + ".dds")
		}

		if !ok {
			slog.Error("file not found", "path", filePath)
			http.Error(w, "file not found", http.StatusNotFound)
			return
		}

		slog.Info("convert", "path", filePath, "format", targetType)
		data, err := convertFile(assets, file, targetType, query)
		if err != nil {
			slog.Error("conversion failed", "path", filePath, "error", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		serveContent(data, targetType, w)
	}
}
