package main

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"golang.org/x/sys/windows/registry"
)

// Problems of the New World folder, GameFolder.Problem
const (
	// the `.env` could not be created or read
	FolderProblemEnv = "env"
	// the `.env` names no folder
	FolderProblemUnset = "unset"
	// the folder of the `.env` does not exist or has no game files (e.g. a drive that is not connected)
	FolderProblemUnreachable = "unreachable"
)

// GameFolder is the New World folder the app and nwbt use, from the `.env`
type GameFolder struct {
	// EnvFile is the `.env` that names the folder
	EnvFile string `json:"envFile"`
	// Dir is the folder, empty when it is not set
	Dir string `json:"dir"`
	// Problem is why nwbt cannot use the folder (FolderProblem*), empty when it can
	Problem string `json:"problem"`
	// Error is the error of FolderProblemEnv
	Error string `json:"error"`
}

// readGameFolder reads the New World folder from the `.env`, creating the file from the template when it is missing
func readGameFolder(env EnvFile) GameFolder {
	folder := GameFolder{EnvFile: env.Path}
	if err := env.Ensure(); err != nil {
		folder.Problem = FolderProblemEnv
		folder.Error = err.Error()
		return folder
	}
	dir, err := env.GameDir()
	if err != nil {
		folder.Problem = FolderProblemEnv
		folder.Error = err.Error()
		return folder
	}
	folder.Dir = dir
	if dir == "" {
		folder.Problem = FolderProblemUnset
	} else if !isGameDir(dir) {
		folder.Problem = FolderProblemUnreachable
	}
	return folder
}

// isGameDir reports whether the folder is a New World installation: the game files are in its `assets` folder
func isGameDir(dir string) bool {
	if dir == "" {
		return false
	}
	info, err := os.Stat(filepath.Join(dir, "assets"))
	return err == nil && info.IsDir()
}

var vdfPath = regexp.MustCompile(`"path"\s+"([^"]+)"`)

// findGameDir looks for New World in the Steam libraries, empty if it is not found. Only on the user's request
// (DesktopService.FindGameDir), the result is stored once the user confirms it.
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
