package serve

import (
	"bufio"
	"bytes"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"nw-buddy/tools/commands/models"
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
	"path"
	"strings"

	"github.com/gorilla/mux"
	"github.com/spf13/cobra"
)

var flgGameDir string
var flgTmpDir string
var flgCacheDir string
var flgHost string
var flgPort uint
var flgCrcFile string
var flgUuidFile string
var flgTempDir string

var Cmd = &cobra.Command{
	Use:           "serve",
	Short:         "serves the game files api",
	Long:          ``,
	SilenceErrors: false,
	Run:           run,
	Hidden:        true,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().StringVarP(&flgTmpDir, "temp", "t", env.TempDir(), "temp directory")
	Cmd.Flags().StringVarP(&flgCacheDir, "cache", "c", path.Join(env.TempDir(), "cache"), "image cache directory")
	Cmd.Flags().StringVar(&flgHost, "host", "0.0.0.0", "host to listen on")
	Cmd.Flags().UintVar(&flgPort, "port", 8000, "port to listen on")
	Cmd.Flags().StringVar(&flgCrcFile, "crc-file", path.Join(env.WorkDir(), "tools/nwbt/rtti/nwt/nwt-crc.json"), "file with crc hashes. Only used for object-stream conversion")
	Cmd.Flags().StringVar(&flgUuidFile, "uuid-file", path.Join(env.WorkDir(), "tools/nwbt/rtti/nwt/nwt-types.json"), "file with uuid hashes. Only used for object-stream conversion")
	Cmd.Flags().StringVar(&flgTempDir, "tmp-dir", ".nwbt/tmp", "temporary directory, used for image conversion")
}

var crcTable rtti.CrcTable
var uuidTable rtti.UuidTable

func run(cmd *cobra.Command, args []string) {
	assets, err := game.InitPackedAssets(flgGameDir)
	if err != nil {
		log.Fatal("failed to initialize assets", "error", err)
	}
	crcTable = utils.Must(rtti.LoadCrcTable(flgCrcFile))
	uuidTable = utils.Must(rtti.LoadUuIdTable(flgUuidFile))
	r := mux.NewRouter()
	r.PathPrefix("/raw").Handler(http.StripPrefix("/raw", RawFileServer(assets.Archive)))
	r.PathPrefix("/list").Handler(http.StripPrefix("/list", ListServer(assets.Archive)))
	r.PathPrefix("/file").Handler(http.StripPrefix("/file", FileServer(assets)))

	addr := fmt.Sprintf("%s:%d", flgHost, flgPort)
	srv := &http.Server{
		Handler: r,
		Addr:    addr,
	}

	slog.Info("serving on", "address", addr)
	log.Fatal(srv.ListenAndServe())
}

func RawFileServer(archive nwfs.Archive) http.HandlerFunc {
	fs := &nwfs.FS{Archive: archive}
	return func(w http.ResponseWriter, r *http.Request) {
		http.ServeFileFS(w, r, fs, r.URL.Path)
	}
}

func ListServer(archive nwfs.Archive) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pattern := nwfs.NormalizePath(r.URL.Path)
		slog.Info("listing", "path", pattern)
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
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)
	}
}

func FileServer(assets *game.Assets) http.HandlerFunc {
	archive := assets.Archive
	return func(w http.ResponseWriter, r *http.Request) {
		filePath := nwfs.NormalizePath(r.URL.Path)

		file, ok := archive.Lookup(filePath)
		if ok {
			slog.Info("serving file", "path", filePath)
			serveFile(file, w)
			return
		}

		targetType := path.Ext(filePath)
		fileGlob := utils.ReplaceExt(filePath, "*")
		list, err := archive.Glob(fileGlob)
		slog.Info("looking for", "file", filePath, "glob", fileGlob, "targetType", targetType, "found", len(list))
		for _, file := range list {
			slog.Info("found", "file", file.Path())
		}
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if len(list) == 0 {
			http.Error(w, "file not found", http.StatusNotFound)
			return
		}
		file = list[0]
		data, err := convertFile(assets, file, targetType)
		if err != nil {
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
			image.WithTempDir(flgTempDir),
			image.WithNormalMap(dds.IsNormalMap(file.Path())),
		)
	case ".webp":
		return image.ConvertDDS(
			img.Data,
			image.FormatWEBP,
			image.WithSilent(true),
			image.WithTempDir(flgTempDir),
			image.WithNormalMap(dds.IsNormalMap(file.Path())),
		)
	default:
		return nil, fmt.Errorf("unsupported target format: %s", target)
	}
}

func convertCGF(assets *game.Assets, file nwfs.File, target string) ([]byte, error) {
	c := models.NewCollector(assets)
	group := importer.AssetGroup{}
	model := file.Path()
	model, material := c.ResolveModelMaterialPair(model, "")
	group.Meshes = append(group.Meshes, importer.GeometryAsset{
		GeometryFile: model,
		MaterialFile: material,
	})
	return convertGltf(c, group, target == ".glb")
}

func convertCDF(assets *game.Assets, file nwfs.File, target string) ([]byte, error) {
	c := models.NewCollector(assets)
	group := importer.AssetGroup{}
	model := file.Path()
	asset, err := c.ResolveCdfAsset(model, false)
	if err != nil {
		return nil, err
	}
	if asset != nil {
		for _, mesh := range asset.Attachments {
			model, material := c.ResolveModelMaterialPair(mesh.Binding, mesh.Material)
			if model != "" {
				group.Meshes = append(group.Meshes, importer.GeometryAsset{
					GeometryFile: model,
					MaterialFile: material,
				})
			}
		}
	}

	return convertGltf(c, group, target == ".glb")
}

func convertGltf(c *models.Collector, group importer.AssetGroup, binary bool) ([]byte, error) {
	document := gltf.NewDocument()
	document.ImageLoader = image.LoaderWithConverter{
		Archive:  c.Archive,
		Catalog:  c.Catalog,
		CacheDir: flgCacheDir,
		Converter: image.BasicConverter{
			Format:  ".png",
			TempDir: flgTmpDir,
			Silent:  true,
			// MaxSize: 1024,
		},
	}
	for _, mesh := range group.Meshes {
		document.ImportGeometry(mesh, c.LoadAsset)
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
