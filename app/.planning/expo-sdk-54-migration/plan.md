# Expo SDK 51 → 54 Migration Plan — GymTune

_Target app: `/mnt/c/Users/kamat/gym-tune/app` (slug `gym-tune`, name `GymTune`)_
_Plan authored: 2026-08-08. Sources cited inline; version facts from Expo `bundledNativeModules.json@sdk-54`, the SDK 52/53/54 changelogs, and per-library npm/GitHub._

> This is a **plan only**. No files are changed by this document. An implementer executes the phases in order and verifies at each checkpoint before proceeding.

---

## 0. Executive summary

GymTune is a tiny managed Expo Router app: three route files (`app/index.tsx`, `app/progress.tsx`, `app/_layout.tsx`) and two lib files (`lib/storage.ts`, `lib/types.ts`). It runs the Expo Go / managed workflow with **no** `eas.json`, `babel.config.js`, `metro.config.js`, or `app.config.js`, and **no** custom native code. That makes this a low-to-moderate migration dominated by one real code change.

The single required code change is **`expo-file-system`**: SDK 54 promotes the new object-oriented API to the default and moves the legacy functions the app uses to `expo-file-system/legacy`. Everything else is version bumps and validation.

Three declared dependencies are **never imported** in the source (`react-native-fs`, `react-native-paper`, `date-fns`). Removing them, especially `react-native-fs` (unmaintained, no New Architecture support, breaks Expo Go), eliminates the largest compatibility risk for free.

**Complexity: Low-Moderate.** Estimated effort: **0.5–1.5 days** including device testing. The New Architecture (default in SDK 54) and Android edge-to-edge (always on in SDK 54) are the two behavioral risks to validate on a real device.

---

## 1. Current-state inventory

### 1.1 Files that define configuration

| File | Present | Notes |
|---|---|---|
| `package.json` | yes | `main: expo-router/entry`; scripts are `start`/`android`/`ios`/`web` only; `packageManager: yarn@1.22.22`. A `package-lock.json` (npm) also exists alongside the yarn declaration — lockfile ambiguity, see §7. |
| `app.json` | yes | `plugins: ["expo-router"]`, `scheme: gymtune`, `splash` field present, no `statusBar` field, no `newArchEnabled` field. |
| `tsconfig.json` | yes | `extends: expo/tsconfig.base`, `strict: true`, path alias `@/* -> ./*`. |
| `eas.json` | **no** | Not on EAS Build; local/Expo Go workflow. |
| `babel.config.js` | **no** | Uses default `babel-preset-expo` implicitly. |
| `metro.config.js` | **no** | Uses default Metro config. |
| `app.config.js` / `.ts` | **no** | Static `app.json` only. |

### 1.2 Dependencies as declared (`package.json`, SDK 51)

| Package | Declared | Imported in source? |
|---|---|---|
| `expo` | `~51.0.0` | (framework) |
| `expo-router` | `~3.5.0` | yes (`_layout.tsx`, `index.tsx`) |
| `react` | `18.2.0` | yes |
| `react-native` | `0.74.0` | yes |
| `expo-file-system` | `~17.0.0` | **yes — `lib/storage.ts`** |
| `@react-native-async-storage/async-storage` | `^1.21.0` | yes (`lib/storage.ts`) |
| `react-native-chart-kit` | `^6.12.0` | yes (`app/progress.tsx`, `LineChart`) |
| `react-native-svg` | `^15.0.0` | only transitively (chart-kit peer) |
| `yaml` | `^2.4.0` | yes (`lib/storage.ts`) |
| `react-native-fs` | `^2.20.0` | **no — unused** |
| `react-native-paper` | `^5.12.0` | **no — unused** |
| `date-fns` | `^3.0.0` | **no — unused** |
| `@babel/core` (dev) | `^7.24.0` | build |
| `@types/react` (dev) | `~18.2.0` | build |
| `typescript` (dev) | `^5.3.0` | build |

### 1.3 Actual API surface used (drives the code work)

