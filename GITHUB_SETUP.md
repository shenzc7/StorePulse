# GitHub Repository Setup Guide

This guide will help you create a separate GitHub repository for StorePulse and upload all the code.

## Step 1: Create a New GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `StorePulse` (or `storepulse`)
   - **Description**: "Professional desktop application for retail forecasting that predicts store traffic patterns"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 2: Update Git Remote

After creating the repository, GitHub will show you the repository URL. Use one of these commands:

**If you created the repository as `StorePulse`:**
```bash
cd /Users/shenzc/Desktop/projects/StorePulse
git remote set-url origin https://github.com/shenzc7/StorePulse.git
```

**Or if you want to add it as a new remote (keeping the old one):**
```bash
git remote add storepulse https://github.com/shenzc7/StorePulse.git
git remote set-url origin https://github.com/shenzc7/StorePulse.git
```

**For SSH (if you have SSH keys set up):**
```bash
git remote set-url origin git@github.com:shenzc7/StorePulse.git
```

## Step 3: Verify Remote

Check that the remote is set correctly:
```bash
git remote -v
```

You should see:
```
origin  https://github.com/shenzc7/StorePulse.git (fetch)
origin  https://github.com/shenzc7/StorePulse.git (push)
```

## Step 4: Push to GitHub

Push all your code to the new repository:

```bash
# Push the main branch
git push -u origin main

# If your default branch is 'master' instead of 'main':
git push -u origin master

# If you get an error about branch names, rename your branch:
git branch -M main
git push -u origin main
```

## Step 5: Verify Upload

1. Go to your GitHub repository page
2. You should see all your files including:
   - `README.md`
   - `DEVELOPER_SETUP.md`
   - `QUICKSTART.md`
   - `.gitignore`
   - All source code files
   - Documentation in `docs/`

## Troubleshooting

### Error: "remote origin already exists"
If you get this error, remove the old remote first:
```bash
git remote remove origin
git remote add origin https://github.com/shenzc7/StorePulse.git
```

### Error: "failed to push some refs"
If you get this error, you might need to pull first:
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Error: Authentication Required
If GitHub asks for authentication:
1. Use a Personal Access Token instead of password
2. Generate one at: https://github.com/settings/tokens
3. Select scopes: `repo` (full control of private repositories)
4. Use the token as your password when pushing

## What Gets Uploaded

The `.gitignore` file ensures these are **NOT** uploaded:
- ❌ Virtual environments (`api_venv/`, `.venv/`, `venv/`)
- ❌ Node modules (`node_modules/`)
- ❌ Build artifacts (`dist/`, `build/`)
- ❌ Database files (`*.db`)
- ❌ Log files (`*.log`)
- ❌ Python cache (`__pycache__/`, `*.pyc`)
- ❌ IDE files (`.vscode/`, `.idea/`)

These **ARE** uploaded:
- ✅ All source code (`api/`, `src/`, `ml/`)
- ✅ Documentation (`docs/`, `README.md`, `DEVELOPER_SETUP.md`)
- ✅ Configuration files (`config.example.json`, `package.json`)
- ✅ Scripts (`scripts/`)
- ✅ Sample data (`data/samples/`)
- ✅ Requirements files (`requirements.txt`, `api/requirements.txt`)

## Next Steps After Upload

1. **Update README**: Make sure the repository description on GitHub matches your project
2. **Add Topics**: Add topics like `retail`, `forecasting`, `python`, `react`, `tauri`, `machine-learning`
3. **Set up GitHub Pages** (optional): For hosting documentation
4. **Add License**: Consider adding a LICENSE file
5. **Create Releases**: Tag versions for releases (e.g., `v1.0.0`)

## Quick Command Reference

```bash
# Check current remote
git remote -v

# Update remote URL
git remote set-url origin <NEW_URL>

# Push to GitHub
git push -u origin main

# Check what will be pushed
git status

# View commit history
git log --oneline -5
```

---

**Need help?** Check the [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md) for more information about the project setup.



