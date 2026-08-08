# GymTune - Final Architecture

**Date**: 2026-08-08  
**Status**: Ready to build

---

## Stack

### Mobile App
- **Framework**: React Native + Expo (cross-platform)
- **UI**: React Native Paper or NativeBase (clean, simple)
- **Charts**: react-native-chart-kit (lightweight)
- **Storage**: 
  - Workouts: Markdown files (RNFS)
  - Knowledge vault: Embedded text chunks (vector DB or simple JSON)
  - User data: AsyncStorage

### LLM System
- **Base Model**: Gemma 3 1B Q4_K_M (720MB, 35-45 tok/s, works on 6GB phones)
  - Alternative: Phi-3-mini 3.8B if Gemma quality insufficient
- **Inference**: llama.rn (llama.cpp bindings)
- **Approach**: RAG, not finetuning
  - Knowledge vault: Scraped gym knowledge (periodization, volume, deloads, exercise form)
  - Embeddings: Lightweight model (sentence-transformers MiniLM or Nomic Embed)
  - Retrieval: Cosine similarity search over embedded chunks

### Knowledge Vault Structure
```
knowledge/
├── periodization.md       # Linear, DUP, block periodization
├── volume-landmarks.md    # MEV, MRV, MAV per muscle group
├── plateau-recovery.md    # Deloads, intensity techniques, variation
├── exercises/
│   ├── bench-press.md    # Form cues, progressions, variations
│   ├── squat.md
│   └── ...
└── equipment/
    ├── barbell-only.md   # Routines with just barbell
    ├── dumbbells.md
    └── bodyweight.md
```

Each file: markdown with semantic chunks, embedded on first launch.

---

## Data Flow

### 1. Workout Logging
```
User types: "Bench 185x5x3, felt heavy"
    ↓
Simple regex/parser (no LLM needed for basic logs)
    ↓
Structured workout object
    ↓
Save as markdown: workouts/2026-08-08_timestamp.md
    ↓
Update in-memory index for charts
```

### 2. Smart Coaching (RAG)
```
User asks: "I've been stuck at 185 bench for 3 weeks, what should I do?"
    ↓
Embed query → retrieve relevant chunks from knowledge vault
    ↓
Prompt LLM: "Given this context: [plateau-recovery.md excerpt], answer: ..."
    ↓
LLM generates advice (grounded in retrieved docs)
    ↓
Display to user
```

### 3. Progress Tracking
```
On app launch:
    ↓
Parse all workout markdown files → extract exercises, weights, reps
    ↓
Build in-memory index: { "Bench Press": [{date, sets: [{weight, reps}]}] }
    ↓
Cache in AsyncStorage (invalidate on new workout)
    ↓
Charts read from cached index
```

### 4. Equipment-Aware Suggestions
```
User profile stores: { equipment: ["barbell", "dumbbells"] }
    ↓
When suggesting exercises:
    ↓
Retrieve: equipment/barbell-only.md + exercise alternatives
    ↓
LLM filters suggestions based on available equipment
```

### 5. Friend Collaboration
```
User shares workout:
    ↓
Export markdown file → share via standard system share sheet
    ↓
Friend imports → saves to their local workouts/
    ↓
Optional: Compare progress (load friend's exported data, overlay on charts)
```

---

## File Structure

```
gym-tune/
├── model/
│   ├── embed.py              # Embed knowledge vault to vectors
│   ├── knowledge/            # Gym knowledge as markdown
│   │   ├── periodization.md
│   │   ├── volume-landmarks.md
│   │   ├── plateau-recovery.md
│   │   └── exercises/*.md
│   └── base-model/           # Downloaded Gemma 1B GGUF (not in git)
│
├── app/
│   ├── app/
│   │   ├── index.tsx         # Home: workout list + quick log
│   │   ├── log.tsx           # Full workout logging
│   │   ├── progress.tsx      # Charts and trends
│   │   ├── coach.tsx         # Chat with LLM (RAG-powered)
│   │   ├── equipment.tsx     # Equipment setup
│   │   └── friends.tsx       # Share/import workouts
│   │
│   ├── lib/
│   │   ├── storage.ts        # Markdown read/write
│   │   ├── parser.ts         # Parse workout logs
│   │   ├── llm.ts            # llama.rn wrapper
│   │   ├── rag.ts            # RAG retrieval logic
│   │   ├── embeddings.ts     # Embed queries, retrieve chunks
│   │   └── types.ts
│   │
│   └── assets/
│       ├── knowledge.json    # Embedded knowledge vault (bundled)
│       └── gemma-1b.gguf     # Downloaded on first launch (not bundled)
│
└── docs/
    ├── PLANNING.md
    └── ARCHITECTURE.md (this file)
```

---

## Features Breakdown

### Phase 0: Foundation (Week 1)
- ✅ Basic workout logging (manual form, no LLM)
- ✅ Markdown storage
- ✅ Workout history list
- ✅ Simple workout frequency chart
- ✅ Equipment profile setup

**Goal**: Prove the core loop works without LLM complexity.

### Phase 1: Smart Parsing (Week 2)
- ✅ Natural language parser (regex + simple rules, NOT LLM)
  - "Bench 185x5x3" → 3 sets of bench press at 185 lbs for 5 reps
- ✅ Volume calculation (sets × reps × weight)
- ✅ Volume-over-time chart per exercise

**Goal**: Make logging fast and delightful.

