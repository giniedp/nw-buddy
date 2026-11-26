package main

import (
	"archive/zip"
	"io/fs"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// openWeb opens the Angular build: a folder, or a .zip archive with index.html at its top (nw-data.zip of a packaged
// app, see tools/build). The archive stays open while the app runs.
func openWeb(location string) (fs.FS, error) {
	if strings.EqualFold(filepath.Ext(location), ".zip") {
		return zip.OpenReader(location)
	}
	return os.DirFS(location), nil
}

// spaHandler serves the Angular build. Paths without a file (the app's routes, e.g. /items/123) get index.html: the
// Wails file server answers them with 404.
func spaHandler(files fs.FS) http.Handler {
	server := application.AssetFileServerFS(files)
	if os.Getenv("FRONTEND_DEVSERVER_URL") != "" {
		// the file server proxies the dev server (ng serve), which has its own fallback
		return server
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		name := strings.TrimPrefix(path.Clean(r.URL.Path), "/")
		if name != "" && path.Ext(name) == "" {
			if _, err := fs.Stat(files, name); err != nil {
				r = r.Clone(r.Context())
				r.URL.Path = "/"
			}
		}
		server.ServeHTTP(w, r)
	})
}

// crossOriginIsolation sends the headers that enable SharedArrayBuffer (the viewer's collision and culling workers)
func crossOriginIsolation(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Set("Cross-Origin-Embedder-Policy", "credentialless")
		next.ServeHTTP(w, r)
	})
}
