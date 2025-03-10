package maps

import (
	"iter"
	"slices"
)

// Map is a general purose map that keeps track of the keys in the order they were inserted
type Map[K comparable, T any] struct {
	keys []K
	data map[K]T
}

func NewMap[K comparable, T any]() *Map[K, T] {
	return &Map[K, T]{
		keys: make([]K, 0),
		data: make(map[K]T, 0),
	}
}

func (r *Map[K, T]) Len() int {
	return len(r.keys)
}

func (r *Map[K, T]) Clear() {
	r.keys = make([]K, 0)
	r.data = make(map[K]T, 0)
}

func (r *Map[K, T]) Store(key K, value T) {
	if _, ok := r.data[key]; !ok {
		r.keys = append(r.keys, key)
	}
	r.data[key] = value
}

func (r *Map[K, T]) Get(key K) T {
	return r.data[key]
}

func (r *Map[K, T]) Load(key K) (T, bool) {
	value, ok := r.data[key]
	return value, ok
}

func (r *Map[K, T]) LoadOrStore(key K, v T) (T, bool) {
	if value, ok := r.data[key]; ok {
		return value, true
	}
	r.keys = append(r.keys, key)
	r.data[key] = v
	return v, false
}

func (r *Map[K, T]) LoadOrStoreFn(key K, factory func() T) (T, bool) {
	if value, ok := r.data[key]; ok {
		return value, true
	}
	v := factory()
	r.keys = append(r.keys, key)
	r.data[key] = v
	return v, false
}

func (r *Map[K, T]) LoadOrCreate(key K, factory func() T) T {
	res, _ := r.LoadOrStoreFn(key, factory)
	return res
}

func (r *Map[K, T]) Has(key K) bool {
	_, ok := r.data[key]
	return ok
}

func (r *Map[K, T]) Delete(key K) {
	index := slices.Index(r.keys, key)
	if index == -1 {
		return
	}
	r.keys = append(r.keys[:index], r.keys[index+1:]...)
	delete(r.data, key)
}

func (r *Map[K, T]) SortFunc(cmp func(K, K) int) {
	slices.SortFunc(r.keys, cmp)
}

func (r *Map[K, T]) Keys() []K {
	keys := make([]K, len(r.keys))
	copy(keys, r.keys)
	return keys
}

func (r *Map[K, T]) Values() []T {
	values := make([]T, len(r.keys))
	for i, key := range r.keys {
		values[i] = r.data[key]
	}
	return values
}

func (r *Map[K, T]) Iter() iter.Seq2[K, T] {
	return func(yield func(K, T) bool) {
		for _, key := range r.keys {
			if !yield(key, r.data[key]) {
				break
			}
		}
	}
}

func (r *Map[K, T]) ToMap() map[K]T {
	m := make(map[K]T, len(r.keys))
	for _, key := range r.keys {
		m[key] = r.data[key]
	}
	return m
}

func (r *Map[K, T]) MarshalJSON() ([]byte, error) {
	keys := r.Keys()
	values := r.Values()
	return marshalJson[[]K, []T](keys, values)
}

type Dict[T any] struct {
	Map[string, T]
}

func NewDict[T any]() *Dict[T] {
	return &Dict[T]{
		Map: Map[string, T]{
			keys: make([]string, 0),
			data: make(map[string]T, 0),
		},
	}
}

// Sort sorts the keys of the dictionary
func (r *Dict[T]) Sort() {
	slices.Sort(r.keys)
}

// SortedKeys returns a copy of the keys of the dictionary in sorted order
func (r *Dict[T]) SortedKeys() []string {
	keys := r.Keys()
	slices.Sort(keys)
	return keys
}

// SortedValues returns a copy of the values of the dictionary. The values are ordered by the sorted keys.
func (r *Dict[T]) SortedValues() []T {
	keys := r.SortedKeys()
	values := make([]T, len(keys))
	for i, key := range keys {
		values[i] = r.data[key]
	}
	return values
}

// SortedIter returns an iterator that yields the key-value pairs of the dictionary in sorted order
func (r *Dict[T]) SortedIter() iter.Seq2[string, T] {
	keys := r.SortedKeys()
	return func(yield func(string, T) bool) {
		for _, key := range keys {
			if !yield(key, r.data[key]) {
				break
			}
		}
	}
}
