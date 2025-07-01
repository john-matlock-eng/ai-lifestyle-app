# Playbook: ADR Writing

## Purpose
Document architectural decisions to preserve the "why" behind technical choices. ADRs are your project's memory - they prevent repeating past mistakes and explain non-obvious decisions to future maintainers.

**Key Principle**: Write ADRs as if explaining to a new team member in 6 months who asks "Why did we do it this way?"

## When to Use This Playbook
- Choosing between technology options
- Making non-obvious technical decisions
- Deviating from standard patterns
- Accepting technical debt deliberately
- After discovering a better approach

## What Deserves an ADR?

### ✅ Write an ADR for:
- Database technology selection
- Authentication/authorization approach
- API versioning strategy
- State management decisions
- Caching strategies
- External service integrations
- Performance trade-offs
- Security compromises
- Breaking from established patterns

### ❌ Don't Write an ADR for:
- Following established patterns
- Minor implementation details
- Temporary workarounds
- Personal preferences
- Industry-standard practices

## The ADR Workflow

### Phase 1: Identify the Decision Point (15 min)

Create a decision brief:
```markdown
# Decision Brief: [Topic]

## Context
What circumstances led to this decision point?

## Problem
What specific problem are we solving?

## Constraints
- Technical: [List limitations]
- Business: [Budget, timeline, etc.]
- Team: [Skills, availability]

## Stakeholders
- Impacted: [Who this affects]
- Consulted: [Who provided input]
- Informed: [Who needs to know]
```

### Phase 2: Research Options (30 min)

Evaluate each option systematically:

```markdown
# Option Analysis

## Option 1: [Name]
### Description
Brief explanation of this approach

### Pros
- ✅ [Advantage 1]
- ✅ [Advantage 2]

### Cons  
- ❌ [Disadvantage 1]
- ❌ [Disadvantage 2]

### Risks
- 🎲 [Risk and mitigation]

### Cost
- Development: [Hours/Days]
- Operational: [$/month]
- Maintenance: [Low|Medium|High]
```

### Phase 3: Write the ADR (20 min)

Use this template and save to `docs/adr/YYYY-MM-DD-title.md`:

```markdown
# ADR-[NUMBER]: [Title]

**Status**: [Proposed | Accepted | Deprecated | Superseded]  
**Date**: [YYYY-MM-DD]  
**Author**: PM Agent  
**Deciders**: [List decision makers]

## Context and Problem Statement

[Describe the context and problem in 2-3 paragraphs. Include:
- What forced this decision
- Why it can't be deferred
- What happens if we don't decide]

## Decision Drivers

* [Driver 1 - e.g., Must handle 10k requests/second]
* [Driver 2 - e.g., Team has Python expertise]
* [Driver 3 - e.g., Must integrate with existing systems]
* [Driver 4 - e.g., Budget limited to $X/month]

## Considered Options

* Option 1: [Name - e.g., "DynamoDB Single Table"]
* Option 2: [Name - e.g., "PostgreSQL with JSONB"]
* Option 3: [Name - e.g., "MongoDB"]

## Decision Outcome

Chosen option: "[Option X]", because [justification in 1-2 sentences highlighting the key reasoning].

### Positive Consequences

* ✅ [Good thing 1]
* ✅ [Good thing 2]
* ✅ [Good thing 3]

### Negative Consequences

* ⚠️ [Accepted trade-off 1]
* ⚠️ [Accepted trade-off 2]

### Mitigation Plan

For each negative consequence, how we'll address it:
* [Trade-off 1]: [Mitigation strategy]
* [Trade-off 2]: [Mitigation strategy]

## Pros and Cons of the Options

### Option 1: [Name]

* ✅ Pro: [Argument]
* ✅ Pro: [Argument]
* ❌ Con: [Argument]
* ❌ Con: [Argument]

### Option 2: [Name]

* ✅ Pro: [Argument]
* ❌ Con: [Argument]

### Option 3: [Name]

* ✅ Pro: [Argument]
* ❌ Con: [Argument]

## Links

* [Link to relevant documentation]
* [Link to proof of concept]
* [Link to similar implementations]

## Notes

[Any additional context, assumptions, or future considerations]
```

## Example ADRs

### Example 1: Database Technology

