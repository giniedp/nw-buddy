#include <stdlib.h>
#include <stdint.h>
#include <tiffio.h> // Include libtiff headers

// Forward declare the Go functions that will be exported
// These are needed because the C wrappers below call them.
extern tmsize_t goTiffReadProc(void* fd, void* buf, tmsize_t size);
extern tmsize_t goTiffWriteProc(void* fd, void* buf, tmsize_t size);
extern toff_t   goTiffSeekProc(void* fd, toff_t off, int whence);
extern int      goTiffCloseProc(void* fd);
extern toff_t   goTiffSizeProc(void* fd);

// Define the C wrapper functions directly in this C file.
// These wrappers match the signatures expected by TIFFClientOpen
// and call the exported Go functions.
tmsize_t cgoReadProc(thandle_t fd, void* buf, tmsize_t size) {
    return goTiffReadProc(fd, buf, size);
}
tmsize_t cgoWriteProc(thandle_t fd, void* buf, tmsize_t size) {
    return goTiffWriteProc(fd, buf, size);
}
toff_t cgoSeekProc(thandle_t fd, toff_t off, int whence) {
    return goTiffSeekProc(fd, off, whence);
}
int cgoCloseProc(thandle_t fd) {
    return goTiffCloseProc(fd);
}
toff_t cgoSizeProc(thandle_t fd) {
    return goTiffSizeProc(fd);
}

// Helper to get width/height
int tiff_get_size(TIFF* tif, uint32_t* w, uint32_t* h) {
    if (!TIFFGetField(tif, TIFFTAG_IMAGEWIDTH, w)) return 0;
    if (!TIFFGetField(tif, TIFFTAG_IMAGELENGTH, h)) return 0;
    return 1;
}

// Helper to read scanlines into a pre-allocated buffer (assumes grayscale)
int tiff_read_scanlines_gray16(TIFF* tif, uint32_t h, tmsize_t scanline_size, void* buf) {
	tmsize_t y;
	for (y = 0; y < h; y++) {
		// Read into the buffer at the correct offset for the current scanline
		if (TIFFReadScanline(tif, (char*)buf + y * scanline_size, (uint32_t)y, 0) < 0) {
			return 0; // Error
		}
	}
	return 1; // Success
}

// Specific helpers for TIFFGetField to avoid CGo variadic issues
int tiff_get_uint16_field(TIFF* tif, uint32_t tag, uint16_t* val) {
    return TIFFGetField(tif, tag, val);
}

// Helper to get the extra samples tag (count and data pointer)
int tiff_get_extrasamples(TIFF* tif, uint16_t* count, uint16_t** data) {
    // TIFFGetField expects the count as uint16_t* and data as uint16_t**
    return TIFFGetField(tif, TIFFTAG_EXTRASAMPLES, count, data);
}

// C wrapper function to call TIFFClientOpen
// Uses the cgo*Proc functions defined above in this file.
TIFF* call_tiff_client_open(
    const char* name,
    const char* mode,
    thandle_t clientdata
) {
    return TIFFClientOpen(name, mode, clientdata,
                          cgoReadProc, cgoWriteProc,
                          cgoSeekProc, cgoCloseProc, cgoSizeProc,
                          NULL, NULL);
}
