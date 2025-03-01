package json

import (
	"bytes"
	"io"

	"github.com/goccy/go-json"
	"github.com/tidwall/pretty"
)

func MarshalJSON(v any, fmt ...string) ([]byte, error) {
	usePretty := len(fmt) == 2
	writer := bytes.NewBuffer(nil)
	enc := json.NewEncoder(writer)
	enc.SetEscapeHTML(false)
	if usePretty {
		enc.SetIndent(fmt[0], fmt[1])
	}
	err := enc.Encode(v)
	if err != nil {
		return nil, err
	}
	data := writer.Bytes()
	if usePretty {
		data = pretty.PrettyOptions(data, &pretty.Options{
			Width:    120,
			Prefix:   fmt[0],
			Indent:   fmt[1],
			SortKeys: false,
		})
	}
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
