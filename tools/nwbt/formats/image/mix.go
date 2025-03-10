package image

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"nw-buddy/tools/utils"

	"golang.org/x/image/draw"
)

func MixPngImages(a []byte, b []byte, mix func(a, b color.Color) color.Color) (out []byte, err error) {
	defer utils.HandleRecover(&err, "mixing png images")

	imgA := utils.Must(png.Decode(bytes.NewBuffer(a)))
	sizeA := imgA.Bounds().Size()
	imgB := utils.Must(png.Decode(bytes.NewBuffer(b)))
	sizeB := imgB.Bounds().Size()

	if sizeA.X != sizeB.X || sizeA.Y != sizeB.Y {
		if sizeA.X > sizeB.X {
			tmp := image.NewRGBA(image.Rect(0, 0, sizeB.X, sizeB.Y))
			draw.BiLinear.Scale(tmp, tmp.Rect, imgA, imgA.Bounds(), draw.Over, nil)
			imgA = tmp
		} else {
			tmp := image.NewRGBA(image.Rect(0, 0, sizeA.X, sizeA.Y))
			draw.BiLinear.Scale(tmp, tmp.Rect, imgB, imgB.Bounds(), draw.Over, nil)
			imgB = tmp
		}
	}

	tmp := image.NewRGBA(image.Rect(0, 0, sizeA.X, sizeB.Y))
	for y := range imgA.Bounds().Max.Y {
		for x := range imgA.Bounds().Max.X {
			colA := imgA.At(x, y)
			colB := imgB.At(x, y)
			c := mix(colA, colB)
			tmp.Set(x, y, c)
		}
	}

	buf := &bytes.Buffer{}
	png.Encode(buf, tmp)
	return buf.Bytes(), nil
}
