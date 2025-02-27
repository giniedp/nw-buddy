package pak

import (
	"archive/zip"
	"path"
)

type Container struct {
	// system path to the pak file
	path string
	// relative path from root directory
	file string
}

func New(rootDir string, file string) *Container {
	return &Container{
		path: path.Join(rootDir, file),
		file: file,
	}
}

func (pak Container) Path() string {
	return pak.path
}

func (pak *Container) ListFiles() ([]Entry, error) {
	r, err := zip.OpenReader(pak.Path())
	if err != nil {
		return nil, err
	}

	files := make([]Entry, len(r.File))
	for i, file := range r.File {
		files[i] = Entry{
			file: path.Join(path.Dir(pak.file), file.Name),
			zip:  file,
			pak:  pak,
		}
	}

	return files, nil
}
