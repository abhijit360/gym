# GymTune - Complete Project Guide

**For**: Portfolio + Personal Use  
**Timeline**: 6 weeks  
**Developer**: Solo (you)

---

## 🎯 What You're Building

A free, local-first gym tracker with on-device AI coaching. No paywalls, no cloud lock-in, no bloat.

### Core Features
1. **Natural language logging**: "Bench 135x10, 155x8" → structured workout
2. **Smart coaching**: Ask "I'm stuck at 185 bench, what now?" → AI suggests deload/variation
3. **Beautiful charts**: Volume over time, PRs, frequency tracking
4. **Equipment-aware**: Suggestions based on your available gear
5. **Share with friends**: Export/import workouts as markdown files

### Tech Highlights (Portfolio-Ready)
- On-device LLM inference (720 MB Gemma 1B via llama.rn)
- RAG (Retrieval-Augmented Generation) with knowledge vault
- React Native + Expo (iOS + Android)
- Local markdown storage (portable, git-friendly)
- Zero server dependencies

---

## 📁 Project Structure Explained

### Current Directory Layout

```
gym-tune/
├── model/                      # LLM & knowledge vault
│   ├── embed.py               # Embeds knowledge → vectors
│   ├── knowledge/             # Gym knowledge as markdown
│   │   ├── periodization.md   # Training strategies
│   │   ├── plateau-recovery.md
│   │   └── exercises/         # 50+ exercise guides
│   └── requirements.txt       # Python dependencies
│
├── app/                       # React Native mobile app
│   ├── app/                   # Screens (Expo Router)
│   │   ├── index.tsx         # Home: workout list
│   │   ├── log.tsx           # Workout logging
│   │   ├── progress.tsx      # Charts
│   │   ├── coach.tsx         # AI chat
│   │   └── friends.tsx       # Share/import
│   │
│   ├── lib/                   # Core logic
│   │   ├── storage.ts        # Markdown read/write
│   │   ├── parser.ts         # Parse "bench 135x10x3"
│   │   ├── llm.ts            # llama.rn wrapper
│   │   ├── rag.ts            # RAG retrieval
│   │   └── types.ts          # TypeScript interfaces
│   │
│   ├── assets/
│   │   └── embeddings.json   # Pre-computed knowledge vectors
│   └── package.json
│
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md       # Tech decisions
│   ├── FILE-STRUCTURE.md     # Storage details
│   ├── PLANNING.md           # User Q&A
│   └── GITHUB_ISSUES.md      # This tracker
│
└── README.md
```

### Key Files You'll Work With

| File | What It Does | Phase |
|------|--------------|-------|
| `app/lib/storage.ts` | Save/load workouts as markdown | Phase 0 |
| `app/lib/parser.ts` | Parse "bench 135x10" into structured data | Phase 1 |
| `model/knowledge/*.md` | Gym knowledge vault (periodization, exercises) | Phase 2 |
| `model/embed.py` | Embed knowledge vault → `embeddings.json` | Phase 2 |
| `app/lib/llm.ts` | Load Gemma 1B GGUF, generate text | Phase 2-3 |
| `app/lib/rag.ts` | Retrieve relevant knowledge chunks | Phase 3 |
| `app/app/coach.tsx` | Chat UI with RAG-powered LLM | Phase 3 |

---

## 🗺️ 6-Week Roadmap Explained

### Phase 0: Foundation (Week 1)
**Goal**: Prove the core loop without LLM complexity.

**What you build**:
- Manual workout logging form
- Save as markdown files
- View workout history
- One simple chart (workout frequency)

**Why this first**: Validates that markdown storage + charting work. You can start using the app immediately.

**Acceptance**: Log 5 real workouts, see them in history, view frequency chart.

---

### Phase 1: Smart Parsing (Week 2)
**Goal**: Make logging fast with natural language.

**What you build**:
- Regex parser: `"bench 135x10, 155x8"` → structured data
- Volume calculations (sets × reps × weight)
- Volume-over-time chart per exercise

**Why regex, not LLM**: Instant, free, deterministic. LLM parsing = 2-5s latency + battery drain.

**Acceptance**: Parse 20 diverse logs with >80% success rate.

---

### Phase 2: RAG System (Week 3)
**Goal**: Set up on-device LLM with knowledge retrieval.

**What you build**:
1. **Knowledge vault**: Write markdown files on periodization, volume, plateau recovery, exercises
2. **Embeddings**: Run Python script to embed knowledge → `embeddings.json`
3. **Model download**: Download Gemma 1B GGUF (720 MB) on first launch
4. **llama.rn**: Integrate llama.cpp bindings for inference
5. **Retrieval**: Given query, find relevant knowledge chunks

**Why RAG**: No finetuning needed. Knowledge is updateable. Smaller model works.

**Acceptance**: 
- Model downloads and loads successfully
- Query "plateau recovery" retrieves relevant chunks
- LLM generates text on device

---

### Phase 3: Smart Coaching (Week 4)
**Goal**: Enable conversational coaching.

