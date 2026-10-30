# FivePrayer Git Guide

This guide explains the Git workflow for the FivePrayer WordPress plugin project.

## Table of Contents
1. [Branch Naming Conventions](#branch-naming-conventions)
2. [Creating a New Branch](#creating-a-new-branch)
3. [Making Commits](#making-commits)
4. [Pushing Changes](#pushing-changes)
5. [Pull Request Process](#pull-request-process)
6. [Best Practices](#best-practices)

## Branch Naming Conventions

Use the following format for branch names:

### Feature Branches
```
feature/descriptive-name
feature/custom-prayer-schedules
feature/translation-enhancements
feature/calendar-improvements
```

### Bug Fix Branches
```
fix/issue-description
fix/login-error
fix/cache-issue
```

### Hotfix Branches
```
hotfix/critical-fix-name
hotfix/security-patch
hotfix/emergency-fix
```

### Enhancement Branches
```
enhancement/feature-name
enhancement/ui-improvements
enhancement/performance-tweaks
```

## Creating a New Branch

### From the main branch
```bash
# Switch to main branch and pull latest changes
git checkout main
git pull origin main

# Create and switch to a new feature branch
git checkout -b feature/descriptive-name

# Or create from a specific branch
git checkout -b feature/descriptive-name main
```

### Example: Creating a branch for the Advanced Schedules Page
```bash
git checkout main
git pull origin main
git checkout -b feature/advanced-schedules-page-enhancements
```

## Making Commits

### Commit Message Format
Follow the conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `enhancement`: Improvement to existing feature
- `refactor`: Code restructuring without changing behavior
- `docs`: Documentation changes
- `style`: Code style changes (white-space, formatting, missing semi-colons, etc)
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

### Examples
```bash
# Good commit messages
git commit -m "feat(custom-schedules): add translation support for prayer names"
git commit -m "fix(calendar): resolve timezone calculation issue"
git commit -m "enhancement(ui): improve responsive design for schedule form"
git commit -m "docs(readme): update development workflow documentation"

# For multiple changes
git add .
git commit -m "feat(translations): add dynamic translation for prayer times

- Implement getTranslatedPrayerName function
- Update CustomPrayerTimeSchedules component
- Add translation lookup for timetable terms
- Update validation messages with translated terms"
```

## Pushing Changes

### Push a new branch
```bash
# Push the new branch to remote repository
git push -u origin feature/descriptive-name

# If branch already exists remotely
git push origin feature/descriptive-name
```

### Example
```bash
git add src/admin/components/More/page/AdvancedSchedulesPage.tsx
git commit -m "feat(schedules): enhance AdvancedSchedulesPage with translation support"
git push -u origin feature/advanced-schedules-page-enhancements
```

## Pull Request Process

### Before Creating a Pull Request
1. Rebase with main branch:
```bash
git checkout main
git pull origin main
git checkout your-feature-branch
git rebase main
```

2. Resolve any conflicts that arise during rebase

3. Push the rebased branch:
```bash
git push --force-with-lease origin your-feature-branch
```

### Creating a Pull Request
1. Go to the repository on GitHub
2. Click "Compare & pull request"
3. Fill in the PR template:
   - Title: Brief description of changes
   - Description: Detailed explanation of what was changed
   - Reference any related issues
   - List any breaking changes or important notes

### Example PR Title
```
feat: Add dynamic translation support to Advanced Schedules Page
```

### Example PR Description
```
## Changes Made
- Updated AdvancedSchedulesPage.tsx to use translated prayer names
- Integrated with existing translation store
- Added support for timetable term translations

## Testing
- Verified translations work with multiple languages
- Tested form validation with translated terms
- Confirmed calendar generation still works properly

## Breaking Changes
None
```

## Best Practices

### 1. Keep Commits Focused
- Each commit should address a single concern
- Don't mix feature additions with style changes
- Separate refactoring from functional changes

### 2. Regular Sync with Main
```bash
# Regularly sync your feature branch with main
git checkout main
git pull origin main
git checkout your-branch
git merge main
```

### 3. Use Descriptive Branch Names
- Be specific about what the branch addresses
- Use kebab-case for multi-word branch names
- Avoid generic names like "updates" or "changes"

### 4. Commit Early and Often
- Make small, logical commits
- Don't wait until everything is "perfect"
- Use `git add -p` to stage specific hunks

### 5. Review Your Changes Before Committing
```bash
# Review changes before committing
git diff
git diff --staged

# Check current status
git status
```

### 6. Squash Commits When Needed
For a cleaner history, you might want to squash commits before merging:
```bash
# Interactive rebase to squash commits
git rebase -i HEAD~n  # where n is number of commits to squash

# Or use amend for small changes
git add .
git commit --amend
```

### 7. Example Workflow
```bash
# 1. Create and switch to new branch
git checkout main
git pull origin main
git checkout -b feature/advanced-schedules-translations

# 2. Make changes to AdvancedSchedulesPage.tsx
# Edit the file...

# 3. Stage and commit changes
git add src/admin/components/More/page/AdvancedSchedulesPage.tsx
git commit -m "feat(schedules): add translation support to AdvancedSchedulesPage"

# 4. Push branch to remote
git push -u origin feature/advanced-schedules-translations

# 5. Continue working, add more commits as needed
# Edit more files...
git add .
git commit -m "refactor(schedules): improve translation function performance"

# 6. Push additional changes
git push origin feature/advanced-schedules-translations

# 7. Before PR, sync with main
git checkout main
git pull origin main
git checkout feature/advanced-schedules-translations
git rebase main

# 8. Push rebased branch
git push --force-with-lease origin feature/advanced-schedules-translations
```

## Common Commands Summary

```bash
# Create and switch to new branch
git checkout -b feature/name

# Add files to staging
git add filename
git add .

# Commit changes
git commit -m "descriptive message"

# Push branch to remote
git push -u origin branch-name

# Sync with main branch
git checkout main
git pull origin main
git checkout your-branch
git merge main

# View commit history
git log --oneline

# View current status
git status

# Discard local changes (be careful!)
git checkout -- filename
git reset --hard HEAD
```

## Troubleshooting

### If you accidentally commit to main branch:
```bash
# Move the commit to a new branch
git branch feature/backup-branch
git reset --hard HEAD~1  # Remove from main
git checkout feature/backup-branch
# Now you can create proper branch and commit
```

### If you need to undo the last commit:
```bash
# Keep changes in working directory
git reset --soft HEAD~1

# Discard changes completely
git reset --hard HEAD~1
```

### If you have merge conflicts:
```bash
# After git merge or git rebase shows conflicts
# 1. Edit conflicted files to resolve conflicts
# 2. Stage resolved files
git add resolved-file.tsx

# 3. Continue with merge/rebase
git rebase --continue  # if using rebase
# OR
git commit  # if using merge
```

## Class Renaming: TranslationAdmin to SettingsAdmin

### Overview
The admin class that handles the Settings submenu was renamed from `TranslationAdmin` to `SettingsAdmin` to better reflect its purpose. The submenu contains multiple types of settings (translations, logging, and potentially more in the future), not just translations.

### Files Affected
- **Old File**: `php/classes/core/Admin/TranslationAdmin.php`
- **New File**: `php/classes/core/Admin/SettingsAdmin.php`
- **Updated Reference**: `php/classes/core/Plugin.php` - Updated class reference from `TranslationAdmin` to `SettingsAdmin`

### Reason for Change
The original class name `TranslationAdmin` was misleading since the submenu handles multiple types of settings beyond just translations, including logging settings and potentially other settings in the future.

This guide should help maintain a clean, organized Git history for the FivePrayer project.