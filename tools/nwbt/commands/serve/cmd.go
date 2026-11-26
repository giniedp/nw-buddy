package serve

import (
	"crypto/tls"
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
	"path/filepath"
	"runtime/debug"
	"strconv"
	"strings"
	"time"

	"github.com/dustin/go-humanize"
	"github.com/gabriel-vasile/mimetype"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/kgolding/zipfs"
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
	TlsPort     uint
	TlsDir      string
	MemLimit    string
	ObjectCache string
	LogRequests bool
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
	// a json array of `{"name", "file"}`: the clips a character (.cdf) export includes
	QUERY_ANIMATIONS = "animations"
)

func init() {
	Cmd.Flags().StringVarP(&flg.GameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().StringVarP(&flg.TempDir, "temp", "t", env.TempDir(), "temporary directory for image conversion")
	Cmd.Flags().StringVarP(&flg.CacheDir, "cache", "c", env.CacheDir(), "image cache directory")
	Cmd.Flags().StringVar(&flg.ModelsDir, "models", env.ModelsDir(), "models directory to serve")
	Cmd.Flags().UintVar(&flg.TextureSize, "texture-size", 0, "maximum size of the textures linked from converted models (texture mode 'link'), 0 for none. Exports and texture requests use their own 'size' parameter")
	Cmd.Flags().StringVar(&flg.Host, "host", env.ToolsHost(), "host to listen on")
	Cmd.Flags().UintVar(&flg.Port, "port", env.ToolsPort(), "port to listen on")
	Cmd.Flags().StringVar(&flg.CrcFile, "crc-file", "nwt-crc.json", "file with crc hashes. Only used for object-stream conversion")
	Cmd.Flags().StringVar(&flg.UuidFile, "uuid-file", "nwt-types.json", "file with uuid hashes. Only used for object-stream conversion")
	Cmd.Flags().BoolVar(&flg.Y_UP, "yup", false, "whether to convert models to y-up. Only used for model conversion. Use true for three.js or babylon.js preview, false for nw-viewer")
	Cmd.Flags().StringVar(&flg.ViewerDir, "viewer", "viewer", "The viewer app directory or .zip archive. Falls back to a viewer.zip next to the executable or in tools/bin")
	Cmd.Flags().UintVar(&flg.TlsPort, "tls-port", 8443, "port for HTTPS / HTTP2 with a self-signed localhost certificate, 0 disables it")
	Cmd.Flags().StringVar(&flg.TlsDir, "tls-dir", path.Join(env.NwbtDir(), "tls"), "directory of the generated certificate")
	Cmd.Flags().StringVar(&flg.MemLimit, "mem-limit", "8GiB", "soft memory limit of the go runtime (GC runs more often near it), 0 disables. Ignored if GOMEMLIMIT is set")
	Cmd.Flags().StringVar(&flg.ObjectCache, "object-cache", "64MiB", "budget of the parsed object stream cache, in source file bytes")
	Cmd.Flags().BoolVar(&flg.LogRequests, "log-requests", false, "log every request, by default only failed requests are logged")
}

func applyMemorySettings() {
	if os.Getenv("GOMEMLIMIT") == "" && flg.MemLimit != "" && flg.MemLimit != "0" {
		if limit, err := humanize.ParseBytes(flg.MemLimit); err != nil {
			slog.Warn("invalid --mem-limit", "value", flg.MemLimit, "err", err)
		} else {
			debug.SetMemoryLimit(int64(limit))
			slog.Info("memory limit", "limit", humanize.IBytes(limit))
		}
	}
	if budget, err := humanize.ParseBytes(flg.ObjectCache); err != nil {
		slog.Warn("invalid --object-cache", "value", flg.ObjectCache, "err", err)
	} else {
		game.ObjectCacheBudget = int64(budget)
	}
}

// fail logs the error and ends the process
func fail(msg string, args ...any) {
	slog.Error(msg, args...)
	os.Exit(1)
}

var crcTable rtti.CrcTable
var uuidTable rtti.UuidTable

func run(cmd *cobra.Command, args []string) {
	applyMemorySettings()

	assets, err := game.InitPackedAssets(flg.GameDir)
	if err != nil {
		fail("cannot load the game files: " + err.Error())
	}
	browseIndex = buildBrowseIndex(assets)

	crcFile, err := exec.LookPath(flg.CrcFile)
	if err != nil {
		fail("crc file not found", "file", flg.CrcFile, "error", err)
	}
	crcTable, err = rtti.LoadCrcTable(crcFile)
	if err != nil {
		fail("crc table not loaded", "file", crcFile, "error", err)
	}

	uuidFile, err := exec.LookPath(flg.UuidFile)
	if err != nil {
		fail("uuid file not found", "file", flg.UuidFile, "error", err)
	}
	uuidTable, err = rtti.LoadUuIdTable(uuidFile)
	if err != nil {
		fail("uuid table not loaded", "file", uuidFile, "error", err)
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
		"/levels/{coatlicue}/{region}/capitals.bin",
		"/levels/{coatlicue}/{region}/heightmap.r16",
		"/levels/{coatlicue}/{region}/watermap.r16",
		"/levels/{coatlicue}/{region}/distribution.json",
		"/levels/{coatlicue}/{region}/distribution.bin",
		"/levels/{coatlicue}/{region}/tractmap.bin",
		"/browse/types",
		"/browse/list?dir=&types=&limit=",
		"/browse/search?q=&types=&limit=",
		"/browse/stat?path=",
		"/characters/animations?model=",
		"POST /characters/compose?target=.glb",
	}
	r.HandleFunc("/info", func(w http.ResponseWriter, r *http.Request) {
		serveJson(map[string]any{
			"name":      "NWBT API",
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
	r.PathPrefix("/files").Handler(http.StripPrefix("/files", compressTextFiles(GetFileHandler(assets))))
	r.PathPrefix("/models").Handler(http.StripPrefix("/models", http.FileServer(http.Dir(flg.ModelsDir))))
	r.HandleFunc("/assets/{assetId}", GetAssetHandler(assets))

	LevelsRouter(r.PathPrefix("/levels").Subrouter(), assets)
	BrowseRouter(r.PathPrefix("/browse").Subrouter(), assets)
	CharactersRouter(r.PathPrefix("/characters").Subrouter(), assets)
	r.PathPrefix("/").Handler(spaHandler(viewerRoots()...))

	h := handlers.CustomLoggingHandler(os.Stdout, r, writeLog)
	// Content-Disposition carries the file name of downloads (download=1), X-Lod-Count the level of detail siblings
	// of a .cgf, for the browser client
	h = handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}),
		handlers.ExposedHeaders([]string{"Content-Disposition", HEADER_LOD_COUNT}),
	)(h)
	h = CORP("cross-origin")(h)
	h = handlers.RecoveryHandler()(h)

	go func() {
		http.ListenAndServe("localhost:6060", nil)
	}()

	if flg.TlsPort > 0 {
		cert, certFile, err := ensureCertificate(flg.TlsDir)
		if err != nil {
			slog.Error("tls disabled, certificate not available", "error", err)
		} else {
			// serves HTTP/2 (negotiated via ALPN), avoids the browser limit of 6 connections per host of HTTP/1.1
			server := &http.Server{
				Addr:      fmt.Sprintf("%s:%d", flg.Host, flg.TlsPort),
				Handler:   h,
				TLSConfig: &tls.Config{Certificates: []tls.Certificate{cert}},
			}
			go func() {
				log.Fatal(server.ListenAndServeTLS("", ""))
			}()
			slog.Info("serving tls on", "address", server.Addr, "url", fmt.Sprintf("https://localhost:%d", flg.TlsPort))
			slog.Info("trust the certificate once with", "command", fmt.Sprintf("certutil -user -addstore Root \"%s\"", certFile))
		}
	}

	addr := fmt.Sprintf("%s:%d", flg.Host, flg.Port)
	slog.Info("serving on", "address", addr)
	slog.Info("browse files at", "nw-buddy", "https://www.nw-buddy.de/pak")
	log.Fatal(http.ListenAndServe(addr, h))
}

// viewerRoots lists the candidate locations of the viewer app, in order of preference:
// the --viewer directory (or zip), a viewer.zip next to the executable, and the packaged tools/bin/viewer.zip.
func viewerRoots() []string {
	roots := []string{flg.ViewerDir}
	if exe, err := os.Executable(); err == nil {
		roots = append(roots, filepath.Join(filepath.Dir(exe), "viewer.zip"))
	}
	return append(roots, filepath.Join("tools", "bin", "viewer.zip"))
}

// spaHandler serves static files from the first existing root (a directory or a .zip archive),
// falling back to index.html for any path that doesn't match an actual file (SPA client-side routing).
func spaHandler(roots ...string) http.Handler {
	var fs http.FileSystem
	var fileServer http.Handler
	for _, root := range roots {
		info, err := os.Stat(root)
		if err != nil {
			continue
		}
		if info.IsDir() {
			fs = http.Dir(root)
			fileServer = http.FileServer(fs)
		} else if strings.EqualFold(filepath.Ext(root), ".zip") {
			zfs, err := zipfs.New(root)
			if err != nil {
				slog.Warn("viewer archive not readable", "file", root, "err", err)
				continue
			}
			fs = zfs
			fileServer = zipfs.FileServer(zfs)
		} else {
			continue
		}
		slog.Info("serving viewer from", "root", root)
		break
	}
	if fs == nil {
		fail("viewer app not found, build it with pnpm viewer:build", "checked", strings.Join(roots, ", "))
	}

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

// serveJson serves the object as compact JSON. API responses are read by code, the browser text views of
// game files are pretty printed by their conversions (convert.go)
func serveJson(object any, w http.ResponseWriter) {
	data, err := json.MarshalJSON(object)
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
	if !flg.LogRequests && params.StatusCode < 400 {
		return
	}
	buf := buildCommonLogLine(params.Request, params.URL, params.TimeStamp, params.StatusCode, params.Size)
	buf = append(buf, '\n')
	_, _ = writer.Write(buf)
}

// compressTextFiles gzips text responses (e.g. the 12 MB atl_controls.xml). Binary game files (banks, textures, meshes)
// do not compress well and are passed through untouched.
func compressTextFiles(next http.Handler) http.Handler {
	compressed := handlers.CompressHandler(next)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch strings.ToLower(path.Ext(r.URL.Path)) {
		case ".xml", ".json", ".csv", ".txt", ".lua", ".cfg":
			compressed.ServeHTTP(w, r)
		default:
			next.ServeHTTP(w, r)
		}
	})
}

func CORP(policy string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Cross-Origin-Resource-Policy", policy)
			next.ServeHTTP(w, r)
		})
	}
}