**What you build**:
- Chat UI (messages, input, send button)
- RAG-augmented prompts: retrieve context → pass to LLM → generate answer
- Equipment-aware: filter suggestions by user's gear
- Workout history context: "Based on your recent bench workouts..."

**Why this matters**: This is the portfolio showcase. On-device AI that's actually useful.

**Acceptance**:
- Ask "I'm stuck at 185 bench, what now?" → get relevant, grounded advice
- Suggestions match equipment profile
- Response time <5s

---

### Phase 4: Collaboration (Week 5)
**Goal**: Share workouts with friends.

**What you build**:
- Export workout as `.md` file or `.zip` (multiple workouts)
- Import friend's workouts
- Compare progress charts (overlay their data)

**Why local-first works**: No server, no accounts. Share via iMessage/WhatsApp. Privacy-first.

**Acceptance**:
- Export workout, send to friend, they import successfully
- See friend's progress overlaid on charts

---

### Phase 5: Polish (Week 6)
**Goal**: Make it portfolio-ready.

**What you build**:
- Onboarding flow (welcome, equipment setup, model download)
- PR tracking (auto-detect personal records)
- Dark mode
- App icon & splash screen
- Error handling polish

**Why last**: Features work first, polish second. Don't paint a house with no walls.

**Acceptance**:
- New user onboards in <2 minutes
- App looks professional
- No crashes on errors

---

## 💾 Storage: Why It's Not Bloat

### Workout Files
- Each workout: ~500 bytes
- 1 year (150 workouts): ~75 KB
- 10 years: ~2 MB

**For perspective**: One photo = 10 MB (100x a year of workouts).

### The Only Large File: AI Model
- Gemma 1B Q4_K_M: 720 MB
- Downloaded on first launch (user consent required)
- Comparable to: Spotify downloads, offline maps, Netflix episode

### Total App Size
- Install from store: 35-50 MB (no model bundled)
- With AI downloaded: 755 MB
- After 1 year of use: 755.125 MB (workouts add ~75 KB)

**Conclusion**: Workouts are tiny. Model is large but justified (on-device AI). Not bloat.

---

## 🧠 RAG vs Finetuning Explained

### Why RAG is Better for This Project

**Finetuning approach** (original plan):
- ❌ Need 1,000+ training examples (weeks of work)
- ❌ Model memorizes but can't update knowledge
- ❌ Larger model needed to store gym facts
- ❌ Complex training pipeline

