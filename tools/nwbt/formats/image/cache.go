package image

import (
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"os"
	"path"
	"sync"
)

type Cache interface {
	Load(file nwfs.File) (*LoadedImage, bool)
	Save(file nwfs.File, image *LoadedImage)
}

func NewCache(dir, format string) Cache {
	return &cache{
		dir:    dir,
		format: format,
		mu:     &sync.Mutex{},
	}
}

type cache struct {
	dir    string
	format string
	mu     *sync.Mutex
}

func (r *cache) getCachePath(file string) string {
	file = path.Join(r.dir, file)
	if r.format != "" {
		file = utils.ReplaceExt(file, r.format)
	}
	return file
}

func (r *cache) Load(file nwfs.File) (*LoadedImage, bool) {
	if file == nil || r.dir == "" {
		return nil, false
	}
	cachePath := r.getCachePath(file.Path())
	if !r.fileExists(cachePath) {
		return nil, false
	}
	data, err := os.ReadFile(cachePath)
	if err != nil {
		return nil, false
	}
	res := &LoadedImage{}
	res.Source = file.Path()
	res.Format = Format(path.Ext(file.Path()))
	res.Data = data
	cachePath = utils.ReplaceExt(cachePath, ".a"+path.Ext(cachePath))
	if _, err := os.Stat(cachePath); err != nil {
		return res, true
	}
	res.Alpha, _ = os.ReadFile(cachePath)
	return res, true
}

func (r *cache) Save(file nwfs.File, image *LoadedImage) {
	if image == nil || r.dir == "" {
		return
	}
	r.mu.Lock()
	defer r.mu.Unlock()

	outPath := r.getCachePath(file.Path())
	outDir := path.Dir(outPath)
	outName := path.Base(outPath)
	outNameA := utils.ReplaceExt(outName, ".a"+path.Ext(outName))
	os.MkdirAll(outDir, os.ModePerm)

	if image.Alpha != nil {
		tmpFileA, _ := os.CreateTemp(outDir, outNameA+"*")
		tmpPath := tmpFileA.Name()
		tmpFileA.Write(image.Alpha)
		tmpFileA.Close()
		os.Rename(tmpPath, path.Join(outDir, outNameA))
	}

	tmpFile, _ := os.CreateTemp(outDir, outName+"*")
	tmpPath := tmpFile.Name()
	tmpFile.Write(image.Data)
	tmpFile.Close()

	os.Rename(tmpPath, path.Join(outDir, outName))
}

func (c *cache) fileExists(path string) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return utils.FileExists(path)
}
