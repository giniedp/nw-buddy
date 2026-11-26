package catalog

import (
	"cmp"
	"io"
	"iter"
	"log/slog"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
	"path"
	"slices"
	"sort"
	"strings"

	"github.com/gofrs/uuid"
)

const (
	CATALOG_PATH = "assetcatalog.catalog"
)

// Document is the parsed asset catalog. It is held for the lifetime of the process, so it is kept compact: one
// sorted asset array searched by guid, no maps, and guid/type/dir strings shared between entries.
type Document struct {
	assets []Asset      // stable sorted by guid, catalog order within a guid
	links  []assetLink  // stable sorted by uuid
	legacy []legacyLink // stable sorted by legacy asset id
}

type Asset struct {
	AssetId
	Type string `json:"type"`
	File string `json:"file"`
	Size uint32 `json:"size"`
}

type assetLink struct {
	uuid string
	id   AssetId
}

type legacyLink struct {
	legacy AssetId
	id     AssetId
}

func Load(f nwfs.File) (*Document, error) {
	data, err := f.Read()
	if err != nil {
		return nil, err
	}
	doc, err := Parse(data)
	return doc, err
}

func Read(r io.Reader) (*Document, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

// uuidTable resolves an index into a uuid block of the catalog to its string, creating each string only once
type uuidTable struct {
	r      *buf.Reader
	offset uint32
	values []string
}

func newUUIDTable(r *buf.Reader, offset uint32, end uint32) *uuidTable {
	count := 0
	if end > offset {
		count = int((end - offset) / 16)
	}
	return &uuidTable{r: r, offset: offset, values: make([]string, count)}
}

func (t *uuidTable) at(index uint32) string {
	if int(index) < len(t.values) && t.values[index] != "" {
		return t.values[index]
	}
	t.r.SeekAbsolute(int(t.offset + 16*index))
	value := utils.Must(uuid.FromBytes(t.r.MustReadBytes(16))).String()
	if int(index) < len(t.values) {
		t.values[index] = value
	}
	return value
}

func Parse(data []byte) (res *Document, err error) {
	defer utils.HandleRecover(&err)

	r := buf.NewReaderLE(data)

	r.MustReadBytes(4) // Signature
	r.MustReadUint32() // Version
	r.MustReadUint32() // FileSize
	r.MustReadUint32() // Field4

	pBlockUuids := r.MustReadUint32() // uuid block offset
	pBlockTypes := r.MustReadUint32() // type block offset
	pBlockDirs := r.MustReadUint32()  // dir block offset
	pBlockFiles := r.MustReadUint32() // file name block offset
	r.MustReadUint32()                // file sizze

	type assetEntry struct {
		uuidIndex  uint32
		subId      uint32
		typeIndex  uint32
		fileSize   uint32
		dirOffset  uint32
		nameOffset uint32
	}
	entries := make([]assetEntry, r.MustReadUint32())
	for i := range entries {
		r.MustReadUint32() // guid index 1, always equal to guid index 2
		r.MustReadUint32() // sub id 1
		entries[i].uuidIndex = r.MustReadUint32()
		entries[i].subId = r.MustReadUint32()
		entries[i].typeIndex = r.MustReadUint32()
		r.MustReadUint32() // field 6
		entries[i].fileSize = r.MustReadUint32()
		r.MustReadUint32() // field 8
		entries[i].dirOffset = r.MustReadUint32()
		entries[i].nameOffset = r.MustReadUint32()
	}

	r.MustReadUint32() // unknown

	type linkEntry struct {
		uuidIndex uint32
		guidIndex uint32
		subId     uint32
	}
	links := make([]linkEntry, r.MustReadUint32())
	for i := range links {
		links[i].uuidIndex = r.MustReadUint32()
		links[i].guidIndex = r.MustReadUint32()
		links[i].subId = r.MustReadUint32()
	}

	type legacyEntry struct {
		legacyGuidIndex uint32
		legacySubId     uint32
		guidIndex       uint32
		subId           uint32
	}
	legacy := make([]legacyEntry, r.MustReadUint32())
	for i := range legacy {
		legacy[i].legacyGuidIndex = r.MustReadUint32()
		legacy[i].legacySubId = r.MustReadUint32()
		legacy[i].guidIndex = r.MustReadUint32()
		legacy[i].subId = r.MustReadUint32()
	}

	uuids := newUUIDTable(r, pBlockUuids, pBlockTypes)
	types := newUUIDTable(r, pBlockTypes, pBlockDirs)
	dirs := make(map[uint32]string)

	res = &Document{
		assets: make([]Asset, len(entries)),
		links:  make([]assetLink, len(links)),
		legacy: make([]legacyLink, len(legacy)),
	}
	for i, entry := range entries {
		dir, ok := dirs[entry.dirOffset]
		if !ok {
			r.SeekAbsolute(int(pBlockDirs + entry.dirOffset))
			dir = utils.Must(r.ReadCString())
			dirs[entry.dirOffset] = dir
		}
		r.SeekAbsolute(int(pBlockFiles + entry.nameOffset))
		name := utils.Must(r.ReadCString())

		res.assets[i] = Asset{
			AssetId: AssetId{Guid: uuids.at(entry.uuidIndex), SubID: entry.subId},
			Type:    types.at(entry.typeIndex),
			File:    path.Join(dir, name),
			Size:    entry.fileSize,
		}
	}
	slices.SortStableFunc(res.assets, func(a, b Asset) int {
		return strings.Compare(a.Guid, b.Guid)
	})

	for i, link := range links {
		res.links[i] = assetLink{
			uuid: uuids.at(link.uuidIndex),
			id:   AssetId{Guid: uuids.at(link.guidIndex), SubID: link.subId},
		}
	}
	slices.SortStableFunc(res.links, func(a, b assetLink) int {
		return strings.Compare(a.uuid, b.uuid)
	})

	for i, entry := range legacy {
		res.legacy[i] = legacyLink{
			legacy: AssetId{Guid: uuids.at(entry.legacyGuidIndex), SubID: entry.legacySubId},
			id:     AssetId{Guid: uuids.at(entry.guidIndex), SubID: entry.subId},
		}
	}
	slices.SortStableFunc(res.legacy, func(a, b legacyLink) int {
		return compareAssetId(a.legacy, b.legacy)
	})
	return res, nil
}

func compareAssetId(a, b AssetId) int {
	if c := strings.Compare(a.Guid, b.Guid); c != 0 {
		return c
	}
	return cmp.Compare(a.SubID, b.SubID)
}

// guidRange returns the range of assets with the given guid
func (doc *Document) guidRange(guid string) (int, int) {
	lo := sort.Search(len(doc.assets), func(i int) bool { return doc.assets[i].Guid >= guid })
	hi := lo
	for hi < len(doc.assets) && doc.assets[hi].Guid == guid {
		hi++
	}
	return lo, hi
}

// isShadowed reports whether a later catalog entry has the same asset id. Lookups resolve to the last entry.
func (doc *Document) isShadowed(i int, hi int) bool {
	for j := i + 1; j < hi; j++ {
		if doc.assets[j].SubID == doc.assets[i].SubID {
			return true
		}
	}
	return false
}

// All iterates all assets of the catalog, ordered by guid
func (doc *Document) All() iter.Seq[*Asset] {
	return func(yield func(*Asset) bool) {
		for lo := 0; lo < len(doc.assets); {
			hi := lo + 1
			for hi < len(doc.assets) && doc.assets[hi].Guid == doc.assets[lo].Guid {
				hi++
			}
			for i := lo; i < hi; i++ {
				if !doc.isShadowed(i, hi) && !yield(&doc.assets[i]) {
					return
				}
			}
			lo = hi
		}
	}
}

func (doc *Document) LookupById(id AssetId) *Asset {
	lo, hi := doc.guidRange(id.Guid)
	for i := hi - 1; i >= lo; i-- {
		if doc.assets[i].SubID == id.SubID {
			return &doc.assets[i]
		}
	}
	return nil
}

func (doc *Document) LookupByRef(ref string) *Asset {
	assetId, ok := ParseAssetId(ref)
	if !ok {
		return nil
	}
	return doc.LookupById(assetId)
}

func (doc *Document) Lookup(uuid string, subid uint) *Asset {
	return doc.LookupById(ToAssetId(uuid, subid))
}

func (doc *Document) LookupByUuidLink(uuid string) *Asset {
	return doc.LookupById(doc.LookupLink(uuid))
}

func (doc *Document) AllByGuid(guid string) []*Asset {
	lo, hi := doc.guidRange(strings.ToLower(guid))
	if lo == hi {
		return nil
	}
	result := make([]*Asset, 0, hi-lo)
	for i := lo; i < hi; i++ {
		result = append(result, &doc.assets[i])
	}
	return result
}

func (doc *Document) LookupLink(uuid string) AssetId {
	uuid = strings.ToLower(uuid)
	i := sort.Search(len(doc.links), func(i int) bool { return doc.links[i].uuid > uuid })
	if i > 0 && doc.links[i-1].uuid == uuid {
		return doc.links[i-1].id
	}
	return AssetId{}
}

func (doc *Document) LookupLegacy(uuid string) AssetId {
	assetId, _ := ParseAssetId(uuid)
	i := sort.Search(len(doc.legacy), func(i int) bool { return compareAssetId(doc.legacy[i].legacy, assetId) > 0 })
	if i > 0 && doc.legacy[i-1].legacy == assetId {
		return doc.legacy[i-1].id
	}
	return AssetId{}
}

func (doc *Document) FindByFile(file string) *Asset {
	for asset := range doc.All() {
		if strings.EqualFold(file, asset.File) {
			return asset
		}
	}
	return nil
}

func (doc *Document) Find(assetGuid, assetSubid, assetType, hint string) *Asset {
	azGuid, _ := ParseUUID(assetGuid)
	if azGuid.IsZeroOrEmpty() {
		return nil
	}

	azType, _ := ParseUUID(assetType)
	if azType.IsZeroOrEmpty() {
		slog.Debug("type is empty", "guid", assetGuid, "type", assetType)
		return nil
	}

	list := doc.AllByGuid(azGuid.String())
	if len(list) == 0 {
		return nil
	}

	// assetSubid is a uuid, the system uses only the first block as subid, so we can parse it as uint32
	// 00000002-0000-0000-0000-000000000000 -> subid = 2
	azSubid, _ := ParseUUIDprefixToInt(assetSubid)

	matchType := make([]*Asset, 0)
	matchTypeAndSub := make([]*Asset, 0)
	for _, asset := range list {
		if strings.EqualFold(asset.Type, azType.String()) {
			matchType = append(matchType, asset)
			if asset.AssetId.SubID == azSubid {
				matchTypeAndSub = append(matchTypeAndSub, asset)
			}
		}
	}

	if len(matchTypeAndSub) == 1 {
		return matchTypeAndSub[0]
	}

	if len(matchType) == 1 {
		slog.Debug("disambiguate asset by type only, unique match for type", "guid", assetGuid, "type", assetType, "subid", assetSubid, "hint", hint, "candidates", len(list))
		return matchType[0]
	}

	hint = nwfs.NormalizePath(hint)
	if hint != "" {
		for _, asset := range list {
			if strings.EqualFold(hint, nwfs.NormalizePath(asset.File)) {
				slog.Debug("disambiguate asset by hint as normalized paths", "guid", assetGuid, "type", assetType, "subid", assetSubid, "hint", hint, "assetFile", asset.File, "candidates", len(list))
				return asset
			}
			if strings.EqualFold(hint, path.Base(asset.File)) {
				slog.Debug("disambiguate asset by hint as base path", "guid", assetGuid, "type", assetType, "subid", assetSubid, "hint", hint, "assetFile", asset.File, "candidates", len(list))
				return asset
			}
		}
	}

	slog.Debug("unable to disambiguate asset, multiple candidates with matching type and guid", "guid", assetGuid, "type", assetType, "subid", assetSubid, "hint", hint, "candidates", len(list))
	return nil
}
