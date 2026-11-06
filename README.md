# pmap-frontend

## API types

`src/api/schema.d.ts` is generated from the backend's OpenAPI document and committed. To regenerate it,
put the backend base URL (the gateway `ApiUrl`, or the site address with `/api`) in `.env.local`:

```bash
VITE_API_TARGET=https://<gateway-or-site>
```

and run `npm run api:types`. A `VITE_API_TARGET` set in the shell takes precedence over `.env.local`.

The script (`scripts/api-types.sh`) downloads `$VITE_API_TARGET/openapi.json`. It runs
`openapi-typescript` through `npx` with a pinned TypeScript 5, because the generator does not work with
the project's TypeScript 7.

## Dev server

`npm run dev` proxies `/api` to the backend, removing the `/api` prefix (`/api/territories` becomes
`$VITE_API_TARGET/territories`). Copy `.env.example` to `.env.local` (git-ignored) and set
`VITE_API_TARGET`. Without it the dev server starts but warns that `/api` is not proxied. In
production `/api` is routed by the infrastructure stack.
