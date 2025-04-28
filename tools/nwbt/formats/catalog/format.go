package catalog

import (
	"io"
	"log/slog"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
	"path"
	"slices"
	"strings"

	"github.com/gofrs/uuid"
)

const (
	CATALOG_PATH = "assetcatalog.catalog"
)

type Document struct {
	index       map[AssetId]*Asset
	legacyIndex map[AssetId]AssetId
	linkIndex   map[string]AssetId
	indexSet    map[string][]*Asset

	Assets []*AssetEntry  `json:"assets"`
	Links  []*AssetLink   `json:"links"`
	Legacy []*LegacyAsset `json:"legacy"`
}

type Asset struct {
	AssetId
	Type string `json:"type"`
	File string `json:"file"`
	Size uint32 `json:"size"`
}

type AssetEntry struct {
	GuidIndex1 uint32 `json:"-"`
	SubId1     uint32 `json:"subId1"`
	UuidIndex2 uint32 `json:"-"`
	SubId2     uint32 `json:"subId2"`
	TypeIndex  uint32 `json:"-"`
	Field6     uint32 `json:"-"`
	FileSize   uint32 `json:"size"`
	Field8     uint32 `json:"-"`
	DirOffset  uint32 `json:"-"`
	NameOffset uint32 `json:"-"`

	// Resolved values
	Guid1 string `json:"guid1"`
	Guid2 string `json:"guid2"`
	Type  string `json:"type"`
	Dir   string `json:"dir"`
	Name  string `json:"name"`
	File  string `json:"file"`
}

type AssetLink struct {
	UuidIndex uint32
	GuidIndex uint32
	SubId     uint32
	// Resolved values
	Uuid string `json:"uuid"`
	Guid string `json:"guid"`
}

