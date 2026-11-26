package gltf

import (
	"errors"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestLinkedImagesWriteOnce(t *testing.T) {
	images := NewLinkedImages()
	var writes atomic.Int32
	var wg sync.WaitGroup
	for range 16 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			err := images.Write("Textures/A.ktx2", func() error {
				writes.Add(1)
				return nil
			})
			require.NoError(t, err)
		}()
	}
	wg.Wait()
	require.Equal(t, int32(1), writes.Load())
	require.True(t, images.Written("textures/a.ktx2"))
}

func TestLinkedImagesRetryAfterFailure(t *testing.T) {
	images := NewLinkedImages()
	err := images.Write("a.ktx2", func() error {
		return errors.New("failed")
	})
	require.Error(t, err)
	require.False(t, images.Written("a.ktx2"))

	err = images.Write("a.ktx2", func() error {
		return nil
	})
	require.NoError(t, err)
	require.True(t, images.Written("a.ktx2"))
}

func TestLinkedImagesNil(t *testing.T) {
	var images *LinkedImages
	writes := 0
	for range 2 {
		require.NoError(t, images.Write("a.ktx2", func() error {
			writes++
			return nil
		}))
	}
	require.Equal(t, 2, writes)
	require.False(t, images.Written("a.ktx2"))
}
