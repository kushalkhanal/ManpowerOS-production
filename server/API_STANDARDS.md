# API Response Standards

## Standard Response Format

All API responses must follow this consistent format:

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // Optional validation errors
}
```

## Using apiResponse Helpers

Import and use the standardized helpers from `src/utils/apiResponse.js`:

```javascript
import * as apiResponse from '../utils/apiResponse.js';

// Success (200)
return apiResponse.success(res, data, 'Optional message');

// Created (201)
return apiResponse.created(res, newResource, 'Resource created');

// No Content (204)
return apiResponse.noContent(res);

// Error (400, 409, etc.)
return apiResponse.error(res, 'Error message', 400);

// Not Found (404)
return apiResponse.notFound(res, 'Resource not found');

// Forbidden (403)
return apiResponse.forbidden(res, 'Insufficient permissions');

// Unauthorized (401)
return apiResponse.unauthorized(res, 'Authentication required');
```

## Status Codes

Use appropriate HTTP status codes:

- **200 OK**: Successful GET, PUT, PATCH
- **201 Created**: Successful POST
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Validation errors, malformed requests
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Authenticated but insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Duplicate resource (e.g., unique constraint violation)
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Unexpected server errors

## Pagination Response

For paginated endpoints, include pagination metadata:

```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Error Details

For validation errors, include field-specific details:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "phone",
      "message": "Phone must be 10 digits"
    }
  ]
}
```

## Examples

### GET /api/candidates/:id

```javascript
const candidate = await Candidate.findById(id);
if (!candidate) {
  return apiResponse.notFound(res, 'Candidate not found');
}
return apiResponse.success(res, candidate);
```

### POST /api/passports

```javascript
const passport = await Passport.create(data);
return apiResponse.created(res, passport, 'Passport added to pool');
```

### DELETE /api/tasks/:id

```javascript
await Task.findByIdAndDelete(id);
return apiResponse.noContent(res);
```

### Error Handling

```javascript
try {
  // operation
} catch (error) {
  if (error.code === 11000) {
    return apiResponse.error(res, 'Duplicate entry', 409);
  }
  return apiResponse.error(res, error.message, 500);
}
```

## Best Practices

1. **Always use helpers**: Never use raw `res.json()` or `res.status().json()`
2. **Consistent messages**: Use clear, user-friendly error messages
3. **Include data**: Always include relevant data in success responses
4. **Handle all cases**: Return appropriate status codes for all scenarios
5. **Log errors**: Use logger for 500 errors before returning to client

## Migration

To update existing endpoints:

**Before:**
```javascript
res.status(200).json({ message: 'Success', candidate });
```

**After:**
```javascript
return apiResponse.success(res, candidate, 'Success');
```

---

This standard is enforced across all controllers to ensure consistent API behavior and better client error handling.
