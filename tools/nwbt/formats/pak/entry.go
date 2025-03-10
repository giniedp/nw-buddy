package pak

import (
	"archive/zip"
	"bufio"
	"bytes"
	"compress/flate"
	"compress/zlib"
	"encoding/binary"
	"fmt"
	"io"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
	"time"
)

type Entry struct {
	file string
	zip  *zip.File
	pak  *Container
}

func (it *Entry) Path() string {
	return it.file
}

func (it *Entry) Package() string {
	return it.pak.file
}

func (file *Entry) Read() ([]byte, error) {
	r, err := file.Inflate(utils.OodleInstance())
	if err != nil {
		return nil, err
	}
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	if isAzcs(data) {
		data, err = unAzcs(data)
		if err != nil {
			return nil, err
		}
	}
	return data, nil
}

func (file *Entry) Container() *Container {
	return file.pak
}

func (file *Entry) ModTime() time.Time {
	return file.zip.Modified
}

func (file *Entry) CompressedSize() uint64 {
	return file.zip.CompressedSize64
}

func (file *Entry) UncompressedSize() uint64 {
	return file.zip.UncompressedSize64
}

func (file *Entry) Crc32() uint32 {
	return file.zip.CRC32
}

func (file *Entry) Inflate(lib utils.Oodle) (io.ReadCloser, error) {
	var rc io.ReadCloser
	var err error

	if file.zip.Method == 0x00 {
		rc, err = file.zip.Open()
		if err != nil {
			return nil, err
		}

		return rc, nil
	}

	if file.zip.Method == 0x08 {
		r, err := file.zip.OpenRaw()
		if err != nil {
			return nil, err
		}

		reader := bufio.NewReaderSize(r, 10*1024)
		sig, err := reader.Peek(2)

		if err == nil {
			if isZlib(sig) {
				rc, err = zlib.NewReader(reader)
				if err != nil {
					return nil, err
				}
			} else {
				rc = flate.NewReader(reader)
			}
		} else {
			rc = flate.NewReader(reader)
		}

		return rc, nil
	}

	if file.zip.Method == 0x0f {
		reader, err := file.zip.OpenRaw()
		if err != nil {
			return nil, err
		}

		data, err := io.ReadAll(reader)
		if err != nil {
			return nil, err
		}

		output := make([]byte, int(file.zip.UncompressedSize64))
		_, err = lib.Decompress(data, len(data), output, len(output))
		if err != nil {
			return nil, err
		}

		data = output

		return io.NopCloser(bytes.NewBuffer(data)), nil
	}

	return nil, fmt.Errorf("unsupported compression method %v", file.zip.Method)
}

type zlibHeader struct {
	cmf struct {
		cm    uint8 // 8
		cinfo uint8 // <=7
	}
	flg struct {
		fcheck uint8
		fdict  uint8 // 0-1
		flevel uint8 // 0-3
	}
}

func isZlib(sigData []byte) bool {
	cmfByte := sigData[0]
	flgByte := sigData[1]
	zh := &zlibHeader{
		cmf: struct {
			cm    uint8
			cinfo uint8
		}{
			cm:    (cmfByte >> 0) & 0b1111,
			cinfo: (cmfByte >> 4) & 0b1111,
		},
		flg: struct {
			fcheck uint8
			fdict  uint8
			flevel uint8
		}{
			fcheck: (flgByte >> 0) & 0b11111,
			fdict:  (flgByte >> 5) & 0b1,
			flevel: (flgByte >> 6) & 0b11,
		},
	}
	return zh.cmf.cm == 0x08 && zh.cmf.cinfo <= 0x07 && zh.flg.fdict <= 0x01 && zh.flg.flevel <= 0x03 && binary.BigEndian.Uint16(sigData)%31 == 0
}

var azcsSig = []byte{0x41, 0x5a, 0x43, 0x53} // AZCS

func isAzcs(data []byte) bool {
	return bytes.HasPrefix(data, azcsSig)
}

func unAzcs(data []byte) (res []byte, err error) {
	defer utils.HandleRecover(&err, "unAzcs")

	r := buf.NewReaderBE(data)
	siz := string(r.MustReadBytes(4))
	if siz != "AZCS" {
		return nil, fmt.Errorf("not an AZCS file")
	}
	compression := r.MustReadUint32()
	r.MustReadUint64() // uncompressed size

	if compression != 0x73887d3a {
		return nil, fmt.Errorf("unsupported compression: 0x%08x", compression)
	}

	seekPoints := r.MustReadUint32()
	seekPointsSize := seekPoints * 16

	data = r.MustReadBytes(r.Len() - r.Pos() - int(seekPointsSize))
	z := utils.Must(zlib.NewReader(bytes.NewBuffer(data)))

	return io.ReadAll(z)
}
