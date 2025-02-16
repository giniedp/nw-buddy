package scan

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/nw-kit/formats/azcs"
	"nw-buddy/tools/nw-kit/nwfs"
	"nw-buddy/tools/nw-kit/rtti"
	"nw-buddy/tools/nw-kit/rtti/nwt"
	"nw-buddy/tools/nw-kit/utils"
	"path"
	"strings"

	"github.com/spf13/cobra"
)

var flgGameDir string
var Cmd = &cobra.Command{
	Use:           "scan",
	Short:         "scans slices for spawn positions",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", utils.GetEnvGameDir(), "game root directory")
}

func run(ccmd *cobra.Command, args []string) {
	fs := utils.Must(nwfs.NewPakFS(flgGameDir))
	files := utils.Must(fs.Glob(
		// "sharedassets/coatlicue/**/regions/**/*.capitals",
		// "sharedassets/coatlicue/**/regions/**/*.metadata",
		// "sharedassets/coatlicue/**/regions/**/*.slicedata",
		// "**/pois/territories**.dynamicslice",
		// "**/pois/zones**.dynamicslice",
		// "**/region.distribution",
		"**.dynamicslice",
		//"!lyshineui/**",
	))
	//bar := utils.Progress(len(files), "Scanning slices", 5)
	for _, file := range files {
		// bar.Add(1)
		// bar.AddDetail(file.Path())
		slog.Info(file.Path())
		err := scanSlice(file)
		if err != nil {
			slog.Warn(fmt.Sprintf("%v", err))
		}
	}

}

func scanSlice(file nwfs.File) (err error) {
	defer utils.HandleRecover(&err, "failed to scan slice")

	ctx := NewScanContext()

	filePath := file.Path()
	switch path.Ext(filePath) {
	case ".distribution":
		scanDistributions(file, ctx)
	case ".dynamicslice":
		if strings.HasPrefix(filePath, "slices/pois/zones") || strings.HasPrefix(filePath, "slices/pois/territories") {
			scanForZones(file, ctx)
		}
		if strings.HasPrefix(filePath, "slices/characters") || strings.HasPrefix(filePath, "slices/dungeon") {
			scanForVitals(file, ctx)
		}
	case ".slicedata":
	case ".capitals":
	}

	data := utils.Must(file.Read())
	doc := utils.Must(azcs.Parse(data))
	for _, el := range doc.Elements {
		node, err := rtti.Load(el)
		if err != nil {
			return err
		}
		switch v := node.(type) {
		case nwt.AZ__Entity:
			scanEntity(v)

		}
	}

	return nil
}

func scanForZones(file nwfs.File, ctx *ScanContext) {

}

func scanForVitals(file nwfs.File, ctx *ScanContext) {

}
func scanEntity(it nwt.AZ__Entity) {
	//fmt.Println(string(utils.Must(json.MarshalIndent(it, "", "  "))))
	slog.Info(fmt.Sprintf("Entity %s", it.Name))
	walkEntity(it, func(e *nwt.AZ__Entity, components []any) {
		for i, component := range components {
			slog.Info(fmt.Sprintf("Component %#v", i))
			switch v := component.(type) {
			case nwt.TransformComponent:
				slog.Info(fmt.Sprintf("%#v", v.Transform.Data))
			case nwt.PolygonPrismShapeComponent:
				slog.Info("PolygonPrismShapeComponent")

				// v.Configuration.PolygonPrism.Element.VertexContainer.Vertices.Element
				// slog.Info(fmt.Sprintf("%#v", v.Transform.Data))
			case nwt.TerritoryDataProviderComponent:
				slog.Info(fmt.Sprintf("TerritoryDataProviderComponent %v", v.Territory_id))
				//
			}
		}
	})
}

type EntityWalkFn func(entity *nwt.AZ__Entity, components []any)

func walkEntity(it nwt.AZ__Entity, fn EntityWalkFn) {
	for _, component := range it.Components.Element {
		if v, ok := component.(nwt.SliceComponent); ok {
			for _, e := range v.Entities.Element {
				fn(&e, e.Components.Element)
			}
		}
	}
}
