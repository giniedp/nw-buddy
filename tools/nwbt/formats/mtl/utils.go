package mtl

import (
	"crypto/md5"
	"encoding/hex"

	"github.com/goccy/go-json"
)

func (it *Material) CalculateHash() (string, error) {
	bytes, err := json.Marshal(it)
	if err != nil {
		return "", err
	}

	sum := md5.Sum(bytes)
	return hex.EncodeToString(sum[:]), nil
}
