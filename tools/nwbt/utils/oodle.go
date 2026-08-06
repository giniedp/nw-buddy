package utils

import (
	"os/exec"
	"unsafe"
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

func (it oodle) Info() string {
	return "Oodle data compression library (Kraken/Leviathan), required for unpacking game archives\n" +
		"info: https://www.radgametools.com/oodle.htm\n" +
		"note: not available for standalone download, obtain from an existing game installation"
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
