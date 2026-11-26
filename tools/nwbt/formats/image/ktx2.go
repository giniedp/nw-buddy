package image

import (
	goimage "image"
	"image/png"

	"nw-buddy/tools/utils"
)

// encodeKTX2 encodes a decoded image to a UASTC KTX2 with `ktx create` (zstd, full mip chain): sRGB by the format
// (see ktxFormatOfDDS), normal maps with normalized mips
func encodeKTX2(img goimage.Image, format string, normalMap bool) ([]byte, error) {
	data, err := encodePNG(img, png.BestSpeed)
	if err != nil {
		return nil, err
	}
	return utils.Ktx.Create(data, utils.KtxCreateOpt{Format: format, NormalMap: normalMap})
}
