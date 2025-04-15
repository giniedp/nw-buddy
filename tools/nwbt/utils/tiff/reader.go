package tiff // Package tiff provides a decoder for specific high-bit-depth grayscale TIFF files.

import (
	"bytes" // Needed for LZW reader
	"compress/zlib"
	"encoding/binary"
	"errors" // Added for errors.New
	"fmt"
	"image"
	"image/color"
	"io"
	"math" // Added for float conversions
	"runtime"
	"sync"

	"log/slog"

	lzw "golang.org/x/image/tiff/lzw" // Needed for LZW decompression
)

// --- Logging Helper (from metadata.go, needed here too) ---
// Defined in metadata.go, assumed accessible or duplicated/moved if needed.
// var discardLogger = slog.New(slog.NewTextHandler(io.Discard, nil))
// func getLogger(l *slog.Logger) *slog.Logger { ... }

// --- Pool for internal buffers --- (Moved to metadata.go)

// Note: A custom Config struct was previously defined but removed as DecodeConfig now returns image.Config.

// readSampleValue reads sample data based on format/bps and returns a normalized float64 [0.0, 1.0].
func readSampleValue(src []byte, sampleFormat SampleFormat, bitsPerSample int, byteOrder binary.ByteOrder) (float64, error) {
	switch sampleFormat {
	case SampleFormatUInt:
		switch bitsPerSample {
		case 8:
			return float64(src[0]) / 255.0, nil
		case 16:
			val := byteOrder.Uint16(src)
			return float64(val) / 65535.0, nil
		case 24:
			var val uint32
			if byteOrder == binary.LittleEndian {
				val = uint32(src[0]) | uint32(src[1])<<8 | uint32(src[2])<<16
			} else {
				val = uint32(src[0])<<16 | uint32(src[1])<<8 | uint32(src[2])
			}
			return float64(val) / 16777215.0, nil // 2^24 - 1
		case 32:
			val := byteOrder.Uint32(src)
			return float64(val) / 4294967295.0, nil // 2^32 - 1
		default:
			return 0, fmt.Errorf("unsupported BitsPerSample=%d for SampleFormatUInt", bitsPerSample)
		}
	case SampleFormatInt:
		switch bitsPerSample {
		case 8:
			val := int8(src[0])
			// Map [-128, 127] to [0.0, 1.0]
			return (float64(val) + 128.0) / 255.0, nil
		case 16:
			val := int16(byteOrder.Uint16(src))
			// Map [-32768, 32767] to [0.0, 1.0]
			return (float64(val) + 32768.0) / 65535.0, nil
		case 32:
			val := int32(byteOrder.Uint32(src))
			// Map [-2147483648, 2147483647] to [0.0, 1.0]
			return (float64(val) + 2147483648.0) / 4294967295.0, nil
		default:
			return 0, fmt.Errorf("unsupported BitsPerSample=%d for SampleFormatInt", bitsPerSample)
		}
	case SampleFormatIEEEFP:
		switch bitsPerSample {
		case 32:
			val := math.Float32frombits(byteOrder.Uint32(src))
			// Clamp to [0.0, 1.0] assuming standard range for image representation
			return math.Max(0.0, math.Min(float64(val), 1.0)), nil
		case 64:
			val := math.Float64frombits(byteOrder.Uint64(src))
			// Clamp to [0.0, 1.0]
			return math.Max(0.0, math.Min(val, 1.0)), nil
		default:
			return 0, fmt.Errorf("unsupported BitsPerSample=%d for SampleFormatIEEEFP", bitsPerSample)
		}
	default:
		return 0, fmt.Errorf("unsupported SampleFormat %s", sampleFormat)
	}
}

// convertFloatToUint converts a normalized float64 [0.0, 1.0] to the target unsigned integer representation.
// Returns an error if the targetBps is unsupported.
func convertFloatToUint(val float64, targetBps int) (uint64, error) {
	// Clamp input just in case
	clampedVal := math.Max(0.0, math.Min(val, 1.0))
	switch targetBps {
	case 8:
		return uint64(clampedVal*255.0 + 0.5), nil // Add 0.5 for rounding
	case 16:
		return uint64(clampedVal*65535.0 + 0.5), nil
	default:
		// Return an error instead of panicking
		return 0, fmt.Errorf("invalid targetBps %d for convertFloatToUint", targetBps)
	}
}

// --- Pool for internal buffers --- (Moved to metadata.go)

// Note: A custom Config struct was previously defined but removed as DecodeConfig now returns image.Config.

// --- Error Types --- (Moved to metadata.go)

// Constants moved to metadata.go

// decoder now optionally holds a logger
type decoder struct {
	byteOrder binary.ByteOrder
	config    image.Config
	readerAt  io.ReaderAt
	metadata  *Metadata
	logger    *slog.Logger // Added logger instance
}

// firstVal (Deprecated/Internal - Keep or remove? Removing for now)
// func (d *decoder) firstVal(tag int) uint {
// 	panic("firstVal should not be used directly, access d.metadata fields instead")
// }

// --- Internal reader helpers --- (Moved to metadata.go)

// --- Internal IFD parsing --- (Moved to metadata.go)

// --- Validation logic --- (Moved to metadata.go)


// newDecoder accepts an optional logger as the last argument
func newDecoder(r io.Reader, logger *slog.Logger) (*decoder, error) {
	log := getLogger(logger)
	log.Debug("Entering newDecoder")
	readerAt, ok := r.(io.ReaderAt)
	if !ok {
		return nil, fmt.Errorf("tiff: reader must implement io.ReaderAt")
	}

	// Read header, determine byte order and IFD offset
	p := make([]byte, 8)
	if _, err := readerAt.ReadAt(p, 0); err != nil {
		if err == io.EOF { err = io.ErrUnexpectedEOF }
		return nil, fmt.Errorf("failed to read header: %w", err)
	}

	var byteOrder binary.ByteOrder
	switch string(p[0:4]) {
	case leHeader:
		byteOrder = binary.LittleEndian
	case beHeader:
		byteOrder = binary.BigEndian
	default:
		return nil, FormatError("malformed header") // Use FormatError from package
	}
	ifdOffset := int64(byteOrder.Uint32(p[4:8]))

	// Pass logger to ReadMetadata as the last argument
	md, cfg, err := ReadMetadata(readerAt, byteOrder, ifdOffset, log)
	if err != nil {
		// Return partially parsed metadata along with the error, if available
		// Include logger in the partially returned decoder
		return &decoder{logger: log, metadata: md, readerAt: readerAt, byteOrder: byteOrder}, err
	}

	// Create and return the decoder struct with the logger
	d := &decoder{
		logger:    log,
		readerAt:  readerAt,
		byteOrder: byteOrder,
		metadata:  md,
		config:    cfg,
	}
	log.Debug("Exiting newDecoder successfully")
	return d, nil
}

// DecodeConfig accepts an optional logger as the last argument
func DecodeConfig(r io.Reader, logger *slog.Logger) (cfg image.Config, md *Metadata, err error) {
	log := getLogger(logger)
	log.Debug("Entering DecodeConfig")
	var d *decoder
	d, err = newDecoder(r, log) // Pass logger last
	if d != nil {
		md = d.metadata
	}
	if err != nil {
		log.Error("DecodeConfig failed during newDecoder", slog.Any("error", err))
		return image.Config{}, md, err
	}
	log.Debug("Exiting DecodeConfig successfully")
	return d.config, md, nil
}


// Decode accepts an optional logger as the last argument
func Decode(r io.Reader, logger *slog.Logger) (img image.Image, md *Metadata, err error) {
	log := getLogger(logger)
	log.Debug("Entering Decode")
	var d *decoder
	d, err = newDecoder(r, log) // Pass logger last
	if d != nil { md = d.metadata }
	if err != nil {
		log.Error("Decode failed during newDecoder", slog.Any("error", err))
		return nil, md, err
	}

	log.Debug("Decode: Calling decodeSingleImageParallel")
	img, err = decodeSingleImageParallel(d.readerAt, d.byteOrder, d.config, d.metadata, log)
	if err != nil {
		log.Error("Decode failed during decodeSingleImageParallel", slog.Any("error", err))
	}
	log.Debug("Exiting Decode")
	return img, md, err
}

