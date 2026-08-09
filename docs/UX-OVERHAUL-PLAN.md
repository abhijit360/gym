# GymTune UX Overhaul — Implementation Plan

**Created**: 2026-08-09
**Status**: Ready for implementation
**Scope**: Homepage redesign (week grid + muscle summary + chat CTA), per-set progressive-overload tracking, full workout CRUD.

---

## 0. Ground Truth (current state)

Verified by reading the source, not the task description. The task refers to `app/(tabs)/*.tsx` and `app/services/markdownService.ts`; **those paths do not exist**. The real layout is:

| Concern | Reality |
| --- | --- |
| Router | `expo-router` **Stack** (not Tabs) in `app/app/_layout.tsx`. |
| Home | `app/app/index.tsx` — single screen, inline `showForm` toggle, `Alert`-based "detail". |
| Progress | `app/app/progress.tsx` — frequency line chart + type breakdown. |
| Storage | `app/lib/storage.ts` — markdown files, one per workout, YAML frontmatter. |
| Types | `app/lib/types.ts` — `Set`, `Exercise`, `Workout`, `WorkoutMetadata`, `EquipmentProfile`. |
| Components/theme/utils | **None.** No `components/`, `theme/`, or `utils/` dir. Styles are inline hardcoded hex. |
| Deps present | `date-fns@4` (unused), `yaml`, `expo-file-system`, `react-native-chart-kit`, `react-native-svg`, `react-native-safe-area-context`, `react-native-screens`, `@react-native-async-storage/async-storage`. |
| Deps missing | `react-native-gesture-handler`, `react-native-reanimated` (needed for swipe-to-delete). No test runner (`jest`/`vitest`). |

### Blocking defects found (must be fixed in Phase 1)

1. **`fromMarkdown` does not parse exercises.** It splits on `---`, reads frontmatter, then stuffs the *entire* markdown body into `workout.notes` and sets `exercises: []` (see `storage.ts:60-86`, comment: "for Phase 0, just preserve the body as notes"). **Consequence: after any reload, no workout has exercises.** The 7-day grid, muscle summary, per-set comparison, and detail view are all impossible until this round-trips. This is the single highest-priority fix.
2. **Frontmatter split is fragile.** `content.split('---')` (`storage.ts:61`) breaks if notes or body contain `---`. Replace with a leading-frontmatter regex.
3. **Lossy serialize.** `toMarkdown` (`storage.ts:22-55`) drops `equipment`/`location` from frontmatter and drops per-set notes (the schema doc shows `(warmup)`, `(PR!)`).
4. **Dangling route.** `_layout.tsx:7` registers `workout/[id]` but `app/app/workout/[id].tsx` does not exist.

### Current data types (`app/lib/types.ts`)

```ts
interface Set { weight?: number; reps?: number; duration?: number; distance?: number; }
interface Exercise { name: string; sets: Set[]; }
interface Workout {
  id: string; date: string; // YYYY-MM-DD
  type: 'strength' | 'cardio' | 'flexibility' | 'other';
  duration_minutes?: number; exercises: Exercise[]; notes?: string;
}
```

**Verdict on data model**: `Set` already carries `weight`/`reps` — per-set tracking needs **no structural change** to store data. What is missing: (a) a working parser, (b) muscle-group resolution, (c) optional per-set note. So the model change is small and backward-compatible.

---

## 1. Data Model

### 1.1 Type changes (`app/lib/types.ts`)

```ts
export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core' | 'cardio' | 'other';

export interface Set {
  weight?: number;
  reps?: number;
  duration?: number;   // minutes (cardio/timed)
  distance?: number;   // miles
  note?: string;       // NEW: e.g. "warmup", "PR" — round-trips the "(…)" in markdown
}

export interface Exercise {
  name: string;
  sets: Set[];
  muscleGroups?: MuscleGroup[]; // NEW: explicit override; when absent, resolved from library
}

// Workout unchanged in shape; add optional location for frontmatter fidelity.
export interface Workout {
  id: string;
  date: string;                 // YYYY-MM-DD
  type: 'strength' | 'cardio' | 'flexibility' | 'other';
  duration_minutes?: number;
  location?: string;            // NEW (schema doc already documents it)
  exercises: Exercise[];
  notes?: string;
}
```

