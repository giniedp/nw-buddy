package math

import "math"

func NextPowerOf2(value int) int {
	return int(math.Pow(float64(2), math.Ceil(math.Log2(float64(value)))))
}

func IsPowerOfTwo(value int) bool {
	return (value & (value - 1)) == 0
}
