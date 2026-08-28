package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"time"
)

func main() {
	ready := flag.Bool("ready", false, "probe readiness instead of liveness")
	flag.Parse()

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	path := "/health"
	if *ready {
		path = "/health/ready"
	}

	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get("http://127.0.0.1:" + port + path)
	if err != nil {
		fmt.Fprintf(os.Stderr, "healthcheck: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Fprintf(os.Stderr, "healthcheck: %s returned %d\n", path, resp.StatusCode)
		os.Exit(1)
	}
}
