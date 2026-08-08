#!/bin/bash
# Setup script for GymTune repository (Linux)

set -e

echo "🏋️ GymTune - Repository Setup (Linux)"
echo "======================================"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI (gh) is not installed."
    echo ""
    echo "Installing GitHub CLI for Linux..."
    echo ""
    
    # Detect Linux distribution
    if [ -f /etc/debian_version ]; then
        echo "Detected Debian/Ubuntu-based system"
        echo "Installing via apt..."
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt update
        sudo apt install gh -y
    elif [ -f /etc/fedora-release ]; then
        echo "Detected Fedora-based system"
        sudo dnf install 'dnf-command(config-manager)'
        sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
        sudo dnf install gh -y
    elif [ -f /etc/arch-release ]; then
        echo "Detected Arch-based system"
        sudo pacman -S github-cli --noconfirm
    else
        echo "❌ Could not detect Linux distribution."
        echo "Please install GitHub CLI manually from: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
        echo ""
        exit 1
    fi
    
    echo ""
    echo "✅ GitHub CLI installed"
    echo ""
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "🔑 Authenticating with GitHub..."
    echo ""
    gh auth login
    echo ""
fi

echo "✅ GitHub CLI is authenticated"
echo ""

# Push code
echo "📤 Pushing code to GitHub..."
if git push -u origin main 2>&1; then
    echo "✅ Code pushed to GitHub"
else
    echo ""
    echo "⚠️  Push failed. Checking remote setup..."
    
    # Check if remote exists
    if ! git remote get-url origin &> /dev/null; then
        echo "Adding GitHub remote..."
        git remote add origin https://github.com/abhijit360/gym.git
    fi
    
    # Try SSH if HTTPS failed
    echo "Trying SSH authentication..."
    git remote set-url origin git@github.com:abhijit360/gym.git
    
    if ! git push -u origin main 2>&1; then
        echo ""
        echo "❌ Still failed. Setting up SSH key..."
        echo ""
        
        # Generate SSH key if needed
        if [ ! -f ~/.ssh/id_ed25519 ]; then
            echo "Generating SSH key..."
            ssh-keygen -t ed25519 -C "$(git config user.email)" -f ~/.ssh/id_ed25519 -N ""
        fi
        
        # Add to GitHub
        echo "Adding SSH key to GitHub..."
        gh ssh-key add ~/.ssh/id_ed25519.pub --title "GymTune Development Key"
        
        # Try again
        echo "Retrying push..."
        git push -u origin main
    fi
fi

echo ""
echo "✅ Code pushed successfully"
echo ""

# Create issues
echo "📋 Creating GitHub issues..."
chmod +x scripts/create-issues.sh
./scripts/create-issues.sh

echo ""
echo "=========================================="
echo "✅ Repository setup complete!"
echo "=========================================="
echo ""
echo "📍 Your repository: https://github.com/abhijit360/gym"
echo "📋 Issues tracker:  https://github.com/abhijit360/gym/issues"
echo ""
echo "Next steps:"
echo "1. View issues at the URL above"
echo "2. Read: docs/PROJECT_GUIDE.md"
echo "3. Start: Issue #2 (Phase 0 - Foundation)"
echo ""
echo "To begin Phase 0:"
echo "  cd app"
echo "  npm install"
echo "  npx expo start"
echo ""