// decodeSingleImageParallel accepts a logger as the last argument
func decodeSingleImageParallel(readerAt io.ReaderAt, byteOrder binary.ByteOrder, config image.Config, md *Metadata, logger *slog.Logger) (image.Image, error) {
	log := getLogger(logger)
	log.Debug("Entering decodeSingleImageParallel", slog.Int("width", int(md.ImageWidth)), slog.Int("height", int(md.ImageLength)))
	// --- Use metadata ---
	predictor := md.Predictor
	compression := md.Compression
	bpsSliceUint16 := md.BitsPerSample
	spp := int(md.SamplesPerPixel)
	width := int(md.ImageWidth)
	height := int(md.ImageLength)
	isWhiteZero := md.PhotometricInterpretation == PhotoWhiteIsZero

	bytesPerPixel := 0
	for _, b := range bpsSliceUint16 { bytesPerPixel += (int(b) + 7) / 8 }
	if bytesPerPixel == 0 { log.Error("bytesPerPixel is zero"); return nil, FormatError("bytesPerPixel is zero") }

	// --- Create Destination Image ---
	rect := image.Rect(0, 0, width, height)
	var destImage image.Image
	switch config.ColorModel {
	case color.Gray16Model:
		destImage = image.NewGray16(rect)
	case color.RGBAModel:
		destImage = image.NewRGBA(rect)
	case color.RGBA64Model:
		destImage = image.NewRGBA64(rect)
	default:
		// Check if it's a Palette type
		if pal, ok := config.ColorModel.(color.Palette); ok {
			destImage = image.NewPaletted(rect, pal)
		} else {
			log.Error("Internal error: unexpected or unsupported color model type", slog.String("type", fmt.Sprintf("%T", config.ColorModel)))
			return nil, fmt.Errorf("internal error: unexpected or unsupported color model type: %T", config.ColorModel)
		}
	}

	// --- Determine Tiling/Stripping ---
	isTiled := md.TileWidth > 0
	var numChunksX, numChunksY int
	var chunkWidth, chunkHeight int
	var chunkOffsets, chunkCounts []uint32

	if isTiled {
		chunkWidth = int(md.TileWidth)
		chunkHeight = int(md.TileLength)
		numChunksX = (width + chunkWidth - 1) / chunkWidth
		numChunksY = (height + chunkHeight - 1) / chunkHeight
		chunkOffsets = md.TileOffsets
		chunkCounts = md.TileByteCounts
	} else {
		chunkWidth = width // Strips are full width
		chunkHeight = int(md.RowsPerStrip)
		numChunksX = 1
		numChunksY = (height + chunkHeight - 1) / chunkHeight
		chunkOffsets = md.StripOffsets
		chunkCounts = md.StripByteCounts
		if len(chunkOffsets) == 1 && len(chunkCounts) == 1 && chunkHeight >= height {
			numChunksY = 1
			chunkHeight = height
		}
	}
	totalChunks := numChunksX * numChunksY
	if len(chunkOffsets) != totalChunks || len(chunkCounts) != totalChunks {
		err := FormatError(fmt.Sprintf("internal error: mismatch between calculated chunk count (%d) and tag count (%d)", totalChunks, len(chunkOffsets)))
		log.Error("Chunk count mismatch", slog.Any("error", err))
		return nil, err
	}
	log.Debug("decodeSingleImageParallel: Chunk geometry calculated", slog.Bool("isTiled", isTiled), slog.Int("totalChunks", totalChunks), slog.Int("numChunksX", numChunksX), slog.Int("numChunksY", numChunksY), slog.Int("chunkWidth", chunkWidth), slog.Int("chunkHeight", chunkHeight))

	// --- Parallel Processing Setup ---
	var wg sync.WaitGroup
	numWorkers := min(runtime.NumCPU(), totalChunks)
	if numWorkers <= 0 { numWorkers = 1 }
	log.Debug("decodeSingleImageParallel: Setting up parallel processing", slog.Int("numWorkers", numWorkers))
	type chunkTask struct {
		chunkIndex int
		coordX, coordY int // Top-left corner of chunk in image pixels
		width, height int  // Actual dimensions of this chunk
		offset, count uint32 // Data location
	}
	type chunkResult struct {
		task chunkTask // Include original task info for assembly
		processedData []byte
		err error
	}
	taskChan := make(chan chunkTask, totalChunks)
	resultChan := make(chan chunkResult, totalChunks)
	errorChan := make(chan error, 1)
	processedChunks := make(map[int][]byte, totalChunks) // Use map for easier assembly

	// --- Start Workers ---
	chunkOffsetsUint := make([]uint, len(chunkOffsets))
	for i, v := range chunkOffsets { chunkOffsetsUint[i] = uint(v) }
	chunkCountsUint := make([]uint, len(chunkCounts))
	for i, v := range chunkCounts { chunkCountsUint[i] = uint(v) }

	for range numWorkers {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for task := range taskChan {
				log.Debug("Worker starting chunk processing", slog.Int("chunkIndex", task.chunkIndex))
				processedData, pErr := processChunk(readerAt, byteOrder, uint(task.offset), uint(task.count), task.width, task.height, compression, predictor, bpsSliceUint16, spp, uint16(md.FillOrder), log)
				if pErr != nil {
					log.Warn("Worker encountered error processing chunk", slog.Int("chunkIndex", task.chunkIndex), slog.Any("error", pErr))
				}
				select {
				case resultChan <- chunkResult{task: task, processedData: processedData, err: pErr}:
				case <-errorChan:
					log.Debug("Worker exiting due to error signal", slog.Int("chunkIndex", task.chunkIndex))
					return
				}
			}
		}()
	}

	// --- Dispatch Tasks & Collect Results ---
	go func() {
		defer close(taskChan)
		log.Debug("decodeSingleImageParallel: Dispatcher started")
		for chunkY := 0; chunkY < numChunksY; chunkY++ {
			for chunkX := 0; chunkX < numChunksX; chunkX++ {
				chunkIndex := chunkY*numChunksX + chunkX
				coordX := chunkX * chunkWidth
				coordY := chunkY * chunkHeight
				actualChunkWidth := min(chunkWidth, width - coordX)
				actualChunkHeight := min(chunkHeight, height - coordY)

				task := chunkTask{
					chunkIndex: chunkIndex,
					coordX:    coordX,
					coordY:    coordY,
					width:     actualChunkWidth,
					height:    actualChunkHeight,
					offset:    chunkOffsets[chunkIndex],
					count:     chunkCounts[chunkIndex],
				}
				select {
				case taskChan <- task:
				case <-errorChan: // Stop dispatching if an error occurred
					return
				}
			}
		}
		log.Debug("decodeSingleImageParallel: Dispatcher finished")
	}()

	log.Debug("decodeSingleImageParallel: Collector started")
	var firstErr error
	resultsCollected := 0
	for resultsCollected < totalChunks {
		result := <-resultChan
		resultsCollected++
		if result.err != nil && firstErr == nil {
			firstErr = result.err
			close(errorChan) // Signal other goroutines to stop
		}
		if firstErr == nil { processedChunks[result.task.chunkIndex] = result.processedData }
	}
	wg.Wait()
	if firstErr == nil { close(errorChan) }
	close(resultChan)
	log.Debug("decodeSingleImageParallel: Collector finished", slog.Int("resultsCollected", resultsCollected))

	if firstErr != nil {
		log.Error("decodeSingleImageParallel failed during chunk processing", slog.Any("firstError", firstErr))
		return nil, firstErr
	}

	// --- Assemble Image --- (Modified for Chunks)
	log.Debug("decodeSingleImageParallel: Assembly started")
	for chunkIndex, processedData := range processedChunks {
		if processedData == nil {
			log.Error("Internal error: missing processed data for chunk without prior error", slog.Int("chunkIndex", chunkIndex))
			return nil, fmt.Errorf("internal error: missing processed data for chunk %d", chunkIndex)
		}

		// Recalculate chunk geometry from index (could also pass from result.task)
		chunkY := chunkIndex / numChunksX
		chunkX := chunkIndex % numChunksX
		startX := chunkX * chunkWidth
		startY := chunkY * chunkHeight
		chunkW := min(chunkWidth, width - startX)
		chunkH := min(chunkHeight, height - startY)

		chunkPos := 0
		for yOffset := 0; yOffset < chunkH; yOffset++ {
			y := startY + yOffset // Absolute image Y coordinate
			for xOffset := 0; xOffset < chunkW; xOffset++ {
				x := startX + xOffset // Absolute image X coordinate

				if chunkPos+bytesPerPixel > len(processedData) {
					err := FormatError(fmt.Sprintf("chunk %d data buffer read index out of bounds at (%d,%d) relative to chunk, abs (%d,%d) (pos=%d, len=%d, bpp=%d)", chunkIndex, xOffset, yOffset, x, y, chunkPos, len(processedData), bytesPerPixel))
					log.Error("Pixel assembly buffer read out of bounds", slog.Any("error", err))
					return nil, err
				}

				// --- Pixel Assembly Logic (remains largely the same, uses x, y) ---
				switch dest := destImage.(type) {
				case *image.Gray16:
					if len(md.SampleFormat) != 1 || len(bpsSliceUint16) != 1 {
						err := FormatError("invalid metadata for Gray16 (expected SPP=1)")
						log.Error("Pixel assembly metadata mismatch for Gray16", slog.Any("error", err))
						return nil, err
					}
					sampleFormat := md.SampleFormat[0]
					inputBpp := int(bpsSliceUint16[0])
					srcBytes := processedData[chunkPos : chunkPos+bytesPerPixel]
					var finalVal uint16

					if sampleFormat == SampleFormatUInt && inputBpp > 16 {
						var pixelVal uint32
						if inputBpp == 24 {
							if byteOrder == binary.LittleEndian {
								pixelVal = uint32(srcBytes[0]) | uint32(srcBytes[1])<<8 | uint32(srcBytes[2])<<16
							} else {
								pixelVal = uint32(srcBytes[0])<<16 | uint32(srcBytes[1])<<8 | uint32(srcBytes[2])
							}
							finalVal = uint16(pixelVal >> 8)
						} else { // inputBpp == 32
							pixelVal = byteOrder.Uint32(srcBytes)
							finalVal = uint16(pixelVal >> 16)
						}
					} else {
						floatVal, err := readSampleValue(srcBytes, sampleFormat, inputBpp, byteOrder)
						if err != nil { log.Error("Error reading gray sample value", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Any("error", err)); return nil, fmt.Errorf("err reading gray sample chunk %d, abs (%d,%d): %w", chunkIndex, x, y, err) }
						if isWhiteZero { floatVal = 1.0 - floatVal }
						// Handle error from convertFloatToUint
						u64Val, convErr := convertFloatToUint(floatVal, 16)
						if convErr != nil {
							log.Error("Error converting float to uint16 for gray sample", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Any("error", convErr))
							return nil, fmt.Errorf("err converting gray sample chunk %d, abs (%d,%d): %w", chunkIndex, x, y, convErr)
						}
						finalVal = uint16(u64Val)
					}
					dest.SetGray16(x, y, color.Gray16{Y: finalVal})

				case *image.RGBA:
					var r, g, b, a uint8 = 0, 0, 0, 255
					sampleOffset := 0
					for sampleIdx := range spp {
						sampleFormat := md.SampleFormat[sampleIdx]
						sampleBpp := int(bpsSliceUint16[sampleIdx])
						sampleBytes := (sampleBpp + 7) / 8
						if chunkPos+sampleOffset+sampleBytes > len(processedData) { err := FormatError("RGBA buffer index out of bounds"); log.Error("Pixel assembly buffer bounds error for RGBA", slog.Any("error", err)); return nil, err }
						sampleData := processedData[chunkPos+sampleOffset : chunkPos+sampleOffset+sampleBytes]
						var u8val uint8
						var err error
						if sampleFormat == SampleFormatUInt && sampleBpp > 8 {
							if sampleBpp == 16 {
								u8val = uint8(byteOrder.Uint16(sampleData) >> 8)
							} else {
								var floatVal float64
								floatVal, err = readSampleValue(sampleData, sampleFormat, sampleBpp, byteOrder)
								// Handle error from convertFloatToUint
								u64Val, convErr := convertFloatToUint(floatVal, 8)
								if convErr != nil {
									log.Error("Error converting float to uint8 for RGBA sample", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Int("sampleIdx", sampleIdx), slog.Any("error", convErr))
									return nil, fmt.Errorf("err converting RGBA sample %d chunk %d: %w", sampleIdx, chunkIndex, convErr)
								}
								u8val = uint8(u64Val)
							}
						} else {
							var floatVal float64
							floatVal, err = readSampleValue(sampleData, sampleFormat, sampleBpp, byteOrder)
							// Handle error from convertFloatToUint
							u64Val, convErr := convertFloatToUint(floatVal, 8)
							if convErr != nil {
								log.Error("Error converting float to uint8 for RGBA sample", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Int("sampleIdx", sampleIdx), slog.Any("error", convErr))
								return nil, fmt.Errorf("err converting RGBA sample %d chunk %d: %w", sampleIdx, chunkIndex, convErr)
							}
							u8val = uint8(u64Val)
						}
						if err != nil { log.Error("Error reading RGBA sample value", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Int("sampleIdx", sampleIdx), slog.Any("error", err)); return nil, fmt.Errorf("err reading RGBA sample %d chunk %d: %w", sampleIdx, chunkIndex, err) }

						switch sampleIdx {
						case 0: r = u8val
						case 1: g = u8val
						case 2: b = u8val
						case 3: a = u8val
						}
						sampleOffset += sampleBytes
					}
					dest.SetRGBA(x, y, color.RGBA{R: r, G: g, B: b, A: a})

				case *image.RGBA64:
					var r, g, b, a uint16 = 0, 0, 0, 65535
					sampleOffset := 0
					for sampleIdx := range spp {
						sampleFormat := md.SampleFormat[sampleIdx]
						sampleBpp := int(bpsSliceUint16[sampleIdx])
						sampleBytes := (sampleBpp + 7) / 8
						if chunkPos+sampleOffset+sampleBytes > len(processedData) { err := FormatError("RGBA64 buffer index out of bounds"); log.Error("Pixel assembly buffer bounds error for RGBA64", slog.Any("error", err)); return nil, err }
						sampleData := processedData[chunkPos+sampleOffset : chunkPos+sampleOffset+sampleBytes]
						var u16val uint16
						var err error
						if sampleFormat == SampleFormatUInt && sampleBpp > 16 {
							var pixelVal uint32
							if sampleBpp == 24 {
								if byteOrder == binary.LittleEndian { pixelVal = uint32(sampleData[0]) | uint32(sampleData[1])<<8 | uint32(sampleData[2])<<16 } else { pixelVal = uint32(sampleData[0])<<16 | uint32(sampleData[1])<<8 | uint32(sampleData[2]) }
								u16val = uint16(pixelVal >> 8)
							} else { // sampleBpp == 32
								pixelVal = byteOrder.Uint32(sampleData)
								u16val = uint16(pixelVal >> 16)
							}
						} else {
							var floatVal float64
							floatVal, err = readSampleValue(sampleData, sampleFormat, sampleBpp, byteOrder)
							// Handle error from convertFloatToUint
							u64Val, convErr := convertFloatToUint(floatVal, 16)
							if convErr != nil {
								log.Error("Error converting float to uint16 for RGBA64 sample", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Int("sampleIdx", sampleIdx), slog.Any("error", convErr))
								return nil, fmt.Errorf("err converting RGBA64 sample %d chunk %d: %w", sampleIdx, chunkIndex, convErr)
							}
							u16val = uint16(u64Val)
						}
						if err != nil { log.Error("Error reading RGBA64 sample value", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Int("sampleIdx", sampleIdx), slog.Any("error", err)); return nil, fmt.Errorf("err reading RGBA64 sample %d chunk %d: %w", sampleIdx, chunkIndex, err) }

						switch sampleIdx {
						case 0: r = u16val
						case 1: g = u16val
						case 2: b = u16val
						case 3: a = u16val
						}
						sampleOffset += sampleBytes
					}
					dest.SetRGBA64(x, y, color.RGBA64{R: r, G: g, B: b, A: a})

				case *image.Paletted:
					if len(md.SampleFormat) != 1 || len(bpsSliceUint16) != 1 { err := FormatError("invalid metadata for Paletted (expected SPP=1)"); log.Error("Pixel assembly metadata mismatch for Paletted", slog.Any("error", err)); return nil, err }
					sampleFormat := md.SampleFormat[0]
					inputBpp := int(bpsSliceUint16[0])
					if chunkPos+bytesPerPixel > len(processedData) { err := FormatError("Paletted buffer index out of bounds"); log.Error("Pixel assembly buffer bounds error for Paletted", slog.Any("error", err)); return nil, err }
					srcBytes := processedData[chunkPos : chunkPos+bytesPerPixel]
					var finalVal uint8
					var err error
					if inputBpp != 8 {
						var floatVal float64
						floatVal, err = readSampleValue(srcBytes, sampleFormat, inputBpp, byteOrder)
						// Handle error from convertFloatToUint
						u64Val, convErr := convertFloatToUint(floatVal, 8)
						if convErr != nil {
							log.Error("Error converting float to uint8 for Paletted sample", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Any("error", convErr))
							return nil, fmt.Errorf("err converting Paletted sample index chunk %d: %w", chunkIndex, convErr)
						}
						finalVal = uint8(u64Val)
					} else { // Direct read for 8-bit index
						if sampleFormat != SampleFormatUInt {
							var floatVal float64
							floatVal, err = readSampleValue(srcBytes, sampleFormat, inputBpp, byteOrder)
							// Handle error from convertFloatToUint
							u64Val, convErr := convertFloatToUint(floatVal, 8)
							if convErr != nil {
								log.Error("Error converting float to uint8 for Paletted sample", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Any("error", convErr))
								return nil, fmt.Errorf("err converting Paletted sample index chunk %d: %w", chunkIndex, convErr)
							}
							finalVal = uint8(u64Val)
						} else {
							finalVal = srcBytes[0]
						}
					}
					if err != nil { log.Error("Error reading Paletted sample index", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Any("error", err)); return nil, fmt.Errorf("err reading Paletted sample index chunk %d: %w", chunkIndex, err) }
					dest.SetColorIndex(x, y, finalVal)

				default:
					err := fmt.Errorf("internal error: unhandled destination image type %T", destImage)
					log.Error("Internal error during pixel assembly", slog.Any("error", err))
					return nil, err
				}

				chunkPos += bytesPerPixel
			}
		}
	}
	log.Debug("decodeSingleImageParallel: Assembly finished")
	return destImage, nil
}

