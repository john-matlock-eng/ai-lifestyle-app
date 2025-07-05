# Pattern: API Endpoints

## Purpose
Quick reference for designing RESTful API endpoints that follow industry standards and our project conventions.

## RESTful Resource Patterns

### Single Resource
```yaml
/resources/{id}:
  get:
    operationId: getResource
    summary: Retrieve a specific resource
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
          format: uuid
  
  put:
    operationId: updateResource
    summary: Full update of resource
    # Request body contains complete resource
  
  patch:
    operationId: partialUpdateResource
    summary: Partial update of resource
    # Request body contains only changed fields
  
  delete:
    operationId: deleteResource
    summary: Remove resource
    responses:
      '204':
        description: Successfully deleted
```

### Resource Collection
```yaml
/resources:
  get:
    operationId: listResources
    summary: List all resources
    parameters:
      - $ref: '#/components/parameters/limit'
      - $ref: '#/components/parameters/offset'
      - $ref: '#/components/parameters/sort'
      - $ref: '#/components/parameters/filter'
  
  post:
    operationId: createResource
    summary: Create new resource
    responses:
      '201':
        description: Created
        headers:
          Location:
            schema:
              type: string
            description: URL of created resource
```

### Nested Resources
```yaml
# When resource belongs to parent
/users/{userId}/meals:
  get:
    operationId: getUserMeals
    summary: List meals for specific user
    
/users/{userId}/meals/{mealId}:
  get:
    operationId: getUserMeal
    summary: Get specific meal for user
```

### Resource Actions (Use Sparingly)
```yaml
# For operations that don't fit CRUD
/meals/{mealId}/duplicate:
  post:
    operationId: duplicateMeal
    summary: Create a copy of the meal
    
/pantry/items/expire-soon:
  get:
    operationId: getExpiringItems
    summary: List items expiring within 7 days
```

## Naming Conventions

### URL Paths
- **Use nouns**: `/meals` not `/getMeals`
- **Plural for collections**: `/users` not `/user`
- **Lowercase with hyphens**: `/meal-plans` not `/MealPlans`
- **Hierarchical when related**: `/users/{id}/preferences`

### Operation IDs
- **camelCase**: `getUserMeals`
- **Verb + Resource**: `createMeal`, `updateMeal`
- **Specific actions**: `duplicateMeal`, `archiveMeal`
- **Must be unique** across entire API

## Common Parameter Patterns

### Pagination
```yaml
components:
  parameters:
    limit:
      name: limit
      in: query
      description: Maximum items to return
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20
    
    offset:
      name: offset
      in: query
      description: Number of items to skip
      schema:
        type: integer
        minimum: 0
        default: 0
    
    cursor:
      name: cursor
      in: query
      description: Cursor for next page
      schema:
        type: string
```

### Sorting
```yaml
sort:
  name: sort
  in: query
  description: Sort order (prefix with - for descending)
  schema:
    type: array
    items:
      type: string
      enum: [createdAt, -createdAt, name, -name]
  style: form
  explode: false
```

### Filtering
```yaml
# Enum filter
status:
  name: status
  in: query
  schema:
    type: array
    items:
      type: string
      enum: [active, inactive, pending]
  style: form
  explode: true

# Date range filter
createdAfter:
  name: createdAfter
  in: query
  schema:
    type: string
    format: date-time

createdBefore:
  name: createdBefore
  in: query
  schema:
    type: string
    format: date-time

# Search filter
search:
  name: search
  in: query
  description: Search in name and description
  schema:
    type: string
    minLength: 3
```

## Response Patterns

### Success Responses

#### Single Resource
```yaml
'200':
  description: Resource retrieved
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/Resource'
```

#### Collection
```yaml
'200':
  description: List retrieved
  content:
    application/json:
      schema:
        type: object
        required: [items, total]
        properties:
          items:
            type: array
            items:
              $ref: '#/components/schemas/Resource'
          total:
            type: integer
            description: Total count for pagination
          nextCursor:
            type: string
            description: Cursor for next page
```

#### Created
```yaml
'201':
  description: Resource created
  headers:
    Location:
      description: URL of created resource
      schema:
        type: string
        example: /resources/123e4567-e89b-12d3
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/Resource'
```

