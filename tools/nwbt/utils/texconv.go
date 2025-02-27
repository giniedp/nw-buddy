package utils

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
)

type texconv struct{ command string }

var Texconv = texconv{"texconv"}

type TexConvOpt struct {
	FileType      string
	Format        string
	Overwrite     bool
	Output        string
	Width         uint32
	Height        uint32
	InvertY       bool
	ReconstructZ  bool
	Alpha         bool
	SeparateAlpha bool
	Nologo        bool
	FeatureLevel  string
	Silent        bool
}

func (it texconv) Name() string {
	return it.command
}

func (it texconv) Check() (string, bool) {
	res, err := exec.LookPath(it.command)
	return res, err == nil
}

func (it texconv) Info() string {
	return `Texconv is a tool for converting images to and from DDS format.
  Documentation: https://github.com/microsoft/DirectXTex/wiki/Texconv
  Download:      https://github.com/microsoft/DirectXTex/releases`
}

func (it texconv) Command(args ...string) *exec.Cmd {
	return exec.Command(it.command, args...)
}

func (it texconv) Args(input string, options TexConvOpt) []string {
	args := make([]string, 0)
	if options.FileType != "" {
		args = append(args, "-ft", options.FileType)
	}
	if options.Format != "" {
		args = append(args, "-f", options.Format)
	}
	if options.Overwrite {
		args = append(args, "-y")
	}
	if options.Output != "" {
		args = append(args, "-o", options.Output)
	}
	if options.Width > 0 {
		args = append(args, "-w", fmt.Sprintf("%d", options.Width))
	}
	if options.Height > 0 {
		args = append(args, "-h", fmt.Sprintf("%d", options.Height))
	}
	if options.InvertY {
		args = append(args, "-inverty")
	}
	if options.ReconstructZ {
		args = append(args, "-reconstructz")
	}
	if options.Alpha {
		args = append(args, "-alpha")
	}
	if options.SeparateAlpha {
		args = append(args, "-sepalpha")
	}
	if options.Nologo {
		args = append(args, "-nologo")
	}
	if options.FeatureLevel != "" {
		args = append(args, "-fl", options.FeatureLevel)
	}
	args = append(args, input)
	return args
}

func (it texconv) Run(input string, options TexConvOpt) error {
	args := it.Args(input, options)
	cmd := it.Command(args...)

	if !options.Silent {
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		return cmd.Run()
	}
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
