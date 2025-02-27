package utils

import (
	"log"
	"os"
	"path"
	"slices"
	"strings"
	"time"
)

func TimeStart() time.Time {
	return time.Now()
}

func TimeTrack(start time.Time, name string) {
	elapsed := time.Since(start)
	log.Printf("%s took %s", name, elapsed)
}

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