```markdown
# ADR-001: Use DynamoDB for Primary Data Storage

**Status**: Accepted  
**Date**: 2024-01-15  
**Author**: PM Agent  
**Deciders**: Tech Lead, Backend Agent, PM Agent

## Context and Problem Statement

The AI Lifestyle App requires a database that can scale to millions of users tracking daily meals, pantry items, and recipes. Each user might generate 10-50 database operations daily. The database must handle variable schemas (nutrition data, pantry items, meal plans) while maintaining single-digit millisecond response times.

Our team has strong Python/AWS expertise but limited database administration experience. We need a solution that minimizes operational overhead while providing predictable performance and costs.

## Decision Drivers

* Must scale from 0 to 1M+ users without architecture changes
* Single-digit millisecond response time at p99
* Support for flexible schemas across different features
* Minimal operational overhead (no DBAs on team)
* Predictable pricing that scales with usage
* Strong consistency for critical operations

## Considered Options

* Option 1: DynamoDB with single-table design
* Option 2: PostgreSQL on RDS with JSONB columns
* Option 3: MongoDB Atlas

## Decision Outcome

Chosen option: "DynamoDB with single-table design", because it provides infinite scalability with zero operational overhead and predictable single-digit millisecond performance, aligning perfectly with our serverless architecture.

### Positive Consequences

* ✅ Infinite scalability with no operational work
* ✅ Consistent performance regardless of scale
* ✅ Pay-per-request pricing perfect for startup phase
* ✅ Native AWS integration with Lambda
* ✅ Point-in-time recovery and global tables available

### Negative Consequences

* ⚠️ Learning curve for single-table design
* ⚠️ Complex queries require careful index design
* ⚠️ No ad-hoc querying capability
* ⚠️ Eventually consistent by default

### Mitigation Plan

* Learning curve: Create comprehensive data access patterns documentation and provide team training
* Complex queries: Design GSIs upfront for all access patterns; use DynamoDB Streams + ElasticSearch for complex search
* Ad-hoc querying: Export to S3 + Athena for analytics
* Consistency: Use strong consistency for critical reads (user authentication, payment processing)

## Pros and Cons of the Options

### Option 1: DynamoDB

* ✅ Pro: Serverless, no operational overhead
* ✅ Pro: Predictable performance at any scale
* ✅ Pro: Tight AWS integration
* ❌ Con: Learning curve for NoSQL patterns
* ❌ Con: Limited query flexibility

### Option 2: PostgreSQL on RDS

* ✅ Pro: Team familiar with SQL
* ✅ Pro: Rich query capabilities
* ✅ Pro: JSONB provides some flexibility
* ❌ Con: Requires capacity planning
* ❌ Con: Performance tuning needed at scale
* ❌ Con: Higher operational overhead

### Option 3: MongoDB Atlas

* ✅ Pro: Flexible document model
* ✅ Pro: Good query capabilities
* ❌ Con: Another vendor to manage
* ❌ Con: Less AWS integration
* ❌ Con: Unpredictable pricing at scale

## Links

* [DynamoDB single-table design guide](https://www.alexdebrie.com/posts/dynamodb-single-table/)
* [Our data access patterns doc](../data-access-patterns.md)
* [DynamoDB pricing calculator results](../analysis/dynamodb-costs.xlsx)

## Notes

This decision will be revisited if:
- Query requirements become too complex for DynamoDB
- Costs exceed PostgreSQL at our scale (estimated at 10M+ users)
- Team struggles with NoSQL patterns after 3 months
```

### Example 2: External API Integration

```markdown
# ADR-003: Cache OpenFood API Responses in DynamoDB

**Status**: Accepted  
**Date**: 2024-01-22  
**Author**: PM Agent  
**Deciders**: Backend Agent, PM Agent

## Context and Problem Statement

The barcode scanning feature relies on the OpenFood Facts API to retrieve product information. This free API has rate limits (100 requests/minute) and variable response times (500ms-3s). With multiple users scanning items simultaneously, we risk hitting rate limits and providing poor user experience due to slow responses.

We need a caching strategy that balances data freshness, API respect, and user experience while staying within our serverless architecture constraints.

## Decision Drivers

* Respect OpenFood API rate limits and terms of service
* Provide <500ms response time for cached items
* Minimize storage costs
* Keep implementation simple (single Lambda function)
* Handle API downtime gracefully

## Considered Options

* Option 1: Cache in DynamoDB with TTL
* Option 2: Redis on ElastiCache
* Option 3: CloudFront with API Gateway caching
* Option 4: No caching, direct API calls only

## Decision Outcome

Chosen option: "Cache in DynamoDB with TTL", because it requires no additional infrastructure, integrates seamlessly with our existing DynamoDB single-table design, and provides automatic cleanup via TTL.

### Positive Consequences

* ✅ No new infrastructure to manage
* ✅ Automatic cache expiration with TTL
* ✅ Consistent with our database choice
* ✅ Works offline (can return stale cache)
* ✅ Simple implementation in Lambda

### Negative Consequences

* ⚠️ Not as fast as in-memory caching
* ⚠️ Counts against DynamoDB capacity
* ⚠️ Cache invalidation is eventual

### Mitigation Plan

* Speed: 20-30ms DynamoDB reads are acceptable for our use case
* Capacity: Monitor usage and switch to on-demand if needed
* Invalidation: 24-hour TTL is reasonable for product data

## Implementation Details

```python
# Cache key pattern
cache_key = f"CACHE#BARCODE#{barcode}"

