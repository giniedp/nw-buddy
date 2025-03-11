package game

import (
	"iter"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/progress"
)

func (it *Assets) ListDatasheets() ([]nwfs.File, error) {
	files, err := it.Archive.Glob("**/*.datasheet")
	if err != nil {
		return nil, err
	}
	return files, nil
}

func (it *Assets) LoadDatasheets() error {
	files, err := it.ListDatasheets()
	if err != nil {
		return err
	}

	bar := progress.Bar(len(files), "Loading datasheets")
	for _, file := range files {
		bar.Add(1)
		bar.Detail(file.Path())
		it.LoadDatasheet(file)
	}
	bar.Detail("")
	bar.Close()
	return nil
}

func (it *Assets) EachDatasheet() iter.Seq[*datasheet.Document] {
	return func(yield func(*datasheet.Document) bool) {
		files, _ := it.ListDatasheets()
		for _, file := range files {
			sheet, _ := it.LoadDatasheet(file)
			if !yield(sheet) {
				return
			}
		}
	}
}
