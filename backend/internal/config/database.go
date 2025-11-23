package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Database struct {
	Username string
	Password string
	Host     string
	Port     uint16
	DBName   string
	SSLMode  string
}

func loadPassword() (string, error) {
	password, ok := os.LookupEnv("POSTGRES_PASSWORD")
	if ok {
		return password, nil
	}

	passwordFile, ok := os.LookupEnv("POSTGRES_PASSWORD_FILE")
	if !ok {
		return "", fmt.Errorf("no POSTGRES_PASSWORD or POSTGRES_PASSWORD_FIL where found in the environment variable set")
	}

	data, err := os.ReadFile(passwordFile)
	if err != nil {
		return "", fmt.Errorf("failed to read from a password file: %v", err)
	}

	return strings.TrimSpace(string(data)), nil
}

func NewDatabase() (*Database, error) {
	username, ok := os.LookupEnv("POSTGRES_USER")
	if !ok {
		return nil, fmt.Errorf("no POSTGRES_USER env variable set")
	}

	password, err := loadPassword()
	if err != nil {
		return nil, fmt.Errorf("loading password: %w", err)
	}

	host, ok := os.LookupEnv("POSTGRES_HOST")
	if !ok {
		return nil, fmt.Errorf("no POSTGRES_HOST env variable set")
	}

	portStr, ok := os.LookupEnv("POSTGRES_PORT")
	if !ok {
		return nil, fmt.Errorf("no POSTGRES_PORT env variable set")
	}

	port, err := strconv.Atoi(portStr)
	if err != nil {
		return nil, fmt.Errorf("failed to convert port to int: %w", err)
	}

	dbname, ok := os.LookupEnv("POSTGRES_DB")
	if !ok {
		return nil, fmt.Errorf("no POSTGRES_DB env variable set")
	}

	sslmode, ok := os.LookupEnv("POSTGRES_SSLMODE")
	if !ok {
		return nil, fmt.Errorf("no SSLMode env variable set")
	}

	config := &Database{
		Username: username,
		Password: password,
		Host:     host,
		Port:     uint16(port),
		DBName:   dbname,
		SSLMode:  sslmode,
	}

	err = config.Validate()
	if err != nil {
		return nil, fmt.Errorf("failed to validate config: %w", err)
	}

	return config, nil
}

func (c *Database) URL() string {
	return fmt.Sprintf(
		"postgresql://%s:%s@%s:%d/%s?sslmode=%s",
		c.Username,
		c.Password,
		c.Host,
		c.Port,
		c.DBName,
		c.SSLMode,
	)
}

func (c *Database) Validate() error {
	if c.DBName == "" {
		return fmt.Errorf("invalid database name")
	}

	if c.Host == "" {
		return fmt.Errorf("invalid host")
	}

	if c.Username == "" {
		return fmt.Errorf("invalid username")
	}

	if c.Password == "" {
		return fmt.Errorf("invalid password")
	}

	if c.Port == 0 {
		return fmt.Errorf("invalid port")
	}

	if c.SSLMode == "" {
		return fmt.Errorf("invalid sslmode")
	}

	return nil
}
