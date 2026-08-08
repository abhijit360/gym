# GymTune Mobile App

React Native app for local-first gym tracking with LLM assistance.

## Features

- 🎯 Natural language workout logging
- 📊 Beautiful progress charts
- 💾 Local markdown storage
- 🤖 Smart suggestions from finetuned LLM
- 📱 Works offline

## Setup

```bash
npm install
npx expo start
```

## Project Structure

```
app/
├── app/
│   ├── _layout.tsx       # Navigation layout
│   ├── index.tsx         # Home screen (workout list)
│   ├── progress.tsx      # Progress charts
│   └── workout/[id].tsx  # Workout detail view
├── lib/
│   ├── storage.ts        # Markdown file operations
│   ├── types.ts          # TypeScript interfaces
│   └── llm.ts            # LLM integration (TODO)
└── package.json
```

## Data Format

Workouts are stored as markdown files in the app's document directory:

```
workouts/
├── 2026-08-08_1691234567.md
├── 2026-08-07_1691148167.md
└── ...
```

Each file has YAML frontmatter + markdown body:

```markdown
---
date: 2026-08-08
workout_type: strength
duration_minutes: 45
---

# Workout - 2026-08-08

## Bench Press
- Set 1: 135 lbs × 10 reps
- Set 2: 155 lbs × 8 reps

## Notes
Great session!
```

## Next Steps

1. **LLM Integration**: Add inference for natural language parsing
2. **Exercise Library**: Pre-populate common exercises
3. **Advanced Charts**: Volume over time, PR tracking
4. **Export**: Share workouts as markdown
5. **Themes**: Dark mode support
