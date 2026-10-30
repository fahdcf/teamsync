# Secrets and account rollout

Copy .env.example to the ignored .env and set DB_PASSWORD and JWT_SECRET, or supply
process environment variables. The local file uses Java properties syntax.
Generate a unique key of at least 32 random bytes encoded as hexadecimal:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Never commit the generated value. Rotate keys/passwords previously committed or
reused in deployments. Source cleanup does not rotate provider credentials or
rewrite Git history. Supply NVIDIA_AI_API_KEY only to enable the AI integration.

JWTs now contain a stable user UUID, issuer, expiration and password version.
Existing email-subject tokens require a fresh login. Current database roles and
workspace participation govern every new request. Password changes invalidate old
tokens; logout only removes browser credentials. Session storage is still readable
by JavaScript: deploy over HTTPS and maintain XSS protections.

Registration only creates TEAM_MEMBER accounts. Review existing privileged users:
the previous registration allowed arbitrary roles. Bootstrap a trusted initial
administrator through an operator-controlled database procedure, never through a
public endpoint. Subsequent role changes use the administrator-only role API.

Read [the audit and rollout policy](docs/SECURITY_AUDIT.md) before deploying.
No database relationships or stored role values are changed by this refactor.