- `lib/storage.ts`: `FileSystem.documentDirectory`, `getInfoAsync`, `makeDirectoryAsync({intermediates:true})`, `writeAsStringAsync`, `readAsStringAsync`, `readDirectoryAsync`, `deleteAsync`; `AsyncStorage` get/set; `YAML` parse/stringify. (See §5.1 for the exact call sites.)
- `app/_layout.tsx`: `Stack`, `Stack.Screen` from `expo-router` (standard, no v6 breakage).
- `app/index.tsx`: `useRouter` from `expo-router`; `react-native` primitives + `Alert`.
- `app/progress.tsx`: `LineChart` from `react-native-chart-kit`; `Dimensions` from `react-native`.

> Note: `_layout.tsx` registers a `workout/[id]` screen, but no `app/workout/[id].tsx` route file exists in the tree. Pre-existing, unrelated to the migration; do not "fix" it as part of this work.

---

## 2. Target versions for SDK 54

Resolve everything with `npx expo install --fix`, which reads `bundledNativeModules.json`. Exact SDK 54 targets:

| Package | Current | SDK 54 target | Source |
|---|---|---|---|
| `expo` | `~51.0.0` | `~54.0.0` (installs `54.0.x`) | expo/expo@sdk-54 template + changelog |
| `expo-router` | `~3.5.0` | `~6.0.24` | bundledNativeModules@sdk-54 |
| `react` | `18.2.0` | `19.1.0` | changelog + bundledNativeModules |
| `react-dom` | (n/a) | `19.1.0` | bundledNativeModules |
| `react-native` | `0.74.0` | `0.81.5` (advertised 0.81) | changelog + bundledNativeModules |
| `expo-file-system` | `~17.0.0` | `~19.0.23` | bundledNativeModules |
| `@react-native-async-storage/async-storage` | `^1.21.0` | `2.2.0` | bundledNativeModules (3.x is NOT compatible) |
| `react-native-svg` | `^15.0.0` | `15.12.1` (Expo pin) | bundledNativeModules |
| `react-native-chart-kit` | `^6.12.0` | `7.0.2` (revived fork; peers `react >=19.1`, `rn >=0.81`, `svg >=15.12.1`) | npm / GitHub `chart-kit/react-native-chart-kit` |
| `react-native-safe-area-context` | (via router) | `~5.6.0` | bundledNativeModules (needed for edge-to-edge insets, see §4/§5) |
| `expo-status-bar` | (via expo) | `~3.0.9` | bundledNativeModules |
| `yaml` | `^2.4.0` | keep (`^2.4.0`, latest `2.9.0`) — pure JS, no RN pin | npm |
| `@types/react` (dev) | `~18.2.0` | `~19.1.0` | template |
| `typescript` (dev) | `^5.3.0` | `~5.9.2` | changelog + template |
| `@babel/core` (dev) | `^7.24.0` | `^7.26.0` | babel-preset-expo@sdk-54 |
| `react-native-fs` | `^2.20.0` | **REMOVE** (unused, unmaintained, no New Arch, breaks Expo Go) | Expo new-arch guide, npm |
| `react-native-paper` | `^5.12.0` | **REMOVE** (unused) — or bump to `5.15.3` if you plan to use it | npm |
| `date-fns` | `^3.0.0` | **REMOVE** (unused) — or keep `^3` / bump `^4` if you plan to use it | npm |

`react` progression across the jump: `18.2.0` (51) → `18.3.1` (52) → `19.0.0` (53) → `19.1.0` (54).
`react-native`: `0.74.5` (51) → `0.76.9` (52) → `0.79.6` (53) → `0.81.5` (54).
`expo-router`: `~3.5` (51) → `~4.0` (52) → `~5.1` (53) → `~6.0` (54).

---

## 3. Breaking changes that affect THIS app

Grouped by area, filtered to what this codebase actually touches. Non-applicable items (expo-av, expo-camera, reanimated, expo-notifications, postcss/autoprefixer, monorepo autolinking, etc.) are intentionally omitted because the app does not use them.

### 3.1 CRITICAL — `expo-file-system` API move (SDK 54)
The new object-oriented API (`File`, `Directory`, `Paths`) is now the default export of `expo-file-system`. The legacy functions this app uses moved to **`expo-file-system/legacy`**. Affected calls, all in `lib/storage.ts`: `documentDirectory`, `getInfoAsync`, `makeDirectoryAsync`, `writeAsStringAsync`, `readAsStringAsync`, `readDirectoryAsync`, `deleteAsync`. Legacy is planned for removal in **SDK 55**. See §5.1 for both migration options.
_Source: expo.dev/changelog/sdk-54, docs.expo.dev/versions/v54.0.0/sdk/filesystem, .../filesystem-legacy._

