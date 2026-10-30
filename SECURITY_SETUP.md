# Local secrets

Copy `.env.example` to `.env` and set `DB_PASSWORD` and `JWT_SECRET`, or supply
those variables through your process environment. The existing Spring config
import reads the local `.env` file as Java properties. Use a unique JWT secret
with at least 32 random bytes encoded as 64 hexadecimal characters. For example, this Python command generates a new
64-character hexadecimal value locally:

```sh
python -c "import secrets; print(secrets.token_hex(32))"
```

Do not copy the generated value into tracked configuration. Restart the server
after changing it; existing tokens signed with the previous value must no longer
be trusted. Rotate the old database password in PostgreSQL if it was reused.
Supply `NVIDIA_AI_API_KEY` only if enabling the AI integration.

The cleanup changes source configuration, not any running deployment, provider
account or Git history. Review deployed settings and rotate exposed credentials.
