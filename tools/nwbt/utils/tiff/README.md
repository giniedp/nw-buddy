# Go TIFF Decoder Package

This package provides a decoder for TIFF image files, with a focus on handling specific variations commonly encountered, such as high-bit-depth grayscale images, various compression methods (LZW, PackBits, Deflate), and predictor schemes. It aims for robustness and performance, offering both sequential and parallel decoding options.

## Purpose

The primary goal of this package is to provide a reliable and efficient way to read TIFF metadata and decode image data within Go applications. It was developed to handle specific TIFF formats that might not be fully supported or performantly decoded by standard library or other third-party packages, especially concerning high bit depths, different sample formats (integer, float), and compression/predictor combinations.

## Features

- Parses TIFF Image File Directories (IFDs) to extract metadata.
- Supports decoding pixel data for various `PhotometricInterpretation` values (WhiteIsZero, BlackIsZero, RGB, Paletted).
- Handles different `SampleFormat` types (unsigned int, signed int, IEEE float).
- Supports multiple `BitsPerSample` values (8, 16, 24, 32, 64 depending on format).
- Decodes common `Compression` types:
  - `CompNone` (No compression)
  - `CompLZW` (Lempel-Ziv & Welch)
  - `CompPackBits` (Macintosh PackBits)
  - `CompDeflate` (Zlib/Deflate)
  - `CompDeflateAdobe` (Adobe Deflate)
- Applies `Predictor` schemes (currently `PredHorizontal`).
- Handles both Tiled and Stripped TIFF layouts.
- Provides both sequential (`DecodeSequential`, `DecodeAllSequential`) and parallel (`Decode`, `DecodeAll`) decoding functions for single and multi-image TIFF files.
- Optional `slog` integration for detailed logging during decoding.

## Usage

### Decoding Configuration and Metadata Only

To read only the image configuration (dimensions, color model) and TIFF metadata without decoding the full pixel data:

```go
package main

import (
	"fmt"
	"log/slog"
	"os"

	"path/to/your/project/tools/nwbt/utils/tiff" // Adjust import path
)

func main() {
	file, err := os.Open("path/to/your/image.tif")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	// Optional: Create a logger
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelDebug}))

	cfg, md, err := tiff.DecodeConfig(file, logger) // Pass nil for logger if not needed
	if err != nil {
		fmt.Printf("Error decoding config: %v
", err)
		if md != nil {
			fmt.Println("Partial metadata might be available:")
			// Print relevant metadata fields if needed
		}
		return
	}

	fmt.Printf("Image Config: %+v
", cfg)
	fmt.Printf("Metadata: %+v
", md)
	fmt.Printf("Dimensions: %d x %d
", md.ImageWidth, md.ImageLength)
	fmt.Printf("Compression: %s
", md.Compression)
	// Access other metadata fields as needed...
}

```

### Decoding a Single Image (Parallel)

This uses multiple CPU cores to decode chunks (tiles or strips) concurrently for potentially faster results on large images.

```go
package main

import (
	"fmt"
	"log/slog"
	"os"

	"path/to/your/project/tools/nwbt/utils/tiff" // Adjust import path
)

func main() {
	file, err := os.Open("path/to/your/image.tif")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelDebug}))

	img, md, err := tiff.Decode(file, logger) // Parallel decoding by default
	if err != nil {
		fmt.Printf("Error decoding image: %v
", err)
		// md might contain partial metadata even on error
		return
	}

	fmt.Printf("Successfully decoded image: %T
", img)
	fmt.Printf("Bounds: %v
", img.Bounds())
	fmt.Printf("Metadata: Compression=%s, Predictor=%s
", md.Compression, md.Predictor)
	// Use the decoded 'img' (image.Image)
}
```

### Decoding a Single Image (Sequential)

Use this if parallel decoding causes issues or for simpler debugging.

```go
// ... imports same as parallel example ...

func main() {
	// ... open file and setup logger same as parallel example ...

	img, md, err := tiff.DecodeSequential(file, logger) // Use sequential decoder
	if err != nil {
		fmt.Printf("Error decoding image sequentially: %v
", err)
		return
	}

	fmt.Printf("Successfully decoded image sequentially: %T
", img)
	// ... use img ...
}
```

### Decoding Multi-Image TIFFs

Use `DecodeAll` (parallel) or `DecodeAllSequential` to decode all images within a multi-page TIFF file.

