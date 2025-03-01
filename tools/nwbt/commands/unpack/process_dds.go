package unpack

import (
	"fmt"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/utils"
	"path"
	"strings"
)

func processDDS(task *Task, format string) {
	if flgFmtDDS == "" {
		// pass through
		data, err := task.Input.Read()
		output := &TaskOutput{
			Path:  task.Input.Path(),
			Data:  data,
			Error: err,
		}
		task.Output = append(task.Output, output)
		task.Error = err
		return
	}
	// all other modes require the dds to be unsplit
	// may result in 2 files, base and alpha

	img, err := dds.Load(task.Input)
	task.Error = err

	if img != nil && img.Data != nil {
		task.Output = append(task.Output, &TaskOutput{
			Path:  task.Input.Path(),
			Data:  img.Data,
			Error: err,
		})
	}
	if img != nil && img.Alpha != nil {
		ext := path.Ext(task.Input.Path())
		task.Output = append(task.Output, &TaskOutput{
			Path:  strings.TrimSuffix(task.Input.Path(), ext) + ".a" + ext,
			Data:  img.Alpha,
			Error: err,
		})
	}
	if err != nil {
		return
	}

	switch format {
	case FMT_MERGE:
		// already done above
		return
	case FMT_PNG:
		for i, img := range task.Output {
			out, err := image.ConvertDDS(
				img.Data,
				image.FormatPNG,
				image.WithSilent(true),
				image.WithTempDir(flgTempDir),
				image.WithNormalMap(dds.IsNormalMap(img.Path)),
			)
			task.Output[i].Data = out
			task.Output[i].Error = err
			task.Output[i].Path = utils.ReplaceExt(img.Path, ".png")
			if err != nil {
				task.Error = err
				return
			}
		}
	case FMT_WEBP:
		for i, img := range task.Output {
			out, err := image.ConvertDDS(
				img.Data,
				image.FormatWEBP,
				image.WithSilent(true),
				image.WithTempDir(flgTempDir),
				image.WithNormalMap(dds.IsNormalMap(img.Path)),
			)
			task.Output[i].Data = out
			task.Output[i].Error = err
			task.Output[i].Path = utils.ReplaceExt(img.Path, ".webp")
			if err != nil {
				task.Error = err
				return
			}
		}
	default:
		task.Error = fmt.Errorf("unknown format: %s", format)
	}
}
