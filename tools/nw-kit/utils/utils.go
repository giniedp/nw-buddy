package utils

import (
	"log"
	"path"
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
	return strings.TrimRight(filePath, path.Ext(filePath)) + ext
}
