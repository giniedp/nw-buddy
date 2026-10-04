package serve

import (
	"fmt"
	"io"
	"log"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/json"
	"os"
	"os/exec"
	"path"
	"strconv"
	"time"

	"github.com/dustin/go-humanize"
	"github.com/gabriel-vasile/mimetype"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/spf13/cobra"

	_ "net/http/pprof" // registers /debug/pprof endpoints
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
	Y_UP        bool
	ViewerDir   string
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

const (
	QUERY_YUP      = "yup"
	QUERY_NO_CACHE = "no-cache"
	QUERY_NO_PROXY = "no-proxy"
	QUERY_NO_LOD   = "no-lod"
)

func init() {
	Cmd.AddCommand(CmdTypegen)
	Cmd.Flags().StringVarP(&flg.GameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().StringVarP(&flg.TempDir, "temp", "t", env.TempDir(), "temporary directory for image conversion")
	Cmd.Flags().StringVarP(&flg.CacheDir, "cache", "c", env.CacheDir(), "image cache directory")
	Cmd.Flags().StringVar(&flg.ModelsDir, "models", env.ModelsDir(), "models directory to serve")
	Cmd.Flags().UintVar(&flg.TextureSize, "texture-size", 2048, "texture size to use for conversion")
	Cmd.Flags().StringVar(&flg.Host, "host", env.ToolsHost(), "host to listen on")
	Cmd.Flags().UintVar(&flg.Port, "port", env.ToolsPort(), "port to listen on")
	Cmd.Flags().StringVar(&flg.CrcFile, "crc-file", "nwt-crc.json", "file with crc hashes. Only used for object-stream conversion")
	Cmd.Flags().StringVar(&flg.UuidFile, "uuid-file", "nwt-types.json", "file with uuid hashes. Only used for object-stream conversion")
	Cmd.Flags().BoolVar(&flg.Y_UP, "yup", false, "whether to convert models to y-up. Only used for model conversion. Use true for three.js or babylon.js preview, false for nw-viewer")
	Cmd.Flags().StringVar(&flg.ViewerDir, "viewer", "viewer", "The viewer app directory")
}

var crcTable rtti.CrcTable
var uuidTable rtti.UuidTable

func run(cmd *cobra.Command, args []string) {

	assets, err := game.InitPackedAssets(flg.GameDir)
	if err != nil {
		log.Fatal("assets not initialized", "error", err)
		return
	}

	crcFile, err := exec.LookPath(flg.CrcFile)
	if err != nil {
		slog.Warn("crc file not found", "file", flg.CrcFile, "err", err)
		return
	}
	crcTable, err = rtti.LoadCrcTable(crcFile)
	if err != nil {
		log.Fatal("crc table not loaded", "error", err)
		return
	}

	uuidFile, err := exec.LookPath(flg.UuidFile)
	if err != nil {
		slog.Warn("uuid file not found", "file", flg.UuidFile, "err", err)
		return
	}
	uuidTable, err = rtti.LoadUuIdTable(uuidFile)
	if err != nil {
		log.Fatal("uuid table not loaded", "error", err)
		return
	}

	r := mux.NewRouter()
	os.MkdirAll(flg.TempDir, os.ModePerm)
	os.MkdirAll(flg.CacheDir, os.ModePerm)

	endpoints := []string{
		"/health",
		"/list/{pattern}",
		"/stats/{filePath}",
		"/files/{filePath}",
		"/models/{filePath}",
		"/assets/{assetId}",
		"/levels/list.json",
		"/levels/{coatlicue}/info.json",
		"/levels/{coatlicue}/{region}/info.json",
		"/levels/{coatlicue}/{region}/capitals.json",
		"/levels/{coatlicue}/{region}/heightmap.r16",
		"/levels/{coatlicue}/{region}/watermap.r16",
		"/levels/{coatlicue}/{region}/distribution.json",
		"/levels/{coatlicue}/{region}/distribution.bin",
	}
	r.HandleFunc("/info", func(w http.ResponseWriter, r *http.Request) {
		serveJson(map[string]any{
			"name": "NWBT API",
			"endpoints": endpoints,
		}, w)
	})

	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		serveJson(map[string]any{
			"status":    "ok",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		}, w)
	})

	r.PathPrefix("/list").Handler(http.StripPrefix("/list", GetListHandler(assets.Archive)))
	r.PathPrefix("/stats").Handler(http.StripPrefix("/stats", GetStatHandler(assets)))
	r.PathPrefix("/files").Handler(http.StripPrefix("/files", GetFileHandler(assets)))
	r.PathPrefix("/models").Handler(http.StripPrefix("/models", http.FileServer(http.Dir(flg.ModelsDir))))
	r.HandleFunc("/assets/{assetId}", GetAssetHandler(assets))

	LevelsRouter(r.PathPrefix("/levels").Subrouter(), assets)
	r.PathPrefix("/").Handler(spaHandler(flg.ViewerDir, "tools/viewer"))

	h := handlers.CustomLoggingHandler(os.Stdout, r, writeLog)
	h = handlers.CORS(handlers.AllowedOrigins([]string{"*"}))(h)
	h = handlers.RecoveryHandler()(h)

	go func() {
		http.ListenAndServe("localhost:6060", nil)
	}()

	addr := fmt.Sprintf("%s:%d", flg.Host, flg.Port)
	slog.Info("serving on", "address", addr)
	slog.Info("browse files at", "nw-buddy", "https://www.nw-buddy.de/pak")
	log.Fatal(http.ListenAndServe(addr, h))
}