### Phase 2: RAG Knowledge System (Week 3)
- ✅ Scrape/write gym knowledge vault (periodization, volume, plateau recovery)
- ✅ Embed knowledge chunks (use pre-trained sentence-transformers)
- ✅ Bundle embedded vectors with app
- ✅ Download Gemma 1B GGUF on first launch
- ✅ Integrate llama.rn

**Goal**: Enable offline LLM queries.

### Phase 3: Smart Coaching (Week 4)
- ✅ "Coach" tab: chat interface with LLM
- ✅ RAG retrieval: user question → relevant knowledge chunks
- ✅ LLM generates advice grounded in retrieved context
- ✅ Equipment-aware exercise suggestions

**Goal**: Demonstrate hyper-focused gym AI.

### Phase 4: Collaboration (Week 5)
- ✅ Export workout as markdown
- ✅ Import friend's workout
- ✅ Compare progress (overlay charts)
- ✅ Optional: Simple "challenges" (hit X volume this week)

**Goal**: Social motivation without a server.

### Phase 5: Polish (Week 6)
- ✅ Onboarding flow
- ✅ Model download UX (progress bar, WiFi warning)
- ✅ PR tracking (auto-detect personal records)
- ✅ Dark mode
- ✅ Export all data (zip of markdown files)

**Goal**: Portfolio-ready.

---

## Parsing Strategy (No Finetuning Needed)

For workout logging, use **regex + rules**, not LLM:

```typescript
// lib/parser.ts
function parseWorkoutLine(input: string): Exercise | null {
  // Pattern: "bench 185x5x3" or "bench press: 185 lbs for 5 reps, 3 sets"
  
  const patterns = [
    /^(.+?)\s+(\d+)x(\d+)x(\d+)$/,  // "bench 185x5x3"
    /^(.+?)\s+(\d+)\s*lbs?\s*x\s*(\d+)\s*x\s*(\d+)$/,  // "bench 185 lbs x 5 x 3"
    // ... more patterns
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return {
        name: normalizeExerciseName(match[1]),
        sets: generateSets(match[2], match[3], match[4])
      };
    }
  }
  
  // If no match, return null → user fills manual form
  return null;
}
```

**Why not use LLM for parsing?**
- Regex is instant, free, deterministic
- LLM parsing = 2-5s latency, battery drain, can hallucinate
- Save LLM for coaching where creativity matters

---

## Knowledge Vault Strategy

### Content Sources
1. **Scrape public resources** (cite sources):
   - Renaissance Periodization blog
   - Stronger by Science articles
   - r/weightroom wiki
   - Exercise wikis

2. **Manually write**:
   - Exercise database (top 50 exercises)
   - Equipment-based routines

3. **Format**: Markdown with semantic sections
   ```markdown
   # Plateau Recovery Strategies
   
   ## Volume Reduction (Deload)
   When stuck for 2-3 weeks, reduce volume by 30-50% for one week...
   
   ## Intensity Variation
   Switch rep ranges: if stuck at 5 reps, try 8-10 reps for 3 weeks...
   
   ## Exercise Variation
   Replace main lift with close variation: bench → close-grip bench...
   ```

### Embedding Strategy
- Use `nomic-embed-text-v1.5` or `sentence-transformers/all-MiniLM-L6-v2`
- Chunk docs into 256-token segments
- Embed offline (Python script), bundle embeddings.json with app
- On-device retrieval: cosine similarity (no vector DB needed, <1000 chunks)

---

## Model Choice: Start with Gemma 3 1B

**Rationale**:
- 720MB Q4_K_M = fastest download, smallest footprint
- 35-45 tok/s = responsive chat
- Works on 6GB RAM phones (wider compatibility)
- With RAG, smaller model is sufficient (just needs to synthesize, not memorize)

**Upgrade path**: If quality insufficient, swap GGUF to Phi-3-mini (2.7GB) without code changes.

---

## Collaboration Without a Server

**Local-first with manual sync**:
1. User exports workout: `2026-08-08_bench-day.md`
2. Shares via iMessage, WhatsApp, email
3. Friend imports: saves to their `workouts/` folder
4. App detects imported files, offers to overlay on charts

**Optional future**: P2P sync via local network (Bonjour/mDNS), but v1 = manual share.

---

## Success Metrics (Portfolio + Personal Use)

1. **Daily use**: You and 2-3 friends log workouts consistently for 1 month
2. **RAG quality**: 80%+ of coaching questions get useful, grounded answers
3. **Performance**: <3s to log a workout, <5s for LLM response
4. **Portfolio impact**: Demo-able in 2 minutes, code quality showcases skills

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Model download fails | Allow app to work without LLM (manual logging + charts) |
| RAG retrieval is poor | Manually curate high-quality chunks, test retrieval coverage |
| Parsing misses edge cases | Fallback to manual form, log misses to improve patterns |
| Friends don't use it | Build it for yourself first, polish before sharing |
| Takes too long | Cut Phase 4 (collaboration), ship Phases 0-3 as v1 |

---

## Next Steps

1. **Validate parsing** (2 hours): Write 20 diverse workout logs, build regex patterns, test coverage
2. **Build Phase 0** (3 days): Manual logging + markdown storage + history
3. **Scrape knowledge vault** (2 days): Gather gym knowledge, format as markdown
4. **Integrate llama.rn** (2 days): Download Gemma 1B, test inference on device
5. **Build RAG system** (3 days): Embed knowledge, retrieval logic, wire to LLM

**First milestone** (1 week): Log 5 workouts manually, see them in history, view frequency chart.

---

**Ready to build?** Let's start with Phase 0.