### 3.2 HIGH — New Architecture is default (SDK 53) and legacy-arch removal looms (SDK 54)
New Architecture (Fabric/TurboModules, bridgeless) became the default in SDK 53 and stays default in SDK 54. SDK 54 is the **last** release that lets you opt out (`newArchEnabled: false`). All the app's runtime native deps support New Arch: `react-native-svg` (Fabric since v13), `async-storage` 2.x (TurboModule), `expo-file-system` (built for New Arch). `react-native-chart-kit` is pure JS over svg, so it inherits svg's support. **Recommendation: adopt New Arch (do not opt out)** and validate on device.
_Source: expo.dev/changelog/sdk-53, sdk-54, docs.expo.dev/guides/new-architecture._

### 3.3 HIGH — Android edge-to-edge always on (SDK 54)
SDK 54 forces Android edge-to-edge; it can no longer be disabled, and `targetSdk`/`compileSdk` move to 36. App content can render under the status bar and navigation bar. The app uses plain `View`/`ScrollView`/`FlatList` with no safe-area handling. **Action: add `react-native-safe-area-context` insets** (see §5.3) and verify no clipped UI.
_Source: expo.dev/changelog/sdk-54, sdk-53, expo.dev/blog/edge-to-edge-display-now-streamlined-for-android._

### 3.4 MEDIUM — React 18 → 19
React 19 removes `propTypes` and legacy string refs, requires the new JSX transform, tightens ref-callback return types and effect timing. The app uses function components with hooks only; a scan for `propTypes`, class components, string refs, and `ReactDOM` legacy APIs is expected to come back clean. The realistic exposure is type errors from `@types/react` 19 in strict mode. **Action: bump `@types/react`/`typescript` together and run `tsc`.**
_Source: react.dev/blog/2024/04/25/react-19-upgrade-guide._

### 3.5 MEDIUM — `react-native-chart-kit` on the abandoned line
Declared `^6.12.0` is the abandoned `indiespirit` package; it emits `ERESOLVE`/`EBADENGINE` against React 19 / RN 0.81 / svg 15. The revived `chart-kit/react-native-chart-kit@7.0.2` declares peers `react >=19.1`, `react-native >=0.81`, `react-native-svg >=15.12.1`. The `import { LineChart } from 'react-native-chart-kit'` call still resolves in 7.x. **Action: upgrade to 7.0.2 and smoke-test the progress chart.**
_Source: npm + raw package.json of chart-kit/react-native-chart-kit._

### 3.6 LOW — `expo-router` v3 → v6
No breaking change to the `Stack` / `Stack.Screen` API this app uses. v4 changed `router.navigate()` semantics (now always pushes) and removed `Href<T>` generics — the app uses neither (`useRouter().push` with plain string paths only, to verify). Typed routes remain opt-in. **Action: none expected beyond navigation smoke test.**
_Source: expo.dev/changelog sdk-52/53/54, reactnavigation.org v7 notes._

### 3.7 LOW — `@react-native-async-storage/async-storage` 1.x → 2.2.0
Major bump to a TurboModule; API is unchanged for the get/set usage here. Do **not** jump to 3.x (incompatible with SDK 54). `npx expo install` pins 2.2.0.
_Source: bundledNativeModules@sdk-54, expo/expo#43757._

### 3.8 LOW — `app.json` schema tightened (SDK 54)
SDK 54 rejects a root/android `statusBar` key and deprecates `notification`. The app's `app.json` has **neither**, so no change is required. `splash` still works (Android now uses the Android-12 splash API; full-bleed splash images are not supported, but the current icon-style splash is fine). Optionally migrate `splash` to the `expo-splash-screen` config plugin later; not required for SDK 54.
_Source: expo.dev/changelog sdk-52/54._

