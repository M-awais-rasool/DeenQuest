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

	AccessLogSampleEvery int

	Host string
	Port string

	MongoURI string
	MongoDB  string

	RedisHost     string
	RedisPort     string
	RedisPassword string
	RedisDB       int

	JWTSecret             string
	JWTAccessExpiry       time.Duration
	RefreshTokenExpiry    time.Duration
	GoogleWebClientID     string
	GoogleIOSClientID     string
	GoogleAndroidClientID string
	AppleClientIDs        string

	WhisperURL string

	WhisperEngine string

	WhisperMaxConcurrent int
	WhisperWait          time.Duration

	RecitationQueueDepth int
	RecitationWorkers    int

	WhisperInternalToken string
	TrustedProxies       string

	AlQuranBaseURL    string
	QuranAudioCDNURL  string
	QuranAudioEdition string
	QuranAudioBitrate int

	ExpoPushURL         string
	ExpoPushAccessToken string

	OllamaURL string

	// Gemini (optional) — powers the Learning Agent's AI feedback/motivation
	// layer. When GeminiAPIKey is empty, the AI consumer is not started and the
	// deterministic learning core runs unchanged.
	GeminiAPIKey string
	GeminiModel  string

	CoachEnabled    bool
	CoachLLMEnabled bool

	CORSAllowedOrigins string

	// AdminEmails is a comma-separated allowlist of user emails permitted to
	// access the /admin endpoints, and the only path to the ADMIN role: whoever
	// signs in with a listed address through any provider is granted it, and
	// losing the listing drops it again. Empty = open (dev convenience).
	AdminEmails string
}

func Load() (*Config, error) {
	_ = godotenv.Load()
	if _, err := os.Stat(".env.local"); err == nil {
		_ = godotenv.Overload(".env.local")
	}

	cfg := &Config{
		AppEnv:               getEnv("APP_ENV", "development"),
		AccessLogSampleEvery: getInt("ACCESS_LOG_SAMPLE_EVERY", 0),
		Host:                 getEnv("SERVER_HOST", "0.0.0.0"),
		Port:                 getEnv("SERVER_PORT", "8080"),
		MongoURI:             getEnv("MONGO_URI", "mongodb://localhost:27017"),
		MongoDB:              getEnv("MONGO_DB", "deenquest"),
		RedisHost:            getEnv("REDIS_HOST", "localhost"),
		RedisPort:            getEnv("REDIS_PORT", "6379"),
		RedisPassword:        getEnv("REDIS_PASSWORD", ""),
		RedisDB:              getInt("REDIS_DB", 0),
		JWTSecret:            getEnv("JWT_SECRET", "change-me-in-production"),
		WhisperURL:           getEnv("WHISPER_URL", "http://localhost:8001"),
		WhisperEngine:        getEnv("WHISPER_ENGINE", "faster-whisper"),
		WhisperMaxConcurrent: getInt("WHISPER_MAX_CONCURRENT", 1),
		RecitationQueueDepth: getInt("RECITATION_QUEUE_DEPTH", 120),
		RecitationWorkers:    getInt("RECITATION_WORKERS", 0),
		AlQuranBaseURL:       getEnv("ALQURAN_BASE_URL", "https://api.alquran.cloud/v1"),
		QuranAudioCDNURL:     getEnv("QURAN_AUDIO_CDN_URL", "https://cdn.islamic.network"),
		QuranAudioEdition:    getEnv("QURAN_AUDIO_EDITION", "ar.alafasy"),
		QuranAudioBitrate:    getInt("QURAN_AUDIO_BITRATE", 128),
		ExpoPushURL:          getEnv("EXPO_PUSH_URL", "https://exp.host/--/api/v2/push/send"),
		ExpoPushAccessToken:  getEnv("EXPO_PUSH_ACCESS_TOKEN", ""),
		OllamaURL:            getEnv("OLLAMA_URL", "http://127.0.0.1:11434"),
		GeminiAPIKey:         getEnv("GEMINI_API_KEY", ""),
		GeminiModel:          getEnv("GEMINI_MODEL", ""),
		CoachEnabled:         getBool("COACH_ENABLED", true),
		CoachLLMEnabled:      getBool("COACH_LLM_ENABLED", false),
		CORSAllowedOrigins:   getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173"),
		AdminEmails:          getEnv("ADMIN_EMAILS", ""),

		GoogleWebClientID:     getEnv("GOOGLE_WEB_CLIENT_ID", ""),
		GoogleIOSClientID:     getEnv("GOOGLE_IOS_CLIENT_ID", ""),
		GoogleAndroidClientID: getEnv("GOOGLE_ANDROID_CLIENT_ID", ""),
		AppleClientIDs:        getEnv("APPLE_CLIENT_IDS", ""),

		WhisperInternalToken: getEnv("WHISPER_INTERNAL_TOKEN", ""),
		TrustedProxies:       getEnv("TRUSTED_PROXIES", ""),
	}

	var err error
	cfg.JWTAccessExpiry, err = time.ParseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_ACCESS_EXPIRY: %w", err)
	}

	cfg.RefreshTokenExpiry, err = time.ParseDuration(getEnv("REFRESH_TOKEN_EXPIRY", "1440h"))
	if err != nil {
		return nil, fmt.Errorf("invalid REFRESH_TOKEN_EXPIRY: %w", err)
	}

	cfg.WhisperWait, err = time.ParseDuration(getEnv("WHISPER_WAIT", "45s"))
	if err != nil {
		return nil, fmt.Errorf("invalid WHISPER_WAIT: %w", err)
	}

	switch cfg.WhisperEngine {
	case "faster-whisper", "whisper-cpp":
	default:
		return nil, fmt.Errorf("invalid WHISPER_ENGINE %q: want faster-whisper or whisper-cpp", cfg.WhisperEngine)
	}

	if cfg.RecitationWorkers < 1 {
		cfg.RecitationWorkers = cfg.WhisperMaxConcurrent
	}

	// Unset means "pick the sane default for this environment": sample hard in
	// production, log everything locally where the volume is trivial and a
	// missing line costs debugging time.
	if cfg.AccessLogSampleEvery <= 0 {
		if cfg.IsProduction() {
			cfg.AccessLogSampleEvery = 100
		} else {
			cfg.AccessLogSampleEvery = 1
		}
	}

	if cfg.IsProduction() {
		if err := cfg.validateProduction(); err != nil {
			return nil, err
		}
	}

	return cfg, nil
}

