# GymTune - GitHub Issues Tracker

Create these issues on https://github.com/abhijit360/gym/issues

---

## Issue #1: [SETUP] Project Foundation & Documentation

**Labels**: `setup`, `documentation`

### Description
Set up the complete project structure, documentation, and development environment for GymTune.

### Tasks
- [x] Create initial project scaffold
- [x] Document architecture in `docs/ARCHITECTURE.md`
- [x] Document file structure and storage in `docs/FILE-STRUCTURE.md`
- [x] Document planning decisions in `docs/PLANNING.md`
- [ ] Set up React Native + Expo project
- [ ] Configure llama.rn dependencies
- [ ] Create development setup guide

### Acceptance Criteria
- All documentation files committed
- React Native project runs on iOS/Android simulator
- Dependencies installed and working

---

## Issue #2: [PHASE 0] Foundation - Manual Logging (Week 1)

**Labels**: `phase-0`, `mvp`

### Goal
Build the core workout tracking without LLM complexity. Prove the basic loop works.

### Deliverables
- Manual workout logging form
- Markdown file storage
- Workout history list view
- Equipment profile setup
- Simple workout frequency chart

### Tasks
- [ ] Create workout logging screen with manual form
  - Exercise name input
  - Sets/reps/weight inputs
  - Notes textarea
  - Save button
- [ ] Implement markdown storage (`lib/storage.ts`)
  - `saveWorkout(workout)` → YAML frontmatter + markdown body
  - `loadWorkouts()` → parse all markdown files
  - `loadWorkout(id)` → parse single file
- [ ] Build workout history screen
  - List all workouts sorted by date
  - Tap to view details
- [ ] Add equipment profile screen
  - Checkboxes: barbell, dumbbells, cables, machines, bodyweight
  - Save to AsyncStorage
- [ ] Create workout frequency chart
  - Line chart: workouts per week over last 4 weeks
  - Use react-native-chart-kit

### Acceptance Criteria
- [ ] Can log a full workout manually (3-5 exercises)
- [ ] Workout saved as valid markdown file
- [ ] Can view workout in history list
- [ ] Can see workout frequency chart update
- [ ] Equipment profile persists across app restarts

### Testing
Log 5 real workouts this week using the app.

**Estimated Time**: 3-4 days

---

## Issue #3: [PHASE 1] Smart Parsing - Natural Language Input (Week 2)

**Labels**: `phase-1`, `parsing`

### Goal
Enable fast logging via natural language parsing (regex, not LLM).

### Deliverables
- Natural language input field
- Regex parser for common formats
- Fallback to manual form on parse failure
- Volume calculations (sets × reps × weight)
- Volume-over-time chart per exercise

### Tasks
- [ ] Build regex parser (`lib/parser.ts`)
  - Pattern: `"bench 185x5x3"` → 3 sets of 185 lbs × 5 reps
  - Pattern: `"bench press: 185 lbs for 5 reps, 3 sets"`
  - Pattern: `"squat 225x5, 245x5, 265x3"` → 3 sets with different weights
  - Pattern: `"run 3.2 miles in 28 minutes"`
  - Return `null` if no match
- [ ] Update logging screen
  - Single textarea input (replaces manual form initially)
  - "Parse" button
  - On success: show parsed workout, allow edit, then save
  - On failure: show manual form
- [ ] Add volume calculation
  - For each exercise: `totalVolume = sum(weight × reps)` across all sets
  - Store in workout metadata
- [ ] Create volume chart
  - Line chart: total volume per week for selected exercise
  - Exercise selector dropdown
- [ ] Exercise name normalization
  - "bench" → "Bench Press"
  - "bp" → "Bench Press"
  - "squat" → "Squat"
  - Build exercise alias map

### Acceptance Criteria
- [ ] Can parse: `"bench 135x10, 155x8, 175x6"`
- [ ] Can parse: `"squat 225x5x3"`
- [ ] Can parse: `"deadlift 315 for 5 reps, 2 sets"`
- [ ] Fallback to manual form if parse fails
- [ ] Volume chart shows correct totals
- [ ] Exercise names normalized consistently

### Testing
Parse 20 diverse workout logs, verify >80% success rate.

**Estimated Time**: 3-4 days

---

## Issue #4: [PHASE 2] RAG System - Knowledge Vault & Model Integration (Week 3)

**Labels**: `phase-2`, `llm`, `rag`

### Goal
Set up the RAG knowledge system and integrate on-device LLM inference.

### Deliverables
- Gym knowledge vault (markdown files)
- Pre-computed embeddings
- Model download flow
- llama.rn integration
- Basic retrieval working

### Tasks

#### Knowledge Vault Creation
- [ ] Research and write knowledge files
  - `knowledge/periodization.md` (linear, DUP, block periodization)
  - `knowledge/volume-landmarks.md` (MEV, MRV, MAV per muscle group)
  - `knowledge/plateau-recovery.md` (deloads, intensity techniques, variation)
  - `knowledge/exercises/bench-press.md` (form, progressions, variations)
  - `knowledge/exercises/squat.md`
  - `knowledge/exercises/deadlift.md`
  - `knowledge/equipment/barbell-only.md` (routines for barbell-only gyms)
  - `knowledge/equipment/bodyweight.md`
