package pull

import "log/slog"

type Stats struct {
	rows []statRow
}

type statRow struct {
	name string
	args []any
}

func (s *Stats) Add(name string, args ...any) {
	s.rows = append(s.rows, statRow{name, args})
}

func (s *Stats) Print() {
	for _, row := range s.rows {
		slog.Info(row.name, row.args...)
	}
}
