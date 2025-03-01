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
