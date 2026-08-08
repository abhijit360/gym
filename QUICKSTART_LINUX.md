# GymTune - Quick Start (Linux)

## One-Command Setup

```bash
./scripts/setup-repo.sh
```

This will:
1. Install GitHub CLI (if needed)
2. Authenticate with GitHub
3. Push all code to https://github.com/abhijit360/gym
4. Create 9 issues for project tracking

---

## What This Script Does

### Step 1: Install GitHub CLI

Detects your Linux distribution and installs `gh` via:
- **Ubuntu/Debian**: `apt`
- **Fedora/RHEL**: `dnf`
- **Arch**: `pacman`

### Step 2: Authenticate

Runs `gh auth login` - follow the prompts:
1. Choose **GitHub.com**
2. Choose **HTTPS** (recommended) or **SSH**
3. Choose **Login with a web browser**
4. Copy the code, open the URL, paste, and authorize

### Step 3: Push Code

Pushes all commits to `origin main`. If it fails:
- Sets up SSH key automatically
- Adds key to GitHub
- Retries push

### Step 4: Create Issues

Creates 9 GitHub issues from `docs/GITHUB_ISSUES.md`:
- #1: Project Setup
- #2: Phase 0 (Manual Logging) ← **Start here**
- #3-7: Phases 1-5
- #8: CI/CD
- #9: Testing

---

## After Setup

### Verify Everything Worked

```bash
# Check repository
xdg-open https://github.com/abhijit360/gym

# List issues
gh issue list --repo abhijit360/gym

# Should show 9 issues
```

### Read the Guide

```bash
# Open in your editor
code docs/PROJECT_GUIDE.md
# or
vim docs/PROJECT_GUIDE.md
# or
cat docs/PROJECT_GUIDE.md
```

### Start Phase 0

```bash
# Install dependencies
cd app
npm install

# Start Expo
npx expo start

# Then scan QR code with Expo Go app (Android/iOS)
# Or press 'a' for Android emulator, 'i' for iOS simulator
```

---

## Troubleshooting

### Script fails?

Run manually:
```bash
# 1. Install gh CLI for your distro
# Ubuntu/Debian:
sudo apt install gh

# 2. Authenticate
gh auth login

# 3. Push code
git push -u origin main

# 4. Create issues
./scripts/create-issues.sh
```

### Need SSH instead of HTTPS?

```bash
# Generate key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub
gh ssh-key add ~/.ssh/id_ed25519.pub

# Update remote
git remote set-url origin git@github.com:abhijit360/gym.git

# Push
git push -u origin main
```

---

## System Info

Check what you're running:
```bash
# Distribution
cat /etc/os-release

# GitHub CLI version
gh --version

# Git version
git --version

# Node version (install if needed)
node --version
npm --version
```

---

## Next Steps

1. ✅ Setup complete
2. 📖 Read `docs/PROJECT_GUIDE.md`
3. 🏗️ Start Phase 0 (Issue #2)
4. 💪 Build your gym tracker!

---

**Quick Links:**
- Repository: https://github.com/abhijit360/gym
- Issues: https://github.com/abhijit360/gym/issues
- Guide: `docs/PROJECT_GUIDE.md`