// DecodeSequential accepts an optional logger as the last argument
func DecodeSequential(r io.Reader, logger *slog.Logger) (img image.Image, md *Metadata, err error) {
	log := getLogger(logger)
	log.Debug("Entering DecodeSequential")
	var d *decoder
	d, err = newDecoder(r, log) // Pass logger last
	if d != nil { md = d.metadata }
	if err != nil {
		log.Error("DecodeSequential failed during newDecoder", slog.Any("error", err))
		return nil, md, err
	}
	log.Debug("DecodeSequential: Calling decodeSingleImageSequential")
	img, err = decodeSingleImageSequential(d.readerAt, d.byteOrder, d.config, d.metadata, log) // Pass logger last
	if err != nil {
		log.Error("DecodeSequential failed during decodeSingleImageSequential", slog.Any("error", err))
	}
	log.Debug("Exiting DecodeSequential")
	return img, md, err
}

// decodeSingleImageSequential accepts a logger as the last argument
func decodeSingleImageSequential(readerAt io.ReaderAt, byteOrder binary.ByteOrder, config image.Config, md *Metadata, logger *slog.Logger) (image.Image, error) {
	log := getLogger(logger)
	log.Debug("Entering decodeSingleImageSequential", slog.Int("width", int(md.ImageWidth)), slog.Int("height", int(md.ImageLength)))
	// --- Use metadata ---
	predictor := md.Predictor
	compression := md.Compression
	bpsSliceUint16 := md.BitsPerSample
	spp := int(md.SamplesPerPixel)
	width := int(md.ImageWidth)
	height := int(md.ImageLength)
	isWhiteZero := md.PhotometricInterpretation == PhotoWhiteIsZero

	bytesPerPixel := 0
	for _, b := range bpsSliceUint16 { bytesPerPixel += (int(b) + 7) / 8 }
	if bytesPerPixel == 0 { log.Error("bytesPerPixel is zero"); return nil, FormatError("bytesPerPixel is zero") }

	// --- Create Destination Image ---
	rect := image.Rect(0, 0, width, height)
	var destImage image.Image
	switch config.ColorModel {
	case color.Gray16Model:
		destImage = image.NewGray16(rect)
	case color.RGBAModel:
		destImage = image.NewRGBA(rect)
	case color.RGBA64Model:
		destImage = image.NewRGBA64(rect)
	default:
		// Check if it's a Palette type
		if pal, ok := config.ColorModel.(color.Palette); ok {
			destImage = image.NewPaletted(rect, pal)
		} else {
			log.Error("Internal error: unexpected or unsupported color model type", slog.String("type", fmt.Sprintf("%T", config.ColorModel)))
			return nil, fmt.Errorf("internal error: unexpected or unsupported color model type: %T", config.ColorModel)
		}
	}

	// --- Determine Tiling/Stripping ---
	isTiled := md.TileWidth > 0
	var numChunksX, numChunksY int
	var chunkWidth, chunkHeight int
	var chunkOffsets, chunkCounts []uint32

	if isTiled {
		chunkWidth = int(md.TileWidth)
		chunkHeight = int(md.TileLength)
		numChunksX = (width + chunkWidth - 1) / chunkWidth
		numChunksY = (height + chunkHeight - 1) / chunkHeight
		chunkOffsets = md.TileOffsets
		chunkCounts = md.TileByteCounts
	} else {
		chunkWidth = width // Strips are full width
		chunkHeight = int(md.RowsPerStrip)
		numChunksX = 1
		numChunksY = (height + chunkHeight - 1) / chunkHeight
		chunkOffsets = md.StripOffsets
		chunkCounts = md.StripByteCounts
		if len(chunkOffsets) == 1 && len(chunkCounts) == 1 && chunkHeight >= height {
			numChunksY = 1
			chunkHeight = height
		}
	}
	totalChunks := numChunksX * numChunksY
	if len(chunkOffsets) != totalChunks || len(chunkCounts) != totalChunks {
		err := FormatError(fmt.Sprintf("internal error: mismatch between calculated chunk count (%d) and tag count (%d)", totalChunks, len(chunkOffsets)))
		log.Error("Chunk count mismatch", slog.Any("error", err))
		return nil, err
	}
	log.Debug("decodeSingleImageSequential: Chunk geometry calculated", slog.Bool("isTiled", isTiled), slog.Int("totalChunks", totalChunks))

	// --- Process and Assemble Chunks Sequentially ---
	chunkOffsetsUint := make([]uint, len(chunkOffsets))
	for i, v := range chunkOffsets { chunkOffsetsUint[i] = uint(v) }
	chunkCountsUint := make([]uint, len(chunkCounts))
	for i, v := range chunkCounts { chunkCountsUint[i] = uint(v) }

	for chunkY := 0; chunkY < numChunksY; chunkY++ {
		for chunkX := 0; chunkX < numChunksX; chunkX++ {
			chunkIndex := chunkY*numChunksX + chunkX
			startX := chunkX * chunkWidth
			startY := chunkY * chunkHeight
			actualChunkWidth := min(chunkWidth, width - startX)
			actualChunkHeight := min(chunkHeight, height - startY)
			chunkOffset := chunkOffsetsUint[chunkIndex]
			chunkCount := chunkCountsUint[chunkIndex]

			log.Debug("Processing chunk", slog.Int("chunkIndex", chunkIndex), slog.Int("chunkX", chunkX), slog.Int("chunkY", chunkY))
			processedData, pErr := processChunk(readerAt, byteOrder, chunkOffset, chunkCount, actualChunkWidth, actualChunkHeight, compression, predictor, bpsSliceUint16, spp, uint16(md.FillOrder), log)
		if pErr != nil {
				log.Error("Failed to process chunk sequentially", slog.Int("chunkIndex", chunkIndex), slog.Any("error", pErr))
				return nil, fmt.Errorf("failed to process chunk %d (coord %d,%d): %w", chunkIndex, chunkX, chunkY, pErr)
		}
		if processedData == nil {
				err := fmt.Errorf("internal error: missing processed data for chunk %d", chunkIndex)
				log.Error("Internal error: processChunk returned nil data without error", slog.Int("chunkIndex", chunkIndex))
				return nil, err
			}

			// Assemble the chunk
			chunkPos := 0
			for yOffset := 0; yOffset < actualChunkHeight; yOffset++ {
				y := startY + yOffset // Absolute image Y coordinate
				for xOffset := 0; xOffset < actualChunkWidth; xOffset++ {
					x := startX + xOffset // Absolute image X coordinate

					if chunkPos+bytesPerPixel > len(processedData) {
						err := FormatError(fmt.Sprintf("chunk %d data buffer read index out of bounds at (%d,%d) relative to chunk, abs (%d,%d) (pos=%d, len=%d, bpp=%d)", chunkIndex, xOffset, yOffset, x, y, chunkPos, len(processedData), bytesPerPixel))
						log.Error("Pixel assembly buffer read out of bounds (sequential)", slog.Any("error", err))
						return nil, err
					}

					// --- Pixel Assembly Logic (same as in Decode) ---
				switch dest := destImage.(type) {
				case *image.Gray16:
						if len(md.SampleFormat) != 1 || len(bpsSliceUint16) != 1 { return nil, FormatError("invalid metadata for Gray16 (expected SPP=1)") }
						sampleFormat := md.SampleFormat[0]; inputBpp := int(bpsSliceUint16[0]); srcBytes := processedData[chunkPos : chunkPos+bytesPerPixel]
					var finalVal uint16
						if sampleFormat == SampleFormatUInt && inputBpp > 16 {
						var pixelVal uint32
						if inputBpp == 24 {
								if byteOrder == binary.LittleEndian { pixelVal = uint32(srcBytes[0]) | uint32(srcBytes[1])<<8 | uint32(srcBytes[2])<<16 } else { pixelVal = uint32(srcBytes[0])<<16 | uint32(srcBytes[1])<<8 | uint32(srcBytes[2]) }
							finalVal = uint16(pixelVal >> 8)
							} else {
								pixelVal = byteOrder.Uint32(srcBytes)
							finalVal = uint16(pixelVal >> 16)
						}
						} else {
							floatVal, err := readSampleValue(srcBytes, sampleFormat, inputBpp, byteOrder)
							if err != nil { log.Error("Error reading gray sample value (sequential)", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Any("error", err)); return nil, fmt.Errorf("err reading gray sample chunk %d, abs (%d,%d): %w", chunkIndex, x, y, err) }
							if isWhiteZero { floatVal = 1.0 - floatVal }
							// Handle error from convertFloatToUint
							u64Val, convErr := convertFloatToUint(floatVal, 16)
							if convErr != nil {
								log.Error("Error converting float to uint16 for gray sample (sequential)", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Any("error", convErr))
								return nil, fmt.Errorf("err converting gray sample chunk %d, abs (%d,%d): %w", chunkIndex, x, y, convErr)
							}
							finalVal = uint16(u64Val)
					}
					dest.SetGray16(x, y, color.Gray16{Y: finalVal})

				case *image.RGBA:
						var r, g, b, a uint8 = 0, 0, 0, 255; sampleOffset := 0
					for sampleIdx := range spp {
							sampleFormat := md.SampleFormat[sampleIdx]; sampleBpp := int(bpsSliceUint16[sampleIdx]); sampleBytes := (sampleBpp + 7) / 8
							if chunkPos+sampleOffset+sampleBytes > len(processedData) { err := FormatError("RGBA buffer index out of bounds"); log.Error("Pixel assembly buffer bounds error for RGBA (sequential)", slog.Any("error", err)); return nil, err }
							sampleData := processedData[chunkPos+sampleOffset : chunkPos+sampleOffset+sampleBytes]
							var u8val uint8; var err error
							if sampleFormat == SampleFormatUInt && sampleBpp > 8 {
								if sampleBpp == 16 {
									u8val = uint8(byteOrder.Uint16(sampleData) >> 8)
								} else {
									var floatVal float64
									floatVal, err = readSampleValue(sampleData, sampleFormat, sampleBpp, byteOrder)
									// Handle error from convertFloatToUint
									u64Val, convErr := convertFloatToUint(floatVal, 8)
									if convErr != nil {
										log.Error("Error converting float to uint8 for RGBA sample (sequential)", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Int("sampleIdx", sampleIdx), slog.Any("error", convErr))
										return nil, fmt.Errorf("err converting RGBA sample %d chunk %d: %w", sampleIdx, chunkIndex, convErr)
									}
									u8val = uint8(u64Val)
							}
						} else {
								var floatVal float64
								floatVal, err = readSampleValue(sampleData, sampleFormat, sampleBpp, byteOrder)
								// Handle error from convertFloatToUint
								u64Val, convErr := convertFloatToUint(floatVal, 8)
								if convErr != nil {
									log.Error("Error converting float to uint8 for RGBA sample (sequential)", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Int("sampleIdx", sampleIdx), slog.Any("error", convErr))
									return nil, fmt.Errorf("err converting RGBA sample %d chunk %d: %w", sampleIdx, chunkIndex, convErr)
								}
								u8val = uint8(u64Val)
							}
							if err != nil { log.Error("Error reading RGBA sample value (sequential)", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Int("sampleIdx", sampleIdx), slog.Any("error", err)); return nil, fmt.Errorf("err reading RGBA sample %d chunk %d: %w", sampleIdx, chunkIndex, err) }

						switch sampleIdx { case 0: r = u8val; case 1: g = u8val; case 2: b = u8val; case 3: a = u8val; }
						sampleOffset += sampleBytes
					}
						dest.SetRGBA(x, y, color.RGBA{R: r, G: g, B: b, A: a})

				case *image.RGBA64:
						var r, g, b, a uint16 = 0, 0, 0, 65535; sampleOffset := 0
					for sampleIdx := range spp {
							sampleFormat := md.SampleFormat[sampleIdx]; sampleBpp := int(bpsSliceUint16[sampleIdx]); sampleBytes := (sampleBpp + 7) / 8
							if chunkPos+sampleOffset+sampleBytes > len(processedData) { err := FormatError("RGBA64 buffer index out of bounds"); log.Error("Pixel assembly buffer bounds error for RGBA64 (sequential)", slog.Any("error", err)); return nil, err }
							sampleData := processedData[chunkPos+sampleOffset : chunkPos+sampleOffset+sampleBytes]
							var u16val uint16; var err error
							if sampleFormat == SampleFormatUInt && sampleBpp > 16 {
								var pixelVal uint32
								if sampleBpp == 24 {
									if byteOrder == binary.LittleEndian { pixelVal = uint32(sampleData[0]) | uint32(sampleData[1])<<8 | uint32(sampleData[2])<<16 } else { pixelVal = uint32(sampleData[0])<<16 | uint32(sampleData[1])<<8 | uint32(sampleData[2]) }
									u16val = uint16(pixelVal >> 8)
								} else {
									pixelVal = byteOrder.Uint32(sampleData)
									u16val = uint16(pixelVal >> 16)
							}
						} else {
								var floatVal float64
								floatVal, err = readSampleValue(sampleData, sampleFormat, sampleBpp, byteOrder)
								// Handle error from convertFloatToUint
								u64Val, convErr := convertFloatToUint(floatVal, 16)
								if convErr != nil {
									log.Error("Error converting float to uint16 for RGBA64 sample (sequential)", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Int("sampleIdx", sampleIdx), slog.Any("error", convErr))
									return nil, fmt.Errorf("err converting RGBA64 sample %d chunk %d: %w", sampleIdx, chunkIndex, convErr)
								}
								u16val = uint16(u64Val)
							}
							if err != nil { log.Error("Error reading RGBA64 sample value (sequential)", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Int("sampleIdx", sampleIdx), slog.Any("error", err)); return nil, fmt.Errorf("err reading RGBA64 sample %d chunk %d: %w", sampleIdx, chunkIndex, err) }

						switch sampleIdx { case 0: r = u16val; case 1: g = u16val; case 2: b = u16val; case 3: a = u16val; }
						sampleOffset += sampleBytes
					}
						dest.SetRGBA64(x, y, color.RGBA64{R: r, G: g, B: b, A: a})

					case *image.Paletted:
						if len(md.SampleFormat) != 1 || len(bpsSliceUint16) != 1 { err := FormatError("invalid metadata for Paletted (expected SPP=1)"); log.Error("Pixel assembly metadata mismatch for Paletted (sequential)", slog.Any("error", err)); return nil, err }
						sampleFormat := md.SampleFormat[0]; inputBpp := int(bpsSliceUint16[0])
						if chunkPos+bytesPerPixel > len(processedData) { err := FormatError("Paletted buffer index out of bounds"); log.Error("Pixel assembly buffer bounds error for Paletted (sequential)", slog.Any("error", err)); return nil, err }
						srcBytes := processedData[chunkPos : chunkPos+bytesPerPixel]
						var finalVal uint8; var err error
						if inputBpp != 8 {
							var floatVal float64
							floatVal, err = readSampleValue(srcBytes, sampleFormat, inputBpp, byteOrder)
							// Handle error from convertFloatToUint
							u64Val, convErr := convertFloatToUint(floatVal, 8)
							if convErr != nil {
								log.Error("Error converting float to uint8 for Paletted sample (sequential)", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Any("error", convErr))
								return nil, fmt.Errorf("err converting Paletted sample index chunk %d: %w", chunkIndex, convErr)
							}
							finalVal = uint8(u64Val)
						} else { // Direct read for 8-bit index
							if sampleFormat != SampleFormatUInt {
								var floatVal float64
								floatVal, err = readSampleValue(srcBytes, sampleFormat, inputBpp, byteOrder)
								// Handle error from convertFloatToUint
								u64Val, convErr := convertFloatToUint(floatVal, 8)
								if convErr != nil {
									log.Error("Error converting float to uint8 for Paletted sample (sequential)", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Any("error", convErr))
									return nil, fmt.Errorf("err converting Paletted sample index chunk %d: %w", chunkIndex, convErr)
								}
								finalVal = uint8(u64Val)
							} else {
								finalVal = srcBytes[0]
							}
						}
						if err != nil { log.Error("Error reading Paletted sample index (sequential)", slog.Int("chunkIndex", chunkIndex), slog.Int("x", x), slog.Int("y", y), slog.Any("error", err)); return nil, fmt.Errorf("err reading Paletted sample index chunk %d: %w", chunkIndex, err) }
						dest.SetColorIndex(x, y, finalVal)

				default:
						err := fmt.Errorf("internal error: unhandled destination image type %T", destImage)
						log.Error("Internal error during pixel assembly (sequential)", slog.Any("error", err))
						return nil, err
					}

					chunkPos += bytesPerPixel
				}
			}
		}
	}
	log.Debug("Exiting decodeSingleImageSequential successfully")
	return destImage, nil
}

