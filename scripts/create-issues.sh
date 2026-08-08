#!/bin/bash
# Script to create GitHub issues for GymTune project
# Requires: GitHub CLI (gh) installed and authenticated

set -e

REPO="abhijit360/gym"

echo "🏋️ Creating GymTune GitHub Issues..."
echo ""

# Issue #1: Setup
echo "Creating Issue #1: Project Setup..."
gh issue create \
  --repo "$REPO" \
  --title "[SETUP] Project Foundation & Documentation" \
  --label "setup,documentation" \
  --body "## Description
Set up the complete project structure, documentation, and development environment for GymTune.

## Tasks
- [x] Create initial project scaffold
- [x] Document architecture in \`docs/ARCHITECTURE.md\`
- [x] Document file structure and storage in \`docs/FILE-STRUCTURE.md\`
- [x] Document planning decisions in \`docs/PLANNING.md\`
- [ ] Set up React Native + Expo project
- [ ] Configure llama.rn dependencies
- [ ] Create development setup guide

## Acceptance Criteria
- All documentation files committed
- React Native project runs on iOS/Android simulator
- Dependencies installed and working"

# Issue #2: Phase 0
echo "Creating Issue #2: Phase 0 - Foundation..."
gh issue create \
  --repo "$REPO" \
  --title "[PHASE 0] Foundation - Manual Logging (Week 1)" \
  --label "phase-0,mvp" \
  --body "## Goal
Build the core workout tracking without LLM complexity. Prove the basic loop works.

## Deliverables
- Manual workout logging form
- Markdown file storage
- Workout history list view
- Equipment profile setup
- Simple workout frequency chart

## Tasks
- [ ] Create workout logging screen with manual form
- [ ] Implement markdown storage (\`lib/storage.ts\`)
- [ ] Build workout history screen
- [ ] Add equipment profile screen
- [ ] Create workout frequency chart

## Acceptance Criteria
- [ ] Can log a full workout manually (3-5 exercises)
- [ ] Workout saved as valid markdown file
- [ ] Can view workout in history list
- [ ] Can see workout frequency chart update
- [ ] Equipment profile persists across app restarts

## Testing
Log 5 real workouts this week using the app.

**Estimated Time**: 3-4 days"

# Issue #3: Phase 1
echo "Creating Issue #3: Phase 1 - Smart Parsing..."
gh issue create \
  --repo "$REPO" \
  --title "[PHASE 1] Smart Parsing - Natural Language Input (Week 2)" \
  --label "phase-1,parsing" \
  --body "## Goal
Enable fast logging via natural language parsing (regex, not LLM).

## Deliverables
- Natural language input field
- Regex parser for common formats
- Fallback to manual form on parse failure
- Volume calculations (sets × reps × weight)
- Volume-over-time chart per exercise

## Tasks
- [ ] Build regex parser (\`lib/parser.ts\`)
- [ ] Update logging screen with natural language input
- [ ] Add volume calculation
- [ ] Create volume chart
- [ ] Exercise name normalization

## Acceptance Criteria
- [ ] Can parse: \`bench 135x10, 155x8, 175x6\`
- [ ] Can parse: \`squat 225x5x3\`
- [ ] Fallback to manual form if parse fails
- [ ] Volume chart shows correct totals

## Testing
Parse 20 diverse workout logs, verify >80% success rate.

**Estimated Time**: 3-4 days"

# Issue #4: Phase 2
echo "Creating Issue #4: Phase 2 - RAG System..."
gh issue create \
  --repo "$REPO" \
  --title "[PHASE 2] RAG System - Knowledge Vault & Model Integration (Week 3)" \
  --label "phase-2,llm,rag" \
  --body "## Goal
Set up the RAG knowledge system and integrate on-device LLM inference.

## Deliverables
- Gym knowledge vault (markdown files)
- Pre-computed embeddings
- Model download flow
- llama.rn integration
- Basic retrieval working

## Tasks
- [ ] Create knowledge vault markdown files
- [ ] Create Python embedding script
- [ ] Implement model download flow
- [ ] Integrate llama.rn
- [ ] Implement RAG retrieval

## Acceptance Criteria
- [ ] Knowledge vault has 10+ markdown files
- [ ] \`embeddings.json\` generated and bundled
- [ ] Model downloads successfully on device
- [ ] llama.rn loads GGUF and generates text
- [ ] Retrieval returns relevant chunks

**Estimated Time**: 5-6 days"

# Issue #5: Phase 3
echo "Creating Issue #5: Phase 3 - Smart Coaching..."
gh issue create \
  --repo "$REPO" \
  --title "[PHASE 3] Smart Coaching - RAG-Powered Chat (Week 4)" \
  --label "phase-3,llm,coaching" \
  --body "## Goal
Enable conversational coaching powered by RAG retrieval and on-device LLM.

## Deliverables
- Coach chat interface
- RAG-augmented prompts
- Equipment-aware suggestions
- Workout history context

## Tasks
- [ ] Create Coach screen with chat UI
- [ ] Implement RAG-augmented generation
- [ ] Add workout history context
- [ ] Equipment-aware suggestions
- [ ] Add example prompts

## Acceptance Criteria
- [ ] Can chat with LLM
- [ ] Responses grounded in knowledge vault
- [ ] Suggestions match user's equipment
- [ ] Response time <5s on mid-range device

**Estimated Time**: 4-5 days"

# Issue #6: Phase 4
echo "Creating Issue #6: Phase 4 - Collaboration..."
gh issue create \
  --repo "$REPO" \
  --title "[PHASE 4] Collaboration - Share & Compare (Week 5)" \
  --label "phase-4,social" \
  --body "## Goal
Enable sharing workouts with friends and comparing progress.

## Deliverables
- Export single workout
- Export multiple workouts
- Import friend's workout
- Compare progress charts

## Tasks
- [ ] Implement export (\`lib/export.ts\`)
- [ ] Implement import (\`lib/import.ts\`)
- [ ] Add export UI
- [ ] Add import UI
- [ ] Compare feature

## Acceptance Criteria
- [ ] Can export single workout
- [ ] Friend can import and see workout
- [ ] Can export all workouts as backup
- [ ] Compare charts show both users

**Estimated Time**: 3-4 days"

# Issue #7: Phase 5
echo "Creating Issue #7: Phase 5 - Polish..."
gh issue create \
  --repo "$REPO" \
  --title "[PHASE 5] Polish - Production Ready (Week 6)" \
  --label "phase-5,polish,ux" \
  --body "## Goal
Polish the app for public use and portfolio showcase.

## Deliverables
- Onboarding flow
- Error handling
- PR tracking
- Dark mode
- App icons & splash screen

## Tasks
- [ ] Onboarding flow
- [ ] Error handling
- [ ] PR tracking
- [ ] Dark mode
- [ ] Design assets
- [ ] Performance optimization
- [ ] Accessibility

## Acceptance Criteria
- [ ] New user can complete onboarding in <2 minutes
- [ ] No crashes on error scenarios
- [ ] Dark mode works on all screens
- [ ] App looks professional

**Estimated Time**: 5-6 days"

# Issue #8: Infrastructure
echo "Creating Issue #8: CI/CD..."
gh issue create \
  --repo "$REPO" \
  --title "[INFRASTRUCTURE] CI/CD & Deployment" \
  --label "infrastructure,deployment" \
  --body "## Goal
Set up automated builds and deployment pipeline.

## Tasks
- [ ] GitHub Actions workflow
- [ ] Embed knowledge vault at build time
- [ ] Version management
- [ ] Distribution (TestFlight/Play Store)

## Acceptance Criteria
- [ ] CI runs on every PR
- [ ] Main branch auto-deploys to TestFlight

**Estimated Time**: 2-3 days"

# Issue #9: Testing
echo "Creating Issue #9: Testing..."
gh issue create \
  --repo "$REPO" \
  --title "[TESTING] Integration & E2E Tests" \
  --label "testing,quality" \
  --body "## Goal
Ensure app quality with comprehensive tests.

## Tasks
- [ ] Unit tests (parser, storage, RAG)
- [ ] Integration tests (full flows)
- [ ] E2E tests (Detox)
- [ ] Performance tests

## Acceptance Criteria
- [ ] 80%+ code coverage
- [ ] All critical paths have E2E tests

**Estimated Time**: 4-5 days"

echo ""
echo "✅ All 9 issues created!"
echo "View them at: https://github.com/$REPO/issues"
