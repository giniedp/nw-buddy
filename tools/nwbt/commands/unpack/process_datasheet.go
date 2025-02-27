package unpack

import (
	"fmt"
	"nw-buddy/tools/formats/datasheet"
)

func processDatasheet(task *Task, format string) {
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
		record, err := datasheet.Parse(output.Data)
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
		output.Path = output.Path + ".json"
		output.Data = out
		return
	default:
		task.Error = fmt.Errorf("unknown format: %s", flgFmtDatasheet)
		return
	}
}
