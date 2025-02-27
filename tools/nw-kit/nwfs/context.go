package nwfs

import "context"

type ctxKey string

func (c ctxKey) String() string {
	return string(c)
}

var (
	ctxKeyArchive = ctxKey("archive")
)

func WithArchive(parent context.Context, archive Archive) context.Context {
	return context.WithValue(parent, ctxKeyArchive, archive)
}

func GetArchive(ctx context.Context) (Archive, bool) {
	v, ok := ctx.Value(ctxKeyArchive).(Archive)
	return v, ok
}
