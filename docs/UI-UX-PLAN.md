# GymTune - UI/UX Master Plan

**Created**: 2026-08-08  
**Status**: Planning Document  
**Based on**: Phase 0 implementation + 6-week roadmap

---

## Executive Summary

**Goal**: Create a clean, portfolio-quality mobile app that feels professional yet simple. Emphasize speed of logging, clarity of progress, and delight in AI interactions.

**Design Philosophy**: "Gym tracker that gets out of your way"
- Logging a workout should take <60 seconds
- Progress should be instantly visible
- AI coach should feel helpful, not gimmicky
- Markdown storage should be invisible (until user wants portability)

---

## 1. Design System

### Color Palette

**Primary**: Blue (Strength, Trust, Tech)
```
Primary:     #007AFF  (iOS Blue - familiar, reliable)
Primary Dark: #0051D5
Primary Light: #4DA2FF
```

**Accent**: Green (Progress, Success, Growth)
```
Success:     #34C759  (iOS Green)
Warning:     #FF9500  (iOS Orange)
Error:       #FF3B30  (iOS Red)
```

**Neutrals**:
```
Background Light: #FFFFFF
Background Dark:  #000000 (pure black for OLED dark mode)
Surface:         #F5F5F5
Surface Dark:    #1C1C1E
Text Primary:    #000000
Text Secondary:  #666666
Text Tertiary:   #999999
Border:          #DDDDDD
```

### Typography

**System**: Use platform defaults (SF Pro on iOS, Roboto on Android)

```
Display:  32pt, Bold     (screen titles)
Heading:  20pt, Semibold (section headers)
Body:     16pt, Regular  (main text)
Caption:  14pt, Regular  (labels, metadata)
Small:    12pt, Regular  (fine print)
Mono:     14pt, Mono     (markdown code blocks)
```

### Spacing

**8px grid system**:
```
xs:  4px   (tight elements)
sm:  8px   (related items)
md:  16px  (standard padding)
lg:  24px  (section spacing)
xl:  32px  (screen margins)
xxl: 48px  (major sections)
```

### Components

**Buttons**:
- Primary: Blue fill, white text, 8px radius
- Secondary: Light gray fill, dark text, 8px radius
- Text: No fill, primary color text
- Minimum touch target: 44x44pt

**Cards**:
- Background: Surface color
- Padding: 16px
- Radius: 8px or 12px (consistent throughout)
- Shadow: None (flat design) or subtle 1px border

**Input Fields**:
- Border: 1px solid #DDD
- Radius: 8px
- Padding: 12px
- Focus: Border → Primary color

---

## 2. Navigation Architecture

### Bottom Tab Navigation (iOS Pattern)

```
┌─────────────────────────────┐
│         Screen Area         │
│                             │
│                             │
└─────────────────────────────┘
┌─────┬─────┬─────┬─────┬─────┐
│ 🏋️  │ 📊  │ 💬  │ 👥  │ ⚙️   │
│Home │Stats│Coach│Share│ Set │
└─────┴─────┴─────┴─────┴─────┘
```

**Tabs**:
1. **Home** (🏋️): Workout logging + history
2. **Progress** (📊): Charts, stats, PRs
3. **Coach** (💬): AI chat (Phase 3+)
4. **Friends** (👥): Share/compare (Phase 4+, initially hidden)
5. **Settings** (⚙️): Equipment, model, preferences

**Alternative**: Start with 3 tabs (Home, Progress, Settings), add Coach in Phase 3, Friends in Phase 4.

---

## 3. Phase 0 Improvements (Current Implementation)

### Home Screen (index.tsx)

**Current Issues**:
- ✅ Manual logging works but feels long
- ❌ No equipment profile visible
- ❌ Workout cards don't show enough detail
- ❌ No workout detail view (just alert on tap)

**Improvements**:

