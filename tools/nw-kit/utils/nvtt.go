package utils

import "os/exec"

type nvtt struct{ command string }

var Nvtt = nvtt{"nvtt_export"}

func (it nvtt) Name() string {
	return it.command
}

func (it nvtt) Check() (string, bool) {
	p, err := exec.LookPath(it.command)
	if err != nil {
		return p, false
	}
	return p, true
}

func (it nvtt) Info() string {
	return `NVIDIA Texture Tools Exporter is a tool for converting images to and from DDS format.
  Download: https://developer.nvidia.com/texture-tools-exporter`
}
