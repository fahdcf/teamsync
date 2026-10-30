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

## Confirmed historical exposure and rotation

The completion review inspected the configuration revisions in Git history. Commit
`85c4c99` contains literal values for `spring.datasource.password` and `jwt.secret`
in `src/main/resources/application.properties`. Treat those values as exposed;
their removal by `ad3e261` does not revoke them. The values are intentionally not
reproduced here. The checked configuration revisions did not contain an NVIDIA
provider key; rotate any provider key separately if it was disclosed elsewhere.

Perform these steps for each environment that used the exposed values:

1. **JWT signing key:** generate a fresh random key with the command above. Set
   `JWT_SECRET` in the deployment's environment or secret store and restart every
   TeamSync instance using that key. Verify that a JWT issued with the old key gets
   HTTP 401 and a fresh login works. Key rotation deliberately signs everyone out.
2. **PostgreSQL password:** identify the actual deployment role from `DB_USERNAME`.
   Connect as an authorized PostgreSQL operator and use psql's interactive
   `\password <deployment_role>` command. Enter a new unique password at the prompt;
   do not put it in a committed SQL file or shell command. Update `DB_PASSWORD` in
   the deployment environment/secret store and restart the application connection
   pool. Verify a fresh connection using the new credential and rejection of the
   previous password. Schedule the restart with the database credential change.
3. Update ignored local `.env` files that reuse either value. Keep `.env.example`
   blank; do not paste new credentials into GitHub, this report, logs or commits.
4. Review accounts already carrying ADMIN or PROJECT_MANAGER because historical
   registration allowed self-selected roles. Keep only operator-approved privileged
   accounts; use the administrator role endpoint for subsequent account changes.

No production credentials were changed by the automated completion review. It
verified source configuration and test environments, not access to a production
database or a provider's account. No shared Git history was rewritten.