type LegacyAsset struct {
	LegacyGuidIndex uint32 `json:"-"`
	LegacySubid     uint32 `json:"legacySubid"`
	GuidIndex       uint32 `json:"-"`
	Guid            string `json:"guid"`
	// Resolved values
	LegacyGuid string `json:"legacyGuid"`
	Subid      uint32 `json:"subId"`
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

	assetCount := r.MustReadUint32()
	assetEntries := make([]*AssetEntry, assetCount)
	for i := range assetEntries {
		ref := &AssetEntry{}
		ref.GuidIndex1 = r.MustReadUint32()
		ref.SubId1 = r.MustReadUint32()
		ref.UuidIndex2 = r.MustReadUint32()
		ref.SubId2 = r.MustReadUint32()
		ref.TypeIndex = r.MustReadUint32()
		ref.Field6 = r.MustReadUint32()
		ref.FileSize = r.MustReadUint32()
		ref.Field8 = r.MustReadUint32()
		ref.DirOffset = r.MustReadUint32()
		ref.NameOffset = r.MustReadUint32()
		assetEntries[i] = ref
	}

	r.MustReadUint32() // unknown

	assetLinkCount := r.MustReadUint32()
	assetLinks := make([]*AssetLink, assetLinkCount)
	for i := range assetLinks {
		ref := &AssetLink{}
		ref.UuidIndex = utils.Must(r.ReadUint32())
		ref.GuidIndex = utils.Must(r.ReadUint32())
		ref.SubId = utils.Must(r.ReadUint32())
		assetLinks[i] = ref
	}

	legacyAssetCount := r.MustReadUint32()
	legacyAssets := make([]*LegacyAsset, legacyAssetCount)
	for i := range legacyAssets {
		ref := &LegacyAsset{}
		ref.LegacyGuidIndex = r.MustReadUint32()
		ref.LegacySubid = r.MustReadUint32()
		ref.GuidIndex = r.MustReadUint32()
		ref.Subid = r.MustReadUint32()
		legacyAssets[i] = ref
	}

	res = &Document{}
	res.index = make(map[AssetId]*Asset)
	res.indexSet = make(map[string][]*Asset)
	res.linkIndex = make(map[string]AssetId)
	res.legacyIndex = make(map[AssetId]AssetId)
	res.Assets = assetEntries
	res.Links = assetLinks
	res.Legacy = legacyAssets
	for _, ref := range assetEntries {
		r.SeekAbsolute(int(pBlockUuids + 16*ref.GuidIndex1))
		ref.Guid1 = utils.Must(uuid.FromBytes(r.MustReadBytes(16))).String()

		r.SeekAbsolute(int(pBlockUuids + 16*ref.UuidIndex2))
		ref.Guid2 = utils.Must(uuid.FromBytes(r.MustReadBytes(16))).String()

		r.SeekAbsolute(int(pBlockTypes + 16*ref.TypeIndex))
		ref.Type = utils.Must(uuid.FromBytes(r.MustReadBytes(16))).String()

		r.SeekAbsolute(int(pBlockDirs + ref.DirOffset))
		ref.Dir = utils.Must(r.ReadCString())

		r.SeekAbsolute(int(pBlockFiles + ref.NameOffset))
		ref.Name = utils.Must(r.ReadCString())
		ref.File = path.Join(ref.Dir, ref.Name)

		asset := &Asset{
			AssetId: ToAssetId(ref.Guid2, uint(ref.SubId2)),
			Type:    ref.Type,
			File:    ref.File,
			Size:    ref.FileSize,
		}

		res.index[asset.AssetId] = asset
		res.indexSet[asset.AssetId.Guid] = append(res.indexSet[asset.AssetId.Guid], asset)
	}

	for _, ref := range legacyAssets {
		r.SeekAbsolute(int(pBlockUuids + 16*ref.LegacyGuidIndex))
		ref.LegacyGuid = utils.Must(uuid.FromBytes(r.MustReadBytes(16))).String()

		r.SeekAbsolute(int(pBlockUuids + 16*ref.GuidIndex))
		ref.Guid = utils.Must(uuid.FromBytes(r.MustReadBytes(16))).String()

		legacyId := ToAssetId(ref.LegacyGuid, uint(ref.LegacySubid))
		assetId := ToAssetId(ref.Guid, uint(ref.Subid))
		res.legacyIndex[legacyId] = assetId
	}

	for _, ref := range assetLinks {
		r.SeekAbsolute(int(pBlockUuids + 16*ref.UuidIndex))
		ref.Uuid = utils.Must(uuid.FromBytes(r.MustReadBytes(16))).String()

		r.SeekAbsolute(int(pBlockUuids + 16*ref.GuidIndex))
		ref.Guid = utils.Must(uuid.FromBytes(r.MustReadBytes(16))).String()

		res.linkIndex[strings.ToLower(ref.Uuid)] = ToAssetId(ref.Guid, uint(ref.SubId))
	}
	return res, nil
}

func (doc *Document) LookupById(id AssetId) *Asset {
	if asset, ok := doc.index[id]; ok {
		return asset
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
	return doc.LookupById(doc.linkIndex[strings.ToLower(uuid)])
}

func (doc *Document) AllByGuid(guid string) []*Asset {
	assets := doc.indexSet[strings.ToLower(guid)]
	if assets == nil {
		return nil
	}
	return slices.Clone(assets)
}

func (doc *Document) LookupLink(uuid string) AssetId {
	return doc.linkIndex[strings.ToLower(uuid)]
}

func (doc *Document) LookupLegacy(uuid string) AssetId {
	assetId, _ := ParseAssetId(uuid)
	return doc.legacyIndex[assetId]
}

func (doc *Document) Find(assetGuid, assetType, hint string) *Asset {
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
	candidates := make([]*Asset, 0)
	for _, asset := range list {
		if strings.EqualFold(string(azType), asset.Type) {
			candidates = append(candidates, asset)
		}
	}

	if len(candidates) == 0 {
		return nil
	}
	if len(candidates) == 1 {
		return candidates[0]
	}

	hint = nwfs.NormalizePath(hint)
	if hint != "" {
		for _, asset := range candidates {
			if strings.EqualFold(hint, nwfs.NormalizePath(asset.File)) {
				return asset
			}
			if strings.EqualFold(hint, path.Base(asset.File)) {
				return asset
			}
		}
	}

	slog.Debug("take first asset", "guid", assetGuid, "type", assetType, "hint", hint, "candidates", len(candidates))
	return candidates[0]
}