#### No Content
```yaml
'204':
  description: Successfully processed, no content to return
```

## Batch Operations

### Batch Create
```yaml
/resources/batch:
  post:
    operationId: batchCreateResources
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required: [items]
            properties:
              items:
                type: array
                minItems: 1
                maxItems: 100
                items:
                  $ref: '#/components/schemas/CreateResource'
    responses:
      '207':
        description: Multi-status response
        content:
          application/json:
            schema:
              type: object
              properties:
                succeeded:
                  type: array
                  items:
                    $ref: '#/components/schemas/Resource'
                failed:
                  type: array
                  items:
                    type: object
                    properties:
                      index:
                        type: integer
                      error:
                        $ref: '#/components/schemas/Error'
```

### Batch Update
```yaml
/resources/batch-update:
  patch:
    operationId: batchUpdateResources
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required: [updates]
            properties:
              updates:
                type: array
                minItems: 1
                maxItems: 100
                items:
                  type: object
                  required: [id, changes]
                  properties:
                    id:
                      type: string
                      format: uuid
                    changes:
                      $ref: '#/components/schemas/UpdateResource'
```

## Search Patterns

### Simple Search
```yaml
/resources:
  get:
    parameters:
      - name: q
        in: query
        description: Search query
        schema:
          type: string
          minLength: 3
```

### Advanced Search
```yaml
/resources/search:
  post:
    operationId: searchResources
    description: Complex search with multiple criteria
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              query:
                type: string
              filters:
                type: object
                properties:
                  status:
                    type: array
                    items:
                      type: string
                  dateRange:
                    type: object
                    properties:
                      start:
                        type: string
                        format: date-time
                      end:
                        type: string
                        format: date-time
              sort:
                type: array
                items:
                  type: object
                  properties:
                    field:
                      type: string
                    order:
                      type: string
                      enum: [asc, desc]
```

## File Upload Patterns

### Single File
```yaml
/resources/{id}/image:
  put:
    operationId: uploadResourceImage
    requestBody:
      content:
        multipart/form-data:
          schema:
            type: object
            required: [file]
            properties:
              file:
                type: string
                format: binary
              metadata:
                type: object
                properties:
                  alt:
                    type: string
                  caption:
                    type: string
```

### Multiple Files
```yaml
/resources/{id}/attachments:
  post:
    operationId: uploadAttachments
    requestBody:
      content:
        multipart/form-data:
          schema:
            type: object
            required: [files]
            properties:
              files:
                type: array
                items:
                  type: string
                  format: binary
                maxItems: 10
```

## API Versioning Patterns

### URL Path Versioning
```yaml
servers:
  - url: https://api.example.com/v1
    description: Version 1

paths:
  /v1/resources:
    get:
      # ...
```

### Header Versioning
```yaml
paths:
  /resources:
    get:
      parameters:
        - name: API-Version
          in: header
          required: false
          schema:
            type: string
            default: "1.0"
```

## Quick Decision Guide

| Scenario | Pattern |
|----------|---------|
| List all items | `GET /items` |
| Get specific item | `GET /items/{id}` |
| Create item | `POST /items` |
| Update entire item | `PUT /items/{id}` |
| Update part of item | `PATCH /items/{id}` |
| Delete item | `DELETE /items/{id}` |
| User's items | `GET /users/{userId}/items` |
| Search items | `GET /items?search=query` |
| Complex search | `POST /items/search` |
| Bulk create | `POST /items/batch` |
| Special action | `POST /items/{id}/archive` |

## Anti-Patterns to Avoid

❌ **Verbs in URLs**: `/getUsers`, `/deleteAllMeals`
❌ **Single endpoint doing multiple things**: `/api/process`
❌ **Inconsistent pluralization**: `/user` vs `/meals`
❌ **Deep nesting**: `/users/{id}/meals/{id}/items/{id}/nutrition`
❌ **GET with body**: Use POST for complex queries
❌ **Missing error responses**: Always define 400, 404, 500
❌ **Unbounded lists**: Always include pagination

---

**Remember**: Consistency is more important than perfection. Pick patterns and stick with them throughout the API.