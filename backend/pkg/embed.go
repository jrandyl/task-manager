package pkg

import "embed"

//go:embed migration/*.sql
var files embed.FS

func LoadMigrations() embed.FS {
	return files
}
