package browse

import (
	"fmt"
	"nw-buddy/tools/formats/catalog"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Lookup returns the position of a file by its path (lowercase, forward slashes)
func (index *Index) Lookup(filePath string) (int, bool) {
	files := index.files
	i := sort.Search(len(files), func(k int) bool {
		return files[k].Path() >= filePath
	})
	return i, i < len(files) && files[i].Path() == filePath
}

// SearchResult is the files that match a query, in path order
type SearchResult struct {
	Query string     `json:"query"`
	Files []ListFile `json:"files"`
	// number of matching files, may be more than returned
	Total int `json:"total"`
}

// Search finds selected files whose path contains the query (case-insensitive), or whose catalog
// asset has the asset id of the query (`guid` or `guid:subid`, the sub id is ignored).
func (index *Index) Search(query string, filter Filter, limit int) SearchResult {
	query = strings.ToLower(strings.TrimSpace(query))
	result := SearchResult{Query: query, Files: []ListFile{}}
	if query == "" {
		return result
	}
	guid := ""
	if id, ok := catalog.ParseAssetId(query); ok {
		guid = id.Guid
	}

	// a scan of all files, split over the cores: each chunk keeps its first `limit` hits in path
	// order, so the chunks in order give the first `limit` hits overall
	type chunk struct {
		hits  []int
		total int
	}
	count := runtime.GOMAXPROCS(0)
	chunks := make([]chunk, count)
	n := len(index.files)
	var wg sync.WaitGroup
	for c := range chunks {
		wg.Add(1)
		go func(c *chunk, lo, hi int) {
			defer wg.Done()
			for i := lo; i < hi; i++ {
				if !index.matches(filter, i) {
					continue
				}
				asset := index.asset[i]
				if !strings.Contains(index.files[i].Path(), query) && (guid == "" || asset == nil || asset.Guid != guid) {
					continue
				}
				c.total++
				if len(c.hits) < limit {
					c.hits = append(c.hits, i)
				}
			}
		}(&chunks[c], n*c/count, n*(c+1)/count)
	}
	wg.Wait()

	for _, c := range chunks {
		result.Total += c.total
		for _, i := range c.hits {
			if len(result.Files) < limit {
				result.Files = append(result.Files, index.listFile(i))
			}
		}
	}
	return result
}

// CatalogInfo is the catalog asset of a file
type CatalogInfo struct {
	Guid  string `json:"guid"`
	SubId uint32 `json:"subId"`
	// asset type uuid
	Type string `json:"type"`
	Size uint32 `json:"size"`
}

// DdsPart is a file that belongs to a split texture
type DdsPart struct {
	Path string `json:"path"`
	// the part number N of a split mip (`.dds.N`, `.dds.Na`), 0 for the alpha base file (`.dds.a`).
	// It is not the mip level: with S parts, part N holds level S - N (the highest N is the largest mip).
	Mip int `json:"mip"`
	// part of the alpha texture: `.dds.a` (a full dds with the small mips) and `.dds.Na`
	Alpha bool `json:"alpha"`
}

// Stat is what the archive and the catalog know about a file, nothing is read from its content
type Stat struct {
	ListFile
	CompressedSize int64  `json:"compressedSize"`
	Pak            string `json:"pak"`
	Crc32          string `json:"crc32"`
	Modified       string `json:"modified"`
	// nil if the file is not in the catalog
	Catalog *CatalogInfo `json:"catalog"`
	// the split parts of a `.dds`, empty for other files
	Parts []DdsPart `json:"parts"`
}

// pak entry details, implemented by the files of a packed archive
type pakEntry interface {
	CompressedSize() uint64
	Crc32() uint32
	ModTime() time.Time
}

// Stat describes a file by its path, false if it is not in the archive
func (index *Index) Stat(filePath string) (Stat, bool) {
	i, ok := index.Lookup(filePath)
	if !ok {
		return Stat{}, false
	}
	file := index.files[i]
	result := Stat{
		ListFile: index.listFile(i),
		Pak:      file.Package(),
		Parts:    []DdsPart{},
	}
	if entry, ok := file.(pakEntry); ok {
		result.CompressedSize = int64(entry.CompressedSize())
		result.Crc32 = fmt.Sprintf("%08x", entry.Crc32())
		result.Modified = entry.ModTime().UTC().Format(time.RFC3339)
	}
	if asset := index.asset[i]; asset != nil {
		result.Catalog = &CatalogInfo{
			Guid:  asset.Guid,
			SubId: asset.SubID,
			Type:  asset.Type,
			Size:  asset.Size,
		}
	}
	if strings.HasSuffix(filePath, ".dds") {
		result.Parts = index.ddsParts(i)
	}
	return result, true
}

// ddsParts lists the split files of the `.dds` at position i: `.dds.N` (part N), `.dds.a` (alpha
// base) and `.dds.Na` (alpha part N). They follow the base file in path order.
func (index *Index) ddsParts(i int) []DdsPart {
	base := index.files[i].Path() + "."
	lo, hi := index.prefixRange(base, i+1, len(index.files))
	parts := []DdsPart{}
	for j := lo; j < hi; j++ {
		suffix := index.files[j].Path()[len(base):]
		if suffix == "a" {
			parts = append(parts, DdsPart{Path: index.files[j].Path(), Mip: 0, Alpha: true})
			continue
		}
		alpha := strings.HasSuffix(suffix, "a")
		level, err := strconv.Atoi(strings.TrimSuffix(suffix, "a"))
		if err != nil {
			// not a split part, e.g. `x.dds.meta`
			continue
		}
		// the catalog sub id tells the part number of typed mips (its "level" bits), the name is the
		// fallback
		if asset := index.asset[j]; asset != nil && asset.Type == catalog.UUIDTextureMipmap {
			level = catalog.SubIdLevel(asset.SubID)
			alpha = catalog.SubIdIsAlpha(asset.SubID)
		}
		parts = append(parts, DdsPart{Path: index.files[j].Path(), Mip: level, Alpha: alpha})
	}
	return parts
}
