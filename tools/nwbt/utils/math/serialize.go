package math

import (
	"encoding/xml"
	"fmt"
	"strconv"
	"strings"
)

type Float32List []float32

func (f *Float32List) UnmarshalXMLAttr(attr xml.Attr) error {
	parts := strings.Split(attr.Value, ",")
	out := make(Float32List, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		val, err := strconv.ParseFloat(p, 64)
		if err != nil {
			return fmt.Errorf("invalid float %q in attribute %q: %w", p, attr.Value, err)
		}
		out = append(out, float32(val))
	}
	*f = out
	return nil
}

func (f Float32List) MarshalXMLAttr(name xml.Name) (xml.Attr, error) {
	strs := make([]string, len(f))
	for i, v := range f {
		strs[i] = strconv.FormatFloat(float64(v), 'g', -1, 64)
	}
	return xml.Attr{Name: name, Value: strings.Join(strs, ",")}, nil
}

type Float64List []float64

func (f *Float64List) UnmarshalXMLAttr(attr xml.Attr) error {
	parts := strings.Split(attr.Value, ",")
	out := make(Float64List, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		val, err := strconv.ParseFloat(p, 64)
		if err != nil {
			return fmt.Errorf("invalid float %q in attribute %q: %w", p, attr.Value, err)
		}
		out = append(out, val)
	}
	*f = out
	return nil
}

func (f Float64List) MarshalXMLAttr(name xml.Name) (xml.Attr, error) {
	strs := make([]string, len(f))
	for i, v := range f {
		strs[i] = strconv.FormatFloat(v, 'g', -1, 64)
	}
	return xml.Attr{Name: name, Value: strings.Join(strs, ",")}, nil
}
