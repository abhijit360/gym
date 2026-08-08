# GymTune 🏋️

A lightweight, local-first gym tracking app powered by a finetuned small language model.

## Features

- 📝 Track workouts with natural language
- 📊 Beautiful graphs and progress visualization
- 💾 Local markdown storage (portable, version-controllable)
- 🤖 Smart assistance via finetuned small LLM
- 📱 Cross-platform mobile app (iOS/Android)

## Architecture

```
gym-tune/
├── model/          # LLM finetuning pipeline
├── app/            # React Native mobile app
└── docs/           # Documentation and schemas
```

## Stack

- **Model**: Phi-3-mini (3.8B) with LoRA finetuning
- **Mobile**: React Native + Expo
- **Storage**: Markdown files with YAML frontmatter
- **Graphs**: recharts/victory-native
- **Training**: PyTorch + Hugging Face transformers

## Quick Start

### Model Training
```bash
cd model
pip install -r requirements.txt
python train.py
```

### Mobile App
```bash
cd app
npm install
npm start
```

## Data Format

Workouts are stored as markdown files:

```markdown
---
date: 2026-08-08
workout_type: strength
duration_minutes: 45
---

# Upper Body Day

## Bench Press
- Set 1: 135 lbs × 10 reps
- Set 2: 155 lbs × 8 reps
- Set 3: 175 lbs × 6 reps

## Notes
Felt strong today, increased weight from last session.
```
