package tiff

import (
	"image"
	"image/png"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"os"
)

func DecodeWithImageWithMagick(data []byte) (image.Image, error) {
	f, err := os.CreateTemp(env.TempDir(), "*")
	if err != nil {
		return nil, err
	}
	defer f.Close()
	_, err = f.Write(data)
	if err != nil {
		return nil, err
	}
	f.Close()

	inputName := f.Name()
	outputName := f.Name() + ".png"
	defer os.Remove(inputName)
	defer os.Remove(outputName)

	cmd := utils.Magick.Convert(f.Name(), f.Name()+".png")
	err = cmd.Run()
	if err != nil {
		return nil, err
	}

	pngFile, err := os.Open(outputName)
	if err != nil {
		return nil, err
	}
	defer pngFile.Close()
	return png.Decode(pngFile)
}