### 3.9 LOW — Tooling minimums
Node `>=20.19.4` (Node 18 is EOL), Xcode `>=16.1` for iOS builds, TypeScript `~5.9.2`, Metro 0.83. No `metro.config.js`/`babel.config.js` in the repo, so the SDK 54 defaults (`experimentalImportSupport` on, lightningcss, class-static-block plugin) apply automatically with nothing to migrate.
_Source: expo.dev/changelog/sdk-54._

### 3.10 REMOVE — `react-native-fs`
Unmaintained (last release 2022, tested only up to RN 0.68), no New Architecture support, a bare native module that requires prebuild/dev-client and breaks Expo Go. It is **not imported anywhere** in the source. Expo's new-architecture guide explicitly says to replace it with `expo-file-system`. **Delete it from `package.json`.**
_Source: npm, github.com/itinance/react-native-fs#1263, docs.expo.dev/guides/new-architecture._

---

## 4. Config file changes

| File | Change | Required? |
|---|---|---|
| `package.json` | Bump versions per §2; remove `react-native-fs` (and unused `react-native-paper`, `date-fns` unless you plan to use them). Resolve the lockfile question (§7) — pick yarn **or** npm, delete the other lockfile. | Yes |
| `app.json` | No structural change required. Optionally add `"newArchEnabled": true` under `expo` to be explicit (it is the default). Optionally set `"android": { "predictiveBackGestureEnabled": false }` (default). Do **not** add a `statusBar` key. | Optional |
| `tsconfig.json` | No change. `expo/tsconfig.base` is versioned with the SDK; keep `strict: true`. | No |
| `babel.config.js` | Do **not** create one. The default preset handles SDK 54. | No |
| `metro.config.js` | Do **not** create one unless a package-exports issue appears; then add `unstable_enablePackageExports`/`experimentalImportSupport` opt-outs as a temporary fallback only. | No (fallback) |
| `eas.json` | Out of scope (app is not on EAS Build). If a dev client is ever needed for device testing, that is a separate task. | No |

---

## 5. Code changes / API migrations

### 5.1 `lib/storage.ts` — file-system migration (the only mandatory code change)

Exact current call sites: `documentDirectory` (line 6), `getInfoAsync` + `makeDirectoryAsync` (lines 13–15), `writeAsStringAsync` (line 96), `readDirectoryAsync` (lines 104, 119, 139), `readAsStringAsync` (lines 110, 125), `deleteAsync` (line 143).

**Option A — quick, low-risk (recommended for this migration).** Change the import only; all logic stays identical:
```ts
// before
import * as FileSystem from 'expo-file-system';
// after
import * as FileSystem from 'expo-file-system/legacy';
```
Zero other edits. Works today; legacy is scheduled for removal in SDK 55, so treat it as a bridge.

**Option B — durable, new object API.** Rewrite to `File`/`Directory`/`Paths`. Mapping:
```ts
import { File, Directory, Paths } from 'expo-file-system';

const workoutsDir = new Directory(Paths.document, 'workouts');

// init(): getInfoAsync(...).exists + makeDirectoryAsync({intermediates:true})
if (!workoutsDir.exists) workoutsDir.create({ intermediates: true });

// save(): writeAsStringAsync(filepath, markdown)
const f = new File(workoutsDir, filename);
f.create({ overwrite: true });
f.write(markdown);

// readDirectoryAsync(dir)  ->  directory.list() returns (File|Directory)[]
const entries = workoutsDir.list();                 // objects, not strings
const names = entries.map(e => e.name);             // where code used string names

// readAsStringAsync(filepath)  ->  file.text()
const content = new File(workoutsDir, name).text();

// deleteAsync(filepath)  ->  file.delete()
new File(workoutsDir, name).delete();
```
Note that `directory.list()` returns objects, so the string-based `files.find(...)`, `files.filter(f => f.endsWith('.md'))`, and `file.split('_')` logic must operate on `.name`. Choose Option A for the SDK 54 cutover, then schedule Option B before SDK 55.

**Recommendation:** Ship Option A in this migration. It is a one-line change with no behavioral risk. File Option B as a follow-up ticket tied to the SDK 55 upgrade.

