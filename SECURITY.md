# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by emailing the maintainer directly. Do not open a public issue.

### What to include:
- Description of the vulnerability
- Steps to reproduce
- Possible impact
- Suggested fix (if any)

## Security Features

This project includes:

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Rate Limiting** - Prevents brute force attacks
- ✅ **Helmet** - HTTP security headers
- ✅ **CORS** - Cross-origin protection
- ✅ **Input Validation** - Zod schema validation
- ✅ **Role-Based Access Control** - Admin/User permissions
- ✅ **Refresh Tokens** - Secure session management

## Best Practices

When using this API:

1. **Never commit secrets** - Use environment variables
2. **Use HTTPS** in production
3. **Rotate JWT secrets** regularly
4. **Keep dependencies updated**
5. **Enable all GitHub security features**

## Dependencies

We use Dependabot to keep dependencies updated automatically.

---

**Last updated:** March 2026
