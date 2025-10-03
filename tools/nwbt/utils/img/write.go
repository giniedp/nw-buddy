package img

import (
	"fmt"
	"image"
	"image/png"
	"os"
	"path"

	"github.com/HugoSmits86/nativewebp"
)

func WriteFile(img image.Image, outFile string) error {
	extName := path.Ext(outFile)
	isPNG := extName == ".png"
	isWEBP := extName == ".webp"
	if !isPNG && !isWEBP {
		return fmt.Errorf("unsupported output format '%s' expected .png or .webp", extName)
	}

	if err := os.MkdirAll(path.Dir(outFile), os.ModePerm); err != nil {
		return err
	}
	f, err := os.OpenFile(outFile, os.O_CREATE, os.ModePerm)
	if err != nil {
		return err
	}
	defer f.Close()

	if isPNG {
		return png.Encode(f, img)
	}
	return nativewebp.Encode(f, img, nil)
}