**Design decision — where muscle groups live.** Muscle group is a property of the *exercise name*, not of one logged instance. So the source of truth is a static library keyed by normalized name (`exerciseLibrary.ts`), resolved at read time. `Exercise.muscleGroups` is only written when (a) the exercise is unknown to the library and the user/AI tags it, or (b) the user overrides. This keeps existing files migration-free: old workouts get muscle groups for free via the library the moment the parser works.

### 1.2 Markdown format (backward compatible)

Keep the existing human-readable format. Two additive, optional conventions:

```markdown
---
date: 2026-08-08
workout_type: strength
duration_minutes: 60
location: home            # optional, preserved if present
---

# Push Day

## Bench Press #chest #triceps        <-- optional trailing hashtags = muscle override
- Set 1: 135 lbs × 12 reps (warmup)   <-- "(warmup)" parses into Set.note
- Set 2: 185 lbs × 8 reps
- Set 3: 205 lbs × 6 reps (PR)

## Run
- Set 1: 3.2 miles
- Set 2: 28 minutes

## Notes
Felt strong today.
```

Rules:
- `## <name>` starts an exercise. Trailing `#tag #tag` (space-separated hashtags) → `muscleGroups`. `## Notes` is reserved and switches to notes capture.
- `- Set N: <body>` is a set. Body parses in this precedence: `<w> lbs × <r> reps` → weight+reps; `<d> miles` → distance; `<m> minutes` → duration. A trailing `(...)` → `Set.note`.
- Absence of hashtags is normal (all legacy files) → muscle groups come from the library.

**Backward compatibility**: existing files have no hashtags and no set-notes; they parse cleanly under these rules. No migration script needed. `toMarkdown` must round-trip the new fields but omit them when empty, so re-saving a legacy workout does not add noise.

### 1.3 Parser spec (`fromMarkdown` rewrite)

```
function fromMarkdown(id, content):
  fm = match content against /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/     # leading block only
  meta = fm ? YAML.parse(fm[1]) : {}
  body = fm ? content.slice(fm[0].length) : content

  exercises = []; cur = null; notes = []; inNotes = false
  for each raw line in body.split(/\r?\n/):
    line = raw.trimEnd()
    if line starts with '## ':
        title = line.slice(3).trim()
        if title.toLowerCase() == 'notes': inNotes = true; cur = null; continue
        inNotes = false
        (name, tags) = splitTrailingHashtags(title)   # "Bench #chest" -> ("Bench", ['chest'])
        cur = { name, sets: [], muscleGroups: tags.length ? mapTags(tags) : undefined }
        exercises.push(cur); continue
    if line starts with '# ': continue                 # H1 title, ignore
    if inNotes: notes.push(raw); continue
    if cur and line matches /^-\s*(?:set\s*\d+\s*:)?\s*(.+)$/i:
        cur.sets.push(parseSetBody(captured))
  return { id, date: meta.date, type: meta.workout_type, duration_minutes: meta.duration_minutes,
           location: meta.location, exercises, notes: notes.join('\n').trim() || undefined }

parseSetBody(s):
  note = extract /\(([^)]*)\)\s*$/ from s     # trailing parens -> note; strip from s
  if s matches /([\d.]+)\s*lbs?\s*[×x]\s*(\d+)\s*reps?/i -> { weight, reps, note }
  elif s matches /([\d.]+)\s*mi(les)?/i        -> { distance, note }
  elif s matches /([\d.]+)\s*min(utes)?/i      -> { duration, note }
  else -> { note: s }                          # unparseable: keep raw as note, never drop data
```

`toMarkdown` mirrors this: emit `## <name>` + ` #tag` per override group; per set emit `lbs × reps` / `miles` / `minutes` and ` (note)` when present; keep `# Workout - <date>` H1 and `## Notes`.

---

## 2. Shared Utilities (`app/lib/`)

### 2.1 `theme.ts` (NEW) — design tokens from `docs/UI-UX-PLAN.md §1`

Single source for the values currently hardcoded across screens. All components import from here.

