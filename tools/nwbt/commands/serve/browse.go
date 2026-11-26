package serve

import (
	"fmt"
	"log/slog"
	"net/http"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/browse"
	"nw-buddy/tools/game/level"
	"nw-buddy/tools/nwfs"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

// browseIndex serves the asset browser of nw-viewer (/browse/*), built once at start
var browseIndex *browse.Index

const (
	browseListLimit   = 5000
	browseSearchLimit = 500
	// upper bound of the `limit` parameter
	browseMaxLimit = 20000
)

func buildBrowseIndex(assets *game.Assets) *browse.Index {
	start := time.Now()
	files, _ := assets.Archive.List()
	index := browse.Build(files, assets.Catalog.All())

	unknown := 0
	for _, t := range index.Types {
		if !t.Known {
			unknown++
			// add it to catalog.KnownTypes or catalog.ExtTypes
			slog.Info("browse index: unknown type", "key", t.Key, "label", t.Label, "files", t.Count)
		}
	}
	slog.Info("browse index built",
		"files", index.Len(),
		"types", len(index.Types),
		"unknown types", unknown,
		"took", time.Since(start).Round(time.Millisecond),
	)
	return index
}

// BrowseRouter serves the asset browser of nw-viewer. Only metadata: file contents come from /files.
//
//	GET /types                           the asset types that occur, a file's `type` indexes this list
//	GET /list?dir=a/b&types=1,2&limit=   child folders and files of a folder
//	GET /search?q=rock&types=&limit=     files whose path contains q, or whose asset id is q
//	GET /stat?path=a/b/c.dds             archive and catalog details, split parts of a dds
//	GET /slice?path=a/b.dynamicslice     the slice and every slice it spawns, as the viewer spawns them
//	GET /datasheets                      the datasheets by family and the inferred kinds of their columns
//
// `types` lists type indices, empty selects every type that is not hidden.
//
// `/slice` is the one content conversion of the browser API (user decision): slices are converted into viewer
// slices by the same Go code that serves the levels (level.LoadSliceClosure).
func BrowseRouter(r *mux.Router, assets *game.Assets) {
	r.Handle("/slice", handlers.CompressHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := nwfs.NormalizePath(r.URL.Query().Get("path"))
		stat, ok := browseIndex.Stat(path)
		if !ok {
			http.Error(w, "file not found", http.StatusNotFound)
			return
		}
		if stat.Catalog == nil {
			http.Error(w, "the slice is not in the catalog", http.StatusNotFound)
			return
		}
		id := catalog.AssetId{Guid: stat.Catalog.Guid, SubID: stat.Catalog.SubId}
		slices := level.LoadSliceClosure(assets, []catalog.AssetId{id})
		root := fmt.Sprintf("%s_%d", id.Guid, id.SubID)
		if _, ok := slices[root]; !ok {
			http.Error(w, "the slice could not be loaded", http.StatusUnprocessableEntity)
			return
		}
		serveJson(BrowseSlice{Root: root, Slices: slices, Meshes: countSliceMeshes(slices)}, w)
	})))
	r.Handle("/datasheets", handlers.CompressHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		serveJson(browseDatasheets(), w)
	})))
	r.HandleFunc("/types", func(w http.ResponseWriter, r *http.Request) {
		serveJson(browseIndex.Types, w)
	})
	r.Handle("/list", handlers.CompressHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		filter := browseIndex.NewFilter(parseTypes(query.Get("types")))
		serveJson(browseIndex.List(nwfs.NormalizePath(query.Get("dir")), filter, parseLimit(query.Get("limit"), browseListLimit)), w)
	})))
	r.Handle("/search", handlers.CompressHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		filter := browseIndex.NewFilter(parseTypes(query.Get("types")))
		serveJson(browseIndex.Search(query.Get("q"), filter, parseLimit(query.Get("limit"), browseSearchLimit)), w)
	})))
	r.HandleFunc("/stat", func(w http.ResponseWriter, r *http.Request) {
		stat, ok := browseIndex.Stat(nwfs.NormalizePath(r.URL.Query().Get("path")))
		if !ok {
			http.Error(w, "file not found", http.StatusNotFound)
			return
		}
		serveJson(stat, w)
	})
}

// browseDatasheets is the answer of /browse/datasheets, built on the first request (it reads every datasheet)
var browseDatasheets = sync.OnceValue(func() *browse.Datasheets {
	start := time.Now()
	result := browseIndex.BuildDatasheets()
	columns, refs := 0, 0
	for _, family := range result.Families {
		columns += len(family.Columns)
		for _, column := range family.Columns {
			if column.Kind == browse.KindRef {
				refs++
			}
		}
	}
	slog.Info("browse datasheets built",
		"families", len(result.Families),
		"columns", columns,
		"references", refs,
		"took", time.Since(start).Round(time.Millisecond),
	)
	return result
})

// BrowseSlice is the answer of /browse/slice
type BrowseSlice struct {
	// key of the slice itself in Slices, "guid_subId"
	Root string `json:"root"`
	// the slice and the slices it spawns, keyed by "guid_subId"
	Slices map[string]level.ViewerSlice `json:"slices"`
	// meshes over all slices (mesh components and character parts), 0 means there is nothing to see in 3D
	Meshes int `json:"meshes"`
}

func countSliceMeshes(slices map[string]level.ViewerSlice) int {
	count := 0
	for _, slice := range slices {
		for _, entity := range slice.Entities {
			for _, component := range entity.Components {
				switch v := component.(type) {
				case level.ViewerMeshComponent:
					count++
				case level.ViewerCharacterComponent:
					count += len(v.Parts)
				}
			}
		}
	}
	return count
}

// parseTypes reads a comma separated list of type indices, invalid entries are skipped
func parseTypes(value string) []int {
	result := []int{}
	for _, part := range strings.Split(value, ",") {
		if n, err := strconv.Atoi(strings.TrimSpace(part)); err == nil {
			result = append(result, n)
		}
	}
	return result
}

func parseLimit(value string, fallback int) int {
	n, err := strconv.Atoi(value)
	if err != nil || n <= 0 {
		return fallback
	}
	return min(n, browseMaxLimit)
}
