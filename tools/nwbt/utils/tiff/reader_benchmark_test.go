package tiff

import (
	"bytes"
	"fmt"
	"image"
	"os"
	"path/filepath"
	"testing"
)

// --- Benchmarks ---
// Run benchmarks from this directory (tools/nwbt/utils/tiff) using:
// go test -bench=. -benchmem
// Or, to run specific benchmarks:
// go test -v -bench='BenchmarkDecodeParallel|BenchmarkDecodeSequential' -benchmem -count=1

// Global variable to prevent compiler optimization from removing the decode calls
var benchmarkResult image.Image

// Helper function to load benchmark data once
var benchmarkTiffData []byte
var benchmarkLoadErr error

func loadBenchmarkData() {
	if benchmarkTiffData == nil && benchmarkLoadErr == nil {
		// IMPORTANT: Adjust the filename if necessary
		benchmarkFilePath := filepath.Join("..", "..", "formats", "heightmap", "samples", "region.heightmap")
		benchmarkTiffData, benchmarkLoadErr = os.ReadFile(benchmarkFilePath)
		if benchmarkLoadErr != nil {
			// Use panic because benchmarks can't easily return errors and
			// we need the file to run them.
			panic(fmt.Sprintf("Failed to read benchmark data file '%s': %v", benchmarkFilePath, benchmarkLoadErr))
		}
	}
}

func BenchmarkDecodeParallel(b *testing.B) {
	loadBenchmarkData()
	if benchmarkLoadErr != nil {
		b.Fatalf("Failed to load benchmark data: %v", benchmarkLoadErr)
	}
	b.ResetTimer() // Start timing after setup

	var img image.Image
	var err error
	var md *Metadata // Variable to hold metadata

	for i := 0; i < b.N; i++ {
		// Create a new reader for each iteration to avoid state issues
		reader := bytes.NewReader(benchmarkTiffData)
		img, md, err = Decode(reader, nil)
		if err != nil {
			b.Fatalf("Decode failed during benchmark: %v", err)
		}
	}
	benchmarkResult = img // Assign to global var to prevent optimization
	_ = md              // Prevent unused variable error for md
}

func BenchmarkDecodeSequential(b *testing.B) {
	loadBenchmarkData()
	if benchmarkLoadErr != nil {
		b.Fatalf("Failed to load benchmark data: %v", benchmarkLoadErr)
	}
	b.ResetTimer() // Start timing after setup

	var img image.Image
	var err error
	var md *Metadata // Variable to hold metadata

	for i := 0; i < b.N; i++ {
		// Create a new reader for each iteration
		reader := bytes.NewReader(benchmarkTiffData)
		img, md, err = DecodeSequential(reader, nil)
		if err != nil {
			b.Fatalf("DecodeSequential failed during benchmark: %v", err)
		}
	}
	benchmarkResult = img // Assign to global var to prevent optimization
	_ = md              // Prevent unused variable error for md
}