```ts
export const color = {
  primary: '#007AFF', primaryDark: '#0051D5', primaryLight: '#4DA2FF',
  success: '#34C759', warning: '#FF9500', error: '#FF3B30',
  bg: '#FFFFFF', surface: '#F5F5F5', border: '#DDDDDD',
  textPrimary: '#000000', textSecondary: '#666666', textTertiary: '#999999',
} as const;
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 12 } as const;
export const font = {
  display: { fontSize: 32, fontWeight: '700' }, heading: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16 }, caption: { fontSize: 14 }, small: { fontSize: 12 },
} as const;
export const touchTarget = 44; // iOS HIG minimum
```

### 2.2 `dateUtils.ts` (NEW) — uses installed `date-fns`

```ts
export function weekDays(ref: Date, weekStartsOn: 0|1 = 1): Date[] // 7 days, Mon-start default
export function isSameDay(a: Date, b: Date): boolean
export function toISODate(d: Date): string   // YYYY-MM-DD (local, not UTC — avoid off-by-one)
export function daysBetween(aISO: string, bISO: string): number
```

**Edge-case note (timezone):** current code uses `new Date().toISOString().split('T')[0]`, which is UTC and can log the wrong day near midnight. `toISODate` must format from local components (`format(d, 'yyyy-MM-dd')`). This also fixes the existing home/progress date math.

### 2.3 `exerciseLibrary.ts` (NEW) — name → muscle groups

```ts
export function normalizeName(raw: string): string       // lower, trim, collapse spaces, strip punctuation
const LIBRARY: Record<string, MuscleGroup[]>              // ~40 common lifts
const ALIASES: Record<string, string>                    // "bench" -> "bench press", "ohp" -> "overhead press"
export function resolveMuscleGroups(ex: Exercise): MuscleGroup[]
  // 1) ex.muscleGroups if set  2) LIBRARY[normalize(alias(name))]  3) ['other']
```

Seed set (enough for real use, extend later): bench press→[chest,triceps,shoulders]; incline press→[chest,shoulders]; overhead press→[shoulders,triceps]; squat→[quads,glutes]; front squat→[quads,core]; deadlift→[hamstrings,glutes,back]; romanian deadlift→[hamstrings,glutes]; row (barbell/dumbbell)→[back,biceps]; pull-up/lat pulldown→[back,biceps]; curl→[biceps]; triceps pushdown/extension→[triceps]; leg press→[quads,glutes]; leg curl→[hamstrings]; calf raise→[calves]; plank/crunch→[core]; run/bike/row-erg→[cardio].

### 2.4 `comparison.ts` (NEW) — week-over-week engine (see §5)

---

## 3. Homepage Redesign (`app/app/index.tsx` rewrite)

New layout, top to bottom (per `UI-UX-PLAN §3.A`, plus the new grid + summary):

```
┌───────────────────────────────┐
│ 🏋️ GymTune                     │  Display title
│                               │
│  This Week                    │  Heading
│  M   T   W   T   F   S   S    │  WeekGrid (7 DayCell)
│  4   5   6   7   8   9  10    │
│  ●   ·   ●   ·  (◉) ·   ·    │  ● worked · rest (◉) today ring
│                               │
│  Muscle Groups This Week      │  Heading
│  [Chest ×2] [Back ×1] [Legs …]│  MuscleGroupSummary (MuscleChip row/wrap)
│                               │
│ ┌───────────────────────────┐ │
│ │ 💬  Ask your AI Coach   →  │ │  ChatCTA (primary-tinted card)
│ └───────────────────────────┘ │
│                               │
│ ┌───────────────────────────┐ │
│ │      + Log Workout        │ │  primary button -> /workout/new
│ └───────────────────────────┘ │
│                               │
│  Recent Workouts              │
│  <WorkoutCard swipe-to-delete>│  FlatList
└───────────────────────────────┘
```

The inline `showForm` state and the whole embedded form are **removed** from `index.tsx`; logging moves to the `/workout/new` route (§6). Home becomes read-only dashboard + navigation.

### 3.1 `WeekGrid` + `DayCell`

```ts
// WeekGrid.tsx
interface WeekGridProps {
  workouts: Workout[];          // all workouts; component filters to current week
  weekStartsOn?: 0 | 1;         // default 1 (Mon)
  onSelectDay?: (dateISO: string, dayWorkouts: Workout[]) => void;
}
// state: none (pure). Derives days = weekDays(new Date(), weekStartsOn).
// For each day: dayWorkouts = workouts.filter(w => w.date === toISODate(day)).
// Renders 7 DayCell in a flex row, gap = space.sm.
```

