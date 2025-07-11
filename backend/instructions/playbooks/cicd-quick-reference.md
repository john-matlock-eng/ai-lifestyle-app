# CI/CD Quick Reference for Backend LLM Agents

## Your Only Job: Write Code & Create PRs

### The Golden Rules
1. **You write code** - CI/CD deploys it
2. **You create PRs** - GitHub Actions handles everything
3. **You NEVER run** - terraform, docker, or aws commands

### Deployment Triggers
```
Your PR → Automatic deployment to DEV
PR Merged → Automatic deployment to PROD
```

### What Happens When You Create a PR

```
You: git push & create PR
         ↓
GitHub Actions: Starts automatically
         ↓
Phase 1: Create infrastructure (3 min)
         ↓
Phase 2: Build Docker image (4 min)
         ↓
Phase 3: Deploy Lambda (2 min)
         ↓
Bot: Comments "✅ Deployed to dev"
```

### Your Workflow Checklist

```bash
# 1. Create feature branch
git checkout -b feature/add-meals-api

# 2. Make your changes
- Edit src/ files
- Update main.py routes
- Update terraform/main.tf

# 3. Test locally
pytest tests/

# 4. Commit and push
git add .
git commit -m "feat: add meals endpoints"
git push origin feature/add-meals-api

# 5. Create PR in GitHub UI
# 6. Wait for bot comment
# 7. Fix any failures
# 8. Get PR approved and merged
```

### Common Tasks

| Task | Your Actions | CI/CD Does |
|------|-------------|------------|
| Add API endpoint | 1. Update main.py<br>2. Create handler<br>3. Update terraform routes | Deploys everything |
| Add DynamoDB table | 1. Add to terraform<br>2. Update Lambda env vars | Creates table & updates Lambda |
| Fix production bug | 1. Create hotfix branch<br>2. Fix code<br>3. Create PR | Deploys to dev then prod |
| Add npm package | 1. Update package.json<br>2. Create PR | Installs & deploys |

### Where to Find Info

| What | Where |
|------|-------|
| Deployment status | PR Checks section (✓ or ✗) |
| Deployment details | Bot comments on PR |
| Error logs | Actions tab → workflow run |
| API endpoints | Bot comment shows URLs |

### Environment Variables

Always reference Terraform:
```hcl
# RIGHT ✓
environment_variables = {
  TABLE_NAME = module.meals.table_name
}

# WRONG ✗
environment_variables = {
  TABLE_NAME = "meals-table-prod"  # Never hardcode!
}
```

### If Deployment Fails

1. **Read the bot comment** - It tells you which step failed
2. **Click "Details"** - Goes to workflow logs
3. **Find the error** - Red sections in logs
4. **Fix in your branch** - Push fix to same branch
5. **CI/CD retries** - Automatically on new push

### Time Expectations

- **PR to Dev Deployed**: ~10 minutes
- **Merge to Prod Deployed**: ~10 minutes
- **Your waiting time**: Make coffee ☕

### Never Do These

```bash
# ❌ NEVER run any of these:
terraform apply
terraform plan
docker build
docker push
aws lambda update-function
aws s3 cp
npm run deploy

# ✅ ALWAYS do this instead:
git push  # Then create PR
```

### Quick Diagnostic

**Q: "How do I deploy my changes?"**
A: Create a PR. That's it.

**Q: "How do I deploy to production?"**
A: Get your PR approved and merged.

**Q: "The deployment failed, what do I do?"**
A: Read the bot comment, check logs, fix code, push again.

**Q: "How do I know it deployed?"**
A: Bot comments "✅ Backend Deployment Complete"

**Q: "Where's my API endpoint?"**
A: In the bot comment under "API Endpoint"

## Remember

You are a **developer**, not a **deployer**. Focus on writing great code. The CI/CD pipeline is your reliable partner that handles all the deployment complexity. Trust the process!

---

**Full Guide**: See `cicd-guide-for-llm-agents.md` for detailed explanations
