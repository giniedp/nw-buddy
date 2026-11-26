package serve

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"log/slog"
	"mime"
	"net/http"
	"net/url"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"os"
	"path"
	"strconv"
	"strings"

	"golang.org/x/sync/singleflight"
)

func GetFileHandler(assets *game.Assets) http.HandlerFunc {
	execGroup := new(singleflight.Group)

	return func(w http.ResponseWriter, r *http.Request) {
		// a POST carries long parameters in its form body (e.g. the animations of a character export): they join the
		// query, which everything below reads, also the key that merges concurrent requests
		if r.Method == http.MethodPost {
			if err := r.ParseForm(); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			r.URL.RawQuery = r.Form.Encode()
		}
		cacheKey := path.Join(flg.CacheDir, "server", getCacheKey(r))

		res, err, _ := execGroup.Do(cacheKey, func() (any, error) {
			ext := path.Ext(r.URL.Path)
			query := r.URL.Query()
			shouldcache := false
			if isTrueParam(query.Get(QUERY_DOWNLOAD)) {
				// exports are converted on every request: the server is local, and an export's options (e.g. the
				// animations of a character) make cache entries that are rarely asked for again
				shouldcache = false
			} else if query.Has("cache") {
				shouldcache = isTrueParam(query.Get("cache"))
			} else {
				shouldcache = ext == ".glb" || ext == ".png" || ext == ".zip" // expensive transformations
			}

			if shouldcache && utils.FileExists(cacheKey) {
				data, err := os.ReadFile(cacheKey)
				if err != nil {
					return contentResult{
						code: http.StatusInternalServerError,
					}, err
				}
				return contentResult{
					code:        http.StatusOK,
					content:     data,
					contentType: contentTypeByExtension(ext),
				}, nil
			}

			res, err := getFile(assets, r)
			if !shouldcache || err != nil {
				return res, err
			}
			err = utils.WriteFile(cacheKey, res.content)
			if err != nil {
				res.code = http.StatusInternalServerError
				res.content = nil
				res.contentType = ""
				return res, err
			}
			return res, nil
		})

		result := res.(contentResult)
		if err != nil {
			http.Error(w, err.Error(), result.code)
			return
		}
		if count, ok := siblingLodCount(assets, r.URL.Path); ok {
			w.Header().Set(HEADER_LOD_COUNT, strconv.Itoa(count))
		}
		if isTrueParam(r.URL.Query().Get(QUERY_DOWNLOAD)) {
			w.Header().Set("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{
				"filename": downloadFileName(r.URL.Path),
			}))
		}
		serveContent(result.content, w, result.contentType)
	}
}

// QUERY_DOWNLOAD serves the file as an attachment with a readable file name (download=1)
const QUERY_DOWNLOAD = "download"

// HEADER_LOD_COUNT tells, on a raw .cgf, how many level of detail sibling files exist (`<name>_lod1.cgf`, …), so the
// viewer requests only those instead of probing up to the engine maximum
const HEADER_LOD_COUNT = "X-Lod-Count"

// maxSiblingLods is the engine's maximum level of detail (MAX_STATOBJ_LODS_NUM - 1)
const maxSiblingLods = 5

// siblingLodCount counts the level of detail siblings of a raw .cgf request, up to the first missing level. False for
// other requests (conversions, other file types).
func siblingLodCount(assets *game.Assets, urlPath string) (int, bool) {
	filePath := nwfs.NormalizePath(urlPath)
	if !strings.EqualFold(path.Ext(filePath), ".cgf") {
		return 0, false
	}
	base := filePath[:len(filePath)-len(".cgf")]
	count := 0
	for level := 1; level <= maxSiblingLods; level++ {
		if _, ok := assets.Archive.Lookup(fmt.Sprintf("%s_lod%d.cgf", base, level)); !ok {
			break
		}
		count = level
	}
	return count, true
}

// cacheVersion is part of the cache path of converted files. Bump it when a converter changes its output
// (e.g. the glTF exporter), so old cached .glb/.png files are not served.
const cacheVersion = "v4"

// maxCacheNameLength keeps the file name of a cache entry below the 255 characters of a Windows path component
const maxCacheNameLength = 200