```ts
// DayCell.tsx
interface DayCellProps {
  date: Date; dayLabel: string;      // "M","T",...
  worked: boolean; isToday: boolean; isFuture: boolean;
  count: number;                     // # workouts that day
  onPress?: () => void;
}
// Layout: column, min 44x44. Top: dayLabel (caption, textTertiary).
// Middle: date number (body). Bottom: status dot 8px.
//   worked -> color.success filled; rest+past -> color.border; future -> transparent (dim number).
//   isToday -> 1.5px color.primary ring around the number, regardless of worked.
//   count>1 -> small "×2" in small font under the dot.
// Accessibility: accessibilityLabel = "Wed Aug 6, 1 workout" / "…, rest day".
// Not color-only: worked days also render the filled dot shape vs empty ring.
```

Tapping a worked day → `onSelectDay` → if 1 workout, `router.push('/workout/'+id)`; if >1, scroll list / show a day sheet (v1: navigate to the first, note the count). Tapping an empty past/today day → `router.push('/workout/new?date=<iso>')` (pre-fills date). Future days: disabled.

### 3.2 `MuscleGroupSummary` + `MuscleChip`

```ts
interface MuscleGroupSummaryProps {
  workouts: Workout[];   // component filters to current week internally
  weekStartsOn?: 0 | 1;
}
```

**Aggregation** (frequency = how many workouts this week hit the group):

```
counts = new Map<MuscleGroup, number>()
for w in thisWeekWorkouts:
  groupsHit = new Set<MuscleGroup>()
  for ex in w.exercises: for g in resolveMuscleGroups(ex): groupsHit.add(g)
  for g in groupsHit: counts[g] += 1        // count once per workout, not per exercise
sorted = counts entries sorted by count desc
```

Decision: count **once per workout per group** so "Chest ×2" means "trained chest on 2 separate days this week" — the useful frequency signal for a weekly split. (Per-exercise or per-set counts inflate and mislead.)

Render: horizontal wrap of `MuscleChip`. Empty week → muted "No muscle groups logged yet this week."

```ts
// MuscleChip.tsx
interface MuscleChipProps { group: MuscleGroup; count: number; }
// Pill: surface bg, radius.sm, padding sm/md. Label = Title-case group + " ×N".
// Optional intensity: opacity/tint scales with count (1 = light, >=3 = primary tint).
// 'other' group renders as "Other" — covers unmapped exercises (edge case).
```

### 3.3 `ChatCTA`

```ts
interface ChatCTAProps { onPress: () => void; }
// Card: primaryLight tint bg (#4DA2FF @ ~15% or surface with primary border), radius.md, padding md.
// Row: 💬 icon | title "Ask your AI Coach" (heading) + subtitle "Plateaus, programs, form tips" (caption) | chevron "→".
// min height 64. onPress -> router.push('/coach'). accessibilityRole="button".
```

Wired in Phase 4 to a `coach.tsx` screen showing the empty-state chips from `UI-UX-PLAN §6`. The actual LLM backend is out of scope here (Phase 3 of the master plan); the CTA + destination screen is the deliverable.

---

## 4. Enhanced Workout Tracking UI

### 4.1 `SetTracker` + `SetRow` (editable, per-set)

```ts
// SetTracker.tsx — used in create/edit
interface SetTrackerProps {
  sets: Set[];
  exerciseType: 'strength' | 'cardio';        // decides which inputs to show
  comparison?: SetComparison[];               // aligned by index; from comparison.ts
  onChange: (sets: Set[]) => void;
}
// Renders header row (Set | Weight | Reps | Δ), then one SetRow per set,
// then "+ Add Set" (duplicates last set's weight/reps as a sensible default).
```

```ts
// SetRow.tsx
interface SetRowProps {
  index: number; set: Set; exerciseType: 'strength'|'cardio';
  comparison?: SetComparison;    // undefined => no baseline (first week / new set)
  onChange: (patch: Partial<Set>) => void;
  onRemove: () => void;
}
// strength layout:  [Set N] [weight TextInput numeric] × [reps TextInput numeric] [ProgressBadge] [✕]
// cardio layout:    [Set N] [distance or duration TextInput]                       [ProgressBadge] [✕]
// TextInput uses theme input style (border, radius.sm, padding 12). Numeric keyboard.
// ✕ hit target >=44. Confirm on remove only if the row has data.
```

