# GymTune - Comprehensive Product Plan

**Status**: Draft for user review  
**Date**: 2026-08-08

---

## Project Overview (Current Understanding)

**Elevator Pitch**: A lightweight, privacy-first gym tracking mobile app that uses a finetuned small language model running entirely on-device to parse natural language workout logs, visualize progress, and provide intelligent coaching—all stored in portable markdown files.

**Core Value Props**:
1. **Natural language input**: "Bench 135x10, 155x8" → structured workout log
2. **Privacy**: Everything stays on device, no cloud dependency
3. **Portability**: Workouts as markdown = future-proof, version-controllable
4. **Smart assistance**: On-device LLM for parsing, suggestions, analysis
5. **Beautiful viz**: Progress graphs and insights

**Tech Stack**:
- Model: Phi-3-mini 3.8B (or lighter alternative) finetuned with Unsloth
- Mobile: React Native + Expo + llama.rn
- Storage: Local markdown files with YAML frontmatter
- Inference: llama.cpp via llama.rn (Metal/Vulkan acceleration)

---

## Feature Matrix

### ✅ Core Features (Implied MVP)

| Feature | Description | Status | Questions |
|---------|-------------|--------|-----------|
| **Natural Language Logging** | User types "Bench 135x10, 155x8" → LLM parses → saves as markdown | Planned | How forgiving should parsing be? What about typos, abbreviations? |
| **Workout History** | List of past workouts, tap to view details | Scaffolded | Sort by date only? Filter by type/exercise? |
| **Progress Charts** | Line charts showing workout frequency over time | Basic version exists | Which metrics matter most? Volume? 1RM estimates? Frequency? |
| **Markdown Storage** | Workouts saved as `.md` files with YAML frontmatter | Defined | Should users see raw markdown or always through app UI? |
| **On-Device LLM** | Finetuned model runs locally via llama.rn | Research complete | What's the actual quality bar? How much training data is realistic? |

### 🤔 Unclear / Needs Definition

| Feature | Why Unclear | Critical Questions |
|---------|-------------|-------------------|
| **Exercise Suggestions** | LLM suggests exercises for a muscle group | Is this core MVP or nice-to-have? How personalized? Generic "back exercises" or based on user's history/equipment? |
| **Progress Analysis** | LLM analyzes trends: "Your squat is improving 5% per week" | Core or premium? What depth of analysis? Just trends or also form cues, deload suggestions? |
| **PR Tracking** | Auto-detect personal records | Should this be automatic or manual tagging? How to handle different rep ranges (1RM vs 5RM vs 10RM)? |
| **Templates/Programs** | Pre-built workout programs (5x5, PPL, etc.) | In scope? Would require significant UI and program data. |
| **Social/Sharing** | Share workouts with friends, compare progress | Out of scope for v1? Conflicts with privacy-first? |
| **Exercise Database** | Searchable library of exercises with instructions | How big? Just names or with videos/images? Where does data come from? |

### ❌ Explicitly Out of Scope (Confirm)

| Feature | Rationale | User Confirmation Needed |
|---------|-----------|--------------------------|
| **Cloud Sync** | Conflicts with local-first, adds complexity | Correct? Or should there be optional cloud backup? |
| **Web App** | Mobile-only keeps scope tight | Correct? Or is desktop view important? |
| **Nutrition Tracking** | Different domain, doubles complexity | Correct? Or is macro tracking part of the vision? |
| **Social Network** | Privacy-first conflicts with social | Correct? |
| **Wearable Integration** | Apple Watch, Fitbit, etc. - significant scope | v1 or future? |

---

## Critical Questions for User

### 🎯 Product & Audience

1. **Who is the primary user?**
   - [ ] Beginner lifters who need guidance and structure
   - [ ] Intermediate lifters who know what they're doing, just want easy tracking
   - [ ] Powerlifters/serious athletes who track every detail
   - [ ] Casual gym-goers who want motivation without complexity
   
   **Why this matters**: Determines LLM training data focus, UI complexity, feature priority.

2. **What's the #1 problem you're solving?**
   - [ ] Existing apps are too complex/bloated
   - [ ] Existing apps aren't private (cloud lock-in)
   - [ ] Natural language input is better than tapping through forms
   - [ ] Markdown storage for portability/version control
   - [ ] On-device AI is cool tech
   
   **Why this matters**: Guides what to build first and how to measure success.

3. **How much coaching does the LLM provide?**
   - **Option A**: Pure parsing ("Bench 135x10" → structured data), minimal suggestions
   - **Option B**: Active coach (suggests programs, analyzes form cues, recommends deloads)
   - **Option C**: Middle ground (parses + basic exercise suggestions)
   
   **Why this matters**: Training data requirements differ 10x. Option A = 500-1K examples. Option B = 10K+ examples + domain expertise.

4. **What does "beautiful graphs" mean specifically?**
   - Simple workout frequency (current scaffold)
   - Volume over time per exercise (total weight × reps)
   - 1RM estimates and progression curves
   - Body composition tracking (weight, measurements)
   - All of the above
   
   **Why this matters**: Charting libraries, data extraction complexity, UI real estate.

