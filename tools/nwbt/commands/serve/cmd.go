package serve

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/env"
	"path"

	"github.com/gorilla/mux"
	"github.com/spf13/cobra"
)

var flgGameDir string
var flgTmpDir string
var flgCacheDir string
var flgHost string
var flgPort uint

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
}

func run(cmd *cobra.Command, args []string) {

	r := mux.NewRouter()
	r.PathPrefix("/assets").Handler(http.StripPrefix("/assets", FileServer(flgGameDir)))
	//h := handlers.LoggingHandler(os.Stdout, r)

	addr := fmt.Sprintf("%s:%d", flgHost, flgPort)
	srv := &http.Server{
		Handler: r,
		Addr:    addr,
	}

	slog.Info("serving on", "address", addr)
	log.Fatal(srv.ListenAndServe())
}

func FileServer(gameDir string) http.HandlerFunc {
	archive, err := nwfs.NewPakFS(gameDir)
	if err != nil {
		log.Fatal("failed to create archive", "error", err)
	}
	fs := &nwfs.FS{Archive: archive}
	return func(w http.ResponseWriter, r *http.Request) {
		http.ServeFileFS(w, r, fs, r.URL.Path)
	}
}