- [ ] Format as semantic markdown chunks (256-token segments)

#### Embedding Pipeline
- [ ] Create Python script `model/embed.py`
  - Load knowledge markdown files
  - Chunk into 256-token segments
  - Embed using `sentence-transformers/all-MiniLM-L6-v2`
  - Output: `app/assets/embeddings.json`
- [ ] Run embedding script
- [ ] Bundle `embeddings.json` with app

#### Model Download
- [ ] Implement model download flow (`lib/model-manager.ts`)
  - Download Gemma 1B Q4_K_M GGUF from HuggingFace
  - Progress bar with percentage
  - Save to `DocumentDirectory/models/gemma-1b.gguf`
  - Resumable downloads
  - WiFi check and warning
- [ ] Create first-launch wizard
  - Screen 1: Welcome
  - Screen 2: Equipment setup
  - Screen 3: Download AI Coach (optional, skippable)
- [ ] Handle download failures gracefully

#### llama.rn Integration
- [ ] Install llama.rn: `npx expo install llama.rn`
- [ ] Configure `app.json` for llama.rn plugin
- [ ] Add Metal/Vulkan entitlements
- [ ] Implement LLM wrapper (`lib/llm.ts`)
  - `initModel()` → load GGUF via llama.rn
  - `generateText(prompt, context?)` → completion
  - `embedQuery(text)` → generate query embedding
- [ ] Test inference on device

#### RAG Retrieval
- [ ] Implement retrieval logic (`lib/rag.ts`)
  - `embedQuery(query)` → vector
  - `cosineSimilarity(vec1, vec2)` → score
  - `retrieveChunks(query, topK=3)` → relevant knowledge
- [ ] Test retrieval: query "plateau recovery" → should return plateau-recovery.md chunks

### Acceptance Criteria
- [ ] Knowledge vault has 10+ markdown files (~10-20 KB each)
- [ ] `embeddings.json` generated and bundled (~5-8 MB)
- [ ] Model downloads successfully on device
- [ ] llama.rn loads GGUF and generates text
- [ ] Retrieval returns relevant chunks for test queries
- [ ] App works without model (degraded gracefully)

### Testing
- Download model on real device (test WiFi warning)
- Query: "How do I break through a plateau?" → retrieve relevant chunks
- Generate text: "Suggest exercises for back day" → LLM responds

**Estimated Time**: 5-6 days

---

## Issue #5: [PHASE 3] Smart Coaching - RAG-Powered Chat (Week 4)

**Labels**: `phase-3`, `llm`, `coaching`

### Goal
Enable conversational coaching powered by RAG retrieval and on-device LLM.

### Deliverables
- "Coach" chat interface
- RAG-augmented prompts
- Equipment-aware suggestions
- Workout history context

### Tasks
- [ ] Create Coach screen (`app/coach.tsx`)
  - Chat UI with message bubbles
  - Input field + send button
  - Loading indicator during inference
  - Message history (persisted)
- [ ] Implement RAG-augmented generation (`lib/coach.ts`)
  - User asks question
  - Retrieve top 3 relevant knowledge chunks
  - Build prompt: `"Context: [chunks]\n\nQuestion: {user_question}\n\nAnswer:"`
  - Generate response via LLM
  - Return answer
- [ ] Add workout history context
  - Include recent workouts in prompt for personalized advice
  - "Based on your recent bench press workouts (185x5x3, 185x5x3), you're ready to..."
- [ ] Equipment-aware suggestions
  - Retrieve user's equipment from profile
  - Filter suggestions based on available equipment
  - "You have barbell and dumbbells. For back, try: barbell rows, dumbbell rows..."
- [ ] Add example prompts
  - "I'm stuck at 185 bench for 3 weeks, what should I do?"
  - "Suggest a push day workout"
  - "What's the best rep range for hypertrophy?"

### Acceptance Criteria
- [ ] Can chat with LLM
- [ ] Responses grounded in knowledge vault (cite sources)
- [ ] Suggestions match user's equipment
- [ ] Responses reference user's workout history when relevant
- [ ] Response time <5s on mid-range device

### Testing
- Ask 10 coaching questions, verify responses are relevant and grounded
- Test with different equipment profiles
- Verify workout history is used in context

**Estimated Time**: 4-5 days

---

## Issue #6: [PHASE 4] Collaboration - Share & Compare (Week 5)

**Labels**: `phase-4`, `social`

### Goal
Enable sharing workouts with friends and comparing progress.

### Deliverables
- Export single workout
- Export multiple workouts (week, month, all)
- Import friend's workout
- Compare progress charts

### Tasks
- [ ] Implement export (`lib/export.ts`)
  - Export single workout as `.md` file
  - Export week/month as `.zip` (multiple markdown files)
  - Export all workouts as `.zip`
  - Use React Native share sheet
- [ ] Implement import (`lib/import.ts`)
  - Accept `.md` or `.zip` file
  - Parse and validate
  - Check for duplicates (same date + timestamp)
  - Save to `workouts/` folder
  - Show confirmation: "Imported 3 workouts from Friend"
