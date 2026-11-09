# Runbook: frontend on AWS (dev)

Stack `pmap-dev-frontend` (`infra/frontend.yaml`), region `eu-north-1`. It needs the stack
`pmap-dev-gateway` of the backend: the API address is read from its output `ApiUrl`.

## 1. How it works

- S3 bucket `pmap-dev-frontend-<account>` is private. Only the CloudFront distribution reads it.
- CloudFront serves the site over HTTPS. Paths without a file extension get `index.html`, so a page
  reload on `/transactions` works.
- `/api/*` goes to the API Gateway with the `/api` prefix removed: the app calls `/api/transactions`,
  the gateway receives `/transactions`. The browser sees one address, so the backend needs no CORS.
- `assets/*` (hash in the name) is cached for a year; everything else is checked again each time.

## 2. Deploy

```
PR        -> checks: lint, format check, tests, build
push main -> checks -> deploy (GitHub machine): ./scripts/aws.sh deploy
```

In this repo: GitHub -> Settings -> Secrets and variables -> Actions -> **Secrets** ->
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (the same values as in the backend repo).
The IAM user must be allowed to use CloudFormation, S3 and CloudFront.

By hand (`aws login` first, Node 22 and `npm ci` done):

```bash
./scripts/aws.sh deploy
./scripts/aws.sh check
```

`check` prints the site address and the status codes of `/`, `/transactions` and `/api/health`;
all three must be 200. The first deploy takes 5-10 minutes (CloudFront).

## 3. When something fails

| Error | Cause |
| --- | --- |
| `stack pmap-dev-gateway not found` | the gateway of the backend is not deployed |
| `AccessDenied` on `cloudformation`, `s3` or `cloudfront` | the IAM user of CI has no such permission |
| the site shows an XML `AccessDenied` | bucket is empty (first deploy has not uploaded the site) |
| `/api/...` returns the page instead of JSON | the old `index.html` is cached: wait for the invalidation or run `check` again |
| `/api/...` answers 403 `Forbidden` from the gateway | no or expired token: the route needs `Authorization: Bearer <access_token>` |