```go
package main

import (
	"fmt"
	"log/slog"
	"os"

	"path/to/your/project/tools/nwbt/utils/tiff" // Adjust import path
)

func main() {
	file, err := os.Open("path/to/your/multi_image.tif")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelDebug}))

	images, metadataSlice, err := tiff.DecodeAll(file, logger) // Parallel by default
	if err != nil {
		fmt.Printf("Error decoding multi-image TIFF: %v
", err)
		// images and metadataSlice might contain successfully decoded parts before the error
	}

	fmt.Printf("Decoded %d images.
", len(images))
	for i, img := range images {
		fmt.Printf("Image %d: Bounds=%v, Compression=%s
", i, img.Bounds(), metadataSlice[i].Compression)
		// Use images[i] and metadataSlice[i]
	}
}
```

## Development

### Running Tests

To run all unit tests within the `tiff` package:

```bash
# Navigate to the directory containing the tiff package
cd path/to/your/project/tools/nwbt/utils/tiff

# Run tests
go test ./...
```

Add the `-v` flag for verbose output:

```bash
go test -v ./...
```

### Running Benchmarks

Benchmarks are included to measure the performance of decoding operations.

```bash
# Navigate to the tiff package directory
cd path/to/your/project/tools/nwbt/utils/tiff

# Run all benchmarks
go test -bench=. ./...

# Run specific benchmarks (e.g., only parallel decode benchmarks)
go test -bench=BenchmarkDecodeParallel ./...
```

Benchmark output typically looks like this:

```
goos: linux
goarch: amd64
pkg: path/to/your/project/tools/nwbt/utils/tiff
cpu: Intel(R) Core(TM) i7-8700K CPU @ 3.70GHz
BenchmarkDecodeParallel/Tiled_LZW_Predictor-12              10         113783740 ns/op       104.58 MB/s     1572864 B/op          2 allocs/op
BenchmarkDecodeSequential/Tiled_LZW_Predictor-12            10         109590960 ns/op       108.58 MB/s     1572864 B/op          2 allocs/op
...
PASS
ok      path/to/your/project/tools/nwbt/utils/tiff      5.234s
```

- `BenchmarkDecodeParallel/Tiled_LZW_Predictor-12`: Name of the benchmark function and specific sub-benchmark. `-12` indicates `GOMAXPROCS=12`.
- `10`: Number of times the benchmark was run (`b.N`).
- `113783740 ns/op`: Average time taken per operation (nanoseconds). Lower is better.
- `104.58 MB/s`: Optional custom metric (throughput). Higher is better.
- `1572864 B/op`: Average memory allocated per operation. Lower is better.
- `2 allocs/op`: Average number of heap allocations per operation. Lower is better.

### Profiling

You can generate CPU and memory profiles during benchmarking to identify performance bottlenecks.

```bash
# Navigate to the tiff package directory
cd path/to/your/project/tools/nwbt/utils/tiff

# Generate CPU profile (cpu.prof) and Memory profile (mem.prof)
go test -bench=. -cpuprofile=cpu.prof -memprofile=mem.prof ./...
```

This will run the benchmarks and create `cpu.prof` and `mem.prof` files in the current directory.

### Analyzing Profiles

Use the Go pprof tool to analyze the generated profiles.

**CPU Profile:**

```bash
go tool pprof cpu.prof
```

This opens the pprof interactive console. Common commands:

- `top`: Show the functions consuming the most CPU time (flat).
- `top --cum`: Show the functions consuming the most CPU time, including time spent in functions they called (cumulative).
- `list <function_name>`: Show the source code of a function, annotated with CPU time per line.
- `web`: Generate a graphical representation (SVG) of the profile and open it in a web browser (requires Graphviz to be installed). This is often the most intuitive way to visualize bottlenecks.
- `exit`: Quit pprof.

**Memory Profile:**

Analyze the heap profile (`mem.prof`) similarly. This shows where memory is being allocated.

```bash
# Analyze allocations in use at the end of the benchmark
go tool pprof mem.prof

# Analyze total allocations made during the benchmark run
go tool pprof -alloc_space mem.prof
```

Common commands in pprof for memory profiles:

- `top`: Show functions with the most allocated memory (in-use or total, depending on the pprof command used).
- `list <function_name>`: Show source code annotated with memory allocations.
- `web`: Generate and view the graphical profile.

Interpreting `pprof` output helps identify functions or specific lines of code that are CPU-intensive or allocate excessive memory, guiding optimization efforts.
