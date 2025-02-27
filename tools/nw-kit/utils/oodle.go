package utils

import (
	"errors"
	"os/exec"
	"unsafe"

	"github.com/ebitengine/purego"
	"golang.org/x/sys/windows"
)

type Oodle interface {
	Decompress(input []byte, inSize int, output []byte, outSize int) (int, error)
}

type oodle struct {
	names      []string
	decompress func(unsafe.Pointer, int, unsafe.Pointer, int, uintptr, uintptr, uintptr, uintptr, uintptr, uintptr, uintptr, uintptr, uintptr, uintptr) uintptr
}

var OodleLib = oodle{
	names: []string{
		"oo2core_9_win64.dll",
		"oo2core_8_win64.dll",
	},
	decompress: nil,
}

func (it oodle) Check() (string, bool) {
	for _, name := range it.names {
		p, err := exec.LookPath(name)
		if err == nil {
			return p, true
		}
	}
	return "", false
}

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

func (it *oodle) Decompress(input []byte, inSize int, output []byte, outSize int) (int, error) {
	if err := it.Load(); err != nil {
		return 0, err
	}
	r1 := it.decompress(
		unsafe.Pointer(&input[0]),
		inSize,
		unsafe.Pointer(&output[0]),
		outSize,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		3,
	)

	return int(r1), nil
}

func OodleInstance() Oodle {
	return &OodleLib
}
