# GitHub Activity Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Start Your Dev Server

```bash
npm run dev
```

### Step 2: Start ngrok Tunnel

```bash
# In a new terminal
ngrok http 3000

# You'll see output like:
# Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

### Step 3: Configure GitHub Webhook

1. Go to your GitHub repository
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Fill in:
   - **Payload URL**: `https://abc123.ngrok.io/api/webhooks/github`
   - **Content type**: `application/json`
   - **Which events?**: Select individual events
     - ✅ Pushes
     - ✅ Pull requests
     - ✅ Issues
4. Click **Add webhook**

### Step 4: Link Repository to Project

In your project in Ontrackr, ensure these fields are set:

```typescript
{
  githubOwner: "your-username",     // GitHub username/org
  githubRepo: "your-repo-name"      // Repository name (not full URL)
}
```

### Step 5: Test It!

```bash
# Make a test commit
git commit -m "Test GitHub webhook integration"
git push origin main
```

**Check the results:**

1. **Terminal running `npm run dev`** - You should see:
   ```
   [Webhook] Received GitHub event: push
   [GitHub] Processing push event
   [GitHub] Stored commit activity
   [Webhook] Event processed in 150ms
   ```

2. **GitHub Webhook Page** - Go to your repo → Settings → Webhooks → Click your webhook
   - Under "Recent Deliveries" you should see a green checkmark ✅
   - Response code: 200

3. **Ontrackr UI** - Go to Project Dashboard → GitHub Activity tab
   - You should see your commit appear automatically! 🎉

---

## 📊 What You'll See

### In the GitHub Activity Tab

```
🟣 Committed: Test GitHub webhook integration
   your-username • main • just now
   [Click to view on GitHub →]
```

### In Firestore Console

Navigate to **githubActivity** collection:

```json
{
  "projectId": "your-project-id",
  "repositoryFullName": "your-username/your-repo",
  "activityType": "commit",
  "title": "Test GitHub webhook integration",
  "githubUsername": "your-username",
  "branch": "main",
  "githubUrl": "https://github.com/your-username/your-repo/commit/abc123",
  "githubId": "abc123def456...",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## 🧪 Test All Event Types

### 1. Test Commits (Push)

```bash
git commit -m "feat: add user authentication"
git push origin main
```

**Expected in UI:**
```
🟣 Committed: feat: add user authentication
   you • main • 1 minute ago
```

### 2. Test Pull Request

```bash
# Create feature branch
git checkout -b feature/new-feature
git commit -m "Add new feature"
git push origin feature/new-feature

# Open PR on GitHub UI
# (Create pull request from feature/new-feature to main)
```

**Expected in UI:**
```
🔵 Opened PR: Add new feature
   you • feature/new-feature • 2 minutes ago
```

### 3. Test PR Merge

```bash
# Merge the PR on GitHub UI
# (Click "Merge pull request")
```

**Expected in UI:**
```
🟢 Merged PR: Add new feature
   you • main • 3 minutes ago
```

### 4. Test Issue Creation

1. Go to GitHub → Issues → New issue
2. Title: "Bug: Login button not working"
3. Click "Submit new issue"

**Expected in UI:**
```
🔴 Opened issue: Bug: Login button not working
   you • 4 minutes ago
```

### 5. Test Issue Close

1. Go to the issue you created
2. Click "Close issue"

**Expected in UI:**
```
🟢 Closed issue: Bug: Login button not working
   you • 5 minutes ago
```

---

## ✅ Verification Checklist

After each test, verify:

- [ ] Webhook shows green checkmark in GitHub
- [ ] Server logs show successful processing
- [ ] Activity appears in Firestore
- [ ] Activity displays in UI within 1-2 seconds
- [ ] Clicking activity opens correct GitHub URL
- [ ] No duplicate activities created

---

## 🔍 Debugging

### Webhook Not Received

**Check:**
```bash
# Verify endpoint is accessible
curl https://abc123.ngrok.io/api/webhooks/github

