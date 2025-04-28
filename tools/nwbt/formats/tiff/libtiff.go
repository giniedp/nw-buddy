package tiff

/*
// Explicitly list the C source file for CGo to compile
// libtiff.c

#cgo CFLAGS: -I../../vendor/libtiff/include
#cgo LDFLAGS: -L../../vendor/libtiff/lib -ltiff -ltiffxx -ljpeg -llzma -lwebp -lz -lstdc++

// Include necessary headers
#include <stdlib.h>
#include <stdint.h>
#include <tiffio.h> // Include tiffio first
#include <tiff.h>   // Include the main libtiff header for constants

// Forward declare C functions defined *in libtiff.c* so Go can see them.
extern int tiff_get_size(TIFF* tif, uint32_t* w, uint32_t* h);
extern int tiff_read_scanlines_gray16(TIFF* tif, uint32_t h, tmsize_t scanline_size, void* buf);
// Signature for call_tiff_client_open as defined in libtiff.c (uses C wrappers defined there)
extern TIFF* call_tiff_client_open(
    const char* name,
    const char* mode,
    thandle_t clientdata
);
// Add declaration for the new helper
extern int tiff_get_uint16_field(TIFF* tif, uint32_t tag, uint16_t* val);
// Add declaration for extrasamples helper
extern int tiff_get_extrasamples(TIFF* tif, uint16_t* count, uint16_t** data);
*/
import "C"

import (
	"bytes"
	"errors"
	"fmt"
	"image"
	"image/color"
	"io"
	"sync"
	"unsafe"
)

// --- Handle Management ---

var (
	// Use a mutex for thread safety
	tiffHandlesMu sync.Mutex
	// Use an integer ID as the key
	tiffHandles    = make(map[int]*tiffClientReader)
	nextTiffHandle = 1
)

type tiffClientReader struct {
	r  io.ReadSeeker
	id int // Store the ID within the reader too for cleanup
}

// Creates a C-allocated handle containing a unique ID.
func storeTiffClientReader(r io.ReadSeeker) (C.thandle_t, error) {
	tiffHandlesMu.Lock()
	defer tiffHandlesMu.Unlock()

	id := nextTiffHandle
	nextTiffHandle++

	clientReader := &tiffClientReader{r: r, id: id}

	// Allocate C memory to store the integer ID
	cHandlePtr := (*C.int)(C.malloc(C.sizeof_int))
	if cHandlePtr == nil {
		return nil, fmt.Errorf("malloc failed for tiff client handle ID")
	}
	*cHandlePtr = C.int(id) // Store the ID in C memory

	// Store the Go reader in the map using the ID
	tiffHandles[id] = clientReader

	// Return the C pointer as the handle
	return C.thandle_t(cHandlePtr), nil
}

// Looks up the reader using the ID stored in the C handle.
func lookupTiffClientReader(chandle C.thandle_t) *tiffClientReader {
	if chandle == nil {
		return nil
	}
	// Get the ID from the C memory pointed to by chandle
	cHandlePtr := (*C.int)(chandle)
	id := int(*cHandlePtr)

	tiffHandlesMu.Lock()
	defer tiffHandlesMu.Unlock()
	return tiffHandles[id]
}

// Deletes the reader using the ID stored in the C handle and frees the C memory.
func deleteTiffClientReader(chandle C.thandle_t) {
	if chandle == nil {
		return
	}
	// Get the ID from the C memory pointed to by chandle
	cHandlePtr := (*C.int)(chandle)
	id := int(*cHandlePtr)

	tiffHandlesMu.Lock()
	defer tiffHandlesMu.Unlock()
	delete(tiffHandles, id)

	// Free the C memory allocated for the ID
	C.free(unsafe.Pointer(cHandlePtr))
}

// --- Go functions exported for C Callbacks ---
// These are called by the C wrappers defined in libtiff.c