### 5.2 `app/progress.tsx` — chart library
No source edit needed if upgrading to `react-native-chart-kit@7.0.2` (the `LineChart` import path is preserved). Smoke-test the rendered chart and any `onDataPointClick`/press behavior (svg press had a transient SDK 54 regression, since fixed upstream).

### 5.3 Safe-area insets (Android edge-to-edge)
Recommended, because edge-to-edge is forced on Android in SDK 54. `react-native-safe-area-context` is already available (expo-router depends on it). Two acceptable approaches:
- Minimal: wrap screen roots in `SafeAreaView` from `react-native-safe-area-context` (not the deprecated RN one), or apply `useSafeAreaInsets()` padding to the top-level `View` in `index.tsx` and `progress.tsx`.
- Or verify the default header/insets already keep content clear and make no change.

Decide after the first device run in Phase 4; do not pre-apply blindly.

### 5.4 React 19 scan
Grep the source for `propTypes`, `defaultProps` on function components, class components, string refs, and legacy `ReactDOM` calls. Expectation: none present (the app is function components + hooks). Fix only what `tsc` flags under `@types/react` 19.

---

## 6. Step-by-step execution order (with verification checkpoints)

Because the app is tiny and every runtime dependency is SDK-54-ready, the primary path is a **single direct jump** with `--fix`. An incremental 51→52→53→54 path is the documented fallback if the direct jump produces resolver conflicts.

Assign the whole migration to **one implementer** (`task` agent). It is sequential; there is nothing to parallelize.

### Phase 0 — Baseline and safety
1. Confirm Node `>=20.19.4` (`node -v`). Upgrade the toolchain if lower.
2. Commit or stash all work; create a branch `expo-sdk-54-migration`. Record current `npx expo-doctor` output as a baseline.
3. **Decide the package manager** (yarn per `packageManager`, or npm per the existing `package-lock.json`) and delete the other lockfile so `--fix` writes one consistent lock.
- **Checkpoint 0:** clean git status on a fresh branch; `node -v` OK; one lockfile only.

### Phase 1 — Remove dead dependencies
4. Remove `react-native-fs` from `package.json` (unused, incompatible). Remove `react-native-paper` and `date-fns` too unless a near-term use is planned.
5. Reinstall; run the app on SDK 51 once to confirm removal changed nothing.
- **Checkpoint 1:** app still starts on SDK 51 (`expo start`), home + progress screens render.

### Phase 2 — Bump the SDK
6. Run `npx expo install expo@^54.0.0 --fix`. This upgrades `expo`, `react`, `react-native`, `expo-router`, `expo-file-system`, `react-native-svg`, `async-storage`, and dev types/TS to the SDK 54 pins from §2.
7. Manually upgrade `react-native-chart-kit` to `7.0.2` (not managed by `expo install`): `<pm> add react-native-chart-kit@7.0.2`.
8. Ensure `react-native-safe-area-context` is at `~5.6.0` (`npx expo install react-native-safe-area-context`).
9. Run `npx expo install --check` / `npx expo-doctor@latest` and resolve every reported version mismatch. Add `overrides`/`resolutions` only if a peer pins React 18 and cannot be satisfied otherwise.
- **Checkpoint 2:** `expo-doctor` passes; `package.json` matches §2; lockfile regenerated with no `ERESOLVE`.

### Phase 3 — Code migration
10. Apply the `expo-file-system` change in `lib/storage.ts` (Option A: import from `expo-file-system/legacy`).
11. Run `npx tsc --noEmit` (TypeScript `~5.9.2`, `@types/react` `~19.1.0`). Fix type errors from the React 19 types.
12. React 19 scan (§5.4); fix anything found.
- **Checkpoint 3:** `tsc --noEmit` is clean; no lint/type regressions.

### Phase 4 — Run and validate on device/simulator
13. `npx expo start -c` (clear Metro cache). Launch in Expo Go (SDK 54 build) or a dev client on **both** iOS and Android.
14. Exercise the real flows:
- Home screen: create/edit a workout, save (writes a `.md` via file system), navigate.
- Load all workouts (list renders, sorted).
- Delete a workout (file removed).
- Equipment profile save/load (AsyncStorage 2.x).
- Progress screen: `LineChart` renders with real data.
- Navigation between all screens via `expo-router`.
15. **Android edge-to-edge check:** confirm no content is hidden under the status/nav bars; apply §5.3 insets if clipped, then re-run.
16. **New Architecture check:** confirm the app runs under New Arch (default). If any native lib misbehaves, first update it, and only as a last resort set `newArchEnabled: false` in `app.json` (remember SDK 54 is the final release allowing this).
- **Checkpoint 4:** every flow above works on iOS and Android; file read/write/delete verified; chart renders; no insets clipping.

