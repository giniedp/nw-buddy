package serve

import (
	"errors"
	"log/slog"
	"net/http"
	"net/url"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"os"
	"path"
	"strings"

	"golang.org/x/sync/singleflight"
)

func GetFileHandler(assets *game.Assets) http.HandlerFunc {
	execGroup := new(singleflight.Group)

	return func(w http.ResponseWriter, r *http.Request) {
		cacheKey := path.Join(flg.CacheDir, "server", getCacheKey(r))

		res, err, _ := execGroup.Do(cacheKey, func() (any, error) {
			ext := path.Ext(r.URL.Path)
			shouldcache := false
			switch r.URL.Query().Get("cache") {
			case "true":
				shouldcache = true
			case "false":
				shouldcache = false
			default:
				shouldcache = ext == ".glb" || ext == ".png" // expensive transformations
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
		serveContent(result.content, w, result.contentType)
	}
}

func getCacheKey(r *http.Request) string {
	urlPath := r.URL.Path
	ext := path.Ext(urlPath)
	query := url.QueryEscape(r.URL.RawQuery)
	return utils.ReplaceExt(urlPath, query+ext)
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

	data, err := convertFile(assets, file, queryType, query)
	if err != nil {
		slog.Error("conversion failed", "path", filePath, "error", err)
		return result, err
	}

	result.code = http.StatusOK
	result.content = data
	result.contentType = contentTypeByExtension(queryType)
	return result, nil
}
