package img

import "image"

func Tiles(area image.Rectangle, tilesX, tilesY int) []image.Rectangle {
	areaW := area.Max.X - area.Min.X
	areaH := area.Max.Y - area.Min.Y
	tileW := areaW / tilesX
	tileH := areaH / tilesY

	tiles := make([]image.Rectangle, 0)
	for y := range tilesY {
		for x := range tilesX {
			min := image.Pt(area.Min.X+x*tileW, area.Min.Y+y*tileH)
			tiles = append(tiles, image.Rectangle{
				Min: min,
				Max: image.Pt(min.X+tileW, min.Y+tileH),
			})
		}
	}
	return tiles
}
