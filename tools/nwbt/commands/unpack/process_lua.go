package unpack

import (
	"bytes"
	"fmt"
	"nw-buddy/tools/utils"
	"os"
	"strings"
)

var luacSig = []byte{0x04, 0x00, 0x1b, 0x4c, 0x75, 0x61}

func processLua(task *Task, format string) {
	data, err := task.Input.Read()
	output := &TaskOutput{
		Path:  task.Input.Path(),
		Data:  data,
		Error: err,
	}
	task.Output = append(task.Output, output)
	task.Error = err

	if err != nil {
		return
	}

	switch format {
	case "":
		return
	case FMT_LUA:
		if bytes.Equal(luacSig, data[:len(luacSig)]) {
			data = data[2:]
		}

		inputFile, err := copyToTemp(data, ".luac", flgTempDir)
		defer os.Remove(inputFile)
		if err != nil {
			task.Error = err
			return
		}

		outFile := utils.ReplaceExt(inputFile, ".lua")
		defer os.Remove(outFile)

		err = utils.Unluac.Run(inputFile, utils.LuacOpt{Output: outFile})
		if err != nil {
			task.Error = err
			return
		}
		output.Path = utils.ReplaceExt(output.Path, ".lua")
		output.Data, output.Error = os.ReadFile(outFile)

		return
	default:
		task.Error = fmt.Errorf("unsupported target format: %s", format)
		return
	}
}

func copyToTemp(data []byte, ext, dir string) (string, error) {
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return "", err
	}
	file, err := os.CreateTemp(dir, "*"+ext)
	if err != nil {
		return "", err
	}
	defer file.Close()

	_, err = file.Write(data)
	if err != nil {
		return "", err
	}
	return strings.ReplaceAll(file.Name(), "\\", "/"), nil
}
