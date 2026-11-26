package mat4

import (
	"math"
	"testing"
)

func TestInvert(t *testing.T) {
	// rotation about z by 115° with scale and translation
	m := FromQuatXYZW(0, 0, float32(math.Sin(115*math.Pi/360)), float32(math.Cos(115*math.Pi/360)))
	m[0] *= 2
	m[1] *= 2
	m[2] *= 2
	m[12], m[13], m[14] = 10, -20, 3

	product := Multiply(m, Invert(m))
	identity := Identity()
	for i := range product {
		if math.Abs(float64(product[i]-identity[i])) > 1e-5 {
			t.Fatalf("m * inverse(m) = %v", product)
		}
	}
}

func TestInvertSingular(t *testing.T) {
	if Invert(Data{}) != Identity() {
		t.Fatal("singular matrix must invert to identity")
	}
}
