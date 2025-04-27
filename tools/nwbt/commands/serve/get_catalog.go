package serve

import (
	"net/http"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"strings"

	"github.com/gorilla/mux"
)

func GetCatalogHandler(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		serveJson(assets.Catalog, w)
	}
}

func GetCatalogAssetHandler(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		assetId := utils.ExtractUUID(vars["assetId"])
		query := r.URL.Query()
		byName := query.Get("name")
		byHint := query.Get("hint")

		if byHint != "" {
			file, err := assets.LookupFileByAsset(nwt.AzAsset{
				Guid: assetId,
				Hint: byHint,
			})
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
			}
			if file != nil {
				serveJson(catalog.Asset{
					Uuid: assetId,
					File: file.Path(),
				}, w)
				return
			}
		}

		if byName != "" {
			file := assets.ResolveDynamicSliceByName(byName)
			if file != nil {
				serveJson(catalog.Asset{
					Uuid: assetId,
					File: file.Path(),
				}, w)
				return
			}
		}

		asset, ok := assets.Catalog[strings.ToLower(assetId)]
		if !ok {
			http.Error(w, "asset not found", http.StatusNotFound)
			return
		}
		serveJson(asset, w)
	}
}