// spaHandler serves static files from root, falling back to index.html
// for any path that doesn't match an actual file (SPA client-side routing).
func spaHandler(roots ...string) http.Handler {
	var root string
	for _, r := range roots {
		if info, err := os.Stat(r); err == nil && info.IsDir() {
			root = r
			break
		}
	}
	if root == "" {
		log.Fatal("viewer assets not found", "checked", roots)
	}
	slog.Info("serving viewer from", "dir", root)

	fs := http.Dir(root)
	fileServer := http.FileServer(fs)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Clean the path to prevent directory traversal
		upath := path.Clean(r.URL.Path)

		f, err := fs.Open(upath)
		if err != nil {
			// No matching file (or it's a directory route like /viewer/foo/bar)
			// -> serve index.html and let the client router handle it.
			r2 := new(http.Request)
			*r2 = *r
			r2.URL.Path = "/"
			fileServer.ServeHTTP(w, r2)
			return
		}
		f.Close()

		fileServer.ServeHTTP(w, r)
	})
}
func serveJson(object any, w http.ResponseWriter) {
	data, err := json.MarshalJSON(object, "", "\t")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	serveContent(data, w, "application/json")
}

func serveContent(data []byte, w http.ResponseWriter, contentType string) {
	if contentType != "" {
		w.Header().Set("Content-Type", contentType)
	} else {
		http.DetectContentType(data)
	}
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(data)))
	w.Write(data)
}

func serveNoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

func contentTypeByExtension(ext string) string {
	if res := mimetype.Lookup(ext); res != nil {
		return res.String()
	}
	return ""
}

// buildCommonLogLine builds a log entry for req in Apache Common Log Format.
// ts is the timestamp with which the entry should be logged.
// status and size are used to provide the response HTTP status and size.
func buildCommonLogLine(req *http.Request, url url.URL, ts time.Time, status int, size int) []byte {
	username := "-"
	if url.User != nil {
		if name := url.User.Username(); name != "" {
			username = name
		}
	}

	host, _, err := net.SplitHostPort(req.RemoteAddr)
	if err != nil {
		host = req.RemoteAddr
	}

	uri := req.RequestURI

	// Requests using the CONNECT method over HTTP/2.0 must use
	// the authority field (aka r.Host) to identify the target.
	// Refer: https://httpwg.github.io/specs/rfc7540.html#CONNECT
	if req.ProtoMajor == 2 && req.Method == "CONNECT" {
		uri = req.Host
	}
	if uri == "" {
		uri = url.RequestURI()
	}

	buf := make([]byte, 0, 3*(len(host)+len(username)+len(req.Method)+len(uri)+len(req.Proto)+50)/2)
	buf = append(buf, host...)
	buf = append(buf, " ["...)
	buf = append(buf, ts.Format(time.DateTime)...)
	buf = append(buf, `] "`...)
	buf = append(buf, req.Method...)
	buf = append(buf, " "...)
	buf = append(buf, uri...)
	buf = append(buf, " "...)
	buf = append(buf, req.Proto...)
	buf = append(buf, `" `...)
	buf = append(buf, strconv.Itoa(status)...)
	buf = append(buf, " "...)
	buf = append(buf, humanize.Bytes(uint64(size))...)
	return buf
}

// writeLog writes a log entry for req to w in Apache Common Log Format.
// ts is the timestamp with which the entry should be logged.
// status and size are used to provide the response HTTP status and size.
func writeLog(writer io.Writer, params handlers.LogFormatterParams) {
	buf := buildCommonLogLine(params.Request, params.URL, params.TimeStamp, params.StatusCode, params.Size)
	buf = append(buf, '\n')
	_, _ = writer.Write(buf)
}
