package serve

import (
	"net/http"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/game"
	"strconv"

	"github.com/gorilla/mux"
)

func GetAssetHandler(assets *game.Assets) http.HandlerFunc {
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
		result := ServeAssetIdResult{
			Asset:  assets.Catalog.LookupById(assetId),
			Assets: assets.Catalog.AllByGuid(assetId.Guid),
			Link:   assets.Catalog.LookupLink(assetId.Guid),
			Legacy: assets.Catalog.LookupLegacy(assetIdString),
		}
		serveJson(result, w)
	}
}
