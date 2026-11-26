package types

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"
	"strings"

	"github.com/goreleaser/fileglob"
)

var ErrNoLumberyardFiles = fmt.Errorf("no lumberyard files found")

func scanLumberyard(inputDir string) (crc rtti.CrcTable, table rtti.UuidTable, error error) {

	patterns := []string{
		path.Join(inputDir, "**.xml"),
		path.Join(inputDir, "**.slice"),
		path.Join(inputDir, "**.uicanvas"),
	}

	files := make([]string, 0)
	for _, pattern := range patterns {
		res, err := fileglob.Glob(pattern, fileglob.MaybeRootFS)
		if err != nil {
			return nil, nil, err
		}
		files = append(files, res...)
	}
	if len(files) == 0 {
		return nil, nil, ErrNoLumberyardFiles
	}

	table = rtti.NewUuidTable()
	crc = rtti.NewCrcTable()
	alias := map[string]string{
		"Uuid":                       "AZ::Uuid",
		"unsigned int":               "int",
		"PrefabInstance":             "SliceInstance",
		"PrefabComponent":            "SliceComponent",
		"PrefabReference":            "SliceReference",
		"CanvasFileObject":           "UiCanvasFileObject",
		"EditorMeshComponent":        "EditorStaticMeshComponent",
		"MeshComponentRenderNode":    "StaticMeshComponentRenderNode",
		"MeshRenderOptions":          "StaticMeshRenderOptions",
		"ModuleDescriptor":           "DynamicModuleDescriptor",
		"AssetDatabaseComponent":     "AssetManagerComponent",
		"RotateCameraTarget":         "CameraTargetComponent",
		"BlackListFileComponent":     "ExcludeFileComponent",
		"StaticPhysicsConfiguration": "StaticPhysicsConfig",
		"EditorStaticPhysicsConfiguration<StaticPhysicsConfiguration >": "EditorStaticPhysicsConfig",
	}

	bar := progress.Bar(len(files), "Lumberyard")
	defer bar.Close()

	for _, file := range files {
		bar.Add(1)

		data, err := os.ReadFile(file)
		if !strings.Contains(string(data), "<ObjectStream") {
			continue
		}
		if err != nil {
			slog.Error(fmt.Sprintf("%v %s", err, file))
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
			// types[el.Type] = el.Name
			return true
		})
	}

	return
}
