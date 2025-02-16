package utils

import (
	"bytes"
	"io"

	"github.com/goccy/go-json"
)

func MarshalJSON(v any, fmt ...string) ([]byte, error) {
	writer := bytes.NewBuffer(nil)
	enc := json.NewEncoder(writer)
	enc.SetEscapeHTML(false)
	if len(fmt) == 2 {
		enc.SetIndent(fmt[0], fmt[1])
	}
	err := enc.Encode(v)
	if err != nil {
		return nil, err
	}
	return writer.Bytes(), nil
}

func UnmarshalJSON(data []byte, v any) error {
	return json.Unmarshal(data, v)
}

func DecodeJSON(r io.Reader, v any) error {
	dec := json.NewDecoder(r)
	return dec.Decode(v)
}
