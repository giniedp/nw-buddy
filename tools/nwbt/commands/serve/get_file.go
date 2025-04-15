package serve

import (
	"errors"
	"log/slog"
	"net/http"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"os"
	"path"
	"strings"

	"golang.org/x/sync/singleflight"
)

func GetFileHandler(assets *game.Assets) http.HandlerFunc {
	g := new(singleflight.Group)

	return func(w http.ResponseWriter, r *http.Request) {
		cacheKey := path.Join(flg.CacheDir, "server", r.URL.String())
		cacheKey = strings.ReplaceAll(cacheKey, "?", "_")

		res, err, _ := g.Do(cacheKey, func() (any, error) {
			ext := path.Ext(r.URL.Path)
			shouldcache := ext == ".glb" || ext == ".png"
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

type contentResult struct {
	code        int
	content     []byte
	contentType string
}

func getFile(assets *game.Assets, r *http.Request) (contentResult, error) {
	result := contentResult{code: http.StatusInternalServerError}

	archive := assets.Archive
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

	query := r.URL.Query()
	if ok && !query.Has("merge") {
		data, err := file.Read()
		if err != nil {
			return result, err
		}
		result.code = http.StatusOK
		result.content = data
		result.contentType = contentTypeByExtension(path.Ext(file.Path()))
		return result, nil
	}

	if !ok {
		filePath = strings.TrimSuffix(filePath, targetType)
		file, ok = archive.Lookup(filePath)
	}

	if !ok && targetType == ".png" {
		file, ok = archive.Lookup(filePath + ".dds")
	}

	if !ok {
		slog.Error("file not found", "path", filePath)
		result.code = http.StatusNotFound
		return result, errors.New("file not found")
	}

	data, err := convertFile(assets, file, targetType, query)
	if err != nil {
		slog.Error("conversion failed", "path", filePath, "error", err)
		return result, err
	}

	result.code = http.StatusOK
	result.content = data
	result.contentType = contentTypeByExtension(targetType)
	return result, nil
}
