package types

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/nw-kit/formats/azcs"
	"nw-buddy/tools/nw-kit/nwfs"
	"nw-buddy/tools/nw-kit/rtti"
	"nw-buddy/tools/nw-kit/utils"
)

func scanObjects(fs nwfs.FileSystem, uidTable rtti.UuidTable, crcTable rtti.CrcTable) (rtti.TypeTable, error) {
	// patterns := []string{
	// 	"**.dynamicslice",
	// 	"**.slice.meta",
	// 	"**.slicedata",
	// 	"**.metadata",
	// 	"**.chunks",
	// 	"**.waterqt",
	// 	"**.aliasasset",
	// }

	files := utils.Must(fs.Glob("**.{meta,dynamicuicanvas,waterqt,metadata,slicedata,chunks,dynamicslice}"))

	bar := utils.Progress(len(files), "scanning", 0)
	table := rtti.NewTypeTable()

	for _, file := range files {
		bar.Add(1)

		doc, err := azcs.Load(file)
		if err != nil {
			slog.Error(fmt.Sprintf("%v %s", err, file.Path()))
			continue
		}

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
	}
	bar.Close()

	return table, nil
}
