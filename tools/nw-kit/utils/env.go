package utils

import (
	"fmt"
	"log/slog"
	"os"
	"path"
	"testing"

	"github.com/joho/godotenv"
)

var envLoadError error

func init() {
	if testing.Testing() {
		return
	}

	workDir := GetEnvWorkDir()
	envFile := path.Join(workDir, ".env")
	if _, err := os.Stat(envFile); os.IsNotExist(err) {
		envLoadError = err
	} else {
		envLoadError = godotenv.Load(path.Join(GetEnvWorkDir(), ".env"))
	}
	AppendEnvPath(GetEnvWorkDir())
	AppendEnvPath(path.Join(GetEnvWorkDir(), "bin"))
	AppendEnvPath(path.Join(GetEnvWorkDir(), "tools", "bin"))
}

func AppendEnvPath(p string) {
	p = os.Getenv("PATH") + p + ";"
	os.Setenv("PATH", p)
}

func PrintEnvStatus() {
	if envLoadError != nil {
		slog.Error(fmt.Sprintf("[ENV] filed to load .env file: %v", envLoadError))
	} else {
		slog.Info("[ENV] loaded .env file")
	}
	slog.Info(fmt.Sprintf("[ENV]  workspace: %v", GetEnvWorkspaceName()))
	slog.Info(fmt.Sprintf("[ENV]   game dir: %v", GetEnvGameDir()))
	slog.Info(fmt.Sprintf("[ENV] unpack dir: %v", GetEnvUnpackDir()))
}

func GetEnvWorkDir() string {
	value, _ := os.Getwd()
	return value
}

func GetEnv(lookup string, fallback string) string {
	value := os.Getenv(lookup)
	if value == "" {
		ws := GetEnvWorkspaceName()
		if ws != "" {
			value = os.Getenv(lookup + "_" + ws)
		}
	}
	if value == "" {
		return fallback
	}
	return value
}

func GetEnvWorkspaceName() string {
	value := os.Getenv("NW_WORKSPACE")
	if value == "" {
		value = "LIVE"
	}
	return value
}

func GetEnvGameDir() string {
	return GetEnv("NW_GAME", "")
}

func GetEnvUnpackDir() string {
	return GetEnv("NW_UNPACK", "tmp/unpack")
}

func GetEnvLumberyardDir() string {
	return GetEnv("LUMBERYARD_DIR", "")
}
