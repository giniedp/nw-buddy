package image

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"nw-buddy/tools/utils"
)

// MixPngOnto applies mix to every pixel of a with the pixel of b at the same place: b is scaled to the size of a
// (unlike MixPngImages, which scales to the smaller one), so a keeps its resolution, e.g. a diffuse map and its
// lower resolution mask
func MixPngOnto(a []byte, b []byte, mix func(a, b color.NRGBA) color.NRGBA) (out []byte, err error) {
	defer utils.HandleRecover(&err, "mixing png images")

	imgA := toNRGBA(utils.Must(png.Decode(bytes.NewBuffer(a))))
	nrgbaB := toNRGBA(utils.Must(png.Decode(bytes.NewBuffer(b))))
	if nrgbaB.Bounds().Size() != imgA.Bounds().Size() {
		nrgbaB = scaleStraight(nrgbaB, imgA.Bounds().Dx(), imgA.Bounds().Dy())
	}
	for i := 0; i+3 < len(imgA.Pix); i += 4 {
		c := mix(
			color.NRGBA{imgA.Pix[i], imgA.Pix[i+1], imgA.Pix[i+2], imgA.Pix[i+3]},
			color.NRGBA{nrgbaB.Pix[i], nrgbaB.Pix[i+1], nrgbaB.Pix[i+2], nrgbaB.Pix[i+3]},
		)
		imgA.Pix[i], imgA.Pix[i+1], imgA.Pix[i+2], imgA.Pix[i+3] = c.R, c.G, c.B, c.A
	}
	buf := &bytes.Buffer{}
	png.Encode(buf, imgA)
	return buf.Bytes(), nil
}

// scaleStraight scales an image bilinearly per channel, without premultiplied alpha: masks keep data in rgb and in
// alpha independently (e.g. dye channels in rgb, a gloss mask in a mostly transparent alpha), which a premultiplied
// scale (x/image/draw) loses where the alpha is low
func scaleStraight(src *image.NRGBA, width, height int) *image.NRGBA {
	dst := image.NewNRGBA(image.Rect(0, 0, width, height))
	sw, sh := src.Bounds().Dx(), src.Bounds().Dy()
	at := func(x, y, c int) float64 {
		return float64(src.Pix[y*src.Stride+x*4+c])
	}
	for y := range height {
		fy := max((float64(y)+0.5)*float64(sh)/float64(height)-0.5, 0)
		y0 := min(int(fy), sh-1)
		y1 := min(y0+1, sh-1)
		ty := fy - float64(y0)
		for x := range width {
			fx := max((float64(x)+0.5)*float64(sw)/float64(width)-0.5, 0)
			x0 := min(int(fx), sw-1)
			x1 := min(x0+1, sw-1)
			tx := fx - float64(x0)
			for c := range 4 {
				top := at(x0, y0, c)*(1-tx) + at(x1, y0, c)*tx
				bottom := at(x0, y1, c)*(1-tx) + at(x1, y1, c)*tx
				dst.Pix[y*dst.Stride+x*4+c] = uint8(top*(1-ty) + bottom*ty + 0.5)
			}
		}
	}
	return dst
}
