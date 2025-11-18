# VPS Deployment Guide

## Quick Deploy (Recommended)

If you just want to deploy the latest from GitHub and don't care about local VPS changes:

```bash
cd /var/www/travunited/travunitedlatest
./deploy-vps.sh
```

Or manually:

```bash
cd /var/www/travunited/travunitedlatest

# Abort any in-progress merge
git merge --abort 2>/dev/null || true

# Reset to GitHub version
git fetch origin
git reset --hard origin/main

# Deploy
npm install
npm run build
pm2 restart travunited --update-env
```

---

## Handling Merge Conflicts

### Understanding the Error

If you see:
```
Pulling is not possible because you have unmerged files.
```

This means a previous `git pull` started a merge, found conflicts, and never finished. Git refuses to continue until you resolve this.

### Option 1: Reset to GitHub (Recommended for Deployment Servers)

**Use this when:** Your VPS is only for deployment, and all real development happens on your Mac → GitHub → VPS.

**Steps:**

1. **Check conflicted files:**
   ```bash
   git status
   ```
   You'll see files listed under "Unmerged paths"

2. **Reset to GitHub version:**
   ```bash
   # Abort any in-progress merge
   git merge --abort 2>/dev/null || true
   
   # Fetch latest from GitHub
   git fetch origin
   
   # Reset to match GitHub exactly (discards local changes)
   git reset --hard origin/main
   ```

3. **Verify clean state:**
   ```bash
   git status
   ```
   Should show: `Your branch is up to date with 'origin/main'. nothing to commit, working tree clean`

4. **Redeploy:**
   ```bash
   npm install
   npm run build
   pm2 restart travunited --update-env
   ```

### Option 2: Keep/Merge Local Changes

**Use this when:** You made important changes directly on the VPS that aren't in GitHub yet.

**Steps:**

1. **See conflicted files:**
   ```bash
   git status
   ```

2. **For each unmerged file, resolve conflicts:**
   ```bash
   nano prisma.config.ts  # or whatever file is conflicted
   ```
   
   Look for conflict markers:
   ```
   <<<<<<< HEAD
   // your version (VPS)
   =======
   // version from GitHub
   >>>>>>> origin/main
   ```
   
   Edit the file to keep the correct code, remove all `<<<<<<<`, `=======`, `>>>>>>>` lines.

3. **Stage the resolved file:**
   ```bash
   git add prisma.config.ts
   ```

4. **Repeat for all conflicted files**, then commit:
   ```bash
   git commit -m "Resolve merge conflicts on server"
   ```

5. **Push if needed:**
   ```bash
   git push  # if you want GitHub to have this merged version
   ```

---

## Best Practices

1. **Always develop locally** - Make changes on your Mac, commit to GitHub, then deploy to VPS
2. **Use Option 1** - For pure deployment servers, always reset to GitHub version
3. **Never edit directly on VPS** - If you need to make changes, do it locally and push to GitHub first
4. **Use the deploy script** - The `deploy-vps.sh` script automates Option 1

---

## Troubleshooting

### "Permission denied" when running deploy script
```bash
chmod +x deploy-vps.sh
```

### PM2 process not found
```bash
pm2 list  # Check if process exists
pm2 start npm --name travunited -- start  # Start if needed
```

### Build fails
```bash
# Check Node version
node -v  # Should be 18+

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

