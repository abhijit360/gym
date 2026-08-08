# GymTune Data Schema

## Workout Markdown Format

Every workout is a single markdown file with YAML frontmatter.

### Frontmatter (YAML)

```yaml
---
date: YYYY-MM-DD          # Required: workout date
workout_type: string      # Required: strength|cardio|flexibility|other
duration_minutes: number  # Optional: total workout duration
location: string          # Optional: gym, home, etc.
---
```

### Body (Markdown)

```markdown
# Workout Title (optional)

## Exercise Name
- Set 1: weight × reps [notes]
- Set 2: weight × reps
- ...

## Another Exercise
- Set 1: duration or distance

## Notes
Free-form notes about the workout
```

### Examples

**Strength Training:**
```markdown
---
date: 2026-08-08
workout_type: strength
duration_minutes: 60
---

# Push Day

## Bench Press
- Set 1: 135 lbs × 12 reps (warmup)
- Set 2: 185 lbs × 8 reps
- Set 3: 205 lbs × 6 reps (PR!)
- Set 4: 185 lbs × 8 reps

## Overhead Press
- Set 1: 95 lbs × 10 reps
- Set 2: 115 lbs × 8 reps
- Set 3: 115 lbs × 7 reps

## Notes
Felt strong today. Shoulders a bit tight before OHP.
```

**Cardio:**
```markdown
---
date: 2026-08-08
workout_type: cardio
duration_minutes: 30
---

# Morning Run

## Run
- 3.2 miles in 28 minutes
- Average pace: 8:45/mile

## Notes
Beautiful weather, new route through the park.
```

## File Naming Convention

`YYYY-MM-DD_timestamp.md`

Example: `2026-08-08_1691234567.md`

This ensures:
- Easy chronological sorting
- Unique filenames (timestamp)
- Human-readable dates

## Storage Location

- **Mobile**: App's document directory (`RNFS.DocumentDirectoryPath/workouts/`)
- **Backup**: Users can sync via iCloud/Google Drive/Dropbox
- **Version Control**: Can be committed to a git repo

## Benefits

1. **Human-readable**: Can be edited in any text editor
2. **Portable**: Just markdown files, no lock-in
3. **Version-controllable**: Works with git
4. **Searchable**: Standard text search tools work
5. **Future-proof**: Plain text lasts forever