### 4.2 `ProgressBadge` — visual diff indicator

```ts
interface ProgressBadgeProps {
  metric: 'weight' | 'reps' | 'volume';
  delta: number;          // signed absolute delta (lbs, reps, or % for volume)
  isNew?: boolean;        // set had no baseline
}
// delta > 0  -> "▲ +10 lb" / "▲ +2 reps" / "▲ +8%" , color.success bg tint
// delta < 0  -> "▼ −5 lb" ...                        , color.error tint
// delta == 0 -> "＝"                                  , color.textTertiary
// isNew      -> "NEW"                                  , color.primary tint (no baseline to compare)
// Accessibility: arrow glyph + sign + text so it never relies on color alone (WCAG, §9).
// Pill: radius.sm, small font, padding xs/sm.
```

Display rule in a row: show the weight delta as the primary badge; show volume% as a secondary chip in the exercise summary (§4.4). Reps delta shown when weight is unchanged (so a same-weight-more-reps session still reads as progress).

### 4.3 `ExerciseCard` — read + edit container

```ts
interface ExerciseCardProps {
  exercise: Exercise;
  comparison?: ExerciseComparison;   // per-set + summary deltas
  editable: boolean;
  onChange?: (ex: Exercise) => void; // edit mode
  onRemove?: () => void;
}
// Header: exercise name (heading) + resolveMuscleGroups -> MuscleChip row (no counts here).
// Body (read): expandable list of sets "Set 1: 135 lb × 8" + inline ProgressBadge per set,
//              plus a summary line "Volume 1,240 lb  ▲ +8% vs Aug 1 (7d ago)".
// Body (edit): renders SetTracker.
```

### 4.4 Workout detail screen `app/app/workout/[id].tsx` (NEW)

Read view per `UI-UX-PLAN §3.B`, extended with week-over-week badges.

```
┌───────────────────────────────┐
│ ← Aug 8            Edit  ⋯     │  header (⋯ = delete)
│ Strength · 45 min             │
│                               │
│ <ExerciseCard read + badges>  │  one per exercise
│ <ExerciseCard …>              │
│                               │
│ Notes                         │
│ Felt strong today.            │
│                               │
│ [ Delete Workout ]            │  destructive, confirm dialog
└───────────────────────────────┘
```

- State: `workout`, `comparison` (computed once from all workouts via `comparison.ts`), `loading`.
- Load: `WorkoutStorage.load(id)`; also `loadAll()` to build the comparison index. "Edit" → `router.push('/workout/'+id+'?edit=1')` (reuses `new.tsx` in edit mode, §6) or toggles inline edit — see §6 decision.
- Delete → `Alert.alert` confirm → `WorkoutStorage.delete(id)` → `router.back()`.

---

## 5. Week-over-Week Comparison Algorithm (`app/lib/comparison.ts`)

### 5.1 Types

```ts
export interface SetComparison {
  weightDelta?: number;   // cur.weight - prev.weight
  repsDelta?: number;     // cur.reps  - prev.reps
  volumeDelta?: number;   // cur.w*cur.r - prev.w*prev.r
  volumePct?: number;     // volumeDelta / prevVolume * 100
  isNew: boolean;         // no matching previous set
}
export interface ExerciseComparison {
  baselineDate?: string;  // date of the session compared against
  daysAgo?: number;
  perSet: SetComparison[];
  totalVolumeDelta?: number;
  totalVolumePct?: number;
}
export interface WorkoutComparison { [exerciseKey: string]: ExerciseComparison }
```

### 5.2 Baseline selection

**Decision**: baseline = the most recent *prior* session of the same exercise, preferring one ~7 days back but tolerating skipped days. This is more useful than a strict "exactly 7 days ago" (which returns nothing on partial weeks). Formalized:

