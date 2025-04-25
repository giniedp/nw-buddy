package env

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"path"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"testing"

	"github.com/joho/godotenv"
)

var envLoadError error
var (
	_, b, _, _     = runtime.Caller(0)
	projectRoot    = filepath.Join(filepath.Dir(b), "../../../..")
	projectVersion = readPackageJsonVersion(path.Join(projectRoot, "package.json"))
)

func init() {
	workDir := WorkDir()
	envFile := path.Join(workDir, ".env")
	if _, err := os.Stat(envFile); os.IsNotExist(err) {
		envLoadError = err
	} else {
		envLoadError = godotenv.Load(path.Join(WorkDir(), ".env"))
	}

	AppendToPATH(WorkDir())
	AppendToPATH(path.Join(WorkDir(), "bin"))
	AppendToPATH(path.Join(WorkDir(), "tools", "bin"))
}

func AppendToPATH(p string) {
	p = os.Getenv("PATH") + p + ";"
	os.Setenv("PATH", p)
}

func PrintStatus() {
	if envLoadError != nil {
		slog.Error(fmt.Sprintf("[ENV] filed to load .env file: %v", envLoadError))
	} else {
		slog.Info("[ENV] loaded .env file")
	}
	slog.Info(fmt.Sprintf("[ENV]  workspace: %v", WorkspaceName()))
	slog.Info(fmt.Sprintf("[ENV]   game dir: %v", GameDir()))
	slog.Info(fmt.Sprintf("[ENV]   temp dir: %v", TempDir()))
	slog.Info(fmt.Sprintf("[ENV] unpack dir: %v", UnpackDir()))
	slog.Info(fmt.Sprintf("[ENV]  cache dir: %v", CacheDir()))
	slog.Info(fmt.Sprintf("[ENV]   pull dir: %v", PullDataDir()))
}

// WorkDir returns the current working directory from where the application is running, usually the project root.
// During tests, this always returns the project root.
func WorkDir() string {
	if testing.Testing() {
		return projectRoot
	}

	value, _ := os.Getwd()
	return strings.ReplaceAll(value, "\\", "/")
}

// WorkspaceName returns the workspace name by looking up the NW_WORKSPACE environment variable
// if not set, it defaults to "LIVE"
func WorkspaceName() string {
	value := os.Getenv("NW_WORKSPACE")
	if value == "" {
		value = "LIVE"
	}
	return value
}

// Get returns the value of the environment variable with the given lookup
func Get(lookup string, fallback string) string {
	value := os.Getenv(lookup)
	if value == "" {
		ws := WorkspaceName()
		if ws != "" {
			value = os.Getenv(lookup + "_" + ws)
		}
	}
	if value == "" {
		return fallback
	}
	return value
}

// GameDir returns the game directory by looking up the NW_GAME environment variable
func GameDir() string {
	return Get("NW_GAME", "")
}

func NwbtDir() string {
	return path.Join(WorkDir(), ".nwbt")
}

// TempDir returns the temp directory by looking up the NW_TEMP environment variable
// if not set, it defaults to ".nwbt"
func TempDir() string {
	return Get("NW_TEMP", path.Join(NwbtDir(), "temp"))
}

// UnpackDir returns the unpack directory by looking up the NW_UNPACK environment variable
func UnpackDir() string {
	return Get("NW_UNPACK", path.Join(NwbtDir(), "unpack"))
}

// ModelsDir returns the models directory by looking up the NW_MODELS environment variable
func ModelsDir() string {
	return Get("NW_MODELS", path.Join(NwbtDir(), "models"))
}

// PreferredWorkerCount for general purpose tasks
func PreferredWorkerCount() int {
	defaultMin := 4
	defaultVal := max(defaultMin, runtime.NumCPU()/2)
	strValue := os.Getenv("NW_WORKER_COUNT")
	if value, err := strconv.Atoi(strValue); err != nil && value > 0 {
		return value
	}
	return defaultVal
}

// PullDataDir returns the pull directory by looking up the NW_PULL_DATA environment variable
func PullDataDir() string {
	fallback := path.Join(NwbtDir(), "pull")
	if projectVersion != "" {
		fallback = path.Join(WorkDir(), "dist", "nw-data", strings.ToLower(WorkspaceName()))
	}
	return Get("NW_PULL_DATA", fallback)
}

// PullDir returns the pull directory by looking up the NW_PULL_TYPES environment variable
func PullTypesDir() string {
	fallback := path.Join(NwbtDir(), "pull")
	if projectVersion != "" {
		fallback = path.Join(WorkDir(), "libs", "nw-data", "generated")
	}
	return Get("NW_PULL_TYPES", fallback)
}

// CacheDir returns the cache directory by looking up the NW_CACHE environment variable
func CacheDir() string {
	return Get("NW_CACHE", path.Join(NwbtDir(), "cache"))
}

// LumberyardDir returns the lumberyard directory by looking up the LUMBERYARD_DIR environment variable
func LumberyardDir() string {
	return Get("LUMBERYARD_DIR", "")
}

// ToolsHost returns the tools host by looking up the NW_TOOLS_HOST environment variable
func ToolsHost() string {
	return Get("NW_TOOLS_HOST", "0.0.0.0")
}

// ToolsPort returns the tools port by looking up the NW_TOOLS_PORT environment variable
func ToolsPort() uint {
	strPort := Get("NW_TOOLS_PORT", "8000")
	if port, err := strconv.Atoi(strPort); err != nil {
		return 8000
	} else {
		return uint(port)
	}
}

// Logfile returns the log file path
func Logfile() string {
	fallback := "nwbt.log"
	if testing.Testing() {
		fallback = "test.log"
	}
	return path.Join(NwbtDir(), fallback)
}

func readPackageJsonVersion(file string) string {
	type PackageJson struct {
		Name    string `json:"name"`
		Version string `json:"version"`
	}

	pack := PackageJson{}
	data, err := os.ReadFile(file)
	if err != nil {
		return ""
	}
	if err := json.Unmarshal(data, &pack); err != nil {
		return ""
	}
	return pack.Version
}
