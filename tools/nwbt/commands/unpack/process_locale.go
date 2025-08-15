package unpack

import (
	"fmt"
	"nw-buddy/tools/formats/loc"
	"nw-buddy/tools/utils"
)

func processLocale(task *Task, format string) {
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
	case FMT_JSON:
		record, err := loc.Parse(output.Data)
		if err != nil {
			task.Error = err
			output.Error = err
			return
		}
		out, err := record.ToJSON("", " ")
		if err != nil {
			task.Error = err
			output.Error = err
			return
		}
		output.Path = utils.ReplaceExt(output.Path, ".json")
		output.Data = out
		return
	default:
		task.Error = fmt.Errorf("unknown format: %s", flgFmtDatasheet)
		return
	}
}