# Cache with 24-hour TTL
item = {
    'PK': cache_key,
    'SK': 'PRODUCT',
    'barcode': barcode,
    'product_data': api_response,
    'cached_at': datetime.now().isoformat(),
    'ttl': int(time.time()) + 86400  # 24 hours
}
```

## Links

* [OpenFood Facts API documentation](https://world.openfoodfacts.org/data)
* [DynamoDB TTL documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)
* [Cost analysis spreadsheet](../analysis/caching-costs.xlsx)
```

## Common ADR Patterns

### Pattern 1: Technology Selection
Use when choosing databases, frameworks, or services:
- Compare at least 3 options
- Include cost analysis
- Consider team expertise
- Plan for migration

### Pattern 2: Performance Trade-off
Use when optimizing for speed vs other concerns:
- Quantify performance requirements
- Measure baseline performance
- Document expected improvements
- Include rollback plan

### Pattern 3: Security Compromise
Use when accepting security risks:
- Clearly state the risk
- Explain why it's acceptable
- Document compensating controls
- Set review date

### Pattern 4: Technical Debt
Use when deliberately taking shortcuts:
- Explain time/resource constraints
- Document the "right" way
- Estimate remediation effort
- Set cleanup timeline

## ADR Quality Checklist

Before finalizing an ADR:
- [ ] Context explains the "why" clearly
- [ ] All realistic options are considered
- [ ] Decision criteria are explicit
- [ ] Trade-offs are acknowledged
- [ ] Consequences (good and bad) are listed
- [ ] Mitigation plans exist for negatives
- [ ] Links to evidence/research included
- [ ] Review date set if applicable

## Managing ADRs Over Time

### Superseding ADRs
When decisions change:

```markdown
# ADR-001: Use PostgreSQL for Primary Storage

**Status**: Superseded by ADR-007  
**Date**: 2024-01-01

[Original content remains but marked superseded]
```

### Referencing ADRs
In code and documentation:
```python
# Using DynamoDB single-table design as per ADR-001
# Cache implementation follows ADR-003
def get_product_by_barcode(barcode: str):
    # Check cache first (ADR-003)
    cached = get_from_cache(barcode)
    if cached:
        return cached
```

### ADR Index
Maintain `docs/adr/index.md`:
```markdown
# Architecture Decision Records

## Accepted
- [ADR-001](./2024-01-15-dynamodb-primary-storage.md): Use DynamoDB for Primary Storage
- [ADR-002](./2024-01-18-jwt-authentication.md): JWT Tokens via AWS Cognito
- [ADR-003](./2024-01-22-cache-openfood-api.md): Cache OpenFood API Responses

## Proposed
- [ADR-004](./2024-01-25-websocket-notifications.md): WebSocket for Real-time Updates

## Superseded
- None yet
```

## Communication After ADR

### Notify Affected Agents
Update relevant `current-task.md` files:
```markdown
## 📢 New Architecture Decision

ADR-003 has been accepted: "Cache OpenFood API Responses in DynamoDB"

This affects your current task:
- Implement caching as specified in the ADR
- Use 24-hour TTL for all cached items
- Follow the cache key pattern: CACHE#BARCODE#{barcode}

See: docs/adr/2024-01-22-cache-openfood-api.md
```

### Update Documentation
Add notes to relevant README files:
```markdown
## Caching Strategy

This service implements response caching as per ADR-003.
- Cache hits avoid external API calls
- 24-hour TTL ensures data freshness
- Falls back to API if cache miss
```

## The ADR Mindset

Remember: ADRs are about communication across time. Write them to:

1. **Prevent Rehashing**: "We already decided this in ADR-001"
2. **Explain Non-Obvious Choices**: "It seems weird but here's why"
3. **Accept Trade-offs Explicitly**: "We know this isn't ideal but..."
4. **Learn from History**: "ADR-001 was superseded because..."

Good ADRs make your future self (and team) grateful.

---

**Next Steps**: With your ADR written, update any affected tasks and documentation. Then return to your main workflow in `pm/instructions.md`.