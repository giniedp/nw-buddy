//go:build windows

package utils

import (
	"errors"

	"github.com/ebitengine/purego"
	"golang.org/x/sys/windows"
)

func (it *oodle) Load() error {
	if it.decompress != nil {
		return nil
	}
	p, ok := it.Check()
	if !ok {
		return errors.New("Oodle library not found")
	}
	handle, err := windows.LoadLibrary(p)
	if err != nil {
		return err
	}
	purego.RegisterLibFunc(&it.decompress, uintptr(handle), "OodleLZ_Decompress")
	return nil
}
