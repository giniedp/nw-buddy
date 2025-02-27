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
	data := writer.Bytes()
	data = bytes.TrimSuffix(data, []byte("\n"))
	return data, nil
}

func UnmarshalJSON(data []byte, v any) error {
	return json.Unmarshal(data, v)
}

func DecodeJSON(r io.Reader, v any) error {
	dec := json.NewDecoder(r)
	return dec.Decode(v)
}
