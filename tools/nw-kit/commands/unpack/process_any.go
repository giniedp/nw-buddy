package unpack

import "nw-buddy/tools/nw-kit/formats/azcs"

func processAny(task *Task) {
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
	if azcs.IsAzcs(data) {
		err = processAzcs(output, flgFmtObjects)
		output.Error = err
		task.Error = err
	}
}
