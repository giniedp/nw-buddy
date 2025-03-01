package catalog

import (
	"io"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
	"path"

	"github.com/gofrs/uuid"
)

type Document = map[string]*Asset

type Asset struct {
	Uuid string `json:"uuid"`
	Type string `json:"type"`
	Name string `json:"name"`
	File string `json:"file"`
}

type AssetInfoRef struct {
	UidIndex1      uint32
	SubId1         uint32
	UidIndex2      uint32
	SubId2         uint32
	TypeIndex      uint32
	Field6         uint32
	FileSize       uint32
	Field8         uint32
	DirOffset      uint32
	FileNameOffset uint32
}

func Load(f nwfs.File) (Document, error) {
	data, err := f.Read()
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

func Read(r io.Reader) (Document, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

func Parse(data []byte) (res Document, err error) {
	defer utils.HandleRecover(&err)

	rr := buf.NewReaderLE(data)
	res = make(map[string]*Asset)

	rr.MustReadBytes(4) // Signature
	rr.MustReadUint32() // Version
	rr.MustReadUint32() // FileSize
	rr.MustReadUint32() // Field4

	pBlockUuids := rr.MustReadUint32() // uuid block offset
	pBlockTypes := rr.MustReadUint32() // type block offset
	pBlockDirs := rr.MustReadUint32()  // dir block offset
	pBlockFiles := rr.MustReadUint32() // file name block offset
	rr.MustReadUint32()                // file sizze

	assetInfoCount := rr.MustReadUint32()
	refs := make([]*AssetInfoRef, assetInfoCount)
	for i := uint32(0); i < assetInfoCount; i++ {
		ref := &AssetInfoRef{}
		ref.UidIndex1 = rr.MustReadUint32()
		ref.SubId1 = rr.MustReadUint32()
		ref.UidIndex2 = rr.MustReadUint32()
		ref.SubId2 = rr.MustReadUint32()
		ref.TypeIndex = rr.MustReadUint32()
		ref.Field6 = rr.MustReadUint32()
		ref.FileSize = rr.MustReadUint32()
		ref.Field8 = rr.MustReadUint32()
		ref.DirOffset = rr.MustReadUint32()
		ref.FileNameOffset = rr.MustReadUint32()
		refs[i] = ref
	}

	for _, ref := range refs {
		asset := &Asset{}
		rr.SeekAbsolute(int(pBlockUuids + 16*ref.UidIndex2))
		asset.Uuid = utils.Must(uuid.FromBytes(rr.MustReadBytes(16))).String()

		rr.SeekAbsolute(int(pBlockTypes + 16*ref.TypeIndex))
		asset.Type = utils.Must(uuid.FromBytes(rr.MustReadBytes(16))).String()

		rr.SeekAbsolute(int(pBlockDirs + ref.DirOffset))
		dir := string(utils.Must(rr.ReadUntilByte(0)))

		rr.SeekAbsolute(int(pBlockFiles + ref.FileNameOffset))
		file := string(utils.Must(rr.ReadUntilByte(0)))

		asset.File = path.Join(dir, file)
		res[asset.Uuid] = asset
	}
	return res, nil
}
