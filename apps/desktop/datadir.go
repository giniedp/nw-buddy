package main

import (
	"io"
	"io/fs"
	"log/slog"
	"os"
	"path/filepath"
)

// portableDirName is the folder next to the exe that holds the app's data in a portable install
const portableDirName = "data"

// DataDirs are the folders the app writes to
type DataDirs struct {
	// Config holds config.json
	Config string
	// Data holds the WebView2 profile (local storage, IndexedDB), nwbt's caches and its log
	Data string
	// Portable is true when both are the data folder next to the exe
	Portable bool
}

// resolveDataDirs returns the data folder next to the exe of a packaged app when it can be written, else the user's
// config and cache folders (development runs, an install in Program Files). The first portable start copies the data
// of the user folders.
func resolveDataDirs(exeDir string, packaged bool) DataDirs {
	user := DataDirs{
		Config: userDir(os.UserConfigDir),
		Data:   userDir(os.UserCacheDir),
	}
	if !packaged {
		return user
	}
	dir := filepath.Join(exeDir, portableDirName)
	fresh := !exists(dir)
	if !isWritableDir(dir) {
		slog.Info("data folder next to the exe not writable, using the user folders", "dir", dir)
		return user
	}
	if fresh {
		migrateUserDirs(user, dir)
	}
	return DataDirs{Config: dir, Data: dir, Portable: true}
}

// isWritableDir creates dir if needed and checks that a file can be written in it
func isWritableDir(dir string) bool {
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return false
	}
	file, err := os.CreateTemp(dir, ".write-test-*")
	if err != nil {
		return false
	}
	name := file.Name()
	file.Close()
	os.Remove(name)
	return true
}

// webviewCaches are folders of the WebView2 profile that are not copied: they are rebuilt on demand
var webviewCaches = map[string]bool{
	"Cache":             true,
	"Code Cache":        true,
	"GPUCache":          true,
	"DawnWebGPUCache":   true,
	"DawnGraphiteCache": true,
	"GrShaderCache":     true,
	"ShaderCache":       true,
	"Crashpad":          true,
}

// migrateUserDirs copies config.json and the WebView2 profile (without caches) of the user folders into the new
// portable data folder. The user folders stay as they are. nwbt's caches are not copied.
func migrateUserDirs(user DataDirs, dir string) {
	config := filepath.Join(user.Config, "config.json")
	if exists(config) {
		if err := copyFile(config, filepath.Join(dir, "config.json")); err != nil {
			slog.Warn("config not copied", "err", err)
		}
	}
	profile := filepath.Join(user.Data, "webview2")
	if !exists(profile) {
		return
	}
	slog.Info("copying the WebView2 profile into the data folder", "from", profile, "to", dir)
	err := filepath.WalkDir(profile, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(profile, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dir, "webview2", rel)
		if entry.IsDir() {
			if webviewCaches[entry.Name()] {
				return filepath.SkipDir
			}
			return os.MkdirAll(target, os.ModePerm)
		}
		if !entry.Type().IsRegular() {
			return nil
		}
		return copyFile(path, target)
	})
	if err != nil {
		slog.Warn("WebView2 profile not fully copied", "err", err)
	}
}

func copyFile(from string, to string) error {
	in, err := os.Open(from)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(to)
	if err != nil {
		return err
	}
	if _, err := io.Copy(out, in); err != nil {
		out.Close()
		return err
	}
	return out.Close()
}
