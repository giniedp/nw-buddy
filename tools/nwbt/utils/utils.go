package utils

import (
	"os"
	"path"
	"slices"
	"strings"
)

func ReplaceExt(filePath string, ext string) string {
	return strings.TrimSuffix(filePath, path.Ext(filePath)) + ext
}

// WriteFile writes data to a file.
// It creates the directory if it does not exist.
// Data is written to a temporary file and then renamed to the target file.
func WriteFile(file string, data []byte) error {
	dir := path.Dir(file)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	tmp, err := os.CreateTemp(dir, "*")
	if err != nil {
		return err
	}
	defer tmp.Close()
	if _, err := tmp.Write(data); err != nil {
		return err
	}
	tmp.Close()
	return os.Rename(tmp.Name(), file)
}

func FileExists(filePath string) bool {
	_, err := os.Stat(filePath)
	return err == nil || !os.IsNotExist(err)
}

func AppendUniq[S ~[]E, E comparable](slice S, tokens ...E) S {
	for _, token := range tokens {
		if !slices.Contains(slice, token) {
			slice = append(slice, token)
		}
	}
	return slice
}

func AppendUniqNoZero[S ~[]E, E comparable](slice S, tokens ...E) S {
	var zero E
	for _, token := range tokens {
		if !slices.Contains(slice, token) && token != zero {
			slice = append(slice, token)
		}
	}
	return slice
}
