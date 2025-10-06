package utils

import (
	"os/exec"
)

type gltfCli struct{ command string }

var GltfTransform = gltfCli{"gltf-transform"}

func (it gltfCli) Name() string {
	return it.command
}

func (it gltfCli) Check() (string, bool) {
	p, err := exec.LookPath(it.command)
	if err != nil {
		return p, false
	}
	return p, true
}

func (it gltfCli) Info() string {
	return `gltf-transform `
}

func (it gltfCli) Run(args ...string) error {
	cmd := exec.Command(it.command, args...)
	// cmd.Stdout = os.Stdout
	// cmd.Stderr = os.Stderr
	return cmd.Run()
}