//export goTiffReadProc
func goTiffReadProc(chandle C.thandle_t, buf unsafe.Pointer, size C.tmsize_t) C.tmsize_t {
	r := lookupTiffClientReader(chandle)
	if r == nil {
		// Consider logging this? Should not happen if libtiff calls correctly.
		return -1
	}
	s := unsafe.Slice((*byte)(buf), int(size))
	n, err := r.r.Read(s)
	if err != nil && !errors.Is(err, io.EOF) {
		// Consider logging the error?
		return -1
	}
	return C.tmsize_t(n)
}

//export goTiffWriteProc
func goTiffWriteProc(chandle C.thandle_t, buf unsafe.Pointer, size C.tmsize_t) C.tmsize_t {
	// Read-only
	return -1
}

//export goTiffSeekProc
func goTiffSeekProc(chandle C.thandle_t, off C.toff_t, whence C.int) C.toff_t {
	r := lookupTiffClientReader(chandle)
	if r == nil {
		return ^C.toff_t(0) // Return -1 cast to toff_t for error
	}
	goWhence := io.SeekStart
	switch whence {
	case C.SEEK_SET: // Use constants defined in C headers if available, or map manually
		goWhence = io.SeekStart
	case C.SEEK_CUR:
		goWhence = io.SeekCurrent
	case C.SEEK_END:
		goWhence = io.SeekEnd
	default:
		// Invalid whence
		return ^C.toff_t(0) // Return -1 cast to toff_t for error
	}
	newOff, err := r.r.Seek(int64(off), goWhence)
	if err != nil {
		// Consider logging error?
		return ^C.toff_t(0) // Return -1 cast to toff_t for error
	}
	return C.toff_t(newOff)
}

//export goTiffCloseProc
func goTiffCloseProc(chandle C.thandle_t) C.int {
	// Lookup MUST happen before delete.
	// We only remove from the Go map here. The C memory for the handle ID
	// is freed by the 'defer deleteTiffClientReader' in the calling Go function.
	if chandle == nil {
		return -1 // Invalid handle
	}
	cHandlePtr := (*C.int)(chandle)
	id := int(*cHandlePtr)

	tiffHandlesMu.Lock()
	// Check if handle exists before deleting
	_, ok := tiffHandles[id]
	if ok {
		delete(tiffHandles, id) // Remove from map
	}
	tiffHandlesMu.Unlock()

	if !ok {
		return -1 // Reader not found (already closed?)
	}
	// We don't free chandle here; the defer does.
	return 0 // Success
}

//export goTiffSizeProc
func goTiffSizeProc(chandle C.thandle_t) C.toff_t {
	r := lookupTiffClientReader(chandle)
	if r == nil {
		return ^C.toff_t(0) // Return -1 cast to toff_t for error
	}
	// Use the sizer interface if available (bytes.Reader implements this)
	type sizer interface{ Size() int64 }
	if szr, ok := r.r.(sizer); ok {
		return C.toff_t(szr.Size())
	}

	// Fallback: Attempt to get size using Seek (less reliable/efficient)
	currentPos, err := r.r.Seek(0, io.SeekCurrent)
	if err != nil {
		return ^C.toff_t(0) // Error seeking
	}
	size, err := r.r.Seek(0, io.SeekEnd)
	if err != nil {
		// Restore original position on error
		_, _ = r.r.Seek(currentPos, io.SeekStart)
		return ^C.toff_t(0) // Error seeking to end
	}
	// Restore original position
	_, err = r.r.Seek(currentPos, io.SeekStart)
	if err != nil {
		// This is problematic, maybe return size but log error?
		return ^C.toff_t(0) // Error seeking back
	}
	return C.toff_t(size)
}

// --- Public API ---

