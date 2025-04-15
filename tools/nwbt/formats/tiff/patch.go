package tiff

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"image"
	"io"
	"log/slog"

	"golang.org/x/image/tiff"
)

func DecodeWithPhotometricPatch(data []byte) (image.Image, error) {
	// intentionally ingore the error
	if _, err := PatchPhotometricInterpretaion(data); err != nil {
		return nil, err
	}
	// Decode using the standard library decoder. The data might have been modified.
	return tiff.Decode(bytes.NewReader(data))
}

// PatchPhotometricInterpretaion checks if the TIFF data has PhotometricInterpretation=RGB
// and SamplesPerPixel=1. If so, it modifies the data *in-place* changing
// PhotometricInterpretation to BlackIsZero and returns true.
// Otherwise, it returns false.
func PatchPhotometricInterpretaion(data []byte) (bool, error) {
	order, tags, err := parse(data)
	if err != nil {
		return false, err
	}

	const fieldTypeUint16 = 3
	const tagPhotoId = 262
	const tagSppId = 277
	const pRGB = 2         // this is an invalid value for PhotometricInterpretation
	const pBlackIsZero = 1 // this is what we want instead

	var tagPhoto *tag
	var tagSpp *tag

	for _, tag := range tags {
		if tag.tagID == tagPhotoId {
			tagPhoto = tag
		}
		if tag.tagID == tagSppId {
			tagSpp = tag
		}
	}

	if tagPhoto == nil || tagSpp == nil {
		// nothing to do
		return false, nil
	}

	if tagPhoto.fieldType != fieldTypeUint16 {
		return false, fmt.Errorf("unexpected field type for PhotometricInterpretation: %d", tagPhoto.fieldType)
	}
	if tagSpp.fieldType != fieldTypeUint16 {
		return false, fmt.Errorf("unexpected field type for SamplesPerPixel: %d", tagSpp.fieldType)
	}

	tagPhotoValue, err := tagPhoto.Uint16(order, data)
	if err != nil {
		return false, err
	}

	tagSppValue, err := tagSpp.Uint16(order, data)
	if err != nil {
		return false, err
	}

	if tagPhotoValue == pRGB && tagSppValue == 1 {
		return true, tagPhoto.putUint16(order, data, pBlackIsZero)
	}
	return false, nil
}

type tag struct {
	tagID     uint16
	offset    int64
	fieldType uint32
	count     uint32
}

func (tag *tag) Uint16(order binary.ByteOrder, data []byte) (uint16, error) {
	if tag.offset+2 > int64(len(data)) {
		return 0, io.ErrUnexpectedEOF
	}
	return order.Uint16(data[tag.offset : tag.offset+2]), nil
}

func (tag *tag) putUint16(order binary.ByteOrder, data []byte, value uint16) error {
	if tag.offset+2 > int64(len(data)) {
		return io.ErrUnexpectedEOF
	}
	order.PutUint16(data[tag.offset:tag.offset+2], value)
	return nil
}

func parse(data []byte) (binary.ByteOrder, []*tag, error) {
	const leHeader = "II"
	const beHeader = "MM"
	const ifdLen = 12

	if len(data) < 8 {
		return nil, nil, io.ErrUnexpectedEOF
	}

	var order binary.ByteOrder
	switch string(data[0:2]) {
	case leHeader:
		order = binary.LittleEndian
	case beHeader:
		order = binary.BigEndian
	default:
		return nil, nil, tiff.FormatError("malformed header")
	}

	ifdOffset := int64(order.Uint32(data[4:8]))
	if ifdOffset <= 0 || ifdOffset+2 > int64(len(data)) {
		slog.Debug("ifdOffset", "ifdOffset", ifdOffset, "len(data)", len(data))
		return nil, nil, io.ErrUnexpectedEOF
	}

	numEntries := int(order.Uint16(data[ifdOffset : ifdOffset+2]))
	ifdStart := ifdOffset + 2
	ifdEnd := ifdStart + int64(numEntries)*int64(ifdLen)

	tags := make([]*tag, 0, numEntries)
	for p := ifdStart; p < ifdEnd; p += int64(ifdLen) {
		if p+ifdLen > int64(len(data)) {
			slog.Debug("ifdEnd", "ifdEnd", ifdEnd, "len(data)", len(data))
			return nil, nil, io.ErrUnexpectedEOF
		}
		tags = append(tags, &tag{
			tagID:     order.Uint16(data[p : p+2]),
			fieldType: uint32(order.Uint16(data[p+2 : p+4])),
			count:     order.Uint32(data[p+4 : p+8]),
			offset:    p + 8,
		})
	}

	return order, tags, nil
}
