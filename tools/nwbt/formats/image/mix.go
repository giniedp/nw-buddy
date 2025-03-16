package image

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"nw-buddy/tools/utils"

	"golang.org/x/image/draw"
)

func MixPngImages(a []byte, b []byte, mix func(a, b color.NRGBA) color.NRGBA) (out []byte, err error) {
	defer utils.HandleRecover(&err, "mixing png images")

	imgA := utils.Must(png.Decode(bytes.NewBuffer(a)))
	sizeA := imgA.Bounds().Size()
	imgB := utils.Must(png.Decode(bytes.NewBuffer(b)))
	sizeB := imgB.Bounds().Size()

	if sizeA.X != sizeB.X || sizeA.Y != sizeB.Y {
		if sizeA.X > sizeB.X {
			tmp := image.NewNRGBA(image.Rect(0, 0, sizeB.X, sizeB.Y))
			draw.BiLinear.Scale(tmp, tmp.Rect, imgA, imgA.Bounds(), draw.Over, nil)
			imgA = tmp
			sizeA = tmp.Bounds().Size()
		} else {
			tmp := image.NewNRGBA(image.Rect(0, 0, sizeA.X, sizeA.Y))
			draw.BiLinear.Scale(tmp, tmp.Rect, imgB, imgB.Bounds(), draw.Over, nil)
			imgB = tmp
			sizeB = tmp.Bounds().Size()
		}
	}

	imgA = toNRGBA(imgA)
	imgB = toNRGBA(imgB)
	tmp := image.NewNRGBA(image.Rect(0, 0, sizeA.X, sizeA.Y))
	for y := range imgA.Bounds().Max.Y {
		for x := range imgA.Bounds().Max.X {
			colA := imgA.(*image.NRGBA).NRGBAAt(x, y)
			colB := imgB.(*image.NRGBA).NRGBAAt(x, y)
			c := mix(colA, colB)
			tmp.SetNRGBA(x, y, c)
		}
	}

	buf := &bytes.Buffer{}
	png.Encode(buf, tmp)
	return buf.Bytes(), nil
}

func toNRGBA(img image.Image) *image.NRGBA {
	if t, pl := img.(*image.NRGBA); pl {
		return t
	}
	tmp := image.NewNRGBA(img.Bounds())
	draw.Draw(tmp, tmp.Bounds(), img, img.Bounds().Min, draw.Src)
	return tmp
}
