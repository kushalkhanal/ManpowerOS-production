# API Versioning Strategy

## Current Status

ManpowerOS API is currently unversioned (all routes under `/api/*`). This document outlines the versioning strategy for future breaking changes.

## Versioning Approach

We use **URL-based versioning** with the format: `/api/v{N}/*`

### Version Lifecycle

1. **Current Version (v1)**: `/api/v1/*` - Latest stable version
2. **Legacy Versions**: Maintained for a deprecation period (6-12 months)
3. **Beta Versions**: `/api/beta/*` - For testing new features (optional)

## Migration Path

### Phase 1: Add v1 Namespace (Optional)

To prepare for future versions without breaking existing integrations:

```javascript
// server/app.js
import authRoutesV1 from './src/routes/v1/auth.js';
import passportRoutesV1 from './src/routes/v1/passports.js';
// ... other routes

// Version 1 API (new endpoints)
app.use('/api/v1/auth', authRoutesV1);
app.use('/api/v1/passports', passportRoutesV1);
// ... other v1 routes

// Legacy unversioned API (backward compatibility)
app.use('/api/auth', authRoutesV1);  // Same handler
app.use('/api/passports', passportRoutesV1);
```

### Phase 2: Deprecate Unversioned Routes

After all clients migrate to `/api/v1/*`:

1. Add deprecation headers:
   ```javascript
   app.use('/api/*', (req, res, next) => {
     if (!req.path.startsWith('/v1')) {
       res.setHeader('X-API-Deprecated', 'true');
       res.setHeader('X-API-Deprecation-Date', '2027-01-01');
       res.setHeader('X-API-Sunset-Date', '2027-06-01');
     }
     next();
   });
   ```

2. Log deprecation warnings
3. Notify clients via email/dashboard
4. Remove unversioned routes after sunset date

### Phase 3: Introduce v2

When introducing breaking changes:

1. Create new route files under `src/routes/v2/`
2. Mount v2 routes: `app.use('/api/v2/*', ...)`
3. Maintain v1 routes alongside v2
4. Document migration guide
5. Deprecate v1 after transition period

## Version Compatibility

### What Requires a New Version

Breaking changes that require a new major version:

- Removing endpoints or parameters
- Changing response structure
- Renaming fields
- Changing authentication method
- Modifying status codes for existing errors

### What Doesn't Require a New Version

Non-breaking changes (patch/minor):

- Adding new endpoints
- Adding optional parameters
- Adding new response fields
- Fixing bugs
- Performance improvements
- Adding new error codes

## Current API Structure

All current routes are under `/api/*`:

```
/api/auth
/api/passports
/api/candidates
/api/medical
/api/orientation
/api/insurance-ssf
/api/demands
/api/fees
/api/alerts
/api/agencies
/api/staff
/api/sponsors
/api/tasks
/api/agency-docs
/api/feims
/api/documents
/api/departments
/api/superadmin
/health (no /api prefix)
/ready
/live
```

## Future v1 Structure

When implementing versioning:

```
/api/v1/auth
/api/v1/passports
/api/v1/candidates
... (same as current)
```

## Client Migration

### Frontend

Update API base URL:

```javascript
// Before
const API_BASE = '/api';

// After
const API_BASE = '/api/v1';
```

Or use environment variable:

```javascript
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_BASE = `/api/${API_VERSION}`;
```

### Mobile/External Clients

Notify all API consumers:
1. Email notification with migration guide
2. Dashboard banner showing deprecation timeline
3. API documentation updates
4. Changelog entry

## Versioning Best Practices

1. **Semantic Versioning**: Use `v1`, `v2`, etc. for major versions only
2. **Backward Compatibility**: Maintain old versions during transition
3. **Clear Documentation**: Document all breaking changes
4. **Gradual Migration**: Give clients 6-12 months to migrate
5. **Deprecation Headers**: Use HTTP headers to signal deprecation
6. **Feature Flags**: Use flags to test v2 features in v1

## Example: Future v2 Breaking Change

Suppose we want to change the passport response structure:

### v1 Response
```json
{
  "success": true,
  "data": {
    "passportNumber": "PA123456",
    "fullName": "John Doe",
    "expiryDate": "2030-01-01"
  }
}
```

### v2 Response (Breaking Change)
```json
{
  "success": true,
  "data": {
    "id": "PA123456",
    "holder": {
      "name": "John Doe"
    },
    "validity": {
      "expires": "2030-01-01"
    }
  }
}
```

Both versions would coexist during the transition period.

## Implementation Checklist

When adding versioning:

- [ ] Create `src/routes/v1/` directory
- [ ] Copy all route files to v1 folder
- [ ] Update imports in `app.js`
- [ ] Mount both `/api/*` (legacy) and `/api/v1/*` routes
- [ ] Update API documentation
- [ ] Add version to health check response
- [ ] Test all endpoints under new v1 namespace
- [ ] Update frontend to use v1
- [ ] Notify external API consumers
- [ ] Set deprecation timeline for unversioned routes

## Status

**Current**: Unversioned (`/api/*`)  
**Next Step**: Add v1 namespace when first breaking change is needed  
**Timeline**: TBD based on business requirements

---

For questions about API versioning, contact the development team.