**RAG approach** (what we're doing):
- ✅ No training data needed (just write knowledge files)
- ✅ Knowledge vault is updateable (add new research anytime)
- ✅ Smaller model works (just needs to synthesize, not memorize)
- ✅ Perfect for gym knowledge (periodization, volume, plateau recovery)

### How RAG Works

```
User: "I'm stuck at 185 bench for 3 weeks, what should I do?"
    ↓
1. Embed query → vector
    ↓
2. Search knowledge vault → find top 3 relevant chunks
   - plateau-recovery.md: "Deload at 70% intensity for 1 week..."
   - volume-landmarks.md: "If stuck, reduce volume by 40%..."
   - exercise-variation.md: "Try close-grip bench..."
    ↓
3. Build prompt:
   "Context: [retrieved chunks]
    Question: I'm stuck at 185 bench for 3 weeks, what should I do?
    Answer:"
    ↓
4. LLM generates answer (grounded in retrieved context)
    ↓
5. Display to user
```

**Result**: Responses are accurate, grounded, and updateable (edit markdown files to change knowledge).

---

## 🔧 Tech Stack Explained

### Why Each Choice

| Component | Choice | Why |
|-----------|--------|-----|
| **Model** | Gemma 3 1B Q4_K_M | 720 MB, 35-45 tok/s, works on 6GB phones, Apache 2.0 license |
| **Inference** | llama.rn | Direct llama.cpp bindings, Metal (iOS) + Vulkan (Android), fastest |
| **Mobile** | React Native + Expo | Cross-platform, fast iteration, large community |
| **Storage** | Markdown files | Human-readable, portable, git-friendly, future-proof |
| **Charts** | react-native-chart-kit | Lightweight, simple, good enough |
| **RAG** | sentence-transformers | Pre-trained embeddings, fast retrieval, no on-device training |

### Alternatives Considered (And Why Not)

| Alternative | Why Not |
|-------------|---------|
| Phi-3-mini 3.8B | 2.7 GB, slower (12-18 tok/s), needs 8GB RAM phones (limits compatibility) |
| Cloud API (OpenAI) | Kills privacy-first value prop, requires internet, costs money |
| TensorFlow Lite | Weaker LLM support than llama.cpp, less community |
| SQLite storage | Adds complexity, not as portable as markdown |
| Flutter | Smaller community for mobile LLM integration vs React Native |

---

## 📋 GitHub Issues Tracker

I've created a complete task breakdown in `docs/GITHUB_ISSUES.md`.

### How to Use It

1. **Go to**: https://github.com/abhijit360/gym/issues
2. **Create issues** from the templates in `docs/GITHUB_ISSUES.md`
   - Issue #1: Project Setup
   - Issue #2: Phase 0 - Foundation
   - Issue #3: Phase 1 - Smart Parsing
   - Issue #4: Phase 2 - RAG System
   - Issue #5: Phase 3 - Smart Coaching
   - Issue #6: Phase 4 - Collaboration
   - Issue #7: Phase 5 - Polish
3. **Work through sequentially** (phases have dependencies)
4. **Check off tasks** as you complete them
5. **Close issue** only when acceptance criteria pass

### Labels to Use
- `phase-0`, `phase-1`, ..., `phase-5`: Which phase
- `mvp`: Critical for minimum viable product
- `polish`: Nice-to-have, do last
- `bug`: Something broken
- `enhancement`: New feature

---

## 🚀 Getting Started (Next Steps)

### This Week: Phase 0

1. **Set up React Native**
   ```bash
   cd app
   npm install
   npx expo start
   ```

2. **Create logging screen** (`app/app/log.tsx`)
   - Manual form with inputs for exercise, weight, reps, sets
   - Save button

3. **Implement markdown storage** (`app/lib/storage.ts`)
   - `saveWorkout()` → write YAML + markdown to file
   - `loadWorkouts()` → read all markdown files

4. **Build history screen** (`app/app/index.tsx`)
   - List workouts sorted by date
   - Tap to view details

5. **Add one chart** (workout frequency)
   - react-native-chart-kit line chart
   - Data: workouts per week over last 4 weeks

6. **Test**: Log 5 real workouts this week using the app

### Success Criteria (Week 1)
- ✅ App runs on your phone
- ✅ Can log a workout manually
- ✅ Workout saved as markdown file
- ✅ Can see workout in history
- ✅ Chart updates with new workouts

---

## ❓ FAQ

### Q: Is 6 weeks realistic for one person?
**A**: Yes, if scoped correctly. Each phase is 3-5 days of focused work. Phases 0-3 are core (4 weeks), Phases 4-5 are polish (2 weeks). You can ship after Phase 3 if needed.

### Q: What if I get stuck?
**A**: Each phase has clear acceptance criteria. If stuck:
1. Check GitHub issue for that phase
2. Re-read relevant docs (ARCHITECTURE.md, FILE-STRUCTURE.md)
3. Test incrementally (don't build for 3 days then test)

### Q: Can I skip phases?
**A**: Don't skip 0-3 (they're sequential). You can skip Phase 4 (collaboration) if you want solo use only. Phase 5 (polish) is optional for portfolio, but recommended.

### Q: What about testing?
**A**: Each phase has acceptance criteria = manual testing. Automated tests are Issue #9 (do after Phase 5 if time allows).

### Q: How do I know it's portfolio-ready?
**A**: When you can:
1. Demo in 2 minutes (log workout → see chart → ask AI coach → get answer)
2. Explain tech stack confidently (RAG, on-device LLM, React Native)
3. Show code quality (typed, commented, structured)
4. Deploy to TestFlight for others to test

---

## 📚 Documentation Index

| File | What It Covers |
|------|----------------|
| `README.md` | Project overview, quick start |
| `docs/ARCHITECTURE.md` | Tech decisions, RAG explanation, stack choices |
| `docs/FILE-STRUCTURE.md` | Storage breakdown, size analysis, directory layout |
| `docs/PLANNING.md` | User Q&A, feature matrix, risk assessment |
| `docs/GITHUB_ISSUES.md` | Complete task tracker (copy to GitHub Issues) |
| `docs/PROJECT_GUIDE.md` | This file - comprehensive walkthrough |

---

## ✅ Quick Checklist

**Before starting Phase 0**:
- [ ] Read this guide fully
- [ ] Understand RAG vs finetuning
- [ ] Understand why workouts aren't bloat
- [ ] Create GitHub issues from `docs/GITHUB_ISSUES.md`
- [ ] Set up development environment (Node, Expo, iOS/Android simulators)

**Weekly checkpoints**:
- [ ] Week 1: Logged 5 workouts manually
- [ ] Week 2: Parsed 20 logs with natural language
- [ ] Week 3: Model downloaded, retrieval working
- [ ] Week 4: Asked AI 10 questions, got good answers
- [ ] Week 5: Shared workout with friend
- [ ] Week 6: App looks professional

---

## 🎓 What You'll Learn (Portfolio Talking Points)

1. **Mobile LLM deployment**: On-device inference, quantization, model optimization
2. **RAG systems**: Embedding, retrieval, augmented generation
3. **React Native**: Cross-platform mobile development
4. **File system design**: Markdown storage, caching strategies
5. **Natural language parsing**: Regex, structured data extraction
6. **Data visualization**: Charts, progress tracking
7. **UX design**: Onboarding, error handling, progressive enhancement

---

**Ready?** Start with Phase 0 (Week 1). Create the GitHub issues, then begin building.

Questions? Re-read the relevant doc section above or check the issue template for that phase.