// DecodeAll accepts an optional logger as the last argument
func DecodeAll(r io.Reader, logger *slog.Logger) ([]image.Image, []*Metadata, error) {
	log := getLogger(logger)
	log.Debug("Entering DecodeAll")
	readerAt, ok := r.(io.ReaderAt)
	if !ok {
		err := fmt.Errorf("tiff: reader must implement io.ReaderAt for DecodeAll")
		log.Error("DecodeAll requires io.ReaderAt", slog.Any("error", err))
		return nil, nil, err
	}

	// 1. Read header
	p := make([]byte, 8)
	if _, err := readerAt.ReadAt(p, 0); err != nil {
		if err == io.EOF { err = io.ErrUnexpectedEOF }
		errWrap := fmt.Errorf("failed to read header for DecodeAll: %w", err)
		log.Error("Failed to read header for DecodeAll", slog.Any("error", errWrap))
		return nil, nil, errWrap
	}

	var byteOrder binary.ByteOrder
	switch string(p[0:4]) {
	case leHeader:
		byteOrder = binary.LittleEndian
	case beHeader:
		byteOrder = binary.BigEndian
	default:
		err := FormatError("malformed header for DecodeAll")
		log.Error("Malformed header for DecodeAll", slog.String("headerBytes", string(p[0:4])))
		return nil, nil, err
	}
	currentIFDOffset := int64(byteOrder.Uint32(p[4:8]))
	log.Debug("DecodeAll: Header read", slog.String("byteOrder", fmt.Sprintf("%T", byteOrder)), slog.Int64("firstIFDOffset", currentIFDOffset))

	// 2. Loop through IFDs, parsing metadata
	parsedMetadata := []*Metadata{}
	var loopErrs []error
	for currentIFDOffset != 0 {
		md, _, err := ReadMetadata(readerAt, byteOrder, currentIFDOffset, log)
	if err != nil {
			errCtx := fmt.Errorf("error parsing IFD at offset %d: %w", currentIFDOffset, err)
			log.Warn("DecodeAll: Error encountered parsing an IFD", slog.Int64("offset", currentIFDOffset), slog.Any("error", err))
			loopErrs = append(loopErrs, errCtx)
		} else {
			parsedMetadata = append(parsedMetadata, md)
		}

		p = p[:2]
		if _, readErr := readerAt.ReadAt(p, currentIFDOffset); readErr != nil {
			if readErr == io.EOF { readErr = io.ErrUnexpectedEOF }
			errCtx := fmt.Errorf("failed to read IFD entry count at offset %d: %w", currentIFDOffset, readErr)
			log.Error("DecodeAll: Failed to read IFD entry count", slog.Int64("offset", currentIFDOffset), slog.Any("error", readErr))
			loopErrs = append(loopErrs, errCtx)
			currentIFDOffset = 0
			break
		}
		numEntries := byteOrder.Uint16(p[0:2])
		nextIFDOffsetPos := currentIFDOffset + 2 + int64(numEntries)*int64(ifdLen)

		p = p[:4]
		if _, readErr := readerAt.ReadAt(p, nextIFDOffsetPos); readErr != nil {
			if readErr != io.EOF && readErr != io.ErrUnexpectedEOF {
				errCtx := fmt.Errorf("failed to read next IFD offset pointer after offset %d: %w", currentIFDOffset, readErr)
				log.Warn("DecodeAll: Failed to read next IFD offset pointer", slog.Int64("offset", currentIFDOffset), slog.Int64("pointerPos", nextIFDOffsetPos), slog.Any("error", readErr))
				loopErrs = append(loopErrs, errCtx)
			} else {
				log.Debug("DecodeAll: Reached end of IFD chain", slog.Int64("lastIFDOffset", currentIFDOffset))
			}
			currentIFDOffset = 0
		} else {
			currentIFDOffset = int64(byteOrder.Uint32(p[0:4]))
		}
	}
	log.Debug("DecodeAll: Finished parsing metadata loop", slog.Int("ifdCount", len(parsedMetadata)), slog.Int("parseErrorsEncountered", len(loopErrs)))

	// 3. Decode each image based on parsed metadata
	images := make([]image.Image, 0, len(parsedMetadata))
	finalMetadata := make([]*Metadata, 0, len(parsedMetadata))

	for i, md := range parsedMetadata {
		cfg, validationErr := validateMetadataAndSetConfig(md, log)
		if validationErr != nil {
			errCtx := fmt.Errorf("error validating metadata for image index %d: %w", i, validationErr)
			log.Warn("DecodeAll: Skipping image due to metadata validation error", slog.Int("imageIndex", i), slog.Any("error", validationErr))
			loopErrs = append(loopErrs, errCtx)
			continue
		}

		img, decodeErr := decodeSingleImageParallel(readerAt, byteOrder, cfg, md, log)
		if decodeErr != nil {
			errCtx := fmt.Errorf("error decoding image index %d (Width: %d, Height: %d): %w", i, md.ImageWidth, md.ImageLength, decodeErr)
			log.Warn("DecodeAll: Skipping image due to decoding error", slog.Int("imageIndex", i), slog.Any("error", decodeErr))
			loopErrs = append(loopErrs, errCtx)
			continue
		}
		images = append(images, img)
		finalMetadata = append(finalMetadata, md)
	}

	// 4. Return results and aggregated errors
	if len(loopErrs) > 0 {
		errMsg := "errors occurred during TIFF processing:"
		for _, e := range loopErrs {
			errMsg += "\n\t- " + e.Error()
		}
		aggregatedErr := errors.New(errMsg)
		log.Warn("DecodeAll completed with errors", slog.Int("errorCount", len(loopErrs)), slog.Any("aggregatedError", aggregatedErr))
		return images, finalMetadata, aggregatedErr
	}

	log.Debug("DecodeAll finished successfully")
	return images, finalMetadata, nil
}

