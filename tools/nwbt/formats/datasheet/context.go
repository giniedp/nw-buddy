package datasheet

import "context"

type ctxKey string

func (c ctxKey) String() string {
	return string(c)
}

var (
	ctxKeyDocument     = ctxKey("document")
	ctxKeyDocumentList = ctxKey("documentList")
)

func WithDocument(parent context.Context, value *Document) context.Context {
	return context.WithValue(parent, ctxKeyDocument, value)
}

func GetDocument(ctx context.Context) (*Document, bool) {
	v, ok := ctx.Value(ctxKeyDocument).(*Document)
	return v, ok
}

func WithDocumentList(parent context.Context, value []*Document) context.Context {
	return context.WithValue(parent, ctxKeyDocumentList, value)
}

func GetDocumentList(ctx context.Context) ([]*Document, bool) {
	v, ok := ctx.Value(ctxKeyDocumentList).([]*Document)
	return v, ok
}