# Should return:
{ "status": "active", ... }
```

**Common Issues:**
- ngrok tunnel expired (restart with `ngrok http 3000`)
- Wrong webhook URL in GitHub settings
- Dev server not running

### Activity Not Appearing in UI

**Check Server Logs:**
```
[Webhook] Received GitHub event: push ✅
[Webhook] Matched to project: My Project ✅
[GitHub] Stored commit activity ✅
```

**Check Firestore:**
1. Firebase Console → Firestore Database
2. Navigate to `githubActivity` collection
3. Filter: `projectId == "your-project-id"`
4. Should see recent activity documents

**Check Browser Console:**
- Open DevTools → Console
- Look for errors in subscription
- Verify user is authenticated

### Duplicate Activities

**Check:**
1. Firestore documents have unique `githubId`
2. Server logs show "Activity already exists" message
3. Create Firestore index if missing

---

## 🎯 Common Scenarios

### Scenario 1: Multiple Commits in One Push

```bash
git commit -m "Fix bug #1"
git commit -m "Fix bug #2"
git commit -m "Fix bug #3"
git push origin main
```

**Result:** All 3 commits appear separately in activity timeline

### Scenario 2: PR from Feature Branch

```bash
git checkout -b feature/awesome-feature
# Make changes
git commit -m "Implement awesome feature"
git push origin feature/awesome-feature
# Create PR on GitHub
```

**Result:** 
- PR opened activity shows `feature/awesome-feature` branch
- After merge, PR merged activity shows `main` branch

### Scenario 3: Issue-Commit-Close Workflow

```bash
# 1. Create issue on GitHub: "Bug: User can't login"
# 2. Make commit with reference
git commit -m "Fix: User login issue (fixes #15)"
git push origin main
# 3. Close issue on GitHub
```

**Result:** Timeline shows issue opened → commit → issue closed

---

## 📱 Mobile Testing

The GitHub Activity tab is fully responsive!

**Test on mobile:**
1. Open Ontrackr on mobile browser
2. Navigate to project
3. Tap GitHub Activity tab
4. Make commit from desktop
5. Watch activity appear in real-time on mobile

---

## 🔐 Production Deployment

### Before Going Live

1. **Deploy to production:**
   ```bash
   vercel deploy --prod
   # or your deployment method
   ```

2. **Update webhook URL in GitHub:**
   - Remove ngrok URL
   - Add production URL: `https://your-domain.com/api/webhooks/github`

3. **Deploy Firestore indexes:**
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. **Deploy security rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Test in production:**
   ```bash
   # Make a test commit
   git commit -m "Test production webhook"
   git push origin main
   ```

6. **Monitor:**
   - Check Vercel/deployment logs
   - Verify Firestore activity creation
   - Test UI updates

---

## 💡 Pro Tips

### Tip 1: Watch Logs in Real-time

```bash
# In terminal running dev server, you'll see:
[Webhook] Received GitHub event: push (delivery: abc-123-def)
[Webhook] Event push for repository: owner/repo
[Webhook] Matched to project: My Project (project123)
[GitHub] Processing push event for project project123
[GitHub] Push to branch: main, Commits: 1, Is Main: true
[GitHub] Stored commit activity: abc123d by johndoe
[Webhook] Successfully processed push event for My Project
[Webhook] Event processed in 147ms
```

### Tip 2: Filter Activities by Type

In the future, you can filter the timeline:

```typescript
// Show only commits
activities.filter(a => a.activityType === 'commit')

// Show only PRs
activities.filter(a => 
  a.activityType === 'pull_request_opened' || 
  a.activityType === 'pull_request_merged'
)
```

### Tip 3: Link Activities to Tasks

The system automatically tries to match commits/PRs to tasks based on keywords in the commit message or PR title.

**Use task keywords in commits:**
```bash
git commit -m "feat: Implement user authentication [TASK-123]"
```

---

## 🎉 Success!

You now have a fully functional GitHub activity tracking system!

**Every time someone:**
- 📝 Commits code
- 🔀 Opens a PR
- ✅ Merges a PR
- 🐛 Opens an issue
- ✔️ Closes an issue

**It automatically appears in your GitHub Activity timeline in real-time!**

No manual updates needed. No mock data. 100% real repository activity.

---

## 📚 Need More Help?

- **Full Documentation**: See `GITHUB_ACTIVITY_BACKEND.md`
- **Test Scripts**: See `GITHUB_WEBHOOK_TEST.md`
- **Architecture Diagrams**: See `GITHUB_ACTIVITY_DIAGRAMS.md`
- **Summary**: See `GITHUB_ACTIVITY_SUMMARY.md`

Happy tracking! 🚀
