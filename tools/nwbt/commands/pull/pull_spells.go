package pull

import (
	"log/slog"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"

	"github.com/spf13/cobra"
)

var cmdPullSpells = &cobra.Command{
	Use:   TASK_SPELLS,
	Short: "Scans for spells and effects",
	Long:  "",
	Run:   runPullSpells,
}

func runPullSpells(ccmd *cobra.Command, args []string) {
	ctx := NewPullContext()
	slog.SetDefault(logging.DefaultFileHandler())
	ctx.PullSpells()
	slog.SetDefault(logging.DefaultTerminalHandler())
	ctx.PrintStats()
}

type ScannedSpell struct {
	PrefabPath        string
	AreaStatusEffects []string
}

func pullSpells(tables []*datasheet.Document, fs nwfs.Archive, outDir string) {
	bar := progress.Bar(len(tables), "Scanning spells")
	records := maps.NewSyncDict[*ScannedSpell]()

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

				record, hadValue := records.LoadOrStore(prefab, &ScannedSpell{
					PrefabPath: prefab,
				})
				if hadValue {
					continue
				}

				slicePath := path.Join("slices", prefab+".dynamicslice")
				file, ok := fs.Lookup(slicePath)
				if !ok {
					slog.Debug("spell slice not found", "path", slicePath)
					continue
				}
				entity, err := game.LoadAzEntity(file)
				if err != nil {
					slog.Warn("spell slice not loaded", "path", slicePath, "err", err)
					continue
				}
				for _, components := range game.EntitiesOf(game.FindSliceComponent(entity)) {
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
							record.AreaStatusEffects = utils.AppendUniqNoZero(record.AreaStatusEffects, string(effect.M_effectid))
						}
					}
				}
			}
		}
	}

	result := make([]*ScannedSpell, 0)
	for _, value := range records.SortedValues() {
		if len(value.AreaStatusEffects) > 0 {
			result = append(result, value)
		}
	}

	outPath := path.Join(outDir, "spells_metadata.json")
	outData, err := json.MarshalJSON(result, "", "\t")
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
