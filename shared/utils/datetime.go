package utils

import (
	"fmt"
	"time"
)

// FormatTimestamp formats a time.Time to ISO 8601 UTC string
func FormatTimestamp(t time.Time) string {
	return t.UTC().Format(time.RFC3339)
}

// FormatTimestampLocal formats a time.Time to ISO 8601 local timezone string
func FormatTimestampLocal(t time.Time) string {
	return t.Format(time.RFC3339)
}

// ParseTimestamp parses an ISO 8601 timestamp string to time.Time
func ParseTimestamp(s string) (time.Time, error) {
	return time.Parse(time.RFC3339, s)
}

// ParseTimestampLocal parses a timestamp string assuming local timezone
func ParseTimestampLocal(s string) (time.Time, error) {
	// Try RFC3339 first
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t, nil
	}

	// Try common formats
	formats := []string{
		"2006-01-02 15:04:05",
		"2006-01-02T15:04:05",
		"2006-01-02",
	}

	for _, format := range formats {
		if t, err := time.Parse(format, s); err == nil {
			return t, nil
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse timestamp: %s", s)
}

// FormatDate formats time.Time to YYYY-MM-DD format
func FormatDate(t time.Time) string {
	return t.Format("2006-01-02")
}

// FormatTime formats time.Time to HH:MM:SS format
func FormatTime(t time.Time) string {
	return t.Format("15:04:05")
}

// FormatDateTime formats time.Time to YYYY-MM-DD HH:MM:SS format
func FormatDateTime(t time.Time) string {
	return t.Format("2006-01-02 15:04:05")
}

// FormatHumanDate formats time.Time to human-readable format
func FormatHumanDate(t time.Time) string {
	return t.Format("January 2, 2006")
}

// FormatHumanDateTime formats time.Time to human-readable date and time
func FormatHumanDateTime(t time.Time) string {
	return t.Format("January 2, 2006 at 3:04 PM")
}

// FormatRelativeTime returns relative time string (e.g., "2 hours ago")
func FormatRelativeTime(t time.Time) string {
	now := time.Now()
	diff := now.Sub(t)

	if diff < time.Minute {
		return "just now"
	}

	if diff < time.Hour {
		minutes := int(diff.Minutes())
		if minutes == 1 {
			return "1 minute ago"
		}
		return fmt.Sprintf("%d minutes ago", minutes)
	}

	if diff < 24*time.Hour {
		hours := int(diff.Hours())
		if hours == 1 {
			return "1 hour ago"
		}
		return fmt.Sprintf("%d hours ago", hours)
	}

	if diff < 7*24*time.Hour {
		days := int(diff.Hours() / 24)
		if days == 1 {
			return "1 day ago"
		}
		return fmt.Sprintf("%d days ago", days)
	}

	return FormatHumanDate(t)
}

// IsToday checks if the given time is today
func IsToday(t time.Time) bool {
	now := time.Now()
	return t.Year() == now.Year() && t.Month() == now.Month() && t.Day() == now.Day()
}

// IsYesterday checks if the given time is yesterday
func IsYesterday(t time.Time) bool {
	yesterday := time.Now().AddDate(0, 0, -1)
	return t.Year() == yesterday.Year() && t.Month() == yesterday.Month() && t.Day() == yesterday.Day()
}

// StartOfDay returns the start of the day for the given time
func StartOfDay(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
}

// EndOfDay returns the end of the day for the given time
func EndOfDay(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 23, 59, 59, 999999999, t.Location())
}

// StartOfWeek returns the start of the week (Monday) for the given time
func StartOfWeek(t time.Time) time.Time {
	weekday := int(t.Weekday())
	if weekday == 0 { // Sunday
		weekday = 7
	}
	return t.AddDate(0, 0, -weekday+1)
}

// StartOfMonth returns the start of the month for the given time
func StartOfMonth(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, t.Location())
}

// AddWorkingDays adds working days (excluding weekends) to the given time
func AddWorkingDays(t time.Time, days int) time.Time {
	current := t
	added := 0

	for added < days {
		current = current.AddDate(0, 0, 1)
		// Skip weekends (Saturday = 6, Sunday = 0)
		if current.Weekday() != time.Saturday && current.Weekday() != time.Sunday {
			added++
		}
	}

	return current
}

// GetAge calculates age from birth date
func GetAge(birthDate time.Time) int {
	now := time.Now()
	age := now.Year() - birthDate.Year()

	if now.Month() < birthDate.Month() || (now.Month() == birthDate.Month() && now.Day() < birthDate.Day()) {
		age--
	}

	return age
}

// IsValidTimeRange checks if start and end times form a valid range
func IsValidTimeRange(start, end time.Time) bool {
	return start.Before(end) || start.Equal(end)
}

// TimeRange represents a time period
type TimeRange struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

// NewTimeRange creates a new time range
func NewTimeRange(start, end time.Time) *TimeRange {
	return &TimeRange{
		Start: start,
		End:   end,
	}
}

// Contains checks if the given time is within the time range
func (tr *TimeRange) Contains(t time.Time) bool {
	return (t.After(tr.Start) || t.Equal(tr.Start)) && (t.Before(tr.End) || t.Equal(tr.End))
}

// Duration returns the duration of the time range
func (tr *TimeRange) Duration() time.Duration {
	return tr.End.Sub(tr.Start)
}

// Overlaps checks if this time range overlaps with another
func (tr *TimeRange) Overlaps(other *TimeRange) bool {
	return tr.Start.Before(other.End) && other.Start.Before(tr.End)
}

// GetCurrentTimestamp returns current timestamp in ISO 8601 format
func GetCurrentTimestamp() string {
	return FormatTimestamp(time.Now())
}

// GetCurrentTimestampLocal returns current timestamp in local timezone
func GetCurrentTimestampLocal() string {
	return FormatTimestampLocal(time.Now())
}