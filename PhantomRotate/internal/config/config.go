package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

type Config struct {
	ServerAddr  string `mapstructure:"server_addr"`
	ConfigDir   string `mapstructure:"config_dir"`
	ClashBin    string `mapstructure:"clash_bin"`
	MixedPort   int    `mapstructure:"mixed_port"`
	HealthCheck struct {
		URL      string `mapstructure:"url"`
		Interval int    `mapstructure:"interval"`
	} `mapstructure:"health_check"`
}

func Load() *Config {
	home, err := os.UserHomeDir()
	if err != nil {
		home = "."
	}

	defaultDir := filepath.Join(home, ".phantomrotate")

	viper.SetDefault("server_addr", ":8888")
	viper.SetDefault("config_dir", defaultDir)
	viper.SetDefault("clash_bin", "./clash-bin/clash-windows-amd64.exe")
	viper.SetDefault("mixed_port", 1080)
	viper.SetDefault("health_check.url", "https://www.google.com")
	viper.SetDefault("health_check.interval", 300)

	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(defaultDir)
	viper.AddConfigPath(".")

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			fmt.Printf("Warning: config file error: %v\n", err)
		}
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		fmt.Printf("Warning: config unmarshal error: %v, using defaults\n", err)
	}

	if cfg.ConfigDir == "" {
		cfg.ConfigDir = defaultDir
	}

	return &cfg
}

func EnsureDir(dir string) error {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return os.MkdirAll(dir, 0755)
	}
	return nil
}