#### A. Home Screen Layout
```
┌─────────────────────────────┐
│ 🏋️ GymTune            👤 ⚙️ │ ← Header with settings icon
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │  + Log Workout          │ │ ← Primary CTA
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Recent Workouts             │
│ ┌─────────────────────────┐ │
│ │ Aug 8 • Strength  📝    │ │ ← Swipe to delete
│ │ Bench, Squat, +2 more   │ │
│ │ 3 exercises • 45min     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Aug 7 • Cardio    🏃     │ │
│ │ Run 3.2 miles           │ │
│ │ 28 minutes              │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

#### B. Workout Detail Screen (NEW)
```
┌─────────────────────────────┐
│ ← Back     Aug 8     Edit   │ ← Navigation
├─────────────────────────────┤
│ Strength • 45 minutes       │
│                             │
│ Bench Press                 │ ← Expandable sections
│ ├ Set 1: 135 lbs × 10 reps  │
│ ├ Set 2: 155 lbs × 8 reps   │
│ └ Set 3: 175 lbs × 6 reps   │
│                             │
│ Squat                       │
│ ├ Set 1: 225 lbs × 5 reps   │
│ └ ...                       │
│                             │
│ Notes                       │
│ Felt strong today!          │
│                             │
│ ┌─────────────────────────┐ │
│ │ Export as Markdown      │ │ ← Action buttons
│ │ Delete Workout          │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

#### C. Logging Flow: Multi-Step Wizard

Instead of long single form, break into steps:

**Step 1: Quick Start**
```
What did you train today?
┌─────────────────────────────┐
│ 💪 Strength                 │
│ 🏃 Cardio                   │
│ 🧘 Flexibility              │
│ 📝 Other                    │
└─────────────────────────────┘
```

**Step 2: Add Exercises**
```
Add Exercises
┌─────────────────────────────┐
│ Exercise name               │ ← Autocomplete
│ [Bench Press_________]      │
├─────────────────────────────┤
│ Weight    Reps    Sets      │
│ [135_] × [10__] × [3_]      │
├─────────────────────────────┤
│ + Add Exercise              │
│                             │
│ Current Workout:            │
│ • Bench Press (3 sets)      │
│                             │
│ [Next]                      │
└─────────────────────────────┘
```

**Step 3: Notes & Save**
```
Anything to note?
┌─────────────────────────────┐
│ How did you feel?           │
│ [________________]          │
│ [________________]          │
│                             │
│ Duration (optional)         │
│ [45_] minutes               │
│                             │
│ [Save Workout]              │
└─────────────────────────────┘
```

### Progress Screen (progress.tsx)

