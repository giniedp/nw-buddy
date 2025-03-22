package serve

import (
	"bufio"
	"bytes"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/formats/gltf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/loc"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/json"
	"os"
	"path"
	"strings"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/spf13/cobra"
)

type Flags struct {
	GameDir   string
	TempDir   string
	CacheDir  string
	ModelsDir string
	Host      string
	Port      uint
	CrcFile   string
	UuidFile  string
}

var flg Flags

var Cmd = &cobra.Command{
	Use:           "serve",
	Short:         "serves the game files api",
	Long:          ``,
	SilenceErrors: false,
	Run:           run,
	Hidden:        true,
}

func init() {
	Cmd.Flags().StringVarP(&flg.GameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().StringVarP(&flg.TempDir, "temp", "t", env.TempDir(), "temporary directory for image conversion")
	Cmd.Flags().StringVarP(&flg.CacheDir, "cache", "c", env.CacheDir(), "image cache directory")
	Cmd.Flags().StringVar(&flg.ModelsDir, "models", env.ModelsDir(), "models directory to serve")
	Cmd.Flags().StringVar(&flg.Host, "host", "0.0.0.0", "host to listen on")
	Cmd.Flags().UintVar(&flg.Port, "port", 8000, "port to listen on")
	Cmd.Flags().StringVar(&flg.CrcFile, "crc-file", path.Join(env.WorkDir(), "tools/nwbt/rtti/nwt/nwt-crc.json"), "file with crc hashes. Only used for object-stream conversion")
	Cmd.Flags().StringVar(&flg.UuidFile, "uuid-file", path.Join(env.WorkDir(), "tools/nwbt/rtti/nwt/nwt-types.json"), "file with uuid hashes. Only used for object-stream conversion")
}

var crcTable rtti.CrcTable
var uuidTable rtti.UuidTable

func run(cmd *cobra.Command, args []string) {
	assets, err := game.InitPackedAssets(flg.GameDir)
	if err != nil {
		log.Fatal("assets not initialized", "error", err)
	}
	crcTable = utils.Must(rtti.LoadCrcTable(flg.CrcFile))
	uuidTable = utils.Must(rtti.LoadUuIdTable(flg.UuidFile))
	r := mux.NewRouter()
	r.PathPrefix("/list").Handler(http.StripPrefix("/list", ListServer(assets.Archive)))
	r.PathPrefix("/file").Handler(http.StripPrefix("/file", FileServer(assets)))
	r.PathPrefix("/models").Handler(http.StripPrefix("/models", http.FileServer(http.Dir(flg.ModelsDir))))
	h := handlers.LoggingHandler(os.Stdout, r)
	h = handlers.CORS(handlers.AllowedOrigins([]string{"*"}))(h)
	h = handlers.RecoveryHandler()(h)

	addr := fmt.Sprintf("%s:%d", flg.Host, flg.Port)
	slog.Info("serving on", "address", addr)
	log.Fatal(http.ListenAndServe(addr, h))
}

func ListServer(archive nwfs.Archive) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pattern := nwfs.NormalizePath(r.URL.Path)
		list, err := archive.Glob(pattern)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		files := make([]string, len(list))
		for i, file := range list {
			files[i] = file.Path()
		}
		content, err := json.MarshalJSON(files, "", "\t")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)
	}
}