```
function findBaseline(index: OccurrenceList, exerciseKey, currentDate):
  candidates = index[exerciseKey].filter(o => o.date < currentDate)   // strictly earlier
  if candidates empty: return undefined                              // FIRST-WEEK edge case
  // prefer the one closest to currentDate-7 within a window; else newest prior
  windowed = candidates.filter(o => 4 <= daysBetween(o.date,current) <= 10)
  pick = windowed.length ? argmin over windowed of |daysBetween - 7|
                         : candidates[0]   // newest prior session
  return pick
```

`OccurrenceList` is built once:

```
buildIndex(allWorkouts):
  index = {}
  for w in allWorkouts (sorted date desc):
    for ex in w.exercises:
      key = normalizeName(ex.name)
      index[key].push({ date: w.date, sets: ex.sets })
  each index[key] sorted date desc
  return index
```

### 5.3 Set matching + deltas

```
function compareExercise(index, exercise, currentDate) -> ExerciseComparison:
  base = findBaseline(index, normalizeName(exercise.name), currentDate)
  if !base: return { perSet: exercise.sets.map(() => ({ isNew: true })) }  // FIRST WEEK
  perSet = []
  for i, cur in exercise.sets:
    prev = base.sets[i]                         // match by position (Set 1 vs Set 1)
    if !prev: perSet.push({ isNew: true }); continue          // did more sets than last time
    if cur.weight != null && prev.weight != null:
      wd = cur.weight - prev.weight
      rd = (cur.reps ?? 0) - (prev.reps ?? 0)
      cv = cur.weight*(cur.reps ?? 0); pv = prev.weight*(prev.reps ?? 0)
      vd = cv - pv; vpct = pv ? vd/pv*100 : undefined
      perSet.push({ weightDelta: wd, repsDelta: rd, volumeDelta: vd, volumePct: vpct, isNew: false })
    else:  // cardio: compare distance or duration
      perSet.push({ volumeDelta: (cur.distance ?? cur.duration ?? 0) - (prev.distance ?? prev.duration ?? 0), isNew: false })
  totalCur = sum cur.weight*cur.reps over strength sets
  totalPrev= sum prev.weight*prev.reps over matched sets
  return { baselineDate: base.date, daysAgo: daysBetween(base.date,currentDate),
           perSet, totalVolumeDelta: totalCur-totalPrev,
           totalVolumePct: totalPrev ? (totalCur-totalPrev)/totalPrev*100 : undefined }
```

