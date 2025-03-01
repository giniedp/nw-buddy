package maps

import (
	"iter"
	"slices"
	"sync"
)

type SafeSet[T comparable] struct {
	keys []T
	data map[T]bool
	mu   sync.RWMutex
}

func NewSafeSet[T comparable]() *SafeSet[T] {
	return &SafeSet[T]{
		keys: make([]T, 0),
		data: make(map[T]bool, 0),
	}
}

func (r *SafeSet[T]) Len() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.keys)
}

func (r *SafeSet[T]) Clear() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.keys = make([]T, 0)
	r.data = make(map[T]bool, 0)
}

func (r *SafeSet[T]) Store(value T) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.data[value]; !ok {
		r.keys = append(r.keys, value)
	}
	r.data[value] = true
}

func (r *SafeSet[T]) Has(value T) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, ok := r.data[value]
	return ok
}

func (r *SafeSet[T]) Delete(value T) {
	r.mu.Lock()
	defer r.mu.Unlock()
	index := slices.Index(r.keys, value)
	if index == -1 {
		return
	}
	r.keys = slices.Delete(r.keys, index, index+1)
	delete(r.data, value)
}

func (r *SafeSet[T]) Values() []T {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return slices.Clone(r.keys)
}

func (r *SafeSet[T]) Iter() iter.Seq[T] {
	r.mu.Lock()
	defer r.mu.Unlock()
	return func(yield func(T) bool) {
		for _, key := range r.keys {
			if !yield(key) {
				break
			}
		}
	}
}
