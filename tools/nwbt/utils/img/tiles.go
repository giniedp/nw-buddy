package img

import "image"

func Tiles(area image.Rectangle, countX, countY int) []image.Rectangle {
	tileW := area.Dx() / countX
	tileH := area.Dy() / countY
	tiles := make([]image.Rectangle, 0)
	for y := range countY {
		for x := range countX {
			minX := area.Min.X + x*tileW
			minY := area.Min.Y + y*tileH
			tiles = append(tiles, image.Rectangle{
				Min: image.Pt(minX, minY),
				Max: image.Pt(minX+tileW, minY+tileH),
			})
		}
	}
	return tiles
}