Public entry: `compareWorkout(allWorkouts, workout): WorkoutComparison` — builds the index (excluding the workout's own date for its own exercises via the `< currentDate` filter) and maps each exercise. Key by `normalizeName(name)`; if the same exercise appears twice in one workout, key with an occurrence suffix so both cards get their own comparison.

### 5.4 Edge cases (explicit)

| Case | Handling |
| --- | --- |
| **First week / no history** | `findBaseline` returns `undefined` → every set `isNew: true` → `ProgressBadge` shows "NEW", no arrows. No crash, no fake 0%. |
| **Partial week / skipped days** | Baseline is "newest prior session", not "exactly 7 days" → still compares. `daysAgo` surfaced in the summary ("vs Aug 1, 8d ago") so the gap is honest. |
| **More sets this session** | Extra sets have no `prev` → `isNew: true`. |
| **Fewer sets this session** | Simply not compared (no phantom regression). |
| **Missing muscle data** | `resolveMuscleGroups` → `['other']`; summary shows "Other". Never blank, never crash. |
| **Cardio (no weight)** | Falls to distance/duration delta path; weight/reps badges suppressed. |
| **Name variants** ("Bench" vs "Bench Press") | `normalizeName` + `ALIASES` collapse common cases. True fuzzy matching is out of scope v1 — documented limitation. |
| **Bodyweight (weight = 0/undefined)** | reps-only comparison: `weightDelta` suppressed, `repsDelta` drives the badge. |

---

## 6. CRUD Flows

### Create / Update — `app/app/workout/new.tsx` (NEW, serves both)

**Decision**: single scrollable form with a per-exercise set builder (not a 3-step wizard). Rationale: the master plan's <60s logging goal favors fewer screen transitions; a wizard adds taps. The screen doubles as the editor via query param.

- Route params: `?date=<iso>` (prefill date for create), `?id=<id>` (edit existing).
- State: `type`, `date`, `exercises: Exercise[]`, `notes`, `duration`. On edit, hydrate from `WorkoutStorage.load(id)`.
- Per exercise: name input (with autocomplete against `exerciseLibrary` names) + `SetTracker` (add/edit/remove individual sets). "+ Add Exercise" appends a blank exercise.
- Save: build `Workout` (reuse `id` on edit, else `Date.now().toString()`), `WorkoutStorage.save` (same filename → overwrites on edit), `router.back()`.
- **Comparison while logging**: when editing/creating for a date, pass `compareWorkout(allWorkouts, draft)` into each `SetTracker` so the lifter sees "▲ +10 lb" live against last week as they type.

### Read

- Home `WorkoutCard` list (§3) → tap → `/workout/[id]` detail (§4.4). Replaces the current `Alert.alert` stub.

### Update

**Decision**: navigate to `new.tsx?id=` (full-screen edit) rather than inline-on-detail. Reuses one form implementation, supports add/remove exercise and per-set edit uniformly. Detail's "Edit" button routes there.

### Delete

- **Swipe-to-delete** on `WorkoutCard` in the home list, + confirm `Alert`. Requires `react-native-gesture-handler` + `react-native-reanimated` (`Swipeable`). **These are not installed** — Phase 3 must `npx expo install react-native-gesture-handler react-native-reanimated`, add the reanimated Babel plugin, and wrap the root in `GestureHandlerRootView`.
- Fallback if libs are rejected: long-press card → action sheet with Delete. (Plan assumes libs are added.)
- Also a `Delete Workout` button on the detail screen. All deletes confirm before `WorkoutStorage.delete`.

```ts
// SwipeableRow.tsx
interface SwipeableRowProps { onDelete: () => void; children: React.ReactNode; }
// Reveals a red (color.error) "Delete" action on left-swipe; calls onDelete after confirm.
```

---

## 7. Component & File Architecture

```
app/
  lib/
    types.ts             (EDIT: add MuscleGroup, Set.note, Exercise.muscleGroups, Workout.location)
    storage.ts           (EDIT: fix fromMarkdown parser + toMarkdown serializer; regex frontmatter)
    theme.ts             (NEW: color/space/radius/font/touchTarget tokens)
    dateUtils.ts         (NEW: weekDays, toISODate(local), daysBetween, isSameDay)
    exerciseLibrary.ts   (NEW: normalizeName, LIBRARY, ALIASES, resolveMuscleGroups)
    comparison.ts        (NEW: buildIndex, findBaseline, compareExercise, compareWorkout)
  components/
    WeekGrid.tsx         (NEW)
    DayCell.tsx          (NEW)
    MuscleGroupSummary.tsx (NEW)
    MuscleChip.tsx       (NEW)
    ChatCTA.tsx          (NEW)
    WorkoutCard.tsx      (NEW: extracted card + swipe delete)
    SwipeableRow.tsx     (NEW)
    SetTracker.tsx       (NEW)
    SetRow.tsx           (NEW)
    ProgressBadge.tsx    (NEW)
    ExerciseCard.tsx     (NEW)
  app/
    _layout.tsx          (EDIT: register workout/new, coach; keep workout/[id])
    index.tsx            (REWRITE: dashboard = WeekGrid + MuscleGroupSummary + ChatCTA + log button + list; remove inline form)
    progress.tsx         (OPTIONAL EDIT: add Exercise PR section using new parser; low priority)
    workout/
      new.tsx            (NEW: create + edit form with SetTracker)
      [id].tsx           (NEW: detail read + edit/delete)
    coach.tsx            (NEW: chat CTA target, empty-state stub)
```

---

## 8. Phases, Dependencies, Verification

```mermaid
graph TD
  P1[Phase 1: foundation<br/>types, storage parser, theme,<br/>dateUtils, exerciseLibrary, comparison]
  P2[Phase 2: Home<br/>WeekGrid, MuscleGroupSummary,<br/>ChatCTA, WorkoutCard, index rewrite]
  P3[Phase 3: Tracking + CRUD<br/>SetTracker, ProgressBadge, ExerciseCard,<br/>workout/new, workout/[id], swipe delete]
  P4[Phase 4: Chat CTA target<br/>coach.tsx + wire]
  P1 --> P2
  P1 --> P3
  P2 --> P4
```

- **Phase 1 blocks everything** (parser fix + comparison + tokens are shared contracts). Do it first, alone.
- **Phase 2 and Phase 3 are independent** once P1 lands (they share only `theme`, `comparison`, `storage`, all frozen by P1). They can run in parallel.
- **Phase 4** is tiny (a stub screen + one route); fold into whoever finishes Phase 2.

### Recommended execution (for the caller)

1. **Sequential — 1 implementer**: Phase 1. Deliver the frozen contracts: `types.ts`, `storage.ts`, `theme.ts`, `dateUtils.ts`, `exerciseLibrary.ts`, `comparison.ts`. Verify before fan-out (below).
2. **Parallel — 2 isolated worktrees** (`isolated: true`): Agent A = Phase 2 (+ Phase 4 coach stub); Agent B = Phase 3. Contract between them: both import the Phase 1 modules and the shared `WorkoutCard` — put `WorkoutCard` in Phase 1's deliverable set OR assign it to Agent A and have Agent B not touch the home list. **Decision: `WorkoutCard` + `SwipeableRow` belong to Agent A (Phase 2 owns the list); Agent B owns everything under `workout/` + set components.** No file overlap.
3. **Synthesis — 1 implementer**: merge both worktrees, edit `_layout.tsx` once to register `workout/new` + `coach`, resolve any import drift, run full verification.

### Verification (proof, not assertion)

- **Phase 1 (pure functions)**: the highest-risk logic (parser round-trip, comparison) is pure and must be proven. No test runner is installed. Two options: (a) add `vitest` (fast, TS-native) with `lib/__tests__/storage.test.ts` + `comparison.test.ts`; (b) a temporary `tsx`-run scratch script. **Recommend (a)** — these are permanent contracts and deserve tests. Minimum assertions:
  - `toMarkdown → fromMarkdown` deep-equals the original workout (incl. sets, notes, muscle tags).
  - A legacy file (no hashtags, no set-notes) parses to the right exercises/sets.
  - `compareWorkout`: first-week → all `isNew`; +10lb → `weightDelta 10`; fewer sets → no phantom regression; unknown exercise → `['other']`.
- **Typecheck**: `cd app && npx tsc --noEmit` (there is a `tsconfig.json`).
- **Smoke (UI)**: `cd app && npx expo start`; exercise: log a workout with 3 sets → reload app → detail shows the sets (proves the parser fix) → log the same exercise next "week" (edit a date) → badges render → swipe-delete a card → confirm gone. This is the acceptance path.

---

## 9. Design-System Compliance (checklist vs `docs/UI-UX-PLAN.md §1, §9`)

- [ ] All colors from `theme.color` (#007AFF primary, #34C759 success, #FF3B30 error) — no new hex literals in components.
- [ ] 8px grid via `theme.space`; card radius 8/12 via `theme.radius`.
- [ ] Typography scale via `theme.font` (Display 32/Heading 20/Body 16/Caption 14/Small 12).
- [ ] Touch targets ≥ 44pt (DayCell, SetRow ✕, ChatCTA, swipe action).
- [ ] Not color-only: ProgressBadge uses ▲/▼ + sign; DayCell uses filled dot vs empty ring; muscle chips carry text labels.
- [ ] Cards: surface bg, flat/1px border (no heavy shadows), matching existing style.
- [ ] Buttons: primary = blue fill/white text/8px radius; secondary = gray fill/dark text.

---

## 10. Assumptions & Out-of-Scope

- **Assumption**: the caller wants a working data round-trip; the parser fix is treated as in-scope (it is a prerequisite, not a new feature).
- **Assumption**: week starts Monday (`weekStartsOn: 1`); trivially configurable.
- **Out of scope (Phase 3 of master plan)**: the LLM/RAG backend behind the chat CTA. This plan delivers the CTA and a chat *screen shell* (empty-state chips), not model inference.
- **Out of scope**: bottom-tab navigation migration (master plan §2). Current Stack router is kept; new screens are pushed routes. Converting to Tabs can follow independently.
- **Deferred**: fuzzy exercise-name matching, dark mode, skeleton loaders, haptics, micro-animations (master plan §5/§8 polish).