func FileServer(assets *game.Assets) http.HandlerFunc {
	archive := assets.Archive
	return func(w http.ResponseWriter, r *http.Request) {
		filePath := nwfs.NormalizePath(r.URL.Path)
		if file, ok := archive.Lookup(filePath); ok {
			serveFile(file, w)
			return
		}

		targetType := path.Ext(filePath)
		filePath = strings.TrimSuffix(filePath, targetType)
		file, ok := archive.Lookup(filePath)
		if !ok {
			slog.Error("file not found", "path", filePath)
			http.Error(w, "file not found", http.StatusNotFound)
			return
		}

		slog.Info("convert", "path", filePath, "format", targetType)
		data, err := convertFile(assets, file, targetType)
		if err != nil {
			slog.Error("conversion failed", "path", filePath, "error", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		serveContent(data, targetType, w)
	}
}

func serveContent(data []byte, ext string, w http.ResponseWriter) {
	if ext == ".json" {
		w.Header().Set("Content-Type", "application/json")
	} else {
		w.Header().Set("Content-Type", http.DetectContentType(data))
	}
	w.Write(data)
}

func serveFile(file nwfs.File, w http.ResponseWriter) {
	data, err := file.Read()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	serveContent(data, path.Ext(file.Path()), w)
}

func convertFile(assets *game.Assets, file nwfs.File, target string) ([]byte, error) {
	if target == "" {
		return file.Read()
	}
	switch path.Ext(file.Path()) {
	case ".datasheet":
		return convertDatasheet(file, target)
	case ".dds":
		return convertDDS(file, target)
	case ".tif":
		return convertDDS(file, target)
	case ".cgf":
		return convertCGF(assets, file, target)
	case ".skin":
		return convertCGF(assets, file, target)
	case ".cdf":
		return convertCDF(assets, file, target)
	case ".xml":
		if strings.HasSuffix(file.Path(), ".loc.xml") {
			return convertLocale(file, target)
		}
	}
	return convertAny(file, target)
}

func convertDatasheet(file nwfs.File, target string) ([]byte, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	switch target {
	case "":
		return data, nil
	case ".json":
		record, err := datasheet.Parse(data)
		if err != nil {
			return nil, err
		}
		return record.ToJSON("", " ")
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}

func convertDDS(file nwfs.File, target string) ([]byte, error) {
	img, err := dds.Load(file)
	if err != nil {
		return nil, err
	}
	if img == nil || img.Data == nil {
		return nil, fmt.Errorf("failed to load dds")
	}
	switch target {
	case "":
		return img.Data, nil
	case ".png":
		return image.ConvertDDS(
			img.Data,
			image.FormatPNG,
			image.WithSilent(true),
			image.WithTempDir(flg.TempDir),
			image.WithNormalMap(dds.IsNormalMap(file.Path())),
		)
	case ".webp":
		return image.ConvertDDS(
			img.Data,
			image.FormatWEBP,
			image.WithSilent(true),
			image.WithTempDir(flg.TempDir),
			image.WithNormalMap(dds.IsNormalMap(file.Path())),
		)
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}

func convertTIF(file nwfs.File, target string) ([]byte, error) {
	img, err := dds.Load(file)
	if err != nil {
		return nil, err
	}
	if img == nil || img.Data == nil {
		return nil, fmt.Errorf("failed to load dds")
	}
	switch target {
	case "":
		return img.Data, nil
	case ".png":
		return image.ConvertDDS(
			img.Data,
			image.FormatPNG,
			image.WithSilent(true),
			image.WithTempDir(flg.TempDir),
			image.WithNormalMap(dds.IsNormalMap(file.Path())),
		)
	case ".webp":
		return image.ConvertDDS(
			img.Data,
			image.FormatWEBP,
			image.WithSilent(true),
			image.WithTempDir(flg.TempDir),
			image.WithNormalMap(dds.IsNormalMap(file.Path())),
		)
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}
func convertCGF(assets *game.Assets, file nwfs.File, target string) ([]byte, error) {
	group := importer.AssetGroup{}
	model := file.Path()
	model, material := assets.ResolveModelMaterialPair(model, "")
	group.Meshes = append(group.Meshes, importer.GeometryAsset{
		GeometryFile: model,
		MaterialFile: material,
	})
	return convertGltf(assets, group, target == ".glb")
}

func convertCDF(assets *game.Assets, file nwfs.File, target string) ([]byte, error) {
	group := importer.AssetGroup{}
	model := file.Path()
	asset, err := assets.ResolveCdfAsset(model)
	if err != nil {
		return nil, err
	}
	for _, mesh := range asset.SkinAndClothAttachments() {
		model, material := assets.ResolveModelMaterialPair(mesh.Binding, mesh.Material)
		if model != "" {
			group.Meshes = append(group.Meshes, importer.GeometryAsset{
				GeometryFile: model,
				MaterialFile: material,
			})
		}
	}
	return convertGltf(assets, group, target == ".glb")
}

func convertGltf(assets *game.Assets, group importer.AssetGroup, binary bool) ([]byte, error) {
	document := gltf.NewDocument()
	document.ImageLoader = image.LoaderWithConverter{
		Archive: assets.Archive,
		Catalog: assets.Catalog,
		Cache:   image.NewCache(flg.CacheDir, ".png"),
		Converter: image.BasicConverter{
			Format:  ".png",
			TempDir: flg.TempDir,
			Silent:  true,
		},
	}
	for _, mesh := range group.Meshes {
		document.ImportGeometry(mesh, assets.LoadAsset)
	}
	document.ImportCgfMaterials()
	var b bytes.Buffer
	w := bufio.NewWriter(&b)
	if err := document.Encode(w, binary); err != nil {
		return nil, err
	}
	w.Flush()
	return b.Bytes(), nil
}

func convertLocale(file nwfs.File, target string) ([]byte, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	switch target {
	case "":
		return data, nil
	case ".json":
		record, err := loc.Parse(data)
		if err != nil {
			return nil, err
		}
		return record.ToJSON("", " ")
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}

func convertAny(file nwfs.File, target string) ([]byte, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	if azcs.IsAzcs(data) {
		return convertAzcs(data, target)
	}

	return nil, fmt.Errorf("unsupported target format: %s", target)
}

func convertAzcs(data []byte, target string) ([]byte, error) {
	switch target {
	case "":
		return data, nil
	case ".json":
		object, err := azcs.Parse(data)
		if err != nil {
			return nil, err
		}
		out, err := rtti.ObjectStreamToJSON(object, crcTable, uuidTable)
		return out, err
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}