// DecodeAllSequential accepts an optional logger as the last argument
func DecodeAllSequential(r io.Reader, logger *slog.Logger) ([]image.Image, []*Metadata, error) {
	log := getLogger(logger)
	log.Debug("Entering DecodeAllSequential")
	readerAt, ok := r.(io.ReaderAt)
	if !ok {
		err := fmt.Errorf("tiff: reader must implement io.ReaderAt for DecodeAllSequential")
		log.Error("DecodeAllSequential requires io.ReaderAt", slog.Any("error", err))
		return nil, nil, err
	}

	// 1. Read header
	p := make([]byte, 8)
	if _, err := readerAt.ReadAt(p, 0); err != nil {
		if err == io.EOF { err = io.ErrUnexpectedEOF }
		errWrap := fmt.Errorf("failed to read header for DecodeAllSequential: %w", err)
		log.Error("Failed to read header for DecodeAllSequential", slog.Any("error", errWrap))
		return nil, nil, errWrap
	}

	var byteOrder binary.ByteOrder
	switch string(p[0:4]) {
	case leHeader:
		byteOrder = binary.LittleEndian
	case beHeader:
		byteOrder = binary.BigEndian
	default:
		err := FormatError("malformed header for DecodeAllSequential")
		log.Error("Malformed header for DecodeAllSequential", slog.String("headerBytes", string(p[0:4])))
		return nil, nil, err
	}
	currentIFDOffset := int64(byteOrder.Uint32(p[4:8]))
	log.Debug("DecodeAllSequential: Header read", slog.String("byteOrder", fmt.Sprintf("%T", byteOrder)), slog.Int64("firstIFDOffset", currentIFDOffset))

	// 2. Loop through IFDs, parsing metadata
	parsedMetadata := []*Metadata{}
	var loopErrs []error
	for currentIFDOffset != 0 {
		md, _, err := ReadMetadata(readerAt, byteOrder, currentIFDOffset, log)
		if err != nil {
			errCtx := fmt.Errorf("error parsing IFD at offset %d: %w", currentIFDOffset, err)
			log.Warn("DecodeAllSequential: Error encountered parsing an IFD", slog.Int64("offset", currentIFDOffset), slog.Any("error", err))
			loopErrs = append(loopErrs, errCtx)
		} else {
			parsedMetadata = append(parsedMetadata, md)
		}

		p = p[:2]
		if _, readErr := readerAt.ReadAt(p, currentIFDOffset); readErr != nil {
			if readErr == io.EOF { readErr = io.ErrUnexpectedEOF }
			errCtx := fmt.Errorf("failed to read IFD entry count at offset %d: %w", currentIFDOffset, readErr)
			log.Error("DecodeAllSequential: Failed to read IFD entry count", slog.Int64("offset", currentIFDOffset), slog.Any("error", readErr))
			loopErrs = append(loopErrs, errCtx)
			currentIFDOffset = 0
			break
		}
		numEntries := byteOrder.Uint16(p[0:2])
		nextIFDOffsetPos := currentIFDOffset + 2 + int64(numEntries)*int64(ifdLen)

		p = p[:4]
		if _, readErr := readerAt.ReadAt(p, nextIFDOffsetPos); readErr != nil {
			if readErr != io.EOF && readErr != io.ErrUnexpectedEOF {
				errCtx := fmt.Errorf("failed to read next IFD offset pointer after offset %d: %w", currentIFDOffset, readErr)
				log.Warn("DecodeAllSequential: Failed to read next IFD offset pointer", slog.Int64("offset", currentIFDOffset), slog.Int64("pointerPos", nextIFDOffsetPos), slog.Any("error", readErr))
				loopErrs = append(loopErrs, errCtx)
			} else {
				log.Debug("DecodeAllSequential: Reached end of IFD chain", slog.Int64("lastIFDOffset", currentIFDOffset))
			}
			currentIFDOffset = 0
		} else {
			currentIFDOffset = int64(byteOrder.Uint32(p[0:4]))
		}
	}
	log.Debug("DecodeAllSequential: Finished parsing metadata loop", slog.Int("ifdCount", len(parsedMetadata)), slog.Int("parseErrorsEncountered", len(loopErrs)))

	// 3. Decode each image sequentially based on parsed metadata
	images := make([]image.Image, 0, len(parsedMetadata))
	finalMetadata := make([]*Metadata, 0, len(parsedMetadata))

	for i, md := range parsedMetadata {
		cfg, validationErr := validateMetadataAndSetConfig(md, log)
		if validationErr != nil {
			errCtx := fmt.Errorf("error validating metadata for image index %d: %w", i, validationErr)
			log.Warn("DecodeAllSequential: Skipping image due to metadata validation error", slog.Int("imageIndex", i), slog.Any("error", validationErr))
			loopErrs = append(loopErrs, errCtx)
			continue
		}

		img, decodeErr := decodeSingleImageSequential(readerAt, byteOrder, cfg, md, log)
		if decodeErr != nil {
			errCtx := fmt.Errorf("error decoding image index %d (Width: %d, Height: %d): %w", i, md.ImageWidth, md.ImageLength, decodeErr)
			log.Warn("DecodeAllSequential: Skipping image due to decoding error", slog.Int("imageIndex", i), slog.Any("error", decodeErr))
			loopErrs = append(loopErrs, errCtx)
			continue
		}
		images = append(images, img)
		finalMetadata = append(finalMetadata, md)
	}

	// 4. Return results and aggregated errors
	if len(loopErrs) > 0 {
		errMsg := "errors occurred during TIFF processing:"
		for _, e := range loopErrs {
			errMsg += "\n\t- " + e.Error()
		}
		aggregatedErr := errors.New(errMsg)
		log.Warn("DecodeAllSequential completed with errors", slog.Int("errorCount", len(loopErrs)), slog.Any("aggregatedError", aggregatedErr))
		return images, finalMetadata, aggregatedErr
	}

	log.Debug("DecodeAllSequential finished successfully")
	return images, finalMetadata, nil
}

