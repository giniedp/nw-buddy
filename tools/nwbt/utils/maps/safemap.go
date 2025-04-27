package maps

import (
	"iter"
	"slices"
	"sync"
)

// SafeMap is a thread-safe map using a read-write mutex
// In addition it keeps track of the keys in the order they were inserted
type SafeMap[K comparable, T any] struct {
	keys []K
	data map[K]T
	mu   sync.RWMutex
}

func NewSafeMap[K comparable, T any]() *SafeMap[K, T] {
	return &SafeMap[K, T]{
		keys: make([]K, 0),
		data: make(map[K]T, 0),
	}
}

func (r *SafeMap[K, T]) Len() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.keys)
}

func (r *SafeMap[K, T]) Clear() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.keys = make([]K, 0)
	r.data = make(map[K]T, 0)
}

func (r *SafeMap[K, T]) Store(key K, value T) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.data[key]; !ok {
		r.keys = append(r.keys, key)
	}
	r.data[key] = value
}

func (r *SafeMap[K, T]) Get(key K) T {
	value, _ := r.Load(key)
	return value
}

func (r *SafeMap[K, T]) Load(key K) (T, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	value, ok := r.data[key]
	return value, ok
}

func (r *SafeMap[K, T]) LoadOrStore(key K, v T) (T, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if value, ok := r.data[key]; ok {
		return value, true
	}
	r.keys = append(r.keys, key)
	r.data[key] = v
	return v, false
}

func (r *SafeMap[K, T]) LoadOrStoreFn(key K, factory func() T) (T, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if value, ok := r.data[key]; ok {
		return value, true
	}
	v := factory()
	r.keys = append(r.keys, key)
	r.data[key] = v
	return v, false
}

func (r *SafeMap[K, T]) Has(key K) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, ok := r.data[key]
	return ok
}

func (r *SafeMap[K, T]) Delete(key K) {
	r.mu.Lock()
	defer r.mu.Unlock()
	index := slices.Index(r.keys, key)
	if index == -1 {
		return
	}
	r.keys = append(r.keys[:index], r.keys[index+1:]...)
	delete(r.data, key)
}

func (r *SafeMap[K, T]) SortFunc(cmp func(K, K) int) {
	r.mu.Lock()
	defer r.mu.Unlock()
	slices.SortFunc(r.keys, cmp)
}

func (r *SafeMap[K, T]) Keys() []K {
	r.mu.RLock()
	defer r.mu.RUnlock()
	keys := make([]K, len(r.keys))
	copy(keys, r.keys)
	return keys
}

func (r *SafeMap[K, T]) Values() []T {
	r.mu.RLock()
	defer r.mu.RUnlock()
	values := make([]T, len(r.keys))
	for i, key := range r.keys {
		values[i] = r.data[key]
	}
	return values
}

func (r *SafeMap[K, T]) Iter() iter.Seq2[K, T] {
	r.mu.Lock()
	defer r.mu.Unlock()
	return func(yield func(K, T) bool) {
		for _, key := range r.keys {
			if !yield(key, r.data[key]) {
				break
			}
		}
	}
}

func (r *SafeMap[K, T]) ToMap() map[K]T {
	r.mu.RLock()
	defer r.mu.RUnlock()
	m := make(map[K]T, len(r.keys))
	for _, key := range r.keys {
		m[key] = r.data[key]
	}
	return m
}

func (r *SafeMap[K, T]) MarshalJSON() ([]byte, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	keys := r.Keys()
	values := r.Values()
	return marshalJson[[]K, []T](keys, values)
}

type SafeDict[T any] struct {
	SafeMap[string, T]
}

func NewSafeDict[T any]() *SafeDict[T] {
	return &SafeDict[T]{
		SafeMap: SafeMap[string, T]{
			keys: make([]string, 0),
			data: make(map[string]T, 0),
		},
	}
}

// Sort sorts the keys of the dictionary
func (r *SafeDict[T]) Sort() {
	r.mu.Lock()
	slices.Sort(r.keys)
	r.mu.Unlock()
}

// SortedKeys returns a copy of the keys of the dictionary in sorted order
func (r *SafeDict[T]) SortedKeys() []string {
	keys := r.Keys()
	slices.Sort(keys)
	return keys
}

// SortedValues returns a copy of the values of the dictionary. The values are ordered by the sorted keys.
func (r *SafeDict[T]) SortedValues() []T {
	keys := r.SortedKeys()
	r.mu.RLock()
	defer r.mu.RUnlock()
	values := make([]T, len(keys))
	for i, key := range keys {
		values[i] = r.data[key]
	}
	return values
}

// SortedIter returns an iterator that yields the key-value pairs of the dictionary in sorted order
func (r *SafeDict[T]) SortedIter() iter.Seq2[string, T] {
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

func (r *SafeDict[T]) Write(fn func()) {
	r.mu.Lock()
	defer r.mu.Unlock()
	fn()
}
