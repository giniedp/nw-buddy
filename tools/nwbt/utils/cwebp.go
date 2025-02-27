package utils

import (
	"os/exec"
)

type cwebp struct{ command string }

var Cwebp = cwebp{"cwebp"}

func (it cwebp) Nmae() string {
	return it.command
}

func (it cwebp) Check() (string, bool) {
	p, err := exec.LookPath(it.command)
	if err != nil {
		return "p", false
	}
	return p, true
}

func (it cwebp) Info() string {
	return `Cwebp is a tool for converting images to WebP format.
  Documentation:        https://developers.google.com/speed/webp/docs/using
  Precompiled Binaries: https://developers.google.com/speed/webp/docs/precompiled
  Download:             https://storage.googleapis.com/downloads.webmproject.org/releases/webp/index.html`
}

func (it cwebp) Run(args ...string) error {
	cmd := exec.Command(it.command, args...)
	// cmd.Stdout = os.Stdout
	// cmd.Stderr = os.Stderr
	return cmd.Run()
}