**Current Issues**:
- ✅ Charts work but basic
- ❌ No interactivity (can't tap to see details)
- ❌ Limited data views (only frequency)

**Improvements**:

#### A. Enhanced Progress Dashboard
```
┌─────────────────────────────┐
│ Progress & Stats            │
├─────────────────────────────┤
│ ┌───────┐ ┌───────┐        │
│ │  52   │ │   5   │        │ ← Stat cards
│ │ Total │ │ Week  │        │
│ └───────┘ └───────┘        │
├─────────────────────────────┤
│ Workout Frequency           │
│ ┌─────────────────────────┐ │
│ │     📈 Line Chart       │ │ ← Interactive
│ │                         │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Exercise PRs                │ ← NEW: Personal records
│ ┌─────────────────────────┐ │
│ │ Bench Press    🏆 185    │ │
│ │ Squat          🏆 275    │ │
│ │ Deadlift       🏆 315    │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

#### B. Exercise Detail View (Drill-down)

Tap on "Bench Press" card:
```
┌─────────────────────────────┐
│ ← Back     Bench Press      │
├─────────────────────────────┤
│ PR: 185 lbs × 6 reps        │
│ Aug 8, 2026                 │
├─────────────────────────────┤
│ Volume Over Time            │
│ ┌─────────────────────────┐ │
│ │     📊 Chart            │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ History                     │
│ Aug 8  • 135×10, 155×8, 175×6│
│ Aug 6  • 135×10, 155×8, 175×5│
│ Aug 4  • 135×10, 155×8, 165×6│
└─────────────────────────────┘
```

---

## 4. Phase 1: Natural Language Parsing

### Input UX

**Option A: Inline on Home Screen** (Recommended)
```
┌─────────────────────────────┐
│ Quick Log                   │
│ ┌─────────────────────────┐ │
│ │ Bench 135x10, 155x8,    │ │ ← Smart input
│ │ 175x6                   │ │
│ │                    [→]  │ │
│ └─────────────────────────┘ │
│ or [Manual Form]            │
└─────────────────────────────┘
```

**Parsing Flow**:
1. User types: "Bench 135x10, 155x8, 175x6"
2. Tap → (or press Enter)
3. Show parsed preview:
   ```
   ┌─────────────────────────────┐
   │ Parsed Workout:             │
   │ ✓ Bench Press               │
   │   • 135 lbs × 10 reps       │
   │   • 155 lbs × 8 reps        │
   │   • 175 lbs × 6 reps        │
   │                             │
   │ Looks good?                 │
   │ [Edit] [Save]               │
   └─────────────────────────────┘
   ```
4. If parse fails → show manual form with pre-filled exercise name

**Error Handling**:
```
┌─────────────────────────────┐
│ Couldn't parse this:        │
│ "benc 135 10"               │
│                             │
│ Did you mean?               │
│ • Bench Press               │
│ • Bench Dips                │
│                             │
│ or [Manual Entry]           │
└─────────────────────────────┘
```

### Suggestions

Show common patterns as chips:
```
Examples:
[Squat 225x5x3] [Run 3mi 28min] [Bench 185 for 5]
```

---

## 5. Phase 2: RAG System (Model Download)

### First Launch Onboarding

**Screen 1: Welcome**
```
┌─────────────────────────────┐
│                             │
│        🏋️                   │
│     GymTune                 │
│                             │
│ Your personal gym tracker   │
│ Completely local & free     │
│                             │
│      [Get Started]          │
└─────────────────────────────┘
```

**Screen 2: Equipment Setup**
```
┌─────────────────────────────┐
│ What equipment do you have? │
│                             │
│ ☑ Barbell                   │ ← Multi-select checkboxes
│ ☑ Dumbbells                 │
│ ☐ Cables & Machines         │
│ ☑ Bodyweight                │
│                             │
│ (You can change this later) │
│                             │
│      [Continue]             │
└─────────────────────────────┘
```

**Screen 3: AI Coach (Optional)**
```
┌─────────────────────────────┐
│ Download AI Coach?          │
│                             │
│ Get smart workout advice    │
│ powered by on-device AI     │
│                             │
│ Size: 720 MB                │
│ ⚠️ WiFi recommended         │
│                             │
│ [Download] [Skip for now]   │
└─────────────────────────────┘
```

### Download Experience

**Progress Screen**:
```
┌─────────────────────────────┐
│ Downloading AI Coach...     │
│                             │
│ ████████░░░░░░░░░░░░  38%   │
│ 274 MB / 720 MB             │
│                             │
│ ~2 minutes remaining        │
│                             │
│ [Pause] [Cancel]            │
│                             │
│ You can use the app while   │
│ this downloads in background│
└─────────────────────────────┘
```

**Success**:
```
┌─────────────────────────────┐
│        ✓                    │
│   AI Coach Ready!           │
│                             │
│ Ask me anything about       │
│ training, recovery, or      │
│ nutrition.                  │
│                             │
│      [Start Chat]           │
└─────────────────────────────┘
```

### Settings: Model Management

```
Settings > AI Coach

Model: Gemma 3 1B
Status: ✓ Downloaded
Size: 720 MB
Last updated: Aug 8, 2026

[Update Model]
[Delete Model]

Offline Mode: ON
(Coach unavailable without download)
```

---

## 6. Phase 3: Smart Coaching (Chat Interface)

### Chat Screen (NEW Tab)

**Empty State**:
```
┌─────────────────────────────┐
│ 💬 AI Coach                 │
├─────────────────────────────┤
│                             │
│      🤖                     │
│   Ask me anything!          │
│                             │
│ Try asking:                 │
│ ┌─────────────────────────┐ │
│ │ I'm stuck at 185 bench  │ │ ← Tappable chips
│ │ for 3 weeks. Help?      │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Create a 4-week program │ │
│ │ for hypertrophy         │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Type your question...   │ │ ← Input at bottom
│ │                    [→]  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Active Conversation**:
```
┌─────────────────────────────┐
│ ← Back   AI Coach       ⋮   │ ← Menu: Clear, Export
├─────────────────────────────┤
│ ┌───────────────────────┐   │
│ │ I'm stuck at 185 bench│   │ ← User message (right)
│ │ for 3 weeks           │   │
│ └───────────────────────┘   │
│                             │
│ ┌─────────────────────────┐ │
│ │ 💭 Let me help...       │ │ ← AI message (left)
│ │                         │ │
│ │ A plateau after 3 weeks │ │
│ │ suggests you need a     │ │
│ │ deload. Try this:       │ │
│ │                         │ │
│ │ Week 1: 70% intensity   │ │ ← Markdown rendering
│ │ • Bench: 130 lbs × 8    │ │
│ │                         │ │
│ │ [Copy] [📋 Save as Log] │ │ ← Action buttons
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Type your message...    │ │
│ │                    [→]  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Markdown Rendering in Chat

Support:
- **Bold**, *italic*
- Bullet lists
- Numbered lists
- Tables (workout logs)
- Code blocks (for JSON/mermaid)
- Links (citations to knowledge vault)

### Mermaid Diagram Rendering

**Workout Program Flowchart**:
```
User: "Create a 12-week program flowchart"

AI response shows:
┌─────────────────────────────┐
│ Here's your program:        │
│                             │
│ ┌─────────────────────────┐ │
│ │   [Mermaid Diagram]     │ │ ← Rendered diagram
│ │                         │ │
│ │ Weeks 1-4: Hypertrophy  │ │
│ │     ↓                   │ │
│ │ Weeks 5-8: Strength     │ │
│ │     ↓                   │ │
│ │ Weeks 9-12: Peak        │ │
│ └─────────────────────────┘ │
│                             │
│ [View Code] [Save]          │
└─────────────────────────────┘
```

Tap "View Code" → show raw mermaid syntax in code block

### Grounding Indicators

Show which knowledge was retrieved:
```
┌─────────────────────────────┐
│ Based on:                   │
│ 📄 plateau-recovery.md      │ ← Tappable to view source
│ 📄 volume-landmarks.md      │
└─────────────────────────────┘
```

### Loading States

```
┌─────────────────────────────┐
│ 💭 Thinking...              │ ← Animated dots
│    ⋯                        │
└─────────────────────────────┘
```

With streaming (if supported):
```
┌─────────────────────────────┐
│ A plateau after 3 weeks_    │ ← Cursor shows it's typing
└─────────────────────────────┘
```

---

## 7. Phase 4: Collaboration (Share/Compare)

### Friends Tab

**Empty State**:
```
┌─────────────────────────────┐
│ 👥 Friends                  │
├─────────────────────────────┤
│                             │
│      👋                     │
│   Track with Friends        │
│                             │
│ Share workouts and compare  │
│ progress with your gym      │
│ buddies.                    │
│                             │
│  [Import Workout]           │
└─────────────────────────────┘
```

### Export Flow

From workout detail screen:
```
Tap "Share" →

┌─────────────────────────────┐
│ Export Workout              │
│                             │
│ ☑ Include notes             │
│ ☐ Include volume stats      │
│                             │
│ Format: Markdown            │
│                             │
│ [Share via...]              │ ← System share sheet
└─────────────────────────────┘
```

### Import Flow

```
Receive file → Open with GymTune →

┌─────────────────────────────┐
│ Import from Friend          │
│                             │
│ Aug 8 • Strength            │
│ Bench, Squat, Deadlift      │
│                             │
│ From: @friend_name          │
│                             │
│ [Import] [Cancel]           │
└─────────────────────────────┘
```

### Compare View

```
┌─────────────────────────────┐
│ You vs Friend               │
├─────────────────────────────┤
│ Bench Press Volume          │
│ ┌─────────────────────────┐ │
│ │  📊 Dual Line Chart     │ │ ← Two colors
│ │   (You: Blue)           │ │
│ │   (Friend: Green)       │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Stats Comparison            │
│ ┌───────┬────────┐         │
│ │ You   │ Friend │         │
│ ├───────┼────────┤         │
│ │ 52    │ 48     │ Workouts│
│ │ 185   │ 195    │ Bench PR│
│ └───────┴────────┘         │
└─────────────────────────────┘
```

---

## 8. Phase 5: Polish

### Onboarding Refinement

Add interactive tutorial:
```
[Screen 1]
Swipe right → "This is your workout history"
[Highlight workout card]

[Screen 2]
Tap this button → "Log a new workout"
[Highlight + button]

[Skip Tutorial]
```

### Dark Mode

**Auto-detect system preference**

Light vs Dark:
```
Light:                     Dark:
Background: #FFFFFF        Background: #000000
Surface:    #F5F5F5        Surface:    #1C1C1E
Text:       #000000        Text:       #FFFFFF
```

Manual toggle in Settings:
```
Theme: ○ Light  ● Dark  ○ Auto
```

### Empty States

**No workouts yet**:
```
┌─────────────────────────────┐
│     [Illustration]          │ ← Simple line art
│   🏋️ No workouts yet        │
│                             │
│ Tap "Log Workout" to        │
│ get started!                │
└─────────────────────────────┘
```

**No internet + AI**:
```
┌─────────────────────────────┐
│     📡                      │
│   Offline Mode              │
│                             │
│ AI Coach needs internet.    │
│ Manual logging still works! │
└─────────────────────────────┘
```

### Loading States

Use skeleton screens instead of spinners:
```
┌─────────────────────────────┐
│ ████████                    │ ← Shimmering gray boxes
│ ████  ██████                │
│                             │
│ ████████████                │
│ ████████  ██                │
└─────────────────────────────┘
```

### Micro-Animations

- Button press: Scale down 95% on touch
- Card tap: Subtle fade + scale
- Success: Checkmark with spring animation
- Delete: Swipe to reveal red background
- Add exercise: Slide in from bottom

### Haptics

- Button tap: Light impact
- Success: Success notification
- Error: Error notification
- Swipe actions: Selection changed

---

## 9. Accessibility

### Touch Targets

- Minimum: 44x44pt (iOS HIG)
- Preferred: 48x48dp (Material Design)
- Spacing between tappable elements: 8pt

### Color Contrast

WCAG AA compliance:
- Text: 4.5:1 ratio
- Large text: 3:1 ratio
- UI components: 3:1 ratio

Test with:
- Protanopia (red-blind)
- Deuteranopia (green-blind)
- Don't rely on color alone (use icons + text)

### Screen Reader

VoiceOver (iOS) / TalkBack (Android):
- Label all buttons: "Log workout button"
- Describe images: "Workout type: Strength"
- Group related elements
- Announce state changes: "Workout saved"

### Dynamic Type

Support iOS/Android font scaling:
- Test at 200% size
- Layouts should reflow, not truncate

---

## 10. Component Library

### Reusable Components

**WorkoutCard**:
```typescript
<WorkoutCard 
  date="2026-08-08"
  type="strength"
  exercises={["Bench", "Squat"]}
  duration={45}
  onPress={() => navigate}
  onDelete={() => delete}
/>
```

**ExerciseRow**:
```typescript
<ExerciseRow
  name="Bench Press"
  sets={[{weight: 135, reps: 10}]}
  expandable={true}
/>
```

**StatCard**:
```typescript
<StatCard
  value="52"
  label="Total Workouts"
  color="primary"
/>
```

**ChatBubble**:
```typescript
<ChatBubble
  role="user" | "assistant"
  content="..."
  timestamp="2026-08-08T14:30"
  actions={[{label: "Copy", onPress}]}
/>
```

**ChartContainer**:
```typescript
<ChartContainer
  title="Workout Frequency"
  data={chartData}
  type="line" | "bar"
  interactive={true}
/>
```

---

## 11. Implementation Priorities

### Must-Have (Phases 0-3)

1. **Phase 0 Polish**:
   - Workout detail screen
   - Swipe to delete
   - Exercise PR tracking
   - Equipment setup screen

2. **Phase 1**:
   - Natural language input with preview
   - Parse error handling
   - Example chips

3. **Phase 2**:
   - Onboarding flow (3 screens)
   - Model download with progress
   - Settings: Model management

4. **Phase 3**:
   - Chat UI with markdown rendering
   - Suggested prompts
   - Grounding indicators
   - Mermaid diagram display

### Should-Have (Phases 4-5)

5. **Phase 4**:
   - Export flow
   - Import flow
   - Compare charts

6. **Phase 5**:
   - Dark mode
   - Interactive tutorial
   - Micro-animations
   - Empty states
   - Skeleton screens

### Nice-to-Have (Post-v1)

- Tablet layouts
- Landscape mode
- Widgets (iOS/Android)
- Apple Watch companion
- Export to PDF/CSV
- Custom chart types
- Social challenges

---

## 12. Portfolio Showcase

### Screenshots to Capture

1. **Home screen** with workouts
2. **Logging flow** (3 steps in sequence)
3. **Progress dashboard** with charts
4. **Chat interface** with AI response
5. **Mermaid diagram** rendering
6. **Dark mode** comparison
7. **Onboarding** screens

### Demo Flow (2 minutes)

1. Open app → Quick onboarding (10s)
2. Log workout with natural language (20s)
3. View progress charts (15s)
4. Ask AI coach a question (30s)
5. Show mermaid diagram generation (20s)
6. Export and share workout (15s)
7. Dark mode toggle (10s)

### App Store Assets

- **Icon**: Dumbbell + chart motif
- **Screenshots**: 6-8 screens showing key features
- **Preview video**: 30-second demo
- **Description**: Emphasize local-first, free, AI-powered

---

## 13. Next Steps

### Week 1 (Phase 0 Polish)
- [ ] Create workout detail screen
- [ ] Add swipe-to-delete on workout cards
- [ ] Implement equipment setup screen
- [ ] Add PR tracking to progress screen

### Week 2 (Phase 1)
- [ ] Build natural language input component
- [ ] Implement parse preview before save
- [ ] Add error handling UI
- [ ] Create example chips

### Week 3-4 (Phase 2-3)
- [ ] Design onboarding screens
- [ ] Build model download progress UI
- [ ] Create chat interface
- [ ] Implement markdown renderer

### Week 5-6 (Phase 4-5)
- [ ] Build share/import flows
- [ ] Implement dark mode
- [ ] Add micro-animations
- [ ] Polish empty/loading states

---

## Summary

**Design Philosophy**: Simple, fast, delightful  
**Color Scheme**: Blue (primary), Green (success), Clean neutrals  
**Navigation**: Bottom tabs (5 tabs, progressive reveal)  
**Key Screens**: 8 primary screens across 5 phases  
**Accessibility**: WCAG AA compliant, VoiceOver support  
**Portfolio Ready**: Professional polish, demo-able in 2 minutes

**Status**: Ready for implementation alongside SLM research findings.
