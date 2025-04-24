package serve

import (
	"net/http"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/json"
)

func GetListHandler(archive nwfs.Archive) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pattern := nwfs.NormalizePath(r.URL.Path)
		list, err := archive.Glob(pattern)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		files := make([]string, len(list))
		for i, file := range list {
			files[i] = file.Path()
		}
		content, err := json.MarshalJSON(files, "", "\t")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		serveContent(content, w, "application/json")
	}
}