// DecodeConfig reads the TIFF image config (dimensions, color model) from data.
func DecodeConfig(data []byte) (image.Config, error) {
	reader := bytes.NewReader(data)
	clientDataHandle, err := storeTiffClientReader(reader)
	if err != nil {
		return image.Config{}, err
	}
	defer deleteTiffClientReader(clientDataHandle) // Ensure cleanup

	cName := C.CString("memconfig")
	if cName == nil {
		// Handle CString allocation failure if needed, though unlikely
		return image.Config{}, fmt.Errorf("CString alloc failed for name")
	}
	defer C.free(unsafe.Pointer(cName))
	cMode := C.CString("r")
	if cMode == nil {
		return image.Config{}, fmt.Errorf("CString alloc failed for mode")
	}
	defer C.free(unsafe.Pointer(cMode))

	tif := C.call_tiff_client_open(cName, cMode, clientDataHandle)
	if tif == nil {
		// Note: deleteTiffClientReader will still run due to defer
		return image.Config{}, fmt.Errorf("call_tiff_client_open failed for config")
	}
	defer C.TIFFClose(tif) // Close the TIFF handle itself

	// Get dimensions using C memory directly
	var w, h C.uint32_t
	if C.tiff_get_size(tif, &w, &h) == 0 {
		// Libtiff might print errors, add context here
		return image.Config{}, fmt.Errorf("tiff_get_size failed")
	}

	// Determine ColorModel from TIFF tags
	var bitsPerSample, samplesPerPixel, photometric C.uint16_t

	// Get BitsPerSample
	if C.tiff_get_uint16_field(tif, C.TIFFTAG_BITSPERSAMPLE, &bitsPerSample) == 0 {
		// Default might be 1 according to spec, but most readers expect the tag.
		return image.Config{}, fmt.Errorf("failed to get required tag: TIFFTAG_BITSPERSAMPLE")
	}

	// Get SamplesPerPixel (default is 1 according to libtiff)
	if C.tiff_get_uint16_field(tif, C.TIFFTAG_SAMPLESPERPIXEL, &samplesPerPixel) == 0 {
		samplesPerPixel = 1 // Assume default if tag is missing
	}

	// Get Photometric Interpretation
	if C.tiff_get_uint16_field(tif, C.TIFFTAG_PHOTOMETRIC, &photometric) == 0 {
		return image.Config{}, fmt.Errorf("failed to get required tag: TIFFTAG_PHOTOMETRIC")
	}

	var colorModel color.Model
	switch photometric {
	case C.PHOTOMETRIC_MINISWHITE, C.PHOTOMETRIC_MINISBLACK:
		if samplesPerPixel == 1 {
			switch bitsPerSample {
			case 8:
				colorModel = color.GrayModel
			case 16:
				colorModel = color.Gray16Model
			// Add cases for other bit depths if needed (e.g., 1, 4)
			default:
				return image.Config{}, fmt.Errorf("unsupported grayscale bitsPerSample: %d", bitsPerSample)
			}
		} else {
			// Grayscale images should have SamplesPerPixel=1
			return image.Config{}, fmt.Errorf("grayscale format (photometric=%d) has unexpected samplesPerPixel: %d", photometric, samplesPerPixel)
		}
	case C.PHOTOMETRIC_RGB:
		if bitsPerSample == 8 {
			if samplesPerPixel == 3 {
				// Standard Go image package doesn't have a direct 8-bit RGB model (only RGBA).
				// Representing as RGBA is common practice.
				colorModel = color.RGBAModel
			} else if samplesPerPixel == 4 {
				// Could be RGBA or RGB + ExtraSample (often alpha)
				// Check TIFFTAG_EXTRASAMPLES to confirm
				var extraSamplesCount C.uint16_t
				var extraSamplesData *C.uint16_t
				if C.tiff_get_extrasamples(tif, &extraSamplesCount, &extraSamplesData) != 0 && extraSamplesCount > 0 {
					extraSampleType := *extraSamplesData // Get the first extra sample type
					if extraSampleType == C.EXTRASAMPLE_ASSOCALPHA || extraSampleType == C.EXTRASAMPLE_UNASSALPHA {
						colorModel = color.RGBAModel // Confirmed Alpha
					} else {
						// Unknown extra sample, maybe return error or treat as RGB?
						// Sticking with RGBAModel for now as it's the Go default.
						colorModel = color.RGBAModel
					}
				} else {
					// Tag missing or error, assume RGBA as per previous logic
					colorModel = color.RGBAModel
				}
			} else {
				return image.Config{}, fmt.Errorf("unsupported RGB samplesPerPixel: %d (bitsPerSample=8)", samplesPerPixel)
			}
		} else if bitsPerSample == 16 {
			if samplesPerPixel == 3 {
				// Similar to 8-bit, represent as RGBA64
				colorModel = color.RGBA64Model
			} else if samplesPerPixel == 4 {
				// Check TIFFTAG_EXTRASAMPLES for 16-bit
				var extraSamplesCount C.uint16_t
				var extraSamplesData *C.uint16_t
				if C.tiff_get_extrasamples(tif, &extraSamplesCount, &extraSamplesData) != 0 && extraSamplesCount > 0 {
					extraSampleType := *extraSamplesData
					if extraSampleType == C.EXTRASAMPLE_ASSOCALPHA || extraSampleType == C.EXTRASAMPLE_UNASSALPHA {
						colorModel = color.RGBA64Model // Confirmed Alpha
					} else {
						// Unknown extra sample, stick with RGBA64Model
						colorModel = color.RGBA64Model
					}
				} else {
					// Tag missing or error, assume RGBA64
					colorModel = color.RGBA64Model
				}
			} else {
				return image.Config{}, fmt.Errorf("unsupported RGB samplesPerPixel: %d (bitsPerSample=16)", samplesPerPixel)
			}
		} else {
			return image.Config{}, fmt.Errorf("unsupported RGB bitsPerSample: %d", bitsPerSample)
		}
	case C.PHOTOMETRIC_PALETTE:
		// Palette color requires reading the colormap (TIFFTAG_COLORMAP)
		// This is complex and not implemented here.
		return image.Config{}, fmt.Errorf("unsupported photometric interpretation: PALETTE")
	// Add cases for other photometric interpretations if needed (e.g., YCbCr, CIELAB)
	default:
		return image.Config{}, fmt.Errorf("unsupported photometric interpretation: %d", photometric)
	}

	// If no specific model could be determined (shouldn't happen with checks above)
	if colorModel == nil {
		return image.Config{}, fmt.Errorf("failed to determine color model for format (photo=%d, bits=%d, samples=%d)",
			photometric, bitsPerSample, samplesPerPixel)
	}

	cfg := image.Config{
		Width:      int(w),
		Height:     int(h),
		ColorModel: colorModel,
	}
	return cfg, nil
}

