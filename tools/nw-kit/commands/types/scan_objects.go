package types

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/nw-kit/formats/azcs"
	"nw-buddy/tools/nw-kit/nwfs"
	"nw-buddy/tools/nw-kit/rtti"
	"nw-buddy/tools/nw-kit/utils"
	"nw-buddy/tools/nw-kit/utils/progress"
	"path"
	"strings"
)

func scanObjects(fs nwfs.Archive, uidTable rtti.UuidTable, crcTable rtti.CrcTable) (rtti.TypeTable, error) {
	// patterns := []string{
	// 	"**.dynamicslice",
	// 	"**.slice.meta",
	// 	"**.slicedata",
	// 	"**.metadata",
	// 	"**.chunks",
	// 	"**.waterqt",
	// 	"**.aliasasset",
	// }

	files := utils.Must(fs.Glob("**.{meta,dynamicuicanvas,waterqt,metadata,slicedata,chunks,dynamicslice,aliasasset,slice.meta}"))
	counter := make(map[string]int)

	bar := progress.Bar(len(files), "scanning")
	table := rtti.NewTypeTable()

	for _, file := range files {
		bar.Add(1)

		doc, err := azcs.Load(file)
		if err != nil {
			slog.Error(fmt.Sprintf("%v %s", err, file.Path()))
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
	}
	bar.Close()

	for ext, count := range counter {
		slog.Info(fmt.Sprintf("%s: %d", ext, count))
	}
	return table, nil
}
