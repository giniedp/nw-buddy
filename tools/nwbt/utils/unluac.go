package utils

import (
	"bytes"
	"fmt"
	"os/exec"
)

type unluac struct{ command string }

var Unluac = unluac{"cLuaDecompiler"}

type LuacOpt struct {
	Output string
}

func (it unluac) Name() string {
	return it.command
}

func (it unluac) Check() (string, bool) {
	res, err := exec.LookPath(it.command)
	return res, err == nil
}

func (it unluac) Info() string {
	return "Lua bytecode disassembler and decompiler By Coldzer0\n" +
		"docs:     https://github.com/Coldzer0/LuaDecompiler\n" +
		"download: https://github.com/Coldzer0/LuaDecompiler/releases"
}

func (it unluac) Command(args ...string) *exec.Cmd {
	return exec.Command(it.command, args...)
}

func (it unluac) Args(input string, options LuacOpt) []string {
	args := make([]string, 0)
	args = append(args, input)
	return args
}

func (it unluac) Run(input string, options LuacOpt) ([]byte, error) {
	args := it.Args(input, options)
	cmd := it.Command(args...)

	bOut := new(bytes.Buffer)
	bErr := new(bytes.Buffer)
	cmd.Stdout = bOut
	cmd.Stderr = bErr
	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("%w: %s", err, bErr.String())
	}
	return bOut.Bytes(), nil
}
