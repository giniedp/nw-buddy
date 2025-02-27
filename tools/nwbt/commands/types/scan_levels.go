package types

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"strings"
)

var ErrNoLevelFiles = fmt.Errorf("no lumberyard files found")

func scanLevels(fs nwfs.Archive) (crc rtti.CrcTable, table rtti.UuidTable, err error) {
	files, err := fs.Glob("**.entities_xml")
	if err != nil {
		return nil, nil, err
	}
	if len(files) == 0 {
		return nil, nil, ErrNoLevelFiles
	}
	slog.Info(fmt.Sprintf("%d files", len(files)))

	table = rtti.NewUuidTable()
	crc = rtti.NewCrcTable()
	alias := map[string]string{
		"AzFramework::SimpleAssetReference<LmbrCentral::MaterialDataAsset>": "AzFramework::SimpleAssetReference<LmbrCentral::MaterialAsset>",
		"WaterOceanComponentData": "OceanSettings",
	}
	for _, file := range files {
		data, err := file.Read()
		if err != nil {
			slog.Error(fmt.Sprintf("%v %s", err, file.Path()))
			continue
		}
		if !strings.Contains(string(data), "<ObjectStream") {
			continue
		}
		obj, err := azcs.ParseXml(data)
		if err != nil {
			slog.Error(fmt.Sprintf("%v %s", err, file))
			continue
		}

		obj.Walk(func(el, parent *azcs.XmlElement, index, depth int) bool {
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
