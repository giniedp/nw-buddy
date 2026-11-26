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
	return "Optimize and transform glTF 3D assets\n" +
		"docs:    https://gltf-transform.dev/cli\n" +
		"install: npm install --global @gltf-transform/cli"
}

func (it gltfCli) Run(args ...string) error {
	cmd := exec.Command(it.command, args...)
	// cmd.Stdout = os.Stdout
	// cmd.Stderr = os.Stderr
	return cmd.Run()
}
