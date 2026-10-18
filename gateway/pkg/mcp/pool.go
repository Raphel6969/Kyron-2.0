package mcp

import (
	"bufio"
	"bytes"
	"io"
	"sync"
)

const DefaultBufferSize = 64 * 1024 // 64KB buffer

var bufferPool = sync.Pool{
	New: func() interface{} {
		buf := make([]byte, DefaultBufferSize)
		return &buf
	},
}

// GetBuffer retrieves a byte slice from the pool
func GetBuffer() *[]byte {
	return bufferPool.Get().(*[]byte)
}

// PutBuffer returns a byte slice to the pool
func PutBuffer(buf *[]byte) {
	if buf != nil && cap(*buf) >= DefaultBufferSize {
		*buf = (*buf)[:DefaultBufferSize]
		bufferPool.Put(buf)
	}
}

// FrameReader reads newline-delimited JSON-RPC messages using buffered I/O
type FrameReader struct {
	reader *bufio.Reader
}

// NewFrameReader wraps an io.Reader
func NewFrameReader(r io.Reader) *FrameReader {
	return &FrameReader{
		reader: bufio.NewReaderSize(r, DefaultBufferSize),
	}
}

// ReadMsg reads a single JSON-RPC message from the reader
func (fr *FrameReader) ReadMsg() ([]byte, error) {
	line, err := fr.reader.ReadBytes('\n')
	if err != nil && len(line) == 0 {
		return nil, err
	}
	trimmed := bytes.TrimSpace(line)
	if len(trimmed) == 0 {
		if err != nil {
			return nil, err
		}
		// Skip empty newline and read next
		return fr.ReadMsg()
	}
	return trimmed, nil
}

// FrameWriter writes newline-delimited JSON-RPC messages safely
type FrameWriter struct {
	writer io.Writer
	mu     sync.Mutex
}

// NewFrameWriter wraps an io.Writer
func NewFrameWriter(w io.Writer) *FrameWriter {
	return &FrameWriter{
		writer: w,
	}
}

// WriteMsg writes a single JSON-RPC message followed by newline
func (fw *FrameWriter) WriteMsg(data []byte) error {
	fw.mu.Lock()
	defer fw.mu.Unlock()

	if _, err := fw.writer.Write(data); err != nil {
		return err
	}
	_, err := fw.writer.Write([]byte("\n"))
	return err
}
