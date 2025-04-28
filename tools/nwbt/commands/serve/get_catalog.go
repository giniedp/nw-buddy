package serve

import (
	"net/http"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/game"
	"strconv"

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
		assetIdString := vars["assetId"]

		assetId, _ := catalog.ParseAssetId(assetIdString)
		if subid := r.URL.Query().Get("subid"); subid != "" {
			subidInt, err := strconv.Atoi(subid)
			if err == nil {
				assetId.SubID = uint32(subidInt)
			}
		}
		result := map[string]any{
			"asset":  assets.Catalog.LookupById(assetId),
			"assets": assets.Catalog.AllByGuid(assetId.Guid),
			"link":   assets.Catalog.LookupLink(assetId.Guid),
			"legacy": assets.Catalog.LookupLegacy(assetIdString),
		}
		serveJson(result, w)
	}
}
