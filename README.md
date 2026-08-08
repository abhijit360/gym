# GymTune 🏋️

> The only gym tracker you need. Completely local and always free.

A lightweight, privacy-first gym tracking app powered by on-device AI. No paywalls, no cloud lock-in, no bloat.

[![GitHub Issues](https://img.shields.io/github/issues/abhijit360/gym)](https://github.com/abhijit360/gym/issues)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ Features

- 📝 **Natural Language Logging**: "Bench 135x10, 155x8" → structured workout
- 🤖 **On-Device AI Coach**: Ask questions, get hypertrophy-focused advice (no internet needed)
- 📊 **Beautiful Charts**: Volume tracking, PRs, progress visualization
- 🔒 **100% Local**: All data stays on your device (markdown files)
- 🎯 **Equipment-Aware**: Suggestions based on your available gear
- 👥 **Share with Friends**: Export/import workouts, compare progress
- 💰 **Always Free**: No paywalls, no subscriptions, no ads

---

## 🚀 Quick Start

### For Users

**Coming Soon**: Download from App Store / Play Store

### For Developers

1. **Clone & Setup**
   ```bash
   git clone https://github.com/abhijit360/gym.git
   cd gym
   ./scripts/setup-repo.sh
   ```

2. **Read the Guide**
   - 📖 [PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) - Complete walkthrough
   - 🏗️ [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical decisions
   - 📋 [GitHub Issues](https://github.com/abhijit360/gym/issues) - Task tracker

3. **Start Building**
   - Begin with [Phase 0](https://github.com/abhijit360/gym/issues) (Manual Logging)
   - Follow the 6-week roadmap

---

## 🎯 Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| **Mobile** | React Native + Expo | Cross-platform (iOS/Android) |
| **LLM** | Gemma 3 1B (Q4_K_M) | 720 MB, 35-45 tok/s, on-device |
| **Inference** | llama.rn (llama.cpp) | Metal/Vulkan acceleration |
| **Approach** | RAG (Retrieval-Augmented Generation) | No finetuning needed |
| **Storage** | Markdown files + YAML frontmatter | Portable, git-friendly |
| **Charts** | react-native-chart-kit | Lightweight, simple |

---

## 📱 How It Works

### 1. Log Workouts Naturally
```
You type: "Bench 135x10, 155x8, 175x6"
App saves: 
---
date: 2026-08-08
workout_type: strength
---
# Push Day
## Bench Press
- Set 1: 135 lbs × 10 reps
- Set 2: 155 lbs × 8 reps
- Set 3: 175 lbs × 6 reps
```

### 2. Ask Your AI Coach
```
You: "I'm stuck at 185 bench for 3 weeks, what should I do?"

AI: "Based on plateau recovery protocols, try a deload week at 70% 
intensity (130 lbs), then progressive overload adding 2.5 lbs per week. 
Also consider close-grip bench as a variation."
```

### 3. Track Progress
- Volume over time per exercise
- Personal records (PRs)
- Workout frequency
- Compare with friends

---

## 🗂️ Project Structure

```
gym/
├── model/              # LLM & knowledge vault
│   ├── knowledge/     # Gym knowledge (periodization, exercises)
│   └── embed.py       # Embedding script
│
├── app/               # React Native mobile app
│   ├── app/          # Screens (logging, progress, coach)
│   └── lib/          # Core logic (storage, parser, RAG)
│
├── docs/              # Comprehensive documentation
│   ├── PROJECT_GUIDE.md    # Start here
│   ├── ARCHITECTURE.md     # Technical deep-dive
│   ├── GITHUB_ISSUES.md    # Task tracker
│   └── FILE-STRUCTURE.md   # Storage breakdown
│
└── scripts/           # Setup & automation
```

---

## 📚 Documentation

| Guide | Purpose | Read When |
|-------|---------|-----------|
| [PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) | Complete walkthrough | **Start here** |
| [SETUP.md](SETUP.md) | Installation & setup | Setting up locally |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical decisions | Implementing features |
| [GITHUB_ISSUES.md](docs/GITHUB_ISSUES.md) | Task breakdown | Planning work |
| [FILE-STRUCTURE.md](docs/FILE-STRUCTURE.md) | Storage details | Understanding data flow |

---

## 🛤️ Roadmap

- [x] **Phase 0**: Manual workout logging + charts (Week 1)
- [ ] **Phase 1**: Natural language parsing (Week 2)
- [ ] **Phase 2**: RAG knowledge system + model download (Week 3)
- [ ] **Phase 3**: On-device AI coaching chat (Week 4)
- [ ] **Phase 4**: Share workouts with friends (Week 5)
- [ ] **Phase 5**: Production polish (Week 6)

See [GitHub Issues](https://github.com/abhijit360/gym/issues) for detailed tasks.

---

## 💾 Storage (Not Bloat!)

**Workouts are tiny**:
- 1 workout = ~500 bytes
- 1 year (150 workouts) = 75 KB
- 10 years = 2 MB

**AI model**: 720 MB (Gemma 1B, downloaded on first launch with user consent)

For comparison:
- 1 photo = ~10 MB (100x a year of workouts)
- Spotify (50 songs) = ~200 MB

See [FILE-STRUCTURE.md](docs/FILE-STRUCTURE.md) for full breakdown.

---

## 🤝 Contributing

This is currently a solo project for portfolio + personal use. Contributions welcome after v1 launch!

**Want to help?**
1. Try the app (coming soon)
2. Report bugs via [Issues](https://github.com/abhijit360/gym/issues)
3. Suggest features
4. Share with friends who lift

---

## 📄 License

MIT © [Abhijit Kamat](https://github.com/abhijit360)

---

## 🙏 Acknowledgments

- **RAG Approach**: Inspired by [LlamaIndex](https://www.llamaindex.ai/) and retrieval-augmented generation research
- **On-Device LLM**: Powered by [llama.cpp](https://github.com/ggml-org/llama.cpp) and [llama.rn](https://github.com/mybigday/llama.rn)
- **Model**: [Gemma 3 1B](https://huggingface.co/google/gemma-3-1b-it) by Google
- **Gym Knowledge**: Curated from [Renaissance Periodization](https://renaissanceperiodization.com/), [Stronger by Science](https://www.strongerbyscience.com/), and r/weightroom

---

## 📞 Contact

- **GitHub**: [@abhijit360](https://github.com/abhijit360)
- **Issues**: [Create an issue](https://github.com/abhijit360/gym/issues)

---

**Built with 🏋️ by a lifter, for lifters.**