- [ ] Add export UI
  - Workout detail screen: "Share" button
  - Settings: "Export All Workouts"
- [ ] Add import UI
  - Settings: "Import Workouts"
  - File picker
- [ ] Compare feature
  - Select friend's imported workouts
  - Overlay on progress charts (different color)
  - Show: "You vs Friend" comparison

### Acceptance Criteria
- [ ] Can export single workout and share via iMessage
- [ ] Friend can import and see workout in their history
- [ ] Can export all workouts as backup
- [ ] Compare charts show both users' progress

### Testing
- Export a workout, send to friend, have them import
- Export all workouts, reimport on fresh install (migration test)
- Compare charts with friend's data

**Estimated Time**: 3-4 days

---

## Issue #7: [PHASE 5] Polish - Production Ready (Week 6)

**Labels**: `phase-5`, `polish`, `ux`

### Goal
Polish the app for public use and portfolio showcase.

### Deliverables
- Onboarding flow
- Error handling
- PR tracking
- Dark mode
- App icons & splash screen

### Tasks
- [ ] Onboarding flow
  - Welcome screen with value props
  - Equipment setup
  - Model download (optional)
  - Sample workout tutorial
- [ ] Error handling
  - Model download failure: retry + skip option
  - Parse failure: helpful error messages
  - File system errors: graceful degradation
- [ ] PR tracking
  - Auto-detect personal records (highest weight for exercise at rep range)
  - Show "🏆 PR!" badge on workout cards
  - PR history screen
- [ ] Dark mode
  - Implement theme switcher
  - Update all screens for dark theme
- [ ] Design assets
  - App icon (iOS + Android)
  - Splash screen
  - Screenshots for App Store/Play Store
- [ ] Performance optimization
  - Lazy load workout list (virtualized)
  - Cache workout index for fast launch
  - Optimize chart rendering
- [ ] Accessibility
  - Screen reader labels
  - Sufficient color contrast
  - Keyboard navigation

### Acceptance Criteria
- [ ] New user can complete onboarding in <2 minutes
- [ ] No crashes on error scenarios
- [ ] PRs detected and displayed correctly
- [ ] Dark mode works on all screens
- [ ] App icon and splash screen look professional
- [ ] App launches in <2s

### Testing
- Fresh install on 3 different devices (iOS + Android)
- Onboard new user, verify they can log first workout
- Test all error scenarios
- A11y audit with screen reader

**Estimated Time**: 5-6 days

---

## Issue #8: [INFRASTRUCTURE] CI/CD & Deployment

**Labels**: `infrastructure`, `deployment`

### Goal
Set up automated builds and deployment pipeline.

### Tasks
- [ ] GitHub Actions workflow
  - Run tests on PR
  - Build iOS/Android on main branch
  - Deploy to TestFlight/Play Store internal testing
- [ ] Embed knowledge vault at build time
  - Run `model/embed.py` in CI
  - Bundle `embeddings.json` in app assets
- [ ] Version management
  - Semantic versioning
  - Changelog automation
- [ ] Distribution
  - TestFlight setup (iOS)
  - Google Play Internal Testing (Android)

### Acceptance Criteria
- [ ] CI runs on every PR
- [ ] Main branch auto-deploys to TestFlight
- [ ] Embeddings auto-generated on build

**Estimated Time**: 2-3 days

---

## Issue #9: [TESTING] Integration & E2E Tests

**Labels**: `testing`, `quality`

### Goal
Ensure app quality with comprehensive tests.

### Tasks
- [ ] Unit tests
  - Parser: test all regex patterns
  - Storage: test markdown read/write
  - RAG: test retrieval accuracy
- [ ] Integration tests
  - Full workout logging flow
  - Model download flow
  - Export/import flow
- [ ] E2E tests (Detox)
  - User can log workout
  - User can view progress chart
  - User can chat with coach
- [ ] Performance tests
  - Launch time <2s
  - LLM response time <5s
  - Chart render time <500ms

### Acceptance Criteria
- [ ] 80%+ code coverage
- [ ] All critical paths have E2E tests
- [ ] Performance benchmarks pass

**Estimated Time**: 4-5 days

---

## Milestone Summary

| Phase | Duration | Key Deliverable |
|-------|----------|----------------|
| **Phase 0** | Week 1 | Manual logging + charts working |
| **Phase 1** | Week 2 | Natural language parsing |
| **Phase 2** | Week 3 | RAG system + model download |
| **Phase 3** | Week 4 | Smart coaching chat |
| **Phase 4** | Week 5 | Share with friends |
| **Phase 5** | Week 6 | Production polish |
| **Total** | 6 weeks | Portfolio-ready app |

---

## How to Use This Tracker

1. **Create each issue** on GitHub from the templates above
2. **Use labels** to filter by phase, type, priority
3. **Link PRs** to issues when working on them
4. **Close issues** only when acceptance criteria pass
5. **Update project board** (optional): Kanban view of phases

---

## Quick Links
- Repository: https://github.com/abhijit360/gym
- Documentation: `/docs` folder
- Issues: https://github.com/abhijit360/gym/issues
