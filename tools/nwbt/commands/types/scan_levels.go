package types

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/utils/progress"
)

var ErrNoLevelFiles = fmt.Errorf("no lumberyard files found")

func scanLevels(fs nwfs.Archive) (crc rtti.CrcTable, table rtti.UuidTable, err error) {
	files, err := fs.List() // TODO: glob specific file types. Although, runtime of 3m isn't that bad atm.
	if err != nil {
		return nil, nil, err
	}

	table = rtti.NewUuidTable()
	crc = rtti.NewCrcTable()
	alias := map[string]string{
		"AzFramework::SimpleAssetReference<LmbrCentral::MaterialDataAsset>": "AzFramework::SimpleAssetReference<LmbrCentral::MaterialAsset>",
		"WaterOceanComponentData": "OceanSettings",
	}
	bar := progress.Bar(len(files), "XML Object Streams")
	defer bar.Close()
	for _, file := range files {
		bar.Add(1)

		if dds.IsDDS(file.Path()) || dds.IsDDSSplitPart(file.Path()) {
			continue
		}

		data, err := file.Read()
		if err != nil {
			slog.Error(fmt.Sprintf("%v %s", err, file.Path()))
			continue
		}
		if !azcs.IsXmlObjectStream(data) {
			continue
		}
		obj, err := azcs.ParseXml(data)
		if err != nil {
			slog.Error(fmt.Sprintf("%v %s", err, file))
			continue
		}

		obj.Walk(func(node *azcs.WalkXmlNode) bool {
			el := node.Element
			crc.PutName(el.Field)

			name := el.Name
			if alias[name] != "" {
				name = alias[name]
			}
			uuid := el.Type
			if el.Type2 != "" {
				uuid = el.Type2
			}
			uuid = rtti.NormalizeUUID(uuid)
			if !table.Has(uuid) {
				table.Put(uuid, name)
				return true
			}
			prev := table.Get(uuid)
			if prev == name {
				return true
			}
			slog.Warn(fmt.Sprintf("%s already has value %s, incoming %s %s ", uuid, prev, name, el.Type2))

			return true
		})

	}

	return
}

// AzFramework::SimpleAssetReference<LmbrCentral::MaterialDataAsset>
// AzFramework::SimpleAssetReference<LmbrCentral::MaterialAsset>
