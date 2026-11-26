package main

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"golang.org/x/sys/windows/registry"
)

// isGameDir reports whether the folder is a New World installation: the game files are in its `assets` folder
func isGameDir(dir string) bool {
	if dir == "" {
		return false
	}
	info, err := os.Stat(filepath.Join(dir, "assets"))
	return err == nil && info.IsDir()
}

var vdfPath = regexp.MustCompile(`"path"\s+"([^"]+)"`)

// findGameDir looks for New World in the Steam libraries, empty if it is not found
func findGameDir() string {
	key, err := registry.OpenKey(registry.CURRENT_USER, `Software\Valve\Steam`, registry.QUERY_VALUE)
	if err != nil {
		return ""
	}
	defer key.Close()
	steam, _, err := key.GetStringValue("SteamPath")
	if err != nil {
		return ""
	}
	libraries := []string{steam}
	if data, err := os.ReadFile(filepath.Join(steam, "steamapps", "libraryfolders.vdf")); err == nil {
		for _, match := range vdfPath.FindAllStringSubmatch(string(data), -1) {
			// vdf escapes backslashes
			libraries = append(libraries, strings.ReplaceAll(match[1], `\\`, `\`))
		}
	}
	for _, library := range libraries {
		dir := filepath.Join(library, "steamapps", "common", "New World")
		if isGameDir(dir) {
			return filepath.Clean(dir)
		}
	}
	return ""
}
