package maps

import (
	"bytes"
	"nw-buddy/tools/utils/json"
)

func marshalJson[Keys ~[]K, Values ~[]V, K any, V any](keys []K, values []V) ([]byte, error) {
	var buf bytes.Buffer
	buf.WriteRune('{')

	for i, key := range keys {
		value := values[i]
		if i > 0 {
			buf.WriteRune(',')
		}

		data, err := json.MarshalJSON(key)
		if err != nil {
			return nil, err
		}
		buf.WriteRune('\n')
		buf.WriteRune('\t')
		buf.Write(data)
		buf.WriteRune(':')

		data, err = json.MarshalJSON(value)
		if err != nil {
			return nil, err
		}
		buf.Write(data)
	}
	buf.WriteRune('\n')
	buf.WriteRune('}')
	return buf.Bytes(), nil
}
