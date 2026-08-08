# GymTune File Structure & Storage Analysis

## Storage Breakdown

### On-Device Storage Requirements

```
Total App Size Breakdown:
├── App Bundle (iOS/Android)
│   ├── React Native runtime:        ~15-20 MB
│   ├── llama.rn native libs:        ~8-12 MB
│   ├── UI assets & fonts:           ~2-3 MB
│   ├── Knowledge vault (embedded):  ~5-8 MB
│   └── App code (JS bundles):       ~3-5 MB
│   SUBTOTAL:                        ~35-50 MB
│
├── Downloaded on First Launch
│   └── Gemma 1B Q4_K_M model:       ~720 MB
│
└── User Data (grows over time)
    ├── Workouts (markdown):         ~5 KB per workout
    ├── Cached embeddings:           ~50-100 KB
    └── AsyncStorage (preferences):  ~10 KB
    TOTAL USER DATA (100 workouts):  ~500 KB
```

**Key Insight**: Workouts are TINY. 100 workouts = ~500 KB (less than one photo).

---

## Markdown Storage: Not a Bloat Concern

### Single Workout Example (~500 bytes)

A typical workout file like `2026-08-08_1723123456.md`:
- YAML frontmatter: ~100 bytes
- Exercise data (3-5 exercises): ~300 bytes
- Notes: ~100 bytes
- **Total: ~500-600 bytes per workout**

### Storage Over Time

| Timeframe | Workouts | Total Size | Equivalent |
|-----------|----------|------------|------------|
| 1 month | 12 | ~6 KB | One text message |
| 1 year | 150 | ~75 KB | One low-res photo |
| 5 years | 750 | ~375 KB | Still less than 1 MB |

**Conclusion**: Even 10 years of daily workouts = ~2 MB. Bloat is not a concern.

---

## Directory Structure

### On Mobile Device

```
Documents/gymtune/
├── workouts/                          # User's workout logs
│   ├── 2026-08-08_1723123456.md      # ~500 bytes each
│   ├── 2026-08-07_1723037056.md
│   └── ...
│
├── models/                            # LLM models (downloaded)
│   └── gemma-1b-q4_k_m.gguf          # 720 MB (one-time download)
│
├── cache/                             # Computed data (regeneratable)
│   └── workout-index.json            # Fast lookup cache
│
└── exports/                           # User-initiated backups
    └── 2026-08-backup.zip
```

### In App Bundle

```
app/assets/
├── knowledge/                    # RAG vault (~5-8 MB total)
│   ├── periodization.md
│   ├── volume-landmarks.md
│   ├── plateau-recovery.md
│   ├── exercises/
│   │   ├── bench-press.md
│   │   ├── squat.md
│   │   └── ... (~50 exercises)
│   └── equipment/
│       ├── barbell-only.md
│       └── dumbbells.md
│
└── embeddings.json          # Pre-computed vectors (~5-8 MB)
```

---

## Storage Optimization

### 1. On-Demand Model Download
- App ships at 35-50 MB (no model bundled)
- User downloads 720 MB model on first launch (WiFi recommended)
- App works without model (manual logging + charts)

### 2. Workout Index Caching
```typescript
// Fast launch: read cache instead of parsing all markdown
if (cacheExists && !stale) {
  index = await loadCache();  // Instant
} else {
  index = await parseAllWorkouts();  // ~100ms for 100 workouts
  await saveCache(index);
}
```

### 3. Pre-Computed Embeddings
- Knowledge vault embedded at build time
- Ships as `embeddings.json` (~5-8 MB)
- No on-device embedding needed (fast retrieval)

---

## File Naming

**Current scheme**: `YYYY-MM-DD_timestamp.md`
- Chronological sorting (lexicographic)
- Unique (timestamp collision impossible)
- Human-readable

**Alternative** (if >1,000 workouts): Year/month folders
```
workouts/2026/08/2026-08-08_1723123456.md
```

**Recommendation**: Start flat, migrate only if needed (unlikely).

---

## Model Storage Strategy

### Download Flow
```
First launch:
1. App works immediately (manual logging)
2. Show: "Download AI Coach (720 MB) for smart features?"
3. User on WiFi → download with progress bar
4. Save to: models/gemma-1b-q4_k_m.gguf
5. On complete: Enable chat/coaching features
```

### Resumable Downloads
```typescript
// If download interrupted, resume from last byte
RNFS.downloadFile({
  fromUrl: MODEL_URL,
  toFile: dest,
  resumable: true,  // Continue from where it left off
  progress: (res) => updateProgress(res.bytesWritten / res.contentLength)
});
```

---

## Total Storage Estimate

**Day 1 (no AI)**:
- App: 35-50 MB

**Day 1 (with AI)**:
- App + Model: 755-770 MB

**After 1 year**:
- App + Model: 755 MB
- 150 workouts: 75 KB
- Cache: 50 KB
- **Total: 755.125 MB**

**For perspective**:
- One 4K photo: ~10 MB (130x a year of workouts)
- Spotify (50 songs): ~200 MB
- Netflix (1 movie): ~1-3 GB

---

## Collaboration Storage

### Sharing Workouts
- Export single workout: ~500 bytes
- Export week (7 workouts): ~3-4 KB
- Export all (100 workouts): ~50 KB

### Import from Friend
- Importing 100 workouts adds ~50 KB
- No duplicate check: filename-based uniqueness

---

## Summary

✅ **Not bloat**:
- Workouts: 5 KB per workout
- Knowledge vault: 5-8 MB (one-time)
- Caches: ~50-100 KB

⚠️ **Only large file**:
- Model: 720 MB (Gemma 1B)
- User consents before download
- Comparable to offline maps, music downloads

🎯 **Recommendation**:
- Gemma 1B Q4_K_M (720 MB, 35-45 tok/s)
- Download after first workout (user sees value first)
- Flat file structure (simple, fast)
- Pre-compute embeddings (no on-device work)
