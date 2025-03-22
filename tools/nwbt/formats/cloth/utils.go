package cloth

import (
	"nw-buddy/tools/nwfs"
	"regexp"
)

var RxGeometryReference = regexp.MustCompile(`objects[\/\\].*\.(skin|cgf)`)

func TryResolveGeometryReference(file nwfs.File) (string, error) {
	data, err := file.Read()
	if err != nil {
		return "", err
	}
	return RxGeometryReference.FindString(string(data)), nil
}
