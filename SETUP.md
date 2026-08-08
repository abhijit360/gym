# GymTune - Setup Instructions (Linux)

## Quick Start (Automated)

### Run the Setup Script

```bash
# Make scripts executable
chmod +x scripts/setup-repo.sh scripts/create-issues.sh

# Run setup (installs gh CLI if needed, pushes code, creates issues)
./scripts/setup-repo.sh
```

The script will:
1. Install GitHub CLI (if not already installed)
2. Authenticate with GitHub
3. Push all code to GitHub
4. Create 9 issues for the project tracker

---

## Manual Setup

If the automated script doesn't work for your distribution:

### 1. Install GitHub CLI

**Debian/Ubuntu:**
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

**Fedora/RHEL/CentOS:**
```bash
sudo dnf install 'dnf-command(config-manager)'
sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
sudo dnf install gh
```

**Arch Linux:**
```bash
sudo pacman -S github-cli
```

**openSUSE:**
```bash
sudo zypper addrepo https://cli.github.com/packages/rpm/gh-cli.repo
sudo zypper refresh
sudo zypper install gh
```

**Other distributions**: See https://github.com/cli/cli/blob/trunk/docs/install_linux.md

### 2. Authenticate

```bash
gh auth login
```

Follow the prompts:
- Choose: **GitHub.com**
- Protocol: **HTTPS** (or SSH if you prefer)
- Authenticate: **Login with a web browser** (easiest)

### 3. Push Code

```bash
git push -u origin main
```

If this fails with authentication error:

**Option A: Use HTTPS with token**
```bash
# Create token at: https://github.com/settings/tokens
# Select: repo (all), workflow
# Copy the token

# Push (use token as password when prompted)
git push -u origin main
```

**Option B: Use SSH**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub
gh ssh-key add ~/.ssh/id_ed25519.pub

# Update remote to SSH
git remote set-url origin git@github.com:abhijit360/gym.git

# Push
git push -u origin main
```

### 4. Create Issues

```bash
chmod +x scripts/create-issues.sh
./scripts/create-issues.sh
```

Or create manually at: https://github.com/abhijit360/gym/issues
(Copy content from `docs/GITHUB_ISSUES.md`)

---

## Verify Setup

### 1. Check GitHub Repository
```bash
# Open in browser
xdg-open https://github.com/abhijit360/gym
# or
firefox https://github.com/abhijit360/gym
```

Should see:
- ✅ All code pushed
- ✅ README.md displayed
- ✅ 9 issues created

### 2. Check Issues
```bash
# List issues
gh issue list --repo abhijit360/gym

# Should show 9 issues:
# #1 [SETUP] Project Foundation
# #2 [PHASE 0] Foundation
# #3 [PHASE 1] Smart Parsing
# ... etc
```

### 3. Verify Git Status
```bash
git status
# Should show: "branch main" and "up to date with origin/main"
```

---

## Install Development Dependencies

After setup completes, install tools for Phase 0:

### Node.js & npm (for React Native)

**Debian/Ubuntu:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**Fedora:**
```bash
sudo dnf install nodejs npm
```

**Arch:**
```bash
sudo pacman -S nodejs npm
```

### Expo CLI
```bash
npm install -g expo-cli
```

### Android Development (Optional)

If you want to test on Android:

```bash
# Install Android Studio
# Download from: https://developer.android.com/studio
# Or via snap:
sudo snap install android-studio --classic
```

---

## Troubleshooting

### "gh: command not found"
Install GitHub CLI (see step 1 above for your distribution).

### "authentication required"
```bash
gh auth status  # Check if authenticated
gh auth logout  # Logout if wrong account
gh auth login   # Login again
```

### "remote: Permission denied"
Your GitHub account doesn't have push access. Check:
```bash
gh auth status
# Should show: "Logged in to github.com as abhijit360"
```

If wrong account:
```bash
gh auth logout
gh auth login
```

### "failed to push some refs"
```bash
# Pull any remote changes first
git pull origin main --rebase

# Then push
git push -u origin main
```

### SSH connection issues
If using SSH and getting "Permission denied (publickey)":
```bash
# Test SSH connection
ssh -T git@github.com

# If it fails, add key to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Try again
ssh -T git@github.com
```

### Script fails to detect distribution
If the script can't detect your Linux distribution:
```bash
# Check what you're running
cat /etc/os-release

# Install gh manually for your distro
# Then run:
gh auth login
git push -u origin main
./scripts/create-issues.sh
```

---

## WSL (Windows Subsystem for Linux) Notes

If you're using WSL:

1. **GitHub CLI installation** works the same as Ubuntu/Debian
2. **Git credentials**: Use Git Credential Manager:
   ```bash
   git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
   ```
3. **SSH keys**: WSL has its own `~/.ssh` directory, separate from Windows

---

## What's Next?

After successful setup:

1. ✅ All code pushed to GitHub
2. ✅ 9 issues created as project tracker
3. 📖 **Read**: `docs/PROJECT_GUIDE.md` (15-20 minutes)
4. 🏗️ **Start**: Phase 0 - Manual workout logging

### Begin Phase 0

```bash
cd app
npm install
npx expo start
```

Then build:
- Manual workout logging form
- Markdown file storage  
- Workout history list
- Simple frequency chart

**Goal**: Log 5 real workouts this week using your app.

---

## Quick Reference

```bash
# View repository in browser
xdg-open https://github.com/abhijit360/gym

# List issues
gh issue list --repo abhijit360/gym

# View specific issue
gh issue view 2 --repo abhijit360/gym

# Check git status
git status

# View project guide
cat docs/PROJECT_GUIDE.md
# or
xdg-open docs/PROJECT_GUIDE.md
```

---

## System Requirements

- **Linux**: Any modern distribution (Ubuntu 20.04+, Fedora 35+, Arch, etc.)
- **Node.js**: 18.x or higher
- **Git**: 2.30 or higher
- **Storage**: ~2 GB for development dependencies
- **Memory**: 4 GB RAM minimum (8 GB recommended)

---

Need help? Check:
- 📖 `docs/PROJECT_GUIDE.md` - Complete walkthrough
- 🐛 [GitHub Issues](https://github.com/abhijit360/gym/issues) - Report problems
- 📚 [Expo Docs](https://docs.expo.dev/) - React Native questions
