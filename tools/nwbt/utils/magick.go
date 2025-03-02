package utils

import "os/exec"

type magick struct{ command string }

var Magick = magick{"magick"}

func (it magick) Name() string {
	return it.command
}

func (it magick) Check() (string, bool) {
	p, err := exec.LookPath(it.command)
	if err != nil {
		return p, false
	}
	return p, true
}

func (it magick) Info() string {
	return `Image Magick tools`
}

func (it magick) Command(args ...string) *exec.Cmd {
	return exec.Command(it.command, args...)
}

func (it magick) Identify(args ...string) *exec.Cmd {
	args = append([]string{"identify"}, args...)
	return exec.Command(it.command, args...)
}

func (it magick) Convert(args ...string) *exec.Cmd {
	args = append([]string{"convert"}, args...)
	return exec.Command(it.command, args...)
}
