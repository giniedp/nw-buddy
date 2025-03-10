package cgf

import (
	"fmt"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

type ChunkReader func(r *buf.Reader, h ChunkHeader) (Chunker, error)

type RegisteredReader struct {
	Type    ChunkType
	Version uint16
	Reader  ChunkReader
}

var chunkRegistroy []RegisteredReader

func RegisterChunkReader(type_ ChunkType, version uint16, reader ChunkReader) {
	chunkRegistroy = append(chunkRegistroy, RegisteredReader{
		Type:    type_,
		Version: version,
		Reader:  reader,
	})
}

type readFileOptions struct {
	withoutChunks bool
	registry      []RegisteredReader
}

type ReadFileOption func(*readFileOptions)

func WithoutChunks() ReadFileOption {
	return func(o *readFileOptions) {
		o.withoutChunks = true
	}
}

func WithReaders(readers []RegisteredReader) ReadFileOption {
	return func(o *readFileOptions) {
		o.registry = readers
	}
}

func Load(file nwfs.File) (out *File, err error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	out, err = Parse(data)
	if out != nil {
		out.Source = file.Path()
	}
	return out, err
}

func Parse(data []byte, options ...ReadFileOption) (out *File, err error) {
	defer utils.HandleRecover(&err)

	config := readFileOptions{}
	for _, o := range options {
		o(&config)
	}
	if len(config.registry) == 0 {
		config.registry = chunkRegistroy
	}

	r := buf.NewReaderLE(data)
	out = &File{}
	out.Header = utils.Must(readFileHeader(r))
	out.Table = utils.Must(readChunkTable(r, out.Header))
	if !config.withoutChunks {
		out.Chunks = utils.Must(readChunks(r, out.Table, config.registry))
	}
	return
}

func readFileHeader(r *buf.Reader) (out FileHeader, err error) {
	defer utils.HandleRecover(&err)

	signature := string(r.MustReadBytes(4))
	if signature != "CrCh" {
		err = fmt.Errorf("invalid signature. Expected 'CrCh' but was '%s' ", signature)
		return
	}

	out.FileVersion = FileVersion(utils.Must(r.ReadUint16()))
	out.FileType = FileType(utils.Must(r.ReadUint16()))
	out.ChunkCount = utils.Must(r.ReadUint32())
	out.ChunkOffset = utils.Must(r.ReadUint32())

	return
}

func readChunkHeader(r *buf.Reader, version FileVersion) (out ChunkHeader, err error) {
	defer utils.HandleRecover(&err)

	if version >= FileVersion_CryTek_3_6 {
		out.Type = ChunkType(r.MustReadUint16())
		out.Version = r.MustReadUint16()
		out.Id = r.MustReadInt32()
		out.Size = r.MustReadUint32()
		out.Offset = r.MustReadUint32()
	} else {
		err = fmt.Errorf("unsupported version %d", version)
	}

	return
}

func readChunkTable(r *buf.Reader, header FileHeader) (out []ChunkHeader, err error) {
	defer utils.HandleRecover(&err)

	r.SeekAbsolute(int(header.ChunkOffset))
	out = make([]ChunkHeader, header.ChunkCount)
	for i := range header.ChunkCount {
		if it, err := readChunkHeader(r, header.FileVersion); err != nil {
			return nil, err
		} else {
			// slog.Debug("Chunk", "id", it.Id, "type", it.Type, "version", it.Version)
			out[i] = it
		}
	}

	return
}

func readChunks(r *buf.Reader, headers []ChunkHeader, readers []RegisteredReader) (out []Chunker, err error) {
	defer utils.HandleRecover(&err)

	out = make([]Chunker, len(headers))
	for i, header := range headers {
		reader := findReader(readers, header)
		// fmt.Printf("Reading chunk %s 0x%04x 0x%04x %d\n", header.Type, uint16(header.Type), header.Version, header.Size)
		if reader == nil {
			continue
		}
		out[i], err = reader(r, header)
		if err != nil {
			return nil, err
		}
	}

	return
}

func findReader(reg []RegisteredReader, header ChunkHeader) ChunkReader {
	for _, r := range reg {
		if r.Type == header.Type && r.Version == header.Version {
			return r.Reader
		}
	}
	return nil
}
