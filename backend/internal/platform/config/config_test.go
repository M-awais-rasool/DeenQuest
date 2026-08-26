package config

import "testing"

// validProduction is a config that passes every check. Each test below breaks
// exactly one field, so a failure names the check that regressed.
func validProduction() *Config {
	return &Config{
		AppEnv:             "production",
		JWTSecret:          "test-fixture-not-a-real-secret-0000000000",
		AdminEmails:        "ops@deenquest.app",
		CORSAllowedOrigins: "https://admin.deenquest.app",
		MongoURI:           "mongodb://dq_app:test-fixture@mongo:27017/deenquest",
		GoogleWebClientID:  "123.apps.googleusercontent.com",

		WhisperInternalToken: "test-fixture-token",
		TrustedProxies:       "172.16.0.0/12",
	}
}

func TestValidateProductionAcceptsSafeConfig(t *testing.T) {
	if err := validProduction().validateProduction(); err != nil {
		t.Fatalf("expected a valid production config to pass, got: %v", err)
	}
}

func TestValidateProductionRejects(t *testing.T) {
	tests := []struct {
		name   string
		mutate func(*Config)
	}{
		{"empty admin allowlist grants ADMIN to everyone", func(c *Config) { c.AdminEmails = "" }},
		{"admin allowlist of only separators", func(c *Config) { c.AdminEmails = " , , " }},
		{"placeholder JWT secret", func(c *Config) { c.JWTSecret = "change-me-in-production" }},
		{"empty JWT secret", func(c *Config) { c.JWTSecret = "" }},
		{"short JWT secret", func(c *Config) { c.JWTSecret = "tooshort" }},
		{"wildcard CORS origin", func(c *Config) { c.CORSAllowedOrigins = "*" }},
		{"localhost CORS origin", func(c *Config) { c.CORSAllowedOrigins = "https://admin.deenquest.app,http://localhost:5173" }},
		{"loopback CORS origin", func(c *Config) { c.CORSAllowedOrigins = "http://127.0.0.1:3000" }},
		{"empty CORS origins", func(c *Config) { c.CORSAllowedOrigins = "" }},
		{"MongoDB without credentials", func(c *Config) { c.MongoURI = "mongodb://mongo:27017" }},
		{"no OAuth client configured", func(c *Config) { c.GoogleWebClientID = ""; c.AppleClientIDs = "" }},
		{"whisper left unauthenticated", func(c *Config) { c.WhisperInternalToken = "" }},
		{"no trusted proxies", func(c *Config) { c.TrustedProxies = "" }},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := validProduction()
			tt.mutate(cfg)
			if err := cfg.validateProduction(); err == nil {
				t.Fatalf("expected %s to be rejected, but the config was accepted", tt.name)
			}
		})
	}
}

// Development keeps every convenience default. The checks must not run there,
// or `make run` stops working.
func TestDevelopmentConfigIsNotValidated(t *testing.T) {
	cfg := &Config{AppEnv: "development", JWTSecret: "change-me-in-production"}
	if cfg.IsProduction() {
		t.Fatal("development config reported itself as production")
	}
}

func TestTrustedProxyList(t *testing.T) {
	cases := map[string][]string{
		"":                            {},
		"172.16.0.0/12":               {"172.16.0.0/12"},
		" 172.16.0.0/12 , 10.0.0.0/8": {"172.16.0.0/12", "10.0.0.0/8"},
		",,":                          {},
	}

	for in, want := range cases {
		got := (&Config{TrustedProxies: in}).TrustedProxyList()
		if len(got) != len(want) {
			t.Fatalf("TrustedProxyList(%q) = %v, want %v", in, got, want)
		}
		for i := range want {
			if got[i] != want[i] {
				t.Fatalf("TrustedProxyList(%q)[%d] = %q, want %q", in, i, got[i], want[i])
			}
		}
	}
}
