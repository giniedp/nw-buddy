package serve

import (
	"net/http"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
)

func GetListHandler(archive nwfs.Archive) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pattern := nwfs.NormalizePath(r.URL.Path)
		list, err := archive.Glob(pattern)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		files := ServeListResult{
			Items: make([]string, len(list)),
		}
		for i, file := range list {
			files.Items[i] = file.Path()
		}
		serveJson(files, w)
	}
}

func GetStatHandler(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pattern := nwfs.NormalizePath(r.URL.Path)
		list, err := assets.Archive.Glob(pattern)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}

		result := ServeStatResult{
			Items: make([]ServeStatResultEntry, len(list)),
		}
		for i, file := range list {
			filePath := file.Path()

			entry := ServeStatResultEntry{}
			entry.File = filePath
			entry.Asset = assets.Catalog.FindByFile(file.Path())

			if dds.IsDDS(filePath) || dds.IsDDSAlpha(filePath) {
				meta, _ := dds.LoadMeta(file)
				if meta != nil {
					entry.Dds = meta.Stats()
				}
			}

			result.Items[i] = entry
		}

		serveJson(result, w)
	}
}
