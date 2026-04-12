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

	GatewayHost string
	GatewayPort string
	AuthHost    string
	AuthPort    string
	CoreHost    string
	CorePort    string
	WorkerHost  string
	WorkerPort  string

	MongoURI      string
	MongoAuthDB   string
	MongoCoreDB   string
	MongoWorkerDB string

	RedisHost     string
	RedisPort     string
	RedisPassword string
	RedisDB       int

	KafkaBrokers string

	JWTSecret        string
	JWTAccessExpiry  time.Duration
	JWTRefreshExpiry time.Duration

	AuthServiceURL string
	CoreServiceURL string

	CORSAllowedOrigins string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		AppEnv:             getEnv("APP_ENV", "development"),
		GatewayHost:        getEnv("GATEWAY_HOST", "0.0.0.0"),
		GatewayPort:        getEnv("GATEWAY_PORT", "8080"),
		AuthHost:           getEnv("AUTH_SERVICE_HOST", "0.0.0.0"),
		AuthPort:           getEnv("AUTH_SERVICE_PORT", "8081"),
		CoreHost:           getEnv("CORE_SERVICE_HOST", "0.0.0.0"),
		CorePort:           getEnv("CORE_SERVICE_PORT", "8082"),
		WorkerHost:         getEnv("WORKER_SERVICE_HOST", "0.0.0.0"),
		WorkerPort:         getEnv("WORKER_SERVICE_PORT", "8083"),
		MongoURI:           getEnv("MONGO_URI", "mongodb://localhost:27017"),
		MongoAuthDB:        getEnv("MONGO_AUTH_DB", "deenquest_auth"),
		MongoCoreDB:        getEnv("MONGO_CORE_DB", "deenquest_core"),
		MongoWorkerDB:      getEnv("MONGO_WORKER_DB", "deenquest_worker"),
		RedisHost:          getEnv("REDIS_HOST", "localhost"),
		RedisPort:          getEnv("REDIS_PORT", "6379"),
		RedisPassword:      getEnv("REDIS_PASSWORD", ""),
		RedisDB:            getInt("REDIS_DB", 0),
		KafkaBrokers:       getEnv("KAFKA_BROKERS", "localhost:9092"),
		JWTSecret:          getEnv("JWT_SECRET", "change-me-in-production"),
		AuthServiceURL:     getEnv("AUTH_SERVICE_URL", "http://auth-service:8081"),
		CoreServiceURL:     getEnv("CORE_SERVICE_URL", "http://core-service:8082"),
		CORSAllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173"),
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
