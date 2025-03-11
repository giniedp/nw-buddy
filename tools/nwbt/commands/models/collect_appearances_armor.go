package models

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/cdf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
	"path"
	"strings"

	"github.com/spf13/cobra"
)

var cmdCollectArmor = &cobra.Command{
	Use:   "armor",
	Short: "Collects armor appearances",
	Long:  "",
	Run:   runCollectArmor,
}

func init() {
	cmdCollectArmor.Flags().AddFlagSet(Cmd.Flags())
}

func runCollectArmor(ccmd *cobra.Command, args []string) {
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectApperancesArmor()
	c.Convert(flgOutput)
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func (c *Collector) CollectApperancesArmor() {
	for table := range c.EachDatasheet() {
		if table.Schema != "ArmorAppearanceDefinitions" {
			continue
		}
		data := table.RowsAsJSON()

		// Skin1 and Material1 is the primary model/material pair for the appearance. All items have this.
		// Skin2 is filler geometry, adds a naked skin if the item is not fully covered
		// ShortsleeveChestSkin is alternative to Skin1 e.g. for chest pieces when the arms are covered with gloves
		// AppearanceCDF is on chest pieces only but contains full gearset character. This is where Skirt and Cape geometry is to find.

		for _, row := range data {
			scope := "itemappearances"
			id := row.GetString("ItemID")
			model := row.GetString("Skin1")
			material := row.GetString("Material1")
			cdfPath := row.GetString("AppearanceCDF")
			gender := strings.ToLower(row.GetString("Gender"))
			genderChr := ""
			if gender == "male" {
				genderChr = game.CHR_MODEL_MALE
			}
			if gender == "female" {
				genderChr = game.CHR_MODEL_FEMALE
			}
			if model == "" || material == "" {
				// all items should have Skin1 and Material1
				continue
			}

			attachments := getCloth(c.Archive, cdfPath)
			file := strings.ToLower(path.Join(scope, fmt.Sprintf("%s-%s", id, "Skin1")))
			if !c.models.Has(file) {
				group := importer.AssetGroup{}
				group.TargetFile = file
				model, material := c.ResolveModelMaterialPair(model, material)
				if model != "" {
					group.Meshes = append(group.Meshes, importer.GeometryAsset{
						GeometryFile: model,
						MaterialFile: material,
					})
					if genderChr != "" {
						group.Meshes = append(group.Meshes, importer.GeometryAsset{
							GeometryFile: genderChr,
							MaterialFile: game.DEFAULT_MATERIAL,
							SkipGeometry: true, // we are only interested in skin
						})
					}
					for _, attachment := range attachments {
						model, material = c.ResolveModelMaterialPair(attachment.Binding, attachment.Material)
						if model != "" {
							group.Meshes = append(group.Meshes, importer.GeometryAsset{
								GeometryFile: model,
								MaterialFile: material,
							})
						}
					}
					c.models.Store(file, group)
				}
			}

			model = row.GetString("ShortsleeveChestSkin")
			material = row.GetString("Material1")
			file = strings.ToLower(path.Join(scope, fmt.Sprintf("%s-%s", id, "ShortsleeveChestSkin")))
			if !c.models.Has(file) {
				group := importer.AssetGroup{}
				group.TargetFile = file
				model, material := c.ResolveModelMaterialPair(model, material)
				if model != "" {
					group.Meshes = append(group.Meshes, importer.GeometryAsset{
						GeometryFile: model,
						MaterialFile: material,
					})
					if genderChr != "" {
						group.Meshes = append(group.Meshes, importer.GeometryAsset{
							GeometryFile: genderChr,
							MaterialFile: game.DEFAULT_MATERIAL,
							SkipGeometry: true, // we are only interested in skin
						})
					}
					for _, attachment := range attachments {
						model, material = c.ResolveModelMaterialPair(attachment.Binding, attachment.Material)
						if model != "" {
							group.Meshes = append(group.Meshes, importer.GeometryAsset{
								GeometryFile: model,
								MaterialFile: material,
							})
						}
					}
					c.models.Store(file, group)
				}
			}
		}
	}
}

func getCloth(archive nwfs.Archive, cdfPath string) []cdf.Attachment {
	if cdfPath == "" {
		return nil
	}
	cdfFile, ok := archive.Lookup(nwfs.NormalizePath(cdfPath))
	if !ok {
		return nil
	}
	cdfDoc, err := cdf.Load(cdfFile)
	if err != nil {
		slog.Warn("cdf not loaded", "file", cdfFile.Path(), "err", err)
		return nil
	}
	return cdfDoc.SkinsOrCloth()
}