### 🔧 Technical Decisions

5. **Model size tradeoff: Quality vs Compatibility**
   - **Phi-3-mini 3.8B** (current): Best quality, 2.7GB, 12-18 tok/s, requires 8GB RAM phones (iPhone 14+, flagship Androids)
   - **SmolLM3 3B**: Balanced, 1.9GB, 26-32 tok/s, 8GB RAM phones
   - **Qwen3 1.7B**: Lightweight, 1.1GB, 26-35 tok/s, works on 6GB RAM phones (mid-range)
   - **Gemma 3 1B**: Fastest, 720MB, 35-45 tok/s, works on 4GB RAM phones (oldest devices)
   
   **Your priority**:
   - [ ] Max quality, accept limiting to newer phones
   - [ ] Max compatibility, accept lower quality parsing
   - [ ] Ship both, let user download appropriate model for their device
   
   **Reality check**: Smaller models struggle more with:
   - Ambiguous input ("bench 135 10" vs "bench 135x10" vs "bench press 135 for 10")
   - Units (lbs vs kg, implicit vs explicit)
   - Exercise name variations ("bench" vs "bench press" vs "BP")

6. **Training data: How will you get it?**
   - Current scaffold has 5-6 sample conversations
   - Research suggests 1K-5K examples for decent LoRA finetuning
   - **Where will your training data come from?**
     - [ ] Manually write conversations (how many can you realistically create?)
     - [ ] Scrape Reddit r/fitness, r/weightroom (legal/ethical concerns, quality variance)
     - [ ] Use GPT-4 to generate synthetic examples (quality ceiling, potential overfitting)
     - [ ] Collect from real users after launch (chicken-egg problem)
   
   **Why this matters**: Model quality is training data quality. 5 examples = toy. 500 examples = functional. 5K examples = good.

7. **Quantization choice**:
   - **Q4_K_M** (current default): 75% size reduction, 90-95% quality retained, best for 3B+
   - **Q5_K_M**: +20% size, +3-5% quality, better for 1B models where accuracy is critical
   - **Q8_0**: Near-lossless, 2x size of Q4
   
   **Your choice**: Start with Q4_K_M or go higher for better parsing accuracy?

8. **Platform priority**:
   - [ ] iOS first (easier testing, Metal acceleration, better performance)
   - [ ] Android first (larger market, more variance to handle)
   - [ ] Simultaneous (doubles testing burden)
   
   **Why this matters**: Android fragmentation = more edge cases. iOS Metal = faster inference but simulator doesn't work.

9. **Offline-first or hybrid?**
   - **Pure offline** (current plan): Model downloaded on first launch (~1-3GB), everything local
   - **Hybrid**: Fallback to cloud API (OpenAI, Anthropic) when offline model fails or device too old
   - **Cloud-first with offline fallback**: Opposite—use cloud unless no connection
   
   **Why this matters**: Pure offline = largest app, longest first launch. Hybrid = easier MVP but privacy compromise.

### 📊 Scope & Complexity

10. **What's the actual MVP?**
    - [ ] Basic logging + history list + one simple chart (ship in 2-4 weeks)
    - [ ] Above + LLM parsing + exercise suggestions (ship in 4-8 weeks)
    - [ ] Above + advanced charts + PR tracking + templates (ship in 8-12 weeks)

11. **Is this a portfolio/learning project or a product you want people to use?**
    - **Portfolio**: Can cut corners, prioritize interesting tech (on-device LLM), polish optional
    - **Product**: Need onboarding, error handling, model download UX, accessibility, polish
    
    **Why this matters**: 3x time difference. Portfolio = interesting scaffold. Product = sweat the details.

12. **Are you building this solo?**
    - Solo → keep scope ruthlessly tight, reuse everything, skip custom UI
    - Team → can parallelize model training + app development

### 💰 Business Model

13. **Monetization intent?**
    - [ ] Free forever (open source, no monetization)
    - [ ] Freemium (basic free, premium features paid)
    - [ ] Paid upfront ($2-5 one-time)
    - [ ] Subscription ($1-3/month)
    
    **Why this matters**: Changes feature prioritization. Free = simpler. Premium = need differentiation.

14. **If premium, what's behind the paywall?**
    - Advanced charts?
    - Cloud backup?
    - Larger model for better quality?
    - Workout templates/programs?

---

## Technical Risks & Unknowns

### 🚨 High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Model parsing quality is poor** | Core value prop fails. Users frustrated by bad parses. | Start with 1K high-quality training examples. Test on diverse input. Have manual edit fallback. |
| **Model too slow on real devices** | Users abandon during first workout (5-10s wait per log) | Test early on mid-range devices. Consider smaller model. Design for batch processing. |
| **First launch model download UX is terrible** | 1-3GB download on cellular, users uninstall during download | Wizard with WiFi warning. Progress bar. Option to use demo mode first. |
| **Training data is insufficient** | Can't create enough quality examples to finetune meaningfully | Synthetic data generation. Crawl public workout logs (Reddit, forums). MVP with simpler parsing rules + smaller model. |
| **React Native + llama.rn is buggy** | Crashes, memory leaks, build issues | Test on real devices early. Have cloud fallback. Budget debugging time. |

