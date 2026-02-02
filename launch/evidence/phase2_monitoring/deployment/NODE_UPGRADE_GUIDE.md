# 🔧 NODE.JS UPGRADE GUIDE - v18 → v20+

**Issue**: Node.js v18 is too old for AccuBooks stack  
**Required**: Node.js v20 or higher  
**Symptoms**: `npm WARN EBADENGINE` errors during `npm install`

---

## 🎯 WHY UPGRADE IS REQUIRED

AccuBooks uses modern dependencies that require Node.js v20+:
- `@types/node: ^20.0.0` - Type definitions for Node.js v20
- Modern Vite, React, and TypeScript tooling
- Latest security patches and performance improvements

**Node.js v18 reached End-of-Life** and is no longer recommended for production.

---

## ✅ UPGRADE INSTRUCTIONS

### Option 1: Using NVM (Recommended)

**For Windows (nvm-windows)**:

```powershell
# Download and install nvm-windows from:
# https://github.com/coreybutler/nvm-windows/releases

# After installation, open NEW PowerShell/CMD window

# Install Node.js v20 LTS
nvm install 20

# Use Node.js v20
nvm use 20

# Verify version
node --version
# Should show: v20.x.x

npm --version
# Should show: 10.x.x or higher
```

**For WSL/Linux/Mac (nvm)**:

```bash
# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc  # or ~/.zshrc for zsh

# Install Node.js v20 LTS
nvm install 20

# Use Node.js v20
nvm use 20

# Set as default
nvm alias default 20

# Verify version
node --version
# Should show: v20.x.x
```

---

### Option 2: Direct Download (Windows)

1. **Uninstall old Node.js**:
   - Go to Settings → Apps → Installed apps
   - Find "Node.js" and uninstall

2. **Download Node.js v20 LTS**:
   - Visit: https://nodejs.org/
   - Download "LTS" version (v20.x.x)
   - Run installer (choose default options)

3. **Verify installation**:
   ```powershell
   node --version
   # Should show: v20.x.x
   ```

---

### Option 3: Using Chocolatey (Windows)

```powershell
# Install Chocolatey if not already installed
# See: https://chocolatey.org/install

# Uninstall old Node.js
choco uninstall nodejs -y

# Install Node.js v20 LTS
choco install nodejs-lts -y

# Verify
node --version
```

---

## 🔄 AFTER UPGRADING NODE.JS

### 1. Clean and Reinstall Dependencies

```bash
# Navigate to AccuBooks root
cd C:\FidiMyProjects2025\Software_Projects\AccuBooks\AccuBooks

# Remove old node_modules and lock files
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install

# Verify no EBADENGINE warnings
# Should complete without engine warnings
```

### 2. Verify Installation

```bash
# Check Node.js version
node --version
# Expected: v20.x.x or higher

# Check npm version
npm --version
# Expected: 10.x.x or higher

# Test backend can start
npm run start:dev
# Should start without engine errors

# Test build works
npm run build
# Should complete successfully
```

---

## 🚨 TROUBLESHOOTING

### "nvm: command not found"

**Windows**: 
- Ensure nvm-windows is installed from official releases
- Restart terminal after installation
- Run as Administrator if needed

**WSL/Linux/Mac**:
- Run: `source ~/.bashrc` or `source ~/.zshrc`
- Restart terminal
- Reinstall nvm if needed

### "npm WARN EBADENGINE" still appears

```bash
# Force reinstall with correct Node version
node --version  # Verify v20+
rm -rf node_modules package-lock.json
npm install --force
```

### Permission errors on Windows

```powershell
# Run PowerShell as Administrator
# Then run nvm/npm commands
```

### npm install fails after upgrade

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules

# Reinstall
npm install
```

---

## 📋 UPDATE DEPLOYMENT SCRIPT

After upgrading Node.js, update the prerequisite check in `deploy_all.sh`:

```bash
# Check Node.js version (should be v20+)
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js v20+ required. Current: v$NODE_VERSION"
    print_info "Upgrade guide: NODE_UPGRADE_GUIDE.md"
    exit 1
fi
```

---

## ✅ VERIFICATION CHECKLIST

After upgrading Node.js:

- [ ] Node.js version is v20.x.x or higher: `node --version`
- [ ] npm version is 10.x.x or higher: `npm --version`
- [ ] Old node_modules removed
- [ ] Dependencies reinstalled: `npm install`
- [ ] No EBADENGINE warnings during install
- [ ] Backend starts successfully: `npm run start:dev`
- [ ] Build completes: `npm run build`
- [ ] Ready to run deployment: `./deploy_all.sh`

---

## 🎯 RECOMMENDED VERSION

**Node.js v20 LTS** (Long Term Support)
- Current LTS version: v20.11.0 or higher
- Supported until April 2026
- Best stability and security
- Full compatibility with AccuBooks

**Download**: https://nodejs.org/

---

## 📞 NEED HELP?

**If upgrade fails**:
1. Check Node.js version: `node --version`
2. Share error messages
3. Verify PATH includes Node.js: `echo $PATH` (Linux/Mac) or `$env:PATH` (Windows)
4. Try clean reinstall of Node.js

**Common issues**:
- Multiple Node.js versions installed → Use nvm to manage
- Old npm cache → Run `npm cache clean --force`
- Permission errors → Run as Administrator (Windows) or use sudo (Linux/Mac)

---

**Once Node.js v20+ is installed, you can proceed with Phase 2 monitoring deployment.**
