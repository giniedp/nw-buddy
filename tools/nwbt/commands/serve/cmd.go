package serve

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/json"
	"os"
	"path"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/spf13/cobra"
	_ "go.uber.org/automaxprocs"
)

type Flags struct {
	GameDir     string
	TempDir     string
	CacheDir    string
	ModelsDir   string
	Host        string
	Port        uint
	CrcFile     string
	UuidFile    string
	TextureSize uint
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
	Cmd.Flags().UintVar(&flg.TextureSize, "texture-size", 2048, "texture size to use for conversion")
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
	os.MkdirAll(flg.TempDir, os.ModePerm)
	os.MkdirAll(flg.CacheDir, os.ModePerm)

	r.PathPrefix("/list").Handler(http.StripPrefix("/list", GetListHandler(assets.Archive)))
	r.PathPrefix("/file").Handler(http.StripPrefix("/file", GetFileHandler(assets)))
	r.PathPrefix("/models").Handler(http.StripPrefix("/models", http.FileServer(http.Dir(flg.ModelsDir))))

	r.HandleFunc("/catalog", GetCatalogHandler(assets))
	r.HandleFunc("/catalog/{assetId}", GetCatalogAssetHandler(assets))
	r.HandleFunc("/level", GetLevelNamesHandler(assets))
	r.HandleFunc("/level/{level}", GetLevelHandler(assets))
	r.HandleFunc("/level/{level}/region/{region}", GetLevelRegionHandler(assets))

	heightmapHandler := GetLevelHeightmapHandler(assets)
	r.HandleFunc("/level/{level}/heightmap", heightmapHandler)
	r.HandleFunc("/level/{level}/heightmap/{z}_{y}_{x}.png", heightmapHandler)

	h := handlers.LoggingHandler(os.Stdout, r)
	h = handlers.CORS(handlers.AllowedOrigins([]string{"*"}))(h)
	h = handlers.RecoveryHandler()(h)

	addr := fmt.Sprintf("%s:%d", flg.Host, flg.Port)
	slog.Info("serving on", "address", addr)
	log.Fatal(http.ListenAndServe(addr, h))
}

func serveJson(object any, w http.ResponseWriter) {
	data, err := json.MarshalJSON(object, "", "\t")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
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