// processChunk accepts a logger as the last argument
func processChunk(r io.ReaderAt, byteOrder binary.ByteOrder, chunkOffset uint, chunkByteCount uint, chunkWidth, chunkHeight int, compression Compression, predictor Predictor, bpsSlice []uint16, spp int, fillOrder uint16, logger *slog.Logger) ([]byte, error) {
	log := getLogger(logger)
	log.Debug("Entering processChunk", slog.Uint64("offset", uint64(chunkOffset)), slog.Uint64("byteCount", uint64(chunkByteCount)), slog.Int("width", chunkWidth), slog.Int("height", chunkHeight))
	offset := int64(chunkOffset)
	byteCount := uint64(chunkByteCount)

	rawChunkData, err := safeReadAt(r, byteCount, offset, log)
	if err != nil {
		log.Error("Failed to read chunk data", slog.Int64("offset", offset), slog.Uint64("byteCount", byteCount), slog.Any("error", err))
		return nil, FormatError(fmt.Sprintf("failed to read chunk data at offset %d: %v", offset, err))
	}
	log.Debug("processChunk: Raw data read", slog.Int("bytesRead", len(rawChunkData)))

	bytesPerPixel := 0
	for _, b := range bpsSlice { bytesPerPixel += (int(b) + 7) / 8 }
	if bytesPerPixel == 0 {
		log.Error("Calculated bytesPerPixel is zero", slog.Any("bpsSlice", bpsSlice))
		return nil, FormatError("calculated bytesPerPixel is zero in processChunk")
	}

	processedChunkData := rawChunkData
	expectedBytes := chunkWidth * bytesPerPixel * chunkHeight
	log.Debug("processChunk: Processing flags", slog.String("compression", compression.String()), slog.String("predictor", predictor.String()), slog.Int("expectedBytes", expectedBytes))

	switch compression {
	case CompNone:
		log.Debug("processChunk: No decompression needed")
	case CompLZW:
		log.Debug("processChunk: Applying LZW decompression", slog.Int64("offset", offset), slog.Int("expectedBytes", expectedBytes))
		lzwReader := lzw.NewReader(bytes.NewReader(rawChunkData), lzw.MSB, 8)
		defer lzwReader.Close()

		const maxDecompressedChunkSize = 128 << 20 // 128 MB limit for decompressed chunk
		if expectedBytes <= 0 {
			log.Error("LZW: Calculated expectedBytes is non-positive", slog.Int64("offset", offset), slog.Int("expectedBytes", expectedBytes))
			return nil, FormatError(fmt.Sprintf("LZW: invalid calculated decompressed chunk size %d at offset %d", expectedBytes, offset))
		}
		if expectedBytes > maxDecompressedChunkSize {
			log.Error("LZW: Calculated decompressed chunk size exceeds limit", slog.Int64("offset", offset), slog.Int("expectedBytes", expectedBytes), slog.Int("limit", maxDecompressedChunkSize))
			return nil, FormatError(fmt.Sprintf("LZW: decompressed chunk size %d exceeds limit %d at offset %d", expectedBytes, maxDecompressedChunkSize, offset))
		}

		// Directly allocate the destination slice to the expected size.
		processedChunkData = make([]byte, expectedBytes)
		log.Debug("LZW: Allocating destination slice", slog.Int64("offset", offset), slog.Int("size", expectedBytes))

		// Read exactly expectedBytes into the slice.
		n, err := io.ReadFull(lzwReader, processedChunkData)
		log.Debug("LZW: io.ReadFull finished", slog.Int64("offset", offset), slog.Int("bytesRead", n), slog.Any("error", err))

		// Check for errors from ReadFull. io.EOF is only okay if we read 0 bytes and expected 0.
		// io.ErrUnexpectedEOF means the stream ended before expectedBytes were read.
		if err != nil {
			if err == io.EOF && expectedBytes == 0 {
				// Reading 0 bytes successfully resulted in EOF, which is fine.
			} else if err == io.ErrUnexpectedEOF || err == io.EOF {
				log.Error("LZW decompression failed: unexpected end of stream",
					slog.Int64("offset", offset),
					slog.Int("expectedBytes", expectedBytes),
					slog.Int("bytesRead", n),
					slog.Any("error", err)) // Log the specific error (EOF or UnexpectedEOF)
				// Return a more specific error indicating insufficient data
				return nil, FormatError(fmt.Sprintf("LZW decompressed data ended early at offset %d: expected %d bytes, got %d", offset, expectedBytes, n))
			} else {
				// Other potential errors (e.g., underlying reader issues)
				log.Error("LZW decompression failed with error", slog.Int64("offset", offset), slog.Int("expectedBytes", expectedBytes), slog.Int("bytesRead", n), slog.Any("error", err))
				return nil, fmt.Errorf("failed to decompress LZW data chunk at offset %d (read %d bytes): %w", offset, n, err)
			}
		}
		// If ReadFull returned nil error, n must equal expectedBytes. No further size check needed.
		log.Debug("LZW decompressed size matches expected size.", slog.Int64("offset", offset), slog.Int("size", n))

	case CompPackBits:
		log.Debug("processChunk: Applying PackBits decompression")
		decodedData, err := decodePackBits(log, rawChunkData, expectedBytes)
		if err != nil {
			log.Error("PackBits decompression failed", slog.Int64("offset", offset), slog.Any("error", err))
			return nil, FormatError(fmt.Sprintf("PackBits decode error chunk at offset %d: %v", offset, err))
		}
		processedChunkData = decodedData
	case CompDeflate, CompDeflateAdobe:
		log.Debug("processChunk: Applying Deflate decompression")
		zlibReader, err := zlib.NewReader(bytes.NewReader(rawChunkData))
		if err != nil {
			log.Error("Deflate reader creation failed", slog.Int64("offset", offset), slog.Any("error", err))
			return nil, FormatError(fmt.Sprintf("Deflate/Zlib reader creation error chunk at offset %d: %v", offset, err))
		}
		defer zlibReader.Close()

		// --- Add check for excessive/invalid expected size before allocation ---
		const maxDecompressedChunkSize = 128 << 20 // 128 MB limit for decompressed chunk
		if expectedBytes <= 0 { // Check for non-positive size
			log.Error("Calculated expectedBytes is non-positive", slog.Int64("offset", offset), slog.Int("expectedBytes", expectedBytes))
			return nil, FormatError(fmt.Sprintf("invalid calculated decompressed chunk size %d", expectedBytes))
		}
		if expectedBytes > maxDecompressedChunkSize {
			log.Error("Calculated decompressed chunk size exceeds limit", slog.Int64("offset", offset), slog.Int("expectedBytes", expectedBytes), slog.Int("limit", maxDecompressedChunkSize))
			return nil, FormatError(fmt.Sprintf("decompressed chunk size %d exceeds limit %d", expectedBytes, maxDecompressedChunkSize))
		}
		// --- End check ---

		// Pre-allocate buffer for decompressed data and use CopyBuffer
		buffer := make([]byte, expectedBytes)
		// Get a buffer from the pool for io.CopyBuffer
		// copyBufPtr := copyBufPool.Get().(*[]byte)
		// defer copyBufPool.Put(copyBufPtr) // Ensure it's put back
		n, err := io.CopyBuffer(bytes.NewBuffer(buffer), zlibReader, nil) // Use a 32KB copy buffer from pool -- CHANGED to nil buffer

		// --- Treat ErrUnexpectedEOF as a fatal error for the chunk ---
		if err != nil && err != io.EOF {
			// EOF is okay if read fully. Any other error, including ErrUnexpectedEOF, is fatal.
			log.Error("Deflate decompression failed", slog.Int64("offset", offset), slog.Int("expectedBytes", expectedBytes), slog.Int64("bytesRead", n), slog.Any("error", err))
			return nil, fmt.Errorf("failed to decompress deflate data chunk at offset %d (read %d/%d bytes): %w", offset, n, expectedBytes, err)
		}
		// --- End change for ErrUnexpectedEOF ---

		// Ensure the number of bytes read matches exactly what was expected.
		// Since we now treat UnexpectedEOF as an error, 'n' should equal expectedBytes if err is nil or io.EOF.
		if int(n) != expectedBytes {
			// This case should ideally not be reached if error handling above is correct,
			// but keep as a safeguard. Could happen if io.EOF occurs *before* expectedBytes are read.
			log.Error("Deflate decompressed size mismatch after handling errors", slog.Int64("offset", offset), slog.Int("expected", expectedBytes), slog.Int64("actual", n))
			return nil, FormatError(fmt.Sprintf("decompressed size mismatch for chunk at offset %d: expected %d, got %d", offset, expectedBytes, n))
		}

		processedChunkData = buffer // Use the full buffer as n must == expectedBytes here
	default:
		err := UnsupportedError(fmt.Sprintf("unsupported compression %s", compression))
		log.Warn("Unsupported compression", slog.String("compression", compression.String()))
		return nil, err
	}
	log.Debug("processChunk: Decompression finished", slog.Int("processedBytes", len(processedChunkData)), slog.Int64("offset", offset))

	// Apply predictor if necessary
	if predictor == PredHorizontal {
		log.Debug("processChunk: Applying Horizontal predictor", slog.Int64("offset", offset))
		bytesPerRow := chunkWidth * bytesPerPixel
		for y := range chunkHeight { // Iterate using chunkHeight
			rowOffset := y * bytesPerRow
			// Skip predictor for the first pixel of each row
			for pixelOffset := rowOffset + bytesPerPixel; pixelOffset < rowOffset+bytesPerRow; pixelOffset += bytesPerPixel {
				prevPixelOffset := pixelOffset - bytesPerPixel
				sampleOffset := 0
				for sampleIdx := range spp {
					sampleBpp := int(bpsSlice[sampleIdx])
					sampleBytes := (sampleBpp + 7) / 8
					currentSampleStart := pixelOffset + sampleOffset
					prevSampleStart := prevPixelOffset + sampleOffset
					if currentSampleStart+sampleBytes > len(processedChunkData) || prevSampleStart+sampleBytes > len(processedChunkData) {
						// Add more context if possible (chunk index, row, etc.)
						return nil, FormatError("predictor buffer index out of bounds")
					}
					switch sampleBpp {
					case 8:
						currentDiff := processedChunkData[currentSampleStart]
						prevVal := processedChunkData[prevSampleStart]
						processedChunkData[currentSampleStart] = prevVal + currentDiff
					case 16:
						currentDiff := byteOrder.Uint16(processedChunkData[currentSampleStart:])
						prevVal := byteOrder.Uint16(processedChunkData[prevSampleStart:])
						byteOrder.PutUint16(processedChunkData[currentSampleStart:], prevVal+currentDiff)
					case 24:
						var currentDiff, prevVal uint32
						if byteOrder == binary.LittleEndian {
							currentDiff = uint32(processedChunkData[currentSampleStart]) | uint32(processedChunkData[currentSampleStart+1])<<8 | uint32(processedChunkData[currentSampleStart+2])<<16
							prevVal = uint32(processedChunkData[prevSampleStart]) | uint32(processedChunkData[prevSampleStart+1])<<8 | uint32(processedChunkData[prevSampleStart+2])<<16
						} else {
							currentDiff = uint32(processedChunkData[currentSampleStart])<<16 | uint32(processedChunkData[currentSampleStart+1])<<8 | uint32(processedChunkData[currentSampleStart+2])
							prevVal = uint32(processedChunkData[prevSampleStart])<<16 | uint32(processedChunkData[prevSampleStart+1])<<8 | uint32(processedChunkData[prevSampleStart+2])
						}
						reconstructedVal := prevVal + currentDiff
						if byteOrder == binary.LittleEndian {
							processedChunkData[currentSampleStart] = uint8(reconstructedVal)
							processedChunkData[currentSampleStart+1] = uint8(reconstructedVal >> 8)
							processedChunkData[currentSampleStart+2] = uint8(reconstructedVal >> 16)
						} else {
							processedChunkData[currentSampleStart] = uint8(reconstructedVal >> 16)
							processedChunkData[currentSampleStart+1] = uint8(reconstructedVal >> 8)
							processedChunkData[currentSampleStart+2] = uint8(reconstructedVal)
						}
					case 32:
						currentDiff := byteOrder.Uint32(processedChunkData[currentSampleStart:])
						prevVal := byteOrder.Uint32(processedChunkData[prevSampleStart:])
						byteOrder.PutUint32(processedChunkData[currentSampleStart:], prevVal+currentDiff)
					default:
						return nil, UnsupportedError(fmt.Sprintf("Predictor=2 not supported for BitsPerSample=%d", sampleBpp))
					}
					sampleOffset += sampleBytes
				}
			}
		}
	} else {
		log.Debug("processChunk: No predictor needed", slog.Int64("offset", offset))
	}

	// Final check on processed data size
	if uint64(len(processedChunkData)) < uint64(expectedBytes) {
		log.Warn("Processed chunk data shorter than expected", slog.Int64("offset", offset), slog.Int("gotBytes", len(processedChunkData)), slog.Int("expectedBytes", expectedBytes))
		return processedChunkData, nil
	}

	log.Debug("Exiting processChunk successfully", slog.Int64("offset", offset))
	return processedChunkData[:expectedBytes], nil
}

