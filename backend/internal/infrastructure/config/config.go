package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv string

	Host string
	Port string

	MongoURI string
	MongoDB  string

	RedisHost     string
	RedisPort     string
	RedisPassword string
	RedisDB       int

	KafkaBrokers string

	JWTSecret        string
	JWTAccessExpiry  time.Duration
	JWTRefreshExpiry time.Duration

	WhisperURL string

	AlQuranBaseURL    string
	QuranAudioCDNURL  string
	QuranAudioEdition string
	QuranAudioBitrate int

	ExpoPushURL         string
	ExpoPushAccessToken string

	OllamaURL string

	CORSAllowedOrigins string
}

func Load() (*Config, error) {
	_ = godotenv.Load()
	if _, err := os.Stat(".env.local"); err == nil {
		_ = godotenv.Overload(".env.local")
	}

	cfg := &Config{
		AppEnv:              getEnv("APP_ENV", "development"),
		Host:                getEnv("SERVER_HOST", "0.0.0.0"),
		Port:                getEnv("SERVER_PORT", "8080"),
		MongoURI:            getEnv("MONGO_URI", "mongodb://localhost:27017"),
		MongoDB:             getEnv("MONGO_DB", "deenquest"),
		RedisHost:           getEnv("REDIS_HOST", "localhost"),
		RedisPort:           getEnv("REDIS_PORT", "6379"),
		RedisPassword:       getEnv("REDIS_PASSWORD", ""),
		RedisDB:             getInt("REDIS_DB", 0),
		KafkaBrokers:        getEnv("KAFKA_BROKERS", "localhost:9092"),
		JWTSecret:           getEnv("JWT_SECRET", "change-me-in-production"),
		WhisperURL:          getEnv("WHISPER_URL", "http://localhost:8001"),
		AlQuranBaseURL:      getEnv("ALQURAN_BASE_URL", "https://api.alquran.cloud/v1"),
		QuranAudioCDNURL:    getEnv("QURAN_AUDIO_CDN_URL", "https://cdn.islamic.network"),
		QuranAudioEdition:   getEnv("QURAN_AUDIO_EDITION", "ar.alafasy"),
		QuranAudioBitrate:   getInt("QURAN_AUDIO_BITRATE", 128),
		ExpoPushURL:         getEnv("EXPO_PUSH_URL", "https://exp.host/--/api/v2/push/send"),
		ExpoPushAccessToken: getEnv("EXPO_PUSH_ACCESS_TOKEN", ""),
		OllamaURL:           getEnv("OLLAMA_URL", "http://127.0.0.1:11434"),
		CORSAllowedOrigins:  getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173"),
	}

	var err error
	cfg.JWTAccessExpiry, err = time.ParseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_ACCESS_EXPIRY: %w", err)
	}

	cfg.JWTRefreshExpiry, err = time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_REFRESH_EXPIRY: %w", err)
	}

	return cfg, nil
}

func (c *Config) GetRedisAddr() string {
	return c.RedisHost + ":" + c.RedisPort
}

func (c *Config) GetKafkaBrokerList() []string {
	parts := strings.Split(c.KafkaBrokers, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		v := strings.TrimSpace(p)
		if v != "" {
			out = append(out, v)
		}
	}
	return out
}

func (c *Config) AllowedOrigins() []string {
	parts := strings.Split(c.CORSAllowedOrigins, ",")
	origins := make([]string, 0, len(parts))
	for _, p := range parts {
		v := strings.TrimSpace(p)
		if v != "" {
			origins = append(origins, v)
		}
	}
	return origins
}

func getEnv(key, fallback string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	return v
}

func getInt(key string, fallback int) int {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	i, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return i
}
