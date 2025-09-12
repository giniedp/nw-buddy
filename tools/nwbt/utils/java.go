package utils

import (
	"bytes"
	"fmt"
	"os/exec"
)

type java struct {
	command string
}

var Java = java{"java"}

func (it java) Name() string {
	return it.command
}

func (it java) Check() (string, bool) {
	res, err := exec.LookPath(it.command)
	return res, err == nil
}

func (it java) Info() string {
	return `Java runtime`
}

func (it java) Command(args ...string) *exec.Cmd {
	return exec.Command(it.command, args...)
}

func (it java) Run(args ...string) error {
	cmd := it.Command(args...)

	// if !options.Silent {
	// 	cmd.Stdout = os.Stdout
	// 	cmd.Stderr = os.Stderr
	// 	return cmd.Run()
	// }
	bOut := new(bytes.Buffer)
	bErr := new(bytes.Buffer)
	cmd.Stdout = bOut
	cmd.Stderr = bErr
	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("%v\n%s %s", err, bOut.String(), bErr.String())
	}
	return nil
}
