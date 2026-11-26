package gltf

import (
	"strings"
	"sync"

	"golang.org/x/sync/singleflight"
)

// LinkedImages is shared by the documents that link their images into the same output directory: an image is
// loaded, encoded and written once, the other documents link the written file. A nil LinkedImages writes every time.
type LinkedImages struct {
	group   singleflight.Group
	written sync.Map
}

func NewLinkedImages() *LinkedImages {
	return &LinkedImages{}
}

// Written tells whether the image has been written
func (s *LinkedImages) Written(imageRef string) bool {
	if s == nil {
		return false
	}
	_, ok := s.written.Load(strings.ToLower(imageRef))
	return ok
}

// Write runs write unless the image has been written. Concurrent calls for an image wait for the running one, a
// failed write runs again on the next call.
func (s *LinkedImages) Write(imageRef string, write func() error) error {
	if s == nil {
		return write()
	}
	key := strings.ToLower(imageRef)
	_, err, _ := s.group.Do(key, func() (any, error) {
		if _, ok := s.written.Load(key); ok {
			return nil, nil
		}
		if err := write(); err != nil {
			return nil, err
		}
		s.written.Store(key, struct{}{})
		return nil, nil
	})
	return err
}
