# TeamSync Angular frontend

Angular 21 standalone components, API services, session-based bearer token storage,
route guards and HTTP interceptors. The backend remains the permission authority.
See the [root README](../../README.md) for architecture, roles and environment setup.

Use Node 22.12+ (or a compatible Angular 21 Node release) and npm:

```sh
npm ci
npm start
npm test -- --watch=false
npm run build
```

Development uses the API URL in src/environments/environment.ts. Production uses
the same-origin /api path in environment.prod.ts and needs a reverse proxy.
Bearer headers are only sent to this API. Credentials use session storage and
expired sessions clear the rendered account. Backend permission flags control
project/task management actions; there is no public role-selection field.

Vitest covers authentication flows, token boundary and error handling, services,
Kanban interactions and representative UI components. There is no configured
end-to-end browser test runner.
