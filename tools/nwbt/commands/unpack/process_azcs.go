package unpack

import (
	"fmt"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/rtti"
)

func processAzcs(output *TaskOutput, format string) error {
	switch format {
	case "":
		return nil
	case FMT_JSON:
		object, err := azcs.Parse(output.Data)
		if err != nil {
			return err
		}
		out, err := rtti.ObjectStreamToJSON(object, crcTable, uuidTable)
		if err != nil {
			return err
		}
		output.Path = output.Path + ".json"
		output.Data = out
		return nil
	default:
		return fmt.Errorf("unknown format: %s", flgFmtObjects)
	}
}
