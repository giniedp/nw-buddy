package types

import (
	"log/slog"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/progress"
	"nw-buddy/tools/utils/str"
	"path"
	"strings"
)

func scanObjects(fs nwfs.Archive, uidTable rtti.UuidTable, crcTable rtti.CrcTable) (rtti.TypeTable, error) {

	files := utils.Must(fs.List())
	counter := make(map[string]int)

	bar := progress.Bar(len(files), "Object Streams")
	table := rtti.NewTypeTable()
	for _, file := range files {
		bar.Add(1)

		if dds.IsDDS(file.Path()) || dds.IsDDSSplitPart(file.Path()) {
			continue
		}
		data, err := file.Read()
		if err != nil {
			slog.Error("Can't read file", "file", file.Path(), "error", err)
			continue
		}

		if azcs.IsBinaryObjectStream(data) {
			doc, err := azcs.Parse(data)
			if err != nil {
				slog.Error("Can't load file", "file", file.Path(), "error", err)
				continue
			}

			basename := path.Base(file.Path())
			split := strings.SplitN(basename, ".", 2)
			counter[split[1]]++

			doc.Walk(func(node *azcs.WalkNode) bool {
				el := node.Element
				elType := table.GetOrCreate(el.Type)
				if elType.Name == "" {
					elType.Name = uidTable.Get(elType.ID)
				}
				if el.NameCrc == 0 {
					return true
				}

				parent := node.Parent.Element
				member := table.GetOrCreate(parent.Type).GetOrCreate(el.NameCrc)
				member.AddType(elType.ID)
				member.Name = crcTable.Get(el.NameCrc)

				if !member.Array {
					count := 0
					for _, element := range parent.Elements {
						if element.NameCrc == el.NameCrc {
							count++
						}
					}
					member.Array = count > 1
				}

				return true
			})
		} else if azcs.IsXmlObjectStream(data) {

			doc, err := azcs.ParseXml(data)
			if err != nil {
				slog.Error("Can't load file", "file", file.Path(), "error", err)
				continue
			}

			basename := path.Base(file.Path())
			split := strings.SplitN(basename, ".", 2)
			counter[split[1]]++

			doc.Walk(func(node *azcs.WalkXmlNode) bool {

				el := node.Element
				elType := table.GetOrCreate(rtti.NormalizeUUID(el.Type))

				if elType.Name == "" {
					elType.Name = uidTable.Get(elType.ID)
				}
				if node.Parent != nil {
					elNameCrc := str.Crc32(el.Field)
					parent := node.Parent.Element
					member := table.GetOrCreate(rtti.NormalizeUUID(parent.Type)).GetOrCreate(elNameCrc)
					member.AddType(elType.ID)
					member.Name = el.Field

					if !member.Array {
						count := 0
						for _, element := range parent.Elements {
							if element.Field == el.Field {
								count++
							}
						}
						member.Array = count > 1
					}
				}

				return true
			})
		}

	}
	bar.Close()
	return table, nil
}