// getCacheKey is the cache path of a conversion: the url path with the escaped query before the extension. A query that
// makes the file name too long (e.g. the animation list of a character export) is replaced by its hash.
func getCacheKey(r *http.Request) string {
	urlPath := r.URL.Path
	ext := path.Ext(urlPath)
	// the download flag only changes the response headers, not the content
	values := r.URL.Query()
	values.Del(QUERY_DOWNLOAD)
	encoded := values.Encode()
	key := utils.ReplaceExt(urlPath, url.QueryEscape(encoded)+ext)
	if len(path.Base(key)) > maxCacheNameLength {
		sum := sha256.Sum256([]byte(encoded))
		key = utils.ReplaceExt(urlPath, "~"+hex.EncodeToString(sum[:16])+ext)
	}
	return path.Join(cacheVersion, key)
}

// downloadFileName is the base name of the requested path. A conversion target replaces the source extension:
// `x.cgf.glb` → `x.glb`, `x_diff.dds.png` → `x_diff.png`, `x_ddna.dds.a.png` → `x_ddna_a.png`.
func downloadFileName(urlPath string) string {
	name := path.Base(urlPath)
	target := path.Ext(name)
	switch target {
	case ".glb", ".gltf", ".png", ".webp", ".zip", ".json":
	default:
		// a raw file, e.g. `x.dds` or `x_ddna.dds.a`
		return name
	}
	base := strings.TrimSuffix(name, target)
	for _, kind := range []string{".gltf", ".raw"} {
		if target == ".zip" && strings.HasSuffix(base, kind) {
			// x.cgf.gltf.zip → x.gltf.zip, x.cgf.raw.zip → x.raw.zip
			base = strings.TrimSuffix(base, kind)
			target = kind + ".zip"
		}
	}
	if strings.HasSuffix(base, ".dds.a") {
		return strings.TrimSuffix(base, ".dds.a") + "_a" + target
	}
	if src := path.Ext(base); src != "" && src != target && isSourceExt(src) {
		return strings.TrimSuffix(base, src) + target
	}
	return name
}

func isSourceExt(ext string) bool {
	switch ext {
	case ".cgf", ".skin", ".cdf", ".caf", ".mtl", ".dds", ".tif", ".dynamicslice", ".musicsheetc":
		return true
	}
	return false
}

type contentResult struct {
	code        int
	content     []byte
	contentType string
}

func getFile(assets *game.Assets, r *http.Request) (contentResult, error) {
	result := contentResult{code: http.StatusInternalServerError}

	archive := assets.Archive
	query := r.URL.Query()
	queryPath := nwfs.NormalizePath(r.URL.Path)
	queryType := path.Ext(queryPath)
	for _, target := range []string{targetGltfZip, targetRawZip} {
		if strings.HasSuffix(queryPath, target) {
			queryType = target
		}
	}
	queryIsImage := queryType == ".png" || queryType == ".webp" || queryType == ".dds"
	assetId, isAssetId := catalog.ParseAssetId(queryPath)

	filePath := queryPath
	if isAssetId {
		asset := assets.Catalog.LookupById(assetId)
		if asset != nil {
			filePath = asset.File
		}
	}

	tried := []string{filePath}
	file, exists := archive.Lookup(filePath)
	if exists && !queryIsImage {
		// the exact file is found and does not need image processing
		// simply read and serve the data
		data, err := file.Read()
		if err != nil {
			return result, err
		}
		result.code = http.StatusOK
		result.content = data
		result.contentType = contentTypeByExtension(path.Ext(file.Path()))
		return result, nil
	}

	if !exists {
		// happens when a file was queried with a conversion type, e.g.: file.cgf.glb
		// strip the conversion type and try again
		filePath = strings.TrimSuffix(filePath, queryType)
		file, exists = archive.Lookup(filePath)
		tried = append(tried, filePath)
	}

	if !exists && queryIsImage {
		// images are sometimes referenced as `.png` but are actually `.dds` files
		// try to load the file as a `.dds` file
		filePath = utils.ReplaceExt(filePath, ".dds")
		file, exists = archive.Lookup(filePath)
		tried = append(tried, filePath)
	}

	if !exists {
		slog.Error("file not found", "path", queryPath, "tried", tried)
		result.code = http.StatusNotFound
		return result, errors.New("file not found")
	}

	data, err := convertFile(convertParams{
		file:   file,
		assets: assets,
		target: queryType,
		query:  query,
	})
	if err != nil {
		slog.Error("conversion failed", "path", filePath, "error", err)
		return result, err
	}

	result.code = http.StatusOK
	result.content = data
	result.contentType = contentTypeByExtension(path.Ext(queryType))
	return result, nil
}