### ⚠️ Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Markdown storage is confusing to users** | Users expect database, don't understand files | Hide file system by default, show as "Export to markdown" feature |
| **No cloud sync frustrates users** | Users switch phones, lose data | Document export workflow clearly. iCloud/Google Drive manual sync instructions. |
| **On-device model can't handle edge cases** | Unusual exercises, non-English, complex logs | Fallback to manual entry. Error messages that teach proper format. |
| **Battery drain from inference** | Users complain about battery hit | Optimize inference (batch logs, cache context). Test thermal behavior. |

---

## Data Flow & Architecture Questions

### Current Implied Flow

```
User Input (text)
    ↓
LLM Inference (llama.rn)
    ↓
Parsed Workout Object
    ↓
Convert to Markdown + YAML
    ↓
Save to File (RNFS)
    ↓
Display in UI (from file list)
```

### Questions

1. **When does LLM run?**
   - On every keystroke (live preview)? → Battery drain
   - On "Log" button press? → Simpler
   - In background after typing pause? → Complex

2. **What if LLM parsing fails?**
   - Show error + manual form fallback?
   - Let user edit raw markdown?
   - Retry with simplified prompt?

3. **How are charts populated?**
   - Parse all markdown files on app launch? → Slow for 100+ workouts
   - Maintain separate index/database? → Adds complexity
   - Lazy load + cache? → More code

4. **Is markdown the source of truth or is there also a DB?**
   - **Pure markdown**: Simple, portable, but slow queries
   - **Markdown + SQLite index**: Fast queries, more complex sync

---

## Recommended Next Steps (Conditional on Answers)

### Phase 0: Validate Core Assumptions (1 week)

1. **Create 50-100 diverse training examples** manually
   - Different formats: "bench 135x10", "bench press: 135 lbs for 10 reps", etc.
   - Different exercises: compound lifts, cardio, bodyweight, stretching
   - **STOP if this feels impossible** → Model approach might not work

2. **Finetune smallest model (Gemma 3 1B)** with Unsloth on those examples
   - Export Q4_K_M GGUF
   - Test with llama.cpp CLI on diverse unseen inputs
   - **MEASURE**: Parsing accuracy on 20 held-out examples
   - **GATE**: If <80% accuracy, rethink approach or need 10x more data

3. **Test inference speed on a real mid-range phone**
   - Borrow Android with 6GB RAM (Galaxy A54, Pixel 7a)
   - Load GGUF via llama.cpp Android example
   - **MEASURE**: Tokens/sec, memory usage, battery drain
   - **GATE**: If >5s for typical parse, too slow for real use

### Phase 1: Ruthless MVP (2-4 weeks) - IF Phase 0 passes

**Scope**: Basic logging + history + one chart

**Features**:
- ✅ Natural language input field
- ✅ LLM parsing to markdown (with manual edit fallback)
- ✅ Workout history list (sorted by date)
- ✅ One simple chart (workout frequency)
- ✅ Model download flow with progress
- ❌ No exercise suggestions
- ❌ No advanced charts
- ❌ No templates
- ❌ No PR tracking

**Deliverable**: TestFlight/internal testing build, 10 users try it

### Phase 2: Refinement (2-4 weeks) - IF Phase 1 gets positive feedback

**Add**:
- Exercise suggestions (if training data allows)
- Volume-over-time chart
- Basic PR detection
- Polish model download UX

### Phase 3: Public Launch (2-4 weeks)

**Add**:
- Onboarding flow
- Error handling polish
- Export functionality
- App Store assets

---

## Open Questions Summary

**Please answer these to refine the plan**:

1. Who is the primary user persona?
2. What's the #1 problem you're solving?
3. How much coaching should the LLM provide?
4. Model size: quality vs compatibility tradeoff?
5. How will you get 1K+ training examples?
6. Platform priority: iOS, Android, or both?
7. Is this a portfolio project or a product for users?
8. What's the realistic MVP scope?
9. Solo or team?
10. Monetization intent?

**Biggest unknown**: Can you realistically create enough quality training data to make the LLM parsing work well? This is the riskiest assumption.

---

## My Recommendations (Opinionated)

1. **Start smaller than you think**: Ship pure manual logging first (forms, no LLM). Add LLM parsing in v2 after validating people even want markdown-based tracking.

2. **Or flip it**: If LLM is the point (learning exercise), accept that UX will be rough and focus on making the model work really well for a narrow use case (only barbell compound lifts, for example).

3. **Don't underestimate training data**: 5 examples won't cut it. Budget 1-2 weeks just creating training data or figure out synthetic generation.

4. **Test on real phones ASAP**: Simulator/emulator doesn't tell you about thermal throttling, battery, or real inference speed.

5. **Have a fallback**: If on-device model sucks, what's plan B? Cloud API? Simpler regex parsing?

---

**Next step**: Answer the open questions above, then we refine scope and build a concrete roadmap.