func (c *Config) IsProduction() bool { return c.AppEnv == "production" }

func (c *Config) validateProduction() error {
	var problems []string

	switch {
	case c.JWTSecret == "", c.JWTSecret == "change-me-in-production":
		problems = append(problems, "JWT_SECRET is unset or still the placeholder — generate one with: openssl rand -base64 48")
	case len(c.JWTSecret) < 32:
		problems = append(problems, "JWT_SECRET must be at least 32 characters")
	}

	if len(c.AdminEmailList()) == 0 {
		problems = append(problems, "ADMIN_EMAILS is empty — an empty allowlist grants the ADMIN role to every signed-in user")
	}

	origins := c.AllowedOrigins()
	if len(origins) == 0 {
		problems = append(problems, "CORS_ALLOWED_ORIGINS is empty")
	}
	for _, o := range origins {
		if o == "*" || strings.Contains(o, "localhost") || strings.Contains(o, "127.0.0.1") {
			problems = append(problems, "CORS_ALLOWED_ORIGINS must not contain a wildcard or a local address: "+o)
		}
	}

	if !strings.Contains(c.MongoURI, "@") {
		problems = append(problems, "MONGO_URI has no credentials — production MongoDB must require authentication")
	}

	if len(c.GoogleClientIDs()) == 0 && len(c.AppleClientIDList()) == 0 {
		problems = append(problems, "no OAuth client IDs configured — nobody would be able to sign in")
	}

	if c.WhisperInternalToken == "" {
		problems = append(problems, "WHISPER_INTERNAL_TOKEN is empty — the whisper service has no other authentication")
	}

	if c.TrustedProxies == "" {
		problems = append(problems, "TRUSTED_PROXIES is empty — set it to the reverse proxy's CIDR so client IPs cannot be forged")
	}

	if len(problems) == 0 {
		return nil
	}
	return fmt.Errorf("refusing to start with an unsafe production config:\n  - %s",
		strings.Join(problems, "\n  - "))
}

func (c *Config) TrustedProxyList() []string {
	parts := strings.Split(c.TrustedProxies, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if v := strings.TrimSpace(p); v != "" {
			out = append(out, v)
		}
	}
	return out
}

func (c *Config) GetRedisAddr() string {
	return c.RedisHost + ":" + c.RedisPort
}

// AdminEmailList returns the configured admin emails, lower-cased, trimmed and
// de-duplicated.
func (c *Config) AdminEmailList() []string {
	parts := strings.Split(c.AdminEmails, ",")
	seen := make(map[string]struct{}, len(parts))
	emails := make([]string, 0, len(parts))
	for _, p := range parts {
		v := strings.ToLower(strings.TrimSpace(p))
		if v == "" {
			continue
		}
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		emails = append(emails, v)
	}
	return emails
}

func (c *Config) GoogleClientIDs() []string {
	return nonEmpty(c.GoogleWebClientID, c.GoogleIOSClientID, c.GoogleAndroidClientID)
}

func (c *Config) AppleClientIDList() []string {
	return nonEmpty(strings.Split(c.AppleClientIDs, ",")...)
}

func nonEmpty(values ...string) []string {
	out := make([]string, 0, len(values))
	for _, v := range values {
		if t := strings.TrimSpace(v); t != "" {
			out = append(out, t)
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

func getBool(key string, fallback bool) bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv(key)))
	switch v {
	case "":
		return fallback
	case "1", "true", "yes", "on":
		return true
	default:
		return false
	}
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
