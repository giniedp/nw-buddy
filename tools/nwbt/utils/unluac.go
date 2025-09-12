package utils

import (
	"os/exec"
)

type unluac struct {
	jar string
}

var Unluac = unluac{"unluac.jar"}

type LuacOpt struct {
	Output string
}

func (it unluac) Name() string {
	return it.jar
}

func (it unluac) Check() (string, bool) {
	res, err := exec.LookPath(it.jar)
	return res, err == nil
}

func (it unluac) Info() string {
	return `unluac ist a tool to decompile lua bytecode`
}

func (it unluac) Args(input string, options LuacOpt) []string {
	args := make([]string, 0)
	if options.Output != "" {
		args = append(args, "-o", options.Output)
	}
	args = append(args, input)
	return args
}

func (it unluac) Run(input string, options LuacOpt) error {
	jarPath, _ := it.Check()
	args := []string{"-jar", jarPath}
	args = append(args, it.Args(input, options)...)
	return Java.Run(args...)
}