### Phase 5 — Cleanup and close
17. Remove any temporary `overrides`/`resolutions` or metro opt-outs that turned out unnecessary.
18. Update `README.md` if it references the SDK version.
19. Commit. File the follow-up ticket for `expo-file-system` Option B (new API) ahead of SDK 55.
- **Checkpoint 5:** clean tree, `expo-doctor` green, single commit/PR ready.

---

## 7. Risks and rollback

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Lockfile ambiguity (`yarn` declared but `package-lock.json` present) causes inconsistent installs | High | Medium | Phase 0 step 3: pick one PM, delete the other lockfile before `--fix`. |
| Android edge-to-edge clips UI (no safe-area handling today) | Medium | Medium | §5.3 insets; validated at Checkpoint 4. |
| New Architecture surfaces a native-lib bug (svg/chart-kit press, async-storage) | Low–Medium | Medium | All deps are New-Arch-ready; update to §2 pins; last-resort `newArchEnabled:false` (SDK 54 only). |
| `react-native-chart-kit` peer/resolver conflict on 6.x | Medium | Low | Upgrade to `7.0.2` (Phase 2 step 7); it declares RN 0.81 / React 19 / svg 15 peers. |
| React 19 type errors under `strict` | Medium | Low | Bump `@types/react`+`typescript` together; fix at Checkpoint 3. |
| `expo-file-system` legacy removed in SDK 55 leaves Option A as debt | Certain (future) | Low | Follow-up ticket for Option B rewrite. |
| Direct 51→54 jump hits a resolver wall | Low | Medium | Fallback: incremental `expo install expo@^52 --fix` → 53 → 54, running `expo-doctor` at each hop (Expo's documented path). |

**Rollback:** all work is on a branch with a single lockfile. To revert, `git checkout main` / delete the branch and `<pm> install` to restore the SDK 51 lock. No native project directories (`ios/`, `android/`) exist to clean up because the app is fully managed. Keep the pre-migration `expo-doctor` baseline (Phase 0) for comparison.

---

## 8. Effort / complexity estimate

| Phase | Effort |
|---|---|
| 0 Baseline + lockfile decision | 0.5–1 h |
| 1 Remove dead deps | 0.25 h |
| 2 SDK bump + doctor | 1–2 h |
| 3 Code migration (file-system one-liner + tsc) | 0.5–1 h |
| 4 Device validation (iOS + Android, edge-to-edge, New Arch) | 2–4 h |
| 5 Cleanup + PR | 0.5 h |
| **Total** | **~0.5–1.5 days** |

**Complexity: Low–Moderate.** One mandatory code change, three dead deps to drop, and a straightforward version bump. The time sink is device validation of New Architecture and Android edge-to-edge, not code.

---

## Appendix A — Primary sources
- Expo SDK 54 changelog: https://expo.dev/changelog/sdk-54
- Expo SDK 53 changelog: https://expo.dev/changelog/sdk-53
- Expo SDK 52 changelog: https://expo.dev/changelog/2024-11-12-sdk-52
- Upgrade walkthrough: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/
- New Architecture guide: https://docs.expo.dev/guides/new-architecture/
- `bundledNativeModules.json@sdk-54`: https://github.com/expo/expo/blob/sdk-54/packages/expo/bundledNativeModules.json
- expo-file-system (new) docs: https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/
- expo-file-system legacy docs: https://docs.expo.dev/versions/v54.0.0/sdk/filesystem-legacy/
- React 19 upgrade guide: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- RN 0.81 blog: https://reactnative.dev/blog/2025/08/12/react-native-0.81
- react-native-chart-kit (revived): https://github.com/chart-kit/react-native-chart-kit
- react-native-fs status: https://github.com/itinance/react-native-fs/issues/1263
