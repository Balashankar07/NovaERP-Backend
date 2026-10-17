==========================
SOURCE OF TRUTH
==========================

The following project documents are the ONLY source of truth.

- 01-PRD.md
- 02-TRD.md
- 03-AppFlow.md
- 04-UIUXDesignBrief.md
- 05-BackendSchema.md
- 06-ImplementationPlan.md

If this prompt conflicts with the project documents,

ALWAYS follow the project documents.

Do NOT invent functionality that is not defined in the project documentation.

==========================
DESIGN RULES
==========================

Preserve the approved design system.

Do NOT redesign pages unless explicitly instructed.

Keep

- spacing
- typography
- colors
- icons
- layout
- navigation
- component hierarchy

consistent across the application.

Improve functionality without changing the approved visual identity.

==========================
API RULES
==========================

Consume ONLY existing backend APIs.

Do NOT invent endpoints.

Do NOT assume API responses.

Reuse the existing ApiResponse<T> contract.

Respect existing HTTP status codes.

Respect backend validation.

If an API does not exist,

state it clearly instead of inventing one.

==========================
RBAC RULES
==========================

The frontend must respect backend authorization.

Implement

- Protected Routes
- Permission-based navigation
- Permission-based buttons
- Permission-based pages

Never rely solely on frontend protection.

Backend authorization remains the final authority.

==========================
AUTHENTICATION RULES
==========================

Reuse the existing backend JWT implementation.

Do NOT modify authentication.

Support

- Login
- Logout
- Session persistence
- Token expiration
- Unauthorized redirects

without changing backend behavior.

==========================
PERFORMANCE RULES
==========================

Avoid unnecessary re-renders.

Use lazy loading where appropriate.

Memoize only when beneficial.

Split routes when appropriate.

Do not prematurely optimize.

Keep bundle size reasonable.

==========================
ACCESSIBILITY RULES
==========================

Use semantic HTML.

Support keyboard navigation.

Provide ARIA labels where appropriate.

Maintain sufficient color contrast.

Manage focus correctly.

Avoid inaccessible custom controls.

==========================
ERROR HANDLING
==========================

Provide

- Loading states
- Empty states
- Error states
- Network failure handling
- Unauthorized handling
- Not Found pages

Use consistent user-friendly messages.

Do not expose internal errors.

==========================
VERIFICATION
==========================

Before completion verify

- npm run build
- TypeScript compilation
- No console errors
- No runtime errors
- Existing functionality still works
- No regression introduced

==========================
STOP RULE
==========================

Stop immediately after implementing the requested feature.

Do NOT continue to another feature.

Do NOT perform unrelated refactoring.

Do NOT modify frozen features.