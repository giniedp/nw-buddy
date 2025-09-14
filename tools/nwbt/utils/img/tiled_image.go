package img

import (
	"fmt"
	"image"
	"image/color"
	"math"
)

var (
	ErrNotMutable = fmt.Errorf("tile image is not mutable")
)

type TiledImage struct {
	color    color.Model
	TileSize int
	TilesX   int
	TilesY   int
	SizeX    int
	SizeY    int
	Rows     []TiledImageRow // [row][col]
}

type TiledImageRow = []image.Image

type MutableImage interface {
	image.Image
	Set(x, y int, c color.Color)
}

func New(tileSize, tilesX, tilesY int, color color.Model) *TiledImage {
	result := TiledImage{
		color:    color,
		TileSize: tileSize,
		TilesX:   tilesX,
		TilesY:   tilesY,
		SizeX:    tileSize * tilesX,
		SizeY:    tileSize * tilesY,
		Rows:     make([][]image.Image, tilesY),
	}
	for i := range result.Rows {
		result.Rows[i] = make([]image.Image, tilesX)
	}

	return &result
}

func (t *TiledImage) ColorModel() color.Model {
	return t.color
}

func (t *TiledImage) Bounds() image.Rectangle {
	return image.Rect(0, 0, t.SizeX, t.SizeY)
}

func (t *TiledImage) At(x, y int) color.Color {
	tile := t.TileAt(x, y)
	if tile == nil {
		return color.Transparent
	}

	px := x % t.TileSize
	py := y % t.TileSize
	return tile.At(px, py)
}

func (t *TiledImage) Set(x, y int, c color.Color) error {
	px := x % t.TileSize
	py := y % t.TileSize

	if tile, ok := t.TileAt(x, y).(MutableImage); ok {
		tile.Set(px, py, c)
		return nil
	}
	return ErrNotMutable
}

func (t *TiledImage) TileAt(x, y int) image.Image {
	if x < 0 || x >= t.SizeX || y < 0 || y >= t.SizeY {
		return nil
	}
	tileX := x / t.TileSize
	tileY := y / t.TileSize
	return t.Rows[tileY][tileX]
}

func isPowerOf2(value int) bool {
	return (value & (value - 1)) == 0
}

func nextPowerOf2(value int) int {
	return int(math.Pow(float64(2), math.Ceil(math.Log2(float64(value)))))
}
