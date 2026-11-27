package main

import (
	_ "embed"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// envTemplate is the `.env` a missing file is created from, the file the packaged app ships (tools/build)
//
//go:embed templates/.env.template
var envTemplate []byte

// envLine is an assignment in a `.env` file, also a commented one (`# NW_GAME=...`)
var envLine = regexp.MustCompile(`^(\s*#\s*)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$`)

// EnvFile is the `.env` that names the New World folder for nwbt and the desktop app: next to nw-buddy.exe in a
// packaged app (nw-buddy-tools.bat runs nwbt with it), the repository's in development
type EnvFile struct {
	Path string
}

// Ensure creates the file from the template when it does not exist
func (f EnvFile) Ensure() error {
	if exists(f.Path) {
		return nil
	}
	if err := os.WriteFile(f.Path, envTemplate, 0o644); err != nil {
		return fmt.Errorf("%s could not be created: %w", f.Path, err)
	}
	return nil
}

// Values reads the assignments of the file, commented ones left out. Quotes around a value are removed.
func (f EnvFile) Values() (map[string]string, error) {
	data, err := os.ReadFile(f.Path)
	if err != nil {
		return nil, fmt.Errorf("%s could not be read: %w", f.Path, err)
	}
	values := map[string]string{}
	for _, line := range strings.Split(string(data), "\n") {
		match := envLine.FindStringSubmatch(strings.TrimRight(line, "\r"))
		if match == nil || match[1] != "" {
			continue
		}
		values[match[2]] = unquote(strings.TrimSpace(match[3]))
	}
	return values, nil
}

// gameDirKey names the New World folder in the file. nwbt reads it first (utils/env), before its workspace keys
// (`NW_GAME_LIVE`, `NW_GAME_PTR`), which the app leaves to nwbt.
const gameDirKey = "NW_GAME"

// GameDir is the New World folder of the file (`NW_GAME`), empty when it is not set
func (f EnvFile) GameDir() (string, error) {
	values, err := f.Values()
	if err != nil {
		return "", err
	}
	return filepath.FromSlash(values[gameDirKey]), nil
}

// SetGameDir writes the New World folder (`NW_GAME`): in place, a commented line of it is uncommented, else the line
// is appended. The other lines and comments stay.
func (f EnvFile) SetGameDir(dir string) error {
	key := gameDirKey
	data, err := os.ReadFile(f.Path)
	if err != nil {
		return err
	}
	assignment := key + "=" + filepath.ToSlash(dir)
	lines := strings.Split(string(data), "\n")
	commented := -1
	replaced := false
	for i, line := range lines {
		match := envLine.FindStringSubmatch(strings.TrimRight(line, "\r"))
		if match == nil || match[2] != key {
			continue
		}
		if match[1] == "" {
			lines[i] = withLineEnd(assignment, line)
			replaced = true
			break
		}
		if commented < 0 {
			commented = i
		}
	}
	if !replaced {
		if commented >= 0 {
			lines[commented] = withLineEnd(assignment, lines[commented])
		} else {
			if len(lines) > 0 && lines[len(lines)-1] == "" {
				lines = lines[:len(lines)-1]
			}
			lines = append(lines, assignment, "")
		}
	}
	if err := os.WriteFile(f.Path, []byte(strings.Join(lines, "\n")), 0o644); err != nil {
		return fmt.Errorf("%s could not be written: %w", f.Path, err)
	}
	return nil
}

// withLineEnd keeps the carriage return of a CRLF line that is replaced
func withLineEnd(line string, replaced string) string {
	if strings.HasSuffix(replaced, "\r") {
		return line + "\r"
	}
	return line
}

func unquote(value string) string {
	if len(value) >= 2 && (value[0] == '"' || value[0] == '\'') && value[len(value)-1] == value[0] {
		return value[1 : len(value)-1]
	}
	return value
}
