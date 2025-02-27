package utils

import (
	"bytes"
	"iter"
	"slices"
	"sync"
)

type Record[T any] struct {
	keys []string
	data map[string]T
	mu   *sync.RWMutex
}

func NewRecord[T any]() *Record[T] {
	return &Record[T]{
		keys: make([]string, 0),
		data: make(map[string]T, 0),
		mu:   &sync.RWMutex{},
	}
}

func (r *Record[T]) Len() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.keys)
}

func (r *Record[T]) Clear() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.keys = make([]string, 0)
	r.data = make(map[string]T, 0)
}

func (r *Record[T]) Set(key string, value T) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.data[key]; !ok {
		r.keys = append(r.keys, key)
	}
	r.data[key] = value
}

func (r *Record[T]) Get(key string) (T, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	value, ok := r.data[key]
	return value, ok
}

func (r *Record[T]) GetOrCreate(key string, factory func() T) T {
	r.mu.Lock()
	defer r.mu.Unlock()
	if value, ok := r.data[key]; ok {
		return value
	}
	value := factory()
	r.keys = append(r.keys, key)
	r.data[key] = value
	return value
}

func (r *Record[T]) GetOrDefault(key string) T {
	return r.GetOrCreate(key, func() (zero T) {
		return zero
	})
}

func (r *Record[T]) Has(key string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, ok := r.data[key]
	return ok
}

func (r *Record[T]) Update(key string, update func(T) T) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.data[key] = update(r.data[key])
}

func (r *Record[T]) Delete(key string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	index := slices.Index(r.keys, key)
	if index == -1 {
		return false
	}
	r.keys = append(r.keys[:index], r.keys[index+1:]...)
	delete(r.data, key)
	return true
}

func (r *Record[T]) Keys() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	keys := make([]string, len(r.keys))
	copy(keys, r.keys)
	return keys
}

func (r *Record[T]) SortedKeys() []string {
	keys := r.Keys()
	slices.Sort(keys)
	return keys
}

func (r *Record[T]) Values() []T {
	r.mu.RLock()
	defer r.mu.RUnlock()
	values := make([]T, len(r.keys))
	for i, key := range r.keys {
		values[i] = r.data[key]
	}
	return values
}

// SortedValues returns values of the record in sorted order of the keys.
func (r *Record[T]) SortedValues() []T {
	keys := r.SortedKeys()
	r.mu.RLock()
	defer r.mu.RUnlock()
	values := make([]T, len(keys))
	for i, key := range keys {
		values[i] = r.data[key]
	}
	return values
}

func (r *Record[T]) Iter() iter.Seq2[string, T] {
	r.mu.Lock()
	defer r.mu.Unlock()
	return func(yield func(string, T) bool) {
		for _, key := range r.keys {
			if !yield(key, r.data[key]) {
				break
			}
		}
	}
}

func (r *Record[T]) SortedIter() iter.Seq2[string, T] {
	keys := r.SortedKeys()
	r.mu.Lock()
	defer r.mu.Unlock()
	return func(yield func(string, T) bool) {
		for _, key := range keys {
			if !yield(key, r.data[key]) {
				break
			}
		}
	}
}

func (r *Record[T]) MarshalJSON() ([]byte, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var buf bytes.Buffer
	buf.WriteRune('{')

	for i, key := range r.keys {
		if i > 0 {
			buf.WriteRune(',')
		}

		data, err := MarshalJSON(key)
		if err != nil {
			return nil, err
		}
		buf.Write(data)
		buf.WriteRune(':')

		data, err = MarshalJSON(r.data[key])
		if err != nil {
			return nil, err
		}
		buf.Write(data)
	}

	buf.WriteRune('}')
	return buf.Bytes(), nil
}

func (r *Record[T]) ToMap() map[string]T {
	r.mu.RLock()
	defer r.mu.RUnlock()
	m := make(map[string]T, len(r.keys))
	for _, key := range r.keys {
		m[key] = r.data[key]
	}
	return m
}

func (r *Record[T]) ToSortedMap() map[string]T {
	r.mu.RLock()
	defer r.mu.RUnlock()
	keys := r.SortedKeys()
	m := make(map[string]T, len(keys))
	for _, key := range keys {
		m[key] = r.data[key]
	}
	return m
}
