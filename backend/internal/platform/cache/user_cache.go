package cache

import (
	"context"
	"encoding/json"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

// UserCache caches per-user read models and a few shared ones.
//
// Invalidation is the hard part here, because one write ripples across
// endpoints owned by different modules: finishing a lesson changes XP, the
// streak, the level map and the day's task list at once. Having each service
// delete the other services' keys would couple them all together and leave
// stale reads the first time someone forgot one.
//
// So keys carry a generation instead. Every user has a version counter, and a
// cache key is only valid for the version it was written under. A write calls
// Invalidate, the counter moves, and every key that user owns — whoever wrote
// it — stops resolving in a single operation.
//
// Every method is nil-safe: with no Redis the app runs uncached rather than
// failing, which is the same contract the rest of the platform package keeps.
type UserCache struct {
	redis *RedisClient
}

func NewUserCache(r *RedisClient) *UserCache {
	return &UserCache{redis: r}
}

// versionTTL keeps a user's counter alive far longer than any value written
// under it. If the counter expired first it would restart at zero and values
// cached under an old generation could resolve again; a day is orders of
// magnitude beyond the minute-scale value TTLs.
const versionTTL = 24 * time.Hour

// getScript resolves the version and the value in one round trip. A missing
// counter reads as generation 0, which is what Invalidate's INCR moves off.
var getScript = redis.NewScript(`
local ver = redis.call("GET", KEYS[1]) or "0"
return redis.call("GET", KEYS[2] .. ":" .. ver)
`)

var setScript = redis.NewScript(`
local ver = redis.call("GET", KEYS[1]) or "0"
redis.call("SET", KEYS[2] .. ":" .. ver, ARGV[1], "PX", ARGV[2])
return 1
`)

// Get reports whether a fresh value for (userID, name) was found and decoded
// into dest. A miss, a decode failure and an unreachable Redis are all the same
// answer to the caller: recompute it.
func (c *UserCache) Get(ctx context.Context, userID, name string, dest any) bool {
	if c == nil || c.redis == nil || userID == "" {
		return false
	}

	raw, err := getScript.Run(ctx, c.redis.Client, c.keys(userID, name)).Text()
	if err != nil || raw == "" {
		return false
	}
	return json.Unmarshal([]byte(raw), dest) == nil
}

// Set stores value for ttl under the user's current generation. Failures are
// silent: a cache that cannot be written is a slower app, not a broken one.
func (c *UserCache) Set(ctx context.Context, userID, name string, value any, ttl time.Duration) {
	if c == nil || c.redis == nil || userID == "" || ttl <= 0 {
		return
	}

	raw, err := json.Marshal(value)
	if err != nil {
		return
	}
	_ = setScript.Run(ctx, c.redis.Client, c.keys(userID, name),
		raw, strconv.FormatInt(ttl.Milliseconds(), 10)).Err()
}

// Invalidate retires every cached value belonging to a user.
//
// Call it after a write that changes anything the user can read back, without
// worrying about which endpoints those are. It is a single INCR, so calling it
// twice for one logical change costs nothing worth avoiding.
func (c *UserCache) Invalidate(ctx context.Context, userID string) {
	if c == nil || c.redis == nil || userID == "" {
		return
	}

	versionKey := "uv:" + userID
	n, err := c.redis.Client.Incr(ctx, versionKey).Result()
	if err != nil {
		return
	}
	if n == 1 {
		_ = c.redis.Client.Expire(ctx, versionKey, versionTTL).Err()
	}
}

// GetShared reads a value that is not scoped to any user — a leaderboard, a
// global count — and so is not affected by per-user invalidation. Shared
// entries rely on their TTL alone, which is why those TTLs are short.
func (c *UserCache) GetShared(ctx context.Context, key string, dest any) bool {
	if c == nil || c.redis == nil {
		return false
	}

	raw, err := c.redis.Client.Get(ctx, "shared:"+key).Bytes()
	if err != nil {
		return false
	}
	return json.Unmarshal(raw, dest) == nil
}

func (c *UserCache) SetShared(ctx context.Context, key string, value any, ttl time.Duration) {
	if c == nil || c.redis == nil || ttl <= 0 {
		return
	}

	raw, err := json.Marshal(value)
	if err != nil {
		return
	}
	_ = c.redis.Client.Set(ctx, "shared:"+key, raw, ttl).Err()
}

func (c *UserCache) keys(userID, name string) []string {
	return []string{"uv:" + userID, "uc:" + userID + ":" + name}
}
