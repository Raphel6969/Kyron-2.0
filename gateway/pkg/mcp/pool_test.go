package mcp

import (
	"bytes"
	"testing"
)

func TestBufferPoolAndFraming(t *testing.T) {
	buf := GetBuffer()
	if buf == nil || cap(*buf) < DefaultBufferSize {
		t.Fatalf("expected buffer with capacity >= %d", DefaultBufferSize)
	}
	PutBuffer(buf)

	var pipe bytes.Buffer
	writer := NewFrameWriter(&pipe)
	reader := NewFrameReader(&pipe)

	payload1 := []byte(`{"jsonrpc":"2.0","method":"ping","id":1}`)
	payload2 := []byte(`{"jsonrpc":"2.0","method":"ping","id":2}`)

	if err := writer.WriteMsg(payload1); err != nil {
		t.Fatalf("failed to write payload1: %v", err)
	}
	if err := writer.WriteMsg(payload2); err != nil {
		t.Fatalf("failed to write payload2: %v", err)
	}

	read1, err := reader.ReadMsg()
	if err != nil {
		t.Fatalf("failed to read payload1: %v", err)
	}
	if string(read1) != string(payload1) {
		t.Errorf("read1 mismatch: got %s, want %s", string(read1), string(payload1))
	}

	read2, err := reader.ReadMsg()
	if err != nil {
		t.Fatalf("failed to read payload2: %v", err)
	}
	if string(read2) != string(payload2) {
		t.Errorf("read2 mismatch: got %s, want %s", string(read2), string(payload2))
	}
}
