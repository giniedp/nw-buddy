package image

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"os"
	"path"
	"sync"
)

// cacheVersion is part of every cache key: bump it when a conversion changes its output
const cacheVersion = 1

type Cache interface {
	Load(file nwfs.File) (*LoadedImage, bool)
	Save(file nwfs.File, image *LoadedImage)
}

// NewCache is a disk cache of converted images in dir. An entry is named after its source and a hash of the source
// content (see sourceHash), a changed source gets a new entry: the cache stays valid across game patches.
func NewCache(dir, format string) Cache {
	return &cache{
		dir:    dir,
		format: format,
	}
}

type cache struct {
	dir    string
	format string
}

// sourceFile is the file a cache entry is made of: a split part (mips, attached alpha) is its DDS
func sourceFile(file nwfs.File) nwfs.File {
	if dds.IsDDSSplitPart(file.Path()) {
		if base, ok := file.Archive().Lookup(utils.ReplaceExt(file.Path(), "")); ok {
			return base
		}
	}
	return file
}

func (r *cache) getCachePath(file nwfs.File) (string, error) {
	file = sourceFile(file)
	hash, err := sourceHash(file)
	if err != nil {
		return "", err
	}
	res := utils.ReplaceExt(path.Join(r.dir, file.Path()), "") + "." + hash
	if r.format != "" {
		res += r.format
	} else {
		res += path.Ext(file.Path())
	}
	return res, nil
}

func alphaPath(cachePath string) string {
	return utils.ReplaceExt(cachePath, ".a"+path.Ext(cachePath))
}

func (r *cache) Load(file nwfs.File) (*LoadedImage, bool) {
	if file == nil || r.dir == "" {
		return nil, false
	}
	cachePath, err := r.getCachePath(file)
	if err != nil {
		return nil, false
	}
	data, err := os.ReadFile(cachePath)
	if err != nil {
		return nil, false
	}
	res := &LoadedImage{
		Source: file.Path(),
		Format: Format(path.Ext(cachePath)),
		Data:   data,
	}
	// written before the data (Save), so it is there when the data is
	if alpha, err := os.ReadFile(alphaPath(cachePath)); err == nil {
		res.Alpha = alpha
	}
	return res, true
}

func (r *cache) Save(file nwfs.File, image *LoadedImage) {
	if file == nil || image == nil || r.dir == "" {
		return
	}
	cachePath, err := r.getCachePath(file)
	if err != nil {
		slog.Warn("image not cached", "file", file.Path(), "err", err)
		return
	}
	if image.Alpha != nil {
		if err := utils.WriteFile(alphaPath(cachePath), image.Alpha); err != nil {
			slog.Warn("image not cached", "file", file.Path(), "err", err)
			return
		}
	}
	if err := utils.WriteFile(cachePath, image.Data); err != nil {
		slog.Warn("image not cached", "file", file.Path(), "err", err)
	}
}

type sourceKey struct {
	archive nwfs.Archive
	path    string
}

// sourceHashes memoizes sourceHash: the archive does not change while the process runs
var sourceHashes sync.Map

// sourceHash is a SHA-256 (first 8 bytes, hex) of the cache version and the content of the source file. A DDS
// counts with all of its split parts (mips, attached alpha). file is a sourceFile.
func sourceHash(file nwfs.File) (string, error) {
	key := sourceKey{file.Archive(), file.Path()}
	if hash, ok := sourceHashes.Load(key); ok {
		return hash.(string), nil
	}

	files := []nwfs.File{file}
	if dds.IsDDS(file.Path()) {
		splits, err := dds.FindSplits(file)
		if err != nil {
			return "", err
		}
		files = append(files, splits.Base.Files...)
		if splits.Alpha.Header != nil {
			files = append(files, splits.Alpha.Header)
		}
		files = append(files, splits.Alpha.Files...)
	}

	h := sha256.New()
	fmt.Fprintf(h, "v%d\n", cacheVersion)
	for _, part := range files {
		data, err := part.Read()
		if err != nil {
			return "", fmt.Errorf("%s not read: %w", part.Path(), err)
		}
		fmt.Fprintf(h, "%s %d\n", path.Base(part.Path()), len(data))
		h.Write(data)
	}
	hash := hex.EncodeToString(h.Sum(nil)[:8])
	sourceHashes.Store(key, hash)
	return hash, nil
}
