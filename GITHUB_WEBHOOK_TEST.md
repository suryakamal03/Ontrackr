# GitHub Webhook Test Script

This script helps you test the GitHub webhook integration locally or in production.

## Test 1: Check Webhook Endpoint Status

```bash
# Test if webhook endpoint is active
curl -X GET https://your-domain.com/api/webhooks/github

# Expected Response:
{
  "status": "active",
  "endpoint": "/api/webhooks/github",
  "supportedEvents": ["push", "pull_request", "issues"],
  "instructions": { ... }
}
```

## Test 2: Simulate Push Event

```bash
# Create a test push event payload
curl -X POST https://your-domain.com/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: test-delivery-123" \
  -d '{
    "ref": "refs/heads/main",
    "repository": {
      "name": "your-repo-name",
      "full_name": "your-owner/your-repo-name",
      "owner": {
        "login": "your-owner"
      }
    },
    "sender": {
      "login": "test-user",
      "avatar_url": "https://avatars.githubusercontent.com/u/1234567"
    },
    "commits": [
      {
        "id": "abc123def456",
        "message": "Test commit for webhook",
        "url": "https://github.com/your-owner/your-repo/commit/abc123def456",
        "author": {
          "name": "Test User",
          "email": "test@example.com",
          "username": "test-user"
        },
        "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
      }
    ]
  }'

# Expected Response:
{
  "success": true,
  "event": "push",
  "projectId": "abc123",
  "projectName": "Your Project",
  "repository": "your-owner/your-repo",
  "processingTime": "150ms"
}
```

## Test 3: Simulate Pull Request Opened

```bash
curl -X POST https://your-domain.com/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-GitHub-Delivery: test-delivery-456" \
  -d '{
    "action": "opened",
    "repository": {
      "name": "your-repo-name",
      "full_name": "your-owner/your-repo-name",
      "owner": {
        "login": "your-owner"
      }
    },
    "sender": {
      "login": "test-user",
      "avatar_url": "https://avatars.githubusercontent.com/u/1234567"
    },
    "pull_request": {
      "id": 123456789,
      "number": 42,
      "html_url": "https://github.com/your-owner/your-repo/pull/42",
      "title": "Add new feature",
      "body": "This PR adds a new feature",
      "state": "open",
      "merged": false,
      "user": {
        "login": "test-user"
      },
      "head": {
        "ref": "feature-branch"
      },
      "base": {
        "ref": "main"
      },
      "created_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'
```

## Test 4: Simulate Issue Opened

```bash
curl -X POST https://your-domain.com/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: issues" \
  -H "X-GitHub-Delivery: test-delivery-789" \
  -d '{
    "action": "opened",
    "repository": {
      "name": "your-repo-name",
      "full_name": "your-owner/your-repo-name",
      "owner": {
        "login": "your-owner"
      }
    },
    "sender": {
      "login": "test-user",
      "avatar_url": "https://avatars.githubusercontent.com/u/1234567"
    },
    "issue": {
      "id": 987654321,
      "number": 15,
      "html_url": "https://github.com/your-owner/your-repo/issues/15",
      "title": "Bug: Something is broken",
      "state": "open",
      "user": {
        "login": "test-user"
      },
      "created_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'
```

## Test 5: Verify in Firestore

After sending test webhooks, check Firestore Console:

### Check githubActivity collection

```javascript
// Firestore Console Query
Collection: githubActivity
Filters:
  - projectId == "your-project-id"
Order by: createdAt desc
Limit: 10
```

Expected documents:
- Activities with matching projectId
- Correct activityType
- GitHub username populated
- GitHub URL present
- Timestamp within last few minutes

### Check github_events collection

```javascript
// Firestore Console Query
Collection: github_events
Filters:
  - projectId == "your-project-id"
Order by: createdAt desc
Limit: 5
```

Expected documents:
- Raw webhook payloads
- Full event details preserved

## Test 6: Verify Real-time Updates

1. Open your application
2. Navigate to Project Dashboard
3. Click on "GitHub Activity" tab
4. Send a test webhook (using curl above)
5. Watch the activity appear in real-time (within 1-2 seconds)

## Test 7: Test Idempotency

Send the same webhook payload twice:

```bash
# First request
curl -X POST https://your-domain.com/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{ ... same payload ... }'

# Second request (immediate retry)
curl -X POST https://your-domain.com/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{ ... same payload ... }'
```

Expected behavior:
- First request: Creates activity in Firestore
- Second request: Skips creation (logs "Activity already exists")
- Only ONE document in githubActivity collection

Check server logs for:
```
[GitHub] Activity already exists for commit abc123def456, skipping
```

## Test 8: Test Member Validation

Send webhook for non-member user:

```bash
curl -X POST https://your-domain.com/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "repository": { ... },
    "commits": [{
      "author": { "username": "unknown-user" }
    }]
  }'
```

Expected behavior:
- Webhook processes successfully
- Activity skipped for non-member (if validation strict)
- Log message: "Skipping commit - user not a project member"

## Monitoring Checklist

After webhook setup, verify:

- [ ] Webhook configured in GitHub repository settings
- [ ] Webhook delivery shows green checkmarks
- [ ] Server logs show `[Webhook] Received GitHub event`
- [ ] Activities appear in Firestore `githubActivity` collection
- [ ] Activities visible in GitHub Activity tab UI
- [ ] Clicking activity opens correct GitHub URL
- [ ] Real-time updates work (new activities appear instantly)
- [ ] No duplicate activities in Firestore
- [ ] Processing time < 500ms per webhook

## Troubleshooting

### Webhook not received

1. Check GitHub webhook Recent Deliveries
2. Look for HTTP error codes
3. Verify webhook URL is correct
4. For local dev, ensure ngrok is running

### Activities not appearing in UI

1. Check Firestore for activities
2. Verify projectId matches
3. Check browser console for errors
4. Ensure user is authenticated

### Duplicate activities

1. Check `githubId` field in Firestore
2. Verify idempotency function is working
3. Review server logs for duplicate detection

### Performance issues

1. Check webhook processing time in logs
2. Monitor Firestore query performance
3. Reduce activity limit if needed
4. Check for excessive events

## Production Deployment

Before going to production:

1. **Deploy Firestore indexes:**
   ```bash
   firebase deploy --only firestore:indexes
   ```

2. **Deploy security rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Update GitHub webhook URL:**
   - Change from ngrok URL to production domain
   - Update in GitHub repository settings

4. **Enable webhook signature validation:**
   - Generate secret in GitHub webhook settings
   - Add `GITHUB_WEBHOOK_SECRET` to environment variables
   - Uncomment signature validation in webhook handler

5. **Set up monitoring:**
   - Enable Cloud Functions logging
   - Set up error alerts
   - Monitor Firestore usage

## Summary

The webhook system is fully tested when:

✅ Endpoint responds to GET requests with status
✅ Push events create commit activities
✅ PR events create PR activities
✅ Issue events create issue activities
✅ Activities appear in Firestore
✅ UI updates in real-time
✅ Idempotency prevents duplicates
✅ Member validation works
✅ Error handling logs issues
✅ Processing completes in < 500ms

Your GitHub activity tracking is now live and ready for production use!
