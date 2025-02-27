package pull

import (
	"log/slog"
	"nw-buddy/tools/commands/pull/scan"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"
	"strings"
)

type ScannedSpell struct {
	PrefabPath        string
	AreaStatusEffects []string
}

func pullSpells(tables []*datasheet.Document, fs nwfs.Archive, outDir string) {
	bar := progress.Bar(len(tables), "Scanning spells")
	records := utils.NewRecord[ScannedSpell]()
	for _, table := range tables {
		bar.Add(1)
		if table.Schema != "SpellData" {
			continue
		}

		rows := table.RowsAsJSON()
		for _, row := range rows {

			prefabs := []string{
				row.GetString("SpellPrefabPath"),
				row.GetString("SecondaryPrefabPath"),
				row.GetString("TertiaryPrefabPath"),
			}
			for _, prefab := range prefabs {
				if prefab == "" {
					continue
				}
				if records.Has(prefab) {
					continue
				}

				slicePath := strings.ToLower(path.Join("slices", prefab+".dynamicslice"))
				file, ok := fs.Lookup(slicePath)
				if !ok {
					slog.Debug("spell slice not found", "path", slicePath)
					continue
				}
				entity, err := scan.LoadAzEntity(file)
				if err != nil {
					slog.Warn("spell slice not loaded", "path", slicePath, "err", err)
					continue
				}
				effects := make([]string, 0)
				for _, components := range scan.EntitiesOf(scan.FindSliceComponent(entity)) {
					for _, component := range components {

						ec, ok := component.(nwt.AreaStatusEffectComponent)
						if !ok {
							continue
						}

						facet, ok := ec.BaseClass1.M_serverFacetPtr.(nwt.AreaStatusEffectComponentServerFacet)
						if !ok {
							continue
						}
						for _, effect := range facet.M_addstatuseffects.Element {
							effects = utils.AppendUniqNoZero(effects, string(effect.M_effectid))
						}
					}
				}
				if len(effects) == 0 {
					continue
				}
				records.Set(prefab, ScannedSpell{
					PrefabPath:        prefab,
					AreaStatusEffects: effects,
				})
			}
		}

	}
	result := records.Values()
	outPath := path.Join(outDir, "spells_metadata.json")
	outData, err := utils.MarshalJSON(result, "", "\t")
	if err != nil {
		slog.Error("failed to marshal spells", "err", err)
		return
	}
	if err := os.WriteFile(outPath, outData, os.ModePerm); err != nil {
		slog.Error("failed to write spells", "err", err)
		return
	}

	bar.Close()
}
