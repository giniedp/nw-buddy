package maps

import (
	"iter"
	"slices"
	"sync"
)

type SyncMap[K any, T any] struct {
	data sync.Map
}

func NewSyncMap[K any, T any]() *SyncMap[K, T] {
	return &SyncMap[K, T]{}
}

func (it *SyncMap[K, T]) Store(key K, value T) {
	it.data.Store(key, value)
}

func (r *SyncMap[K, T]) Get(key K) T {
	value, _ := r.Load(key)
	return value
}

func (it *SyncMap[K, T]) Load(key K) (value T, loaded bool) {
	v, ok := it.data.Load(key)
	if !ok {
		loaded = false
		return
	}
	value, loaded = v.(T)
	return
}

func (it *SyncMap[K, T]) LoadOrStore(key K, value T) (T, bool) {
	if v, loaded := it.data.LoadOrStore(key, value); loaded {
		return v.(T), true
	}
	return value, false
}

func (it *SyncMap[K, T]) Delete(key K) {
	it.data.Delete(key)
}

func (it *SyncMap[K, T]) Clear() {
	it.data.Clear()
}

func (it *SyncMap[K, T]) Keys() []K {
	keys := make([]K, 0)
	it.data.Range(func(key, _ any) bool {
		keys = append(keys, key.(K))
		return true
	})
	return keys
}

func (it *SyncMap[K, T]) Values() []T {
	values := make([]T, 0)
	it.data.Range(func(_, value any) bool {
		values = append(values, value.(T))
		return true
	})
	return values
}

func (it *SyncMap[K, T]) Iter() iter.Seq2[K, T] {
	return func(yield func(K, T) bool) {
		it.data.Range(func(key, value any) bool {
			return yield(key.(K), value.(T))
		})
	}
}

func (r *SyncMap[K, T]) MarshalJSON() ([]byte, error) {
	keys := make([]K, 0)
	values := make([]T, 0)
	for key, value := range r.Iter() {
		keys = append(keys, key)
		values = append(values, value)
	}
	return marshalJson[[]K, []T](keys, values)
}

type SyncDict[T any] struct {
	SyncMap[string, T]
}

func NewSyncDict[T any]() *SyncDict[T] {
	return &SyncDict[T]{}
}

func (it *SyncDict[T]) SortedKeys() []string {
	keys := it.Keys()
	slices.Sort(keys)
	return keys
}

func (it *SyncDict[T]) SortedValues() []T {
	keys := it.SortedKeys()
	values := make([]T, len(keys))
	for i, key := range keys {
		values[i], _ = it.Load(key)
	}
	return values
}

func (it *SyncDict[T]) SortedIter() iter.Seq2[string, T] {
	keys := it.SortedKeys()
	return func(yield func(string, T) bool) {
		for _, key := range keys {
			v, _ := it.Load(key)
			if !yield(key, v) {
				break
			}
		}
	}
}

func (r *SyncDict[T]) MarshalJSON() ([]byte, error) {
	keys := make([]string, 0)
	values := make([]T, 0)
	for key, value := range r.Iter() {
		keys = append(keys, key)
		values = append(values, value)
	}
	return marshalJson[[]string, []T](keys, values)
}