// decodePackBits accepts a logger
func decodePackBits(logger *slog.Logger, src []byte, expectedSize int) ([]byte, error) {
	log := getLogger(logger)
	log.Debug("Entering decodePackBits", slog.Int("srcSize", len(src)), slog.Int("expectedSize", expectedSize))
	// Pre-allocate buffer with expected size if possible, but allow growth.
	dst := make([]byte, 0, expectedSize)
	srcReader := bytes.NewReader(src)
	var n int8
	var err error
	for {
		err = binary.Read(srcReader, binary.BigEndian, &n)
		if err == io.EOF {
			break // End of stream
		} else if err != nil {
			log.Error("Error reading PackBits header byte", slog.Any("error", err))
			return nil, fmt.Errorf("error reading PackBits header byte: %w", err)
		}

		if n >= 0 { // Literal run: n+1 bytes
			count := int(n) + 1
			buf := make([]byte, count)
			readBytes, readErr := io.ReadFull(srcReader, buf)
			if readErr != nil {
				log.Error("Error reading PackBits literal run", slog.Int("expectedCount", count), slog.Any("error", readErr))
				return nil, fmt.Errorf("error reading literal run (expected %d bytes): %w", count, readErr)
			}
			if readBytes != count {
				return nil, fmt.Errorf("short read for literal run: expected %d, got %d", count, readBytes)
			}
			dst = append(dst, buf...)
		} else if n >= -127 { // Repeat run: 1 - n repeats
			repeatCount := 1 - int(n)
			var repeatByte byte
			err = binary.Read(srcReader, binary.BigEndian, &repeatByte)
			if err != nil {
				log.Error("Error reading PackBits repeat byte", slog.Any("error", err))
				return nil, fmt.Errorf("error reading repeat byte: %w", err)
			}
			for range repeatCount {
				dst = append(dst, repeatByte)
			}
		} // n = -128 is a no-op, ignore
	}
	log.Debug("Exiting decodePackBits", slog.Int("dstSize", len(dst)))
	return dst, nil
}


