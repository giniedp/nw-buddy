package utils

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"unsafe"

	"github.com/ebitengine/purego"
)

type Oodle interface {
	Decompress(input []byte, inSize int, output []byte, outSize int) (int, error)
}

type oodle struct {
	names      []string
	decompress func(unsafe.Pointer, int, unsafe.Pointer, int, uintptr, uintptr, uintptr, uintptr, uintptr, uintptr, uintptr, uintptr, uintptr, uintptr) uintptr
}

// OodleLib is the Oodle library, loaded on first use: the file from Check, else by name through the system's library
// search
var OodleLib = oodle{
	names:      oodleNames,
	decompress: nil,
}

// oodleEnv is the environment variable with the path of the Oodle library
const oodleEnv = "NW_OODLE"

// Check returns the path of the library file: NW_OODLE when set, else the first library name found on the PATH
func (it oodle) Check() (string, bool) {
	if p := os.Getenv(oodleEnv); p != "" {
		if _, err := os.Stat(p); err != nil {
			return "", false
		}
		return p, true
	}
	for _, dir := range filepath.SplitList(os.Getenv("PATH")) {
		if dir == "" {
			continue
		}
		for _, name := range it.names {
			p := filepath.Join(dir, name)
			if stat, err := os.Stat(p); err == nil && !stat.IsDir() {
				return p, true
			}
		}
	}
	return "", false
}

func (it oodle) Info() string {
	return "Oodle data compression library (Kraken/Leviathan), required for unpacking game archives\n" +
		"info: https://www.radgametools.com/oodle.htm\n" +
		fmt.Sprintf("looked for: %s (or set %s to the library file)\n", OodleLibraryNames(), oodleEnv) +
		"note: not available for standalone download, obtain from an existing game installation"
}

// OodleLibraryNames lists the library file names nwbt looks for on this OS
func OodleLibraryNames() string {
	return strings.Join(OodleLib.names, ", ")
}

func (it *oodle) Load() error {
	if it.decompress != nil {
		return nil
	}
	handle, err := it.open()
	if err != nil {
		return err
	}
	purego.RegisterLibFunc(&it.decompress, handle, "OodleLZ_Decompress")
	return nil
}

func (it *oodle) open() (uintptr, error) {
	if p, ok := it.Check(); ok {
		return loadLibrary(p)
	}
	if p := os.Getenv(oodleEnv); p != "" {
		return 0, fmt.Errorf("Oodle library not found: %s=%s does not exist", oodleEnv, p)
	}
	for _, name := range it.names {
		if handle, err := loadLibrary(name); err == nil {
			return handle, nil
		}
	}
	return 0, errors.New("Oodle library not found: put " + OodleLibraryNames() + " on the PATH or set " + oodleEnv)
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
