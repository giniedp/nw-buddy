package utils

import (
	"bytes"
	"slices"

	"github.com/goccy/go-json"
)

type Record[T any] struct {
	keys []string
	data map[string]T
}

func NewRecord[T any]() *Record[T] {
	return &Record[T]{
		keys: make([]string, 0),
		data: make(map[string]T, 0),
	}
}

func (r *Record[T]) Len() int {
	return len(r.keys)
}

func (r *Record[T]) Clear() {
	r.keys = make([]string, 0)
	r.data = make(map[string]T, 0)
}

func (r *Record[T]) Set(key string, value T) {
	if _, ok := r.data[key]; !ok {
		r.keys = append(r.keys, key)
	}
	r.data[key] = value
}

func (r *Record[T]) Get(key string) (T, bool) {
	value, ok := r.data[key]
	return value, ok
}

func (r *Record[T]) Has(key string) bool {
	_, ok := r.data[key]
	return ok
}

func (r *Record[T]) Delete(key string) bool {
	index := slices.Index(r.keys, key)
	if index == -1 {
		return false
	}
	r.keys = append(r.keys[:index], r.keys[index+1:]...)
	delete(r.data, key)
	return true
}

func (r *Record[T]) Keys() []string {
	return r.keys
}

func (r *Record[T]) Values() []T {
	values := make([]T, len(r.keys))
	for i, key := range r.keys {
		values[i] = r.data[key]
	}
	return values
}

func (r *Record[T]) MarshalJSON() ([]byte, error) {
	var buf bytes.Buffer
	buf.WriteRune('{')

	for i, key := range r.keys {
		if i > 0 {
			buf.WriteRune(',')
		}

		data, err := json.Marshal(key)
		if err != nil {
			return nil, err
		}
		buf.Write(data)
		buf.WriteRune(':')

		data, err = json.Marshal(r.data[key])
		if err != nil {
			return nil, err
		}
		buf.Write(data)
	}

	buf.WriteRune('}')
	return buf.Bytes(), nil
}

func (r *Record[T]) ToDict() map[string]T {
	m := make(map[string]T, len(r.keys))
	for _, key := range r.keys {
		m[key] = r.data[key]
	}
	return m
}