// Decode reads a 16-bit grayscale TIFF image from data.
func Decode(data []byte) (image.Image, error) {
	reader := bytes.NewReader(data)
	clientDataHandle, err := storeTiffClientReader(reader)
	if err != nil {
		return nil, err
	}
	defer deleteTiffClientReader(clientDataHandle) // Ensure cleanup

	cName := C.CString("memdecode")
	if cName == nil {
		return nil, fmt.Errorf("CString alloc failed for name")
	}
	defer C.free(unsafe.Pointer(cName))
	cMode := C.CString("r")
	if cMode == nil {
		return nil, fmt.Errorf("CString alloc failed for mode")
	}
	defer C.free(unsafe.Pointer(cMode))

	tif := C.call_tiff_client_open(cName, cMode, clientDataHandle)
	if tif == nil {
		return nil, fmt.Errorf("call_tiff_client_open failed")
	}
	defer C.TIFFClose(tif) // Close the TIFF handle itself

	// Get dimensions
	var w, h C.uint32_t
	if C.tiff_get_size(tif, &w, &h) == 0 {
		return nil, fmt.Errorf("tiff_get_size failed")
	}
	width := int(w)
	height := int(h)

	// Check image format - expecting 16-bit grayscale
	var bitsPerSample, samplesPerPixel, photometric C.uint16_t // Use standard types

	// Use the C helper function
	if C.tiff_get_uint16_field(tif, C.TIFFTAG_BITSPERSAMPLE, &bitsPerSample) == 0 {
		return nil, errors.New("failed to get TIFFTAG_BITSPERSAMPLE")
	}

	// For SamplesPerPixel, libtiff defaults to 1 if the tag is missing.
	// Call the helper, but be aware TIFFGetField itself handles the default.
	// We explicitly pass the address of samplesPerPixel.
	if C.tiff_get_uint16_field(tif, C.TIFFTAG_SAMPLESPERPIXEL, &samplesPerPixel) == 0 {
		// This means the tag was absent OR TIFFGetField failed internally.
		// Libtiff usually defaults samplesPerPixel to 1 if tag missing,
		// so an error here might be more serious. Let's assume default for now.
		samplesPerPixel = 1
	}

	if C.tiff_get_uint16_field(tif, C.TIFFTAG_PHOTOMETRIC, &photometric) == 0 {
		return nil, errors.New("failed to get TIFFTAG_PHOTOMETRIC")
	}

	// Check if it's 16-bit grayscale (MinIsBlack or MinIsWhite)
	if bitsPerSample != 16 || samplesPerPixel != 1 || (photometric != C.PHOTOMETRIC_MINISBLACK && photometric != C.PHOTOMETRIC_MINISWHITE) {
		return nil, fmt.Errorf("unsupported format: bits=%d, samples=%d, photometric=%d. Expected 16-bit Grayscale",
			bitsPerSample, samplesPerPixel, photometric)
	}

	// Validate scanline size
	scanlineSize := C.TIFFScanlineSize(tif)
	if scanlineSize <= 0 {
		// Consider checking TIFFError for details if available
		return nil, fmt.Errorf("TIFFScanlineSize returned invalid value: %d", scanlineSize)
	}
	expectedScanlineSize := width * 2 // 16 bits = 2 bytes per pixel
	if int(scanlineSize) != expectedScanlineSize {
		return nil, fmt.Errorf("scanline size mismatch: calculated %d, TIFFScanlineSize %d", expectedScanlineSize, scanlineSize)
	}

	// Check for potential overflow before allocating C buffer
	// TIFFCheckTile requires checking tile sizes, not directly applicable here.
	// Check totalBytes calculation manually.
	if height > 0 && int(scanlineSize) > (1<<63-1)/height { // Basic overflow check
		return nil, fmt.Errorf("image dimensions (%d x %d pixels, %d bytes/scanline) result in potential allocation overflow", width, height, scanlineSize)
	}
	totalBytes := C.size_t(height) * C.size_t(scanlineSize)

	// Allocate C buffer for the entire image
	cBuf := C.malloc(totalBytes)
	if cBuf == nil {
		return nil, fmt.Errorf("malloc failed for image buffer of %d bytes", totalBytes)
	}
	defer C.free(cBuf)

	// Read pixel data using the helper function
	// Need standard uint32_t for height argument
	h_c := C.uint32_t(h) // Convert Go uint32 to C.uint32_t
	if C.tiff_read_scanlines_gray16(tif, h_c, C.tmsize_t(scanlineSize), cBuf) == 0 {
		// Consider using TIFFError() to get details
		return nil, errors.New("tiff_read_scanlines_gray16 failed")
	}

	// Create Go image and copy data
	img := image.NewGray16(image.Rect(0, 0, width, height))
	// Use unsafe.Slice to create a Go slice backed by C memory.
	// IMPORTANT: This slice is only valid until cBuf is freed by the defer.
	cBufSlice := unsafe.Slice((*byte)(cBuf), int(totalBytes))
	copy(img.Pix, cBufSlice) // Copy data from C buffer to Go slice

	// The img.Pix now contains the data, and is managed by Go GC.
	// The C buffer cBuf will be freed by defer C.free(cBuf).

	return img, nil
}
