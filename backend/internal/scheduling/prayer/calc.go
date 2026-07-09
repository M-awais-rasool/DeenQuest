// Package prayer is a small, dependency-free prayer-times calculator (standard
// astronomical algorithm — no external API), so the Scheduling Agent stays fast
// and scalable. Angles default to Muslim World League; Asr to Shafi.
package prayer

import (
	"fmt"
	"math"
)

// Times holds the day's prayer times as "HH:MM" (local, per the given tz).
type Times struct {
	Fajr    string `json:"fajr"`
	Sunrise string `json:"sunrise"`
	Dhuhr   string `json:"dhuhr"`
	Asr     string `json:"asr"`
	Maghrib string `json:"maghrib"`
	Isha    string `json:"isha"`
}

// Params are the calculation conventions.
type Params struct {
	FajrAngle float64 // degrees below horizon
	IshaAngle float64
	AsrFactor float64 // 1 = Shafi/Maliki/Hanbali, 2 = Hanafi
}

// Default is Muslim World League (Fajr 18°, Isha 17°), Asr Shafi.
func Default() Params { return Params{FajrAngle: 18, IshaAngle: 17, AsrFactor: 1} }

// degree-based trig helpers
func dsin(d float64) float64        { return math.Sin(d * math.Pi / 180) }
func dcos(d float64) float64        { return math.Cos(d * math.Pi / 180) }
func dtan(d float64) float64        { return math.Tan(d * math.Pi / 180) }
func darcsin(x float64) float64     { return math.Asin(x) * 180 / math.Pi }
func darccos(x float64) float64     { return math.Acos(x) * 180 / math.Pi }
func darctan2(y, x float64) float64 { return math.Atan2(y, x) * 180 / math.Pi }
func darccot(x float64) float64     { return math.Atan2(1, x) * 180 / math.Pi }

func fixHour(h float64) float64 {
	h = math.Mod(h, 24)
	if h < 0 {
		h += 24
	}
	return h
}

func julian(year, month, day int) float64 {
	if month <= 2 {
		year--
		month += 12
	}
	a := math.Floor(float64(year) / 100)
	b := 2 - a + math.Floor(a/4)
	return math.Floor(365.25*float64(year+4716)) + math.Floor(30.6001*float64(month+1)) + float64(day) + b - 1524.5
}

// sunPosition returns the sun's declination and the equation of time (minutes).
func sunPosition(jd float64) (decl, eqt float64) {
	d := jd - 2451545.0
	g := math.Mod(357.529+0.98560028*d, 360)
	q := math.Mod(280.459+0.98564736*d, 360)
	l := math.Mod(q+1.915*dsin(g)+0.020*dsin(2*g), 360)
	e := 23.439 - 0.00000036*d
	decl = darcsin(dsin(e) * dsin(l))
	ra := darctan2(dcos(e)*dsin(l), dcos(l)) / 15
	eqt = (q/15 - fixHour(ra)) * 60
	return decl, eqt
}

// Compute returns the prayer times for a date at (lat, lng) with timezone offset
// tz (hours east of UTC, e.g. 5 for PKT).
func Compute(year, month, day int, lat, lng, tz float64, p Params) Times {
	jd := julian(year, month, day) - lng/(15*24)
	decl, eqt := sunPosition(jd)

	dhuhr := 12 + tz - lng/15 - eqt/60

	// Canonical PrayTimes hour-angle for an "angle below/at the horizon".
	// Morning prayers are noon - T, afternoon/evening are noon + T.
	tFor := func(angle float64) float64 {
		x := (-dsin(angle) - dsin(lat)*dsin(decl)) / (dcos(lat) * dcos(decl))
		if x > 1 {
			x = 1
		} else if x < -1 {
			x = -1
		}
		return darccos(x) / 15
	}

	asrAngle := -darccot(p.AsrFactor + dtan(math.Abs(lat-decl)))

	return Times{
		Fajr:    hm(dhuhr - tFor(p.FajrAngle)),
		Sunrise: hm(dhuhr - tFor(0.833)),
		Dhuhr:   hm(dhuhr),
		Asr:     hm(dhuhr + tFor(asrAngle)),
		Maghrib: hm(dhuhr + tFor(0.833)),
		Isha:    hm(dhuhr + tFor(p.IshaAngle)),
	}
}

func hm(h float64) string {
	h = fixHour(h + 0.5/60) // round to the nearest minute
	hh := int(h)
	mm := int((h - float64(hh)) * 60)
	return fmt.Sprintf("%02d:%02d", hh, mm)
}
