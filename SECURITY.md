# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in MatchIQ, please report it via:

- **Email**: Create an issue at https://github.com/Vasil-Sh/CS/issues (use the "Security" label)
- **Telegram**: https://t.me/cs2beet

**Please do not report security vulnerabilities through public GitHub issues.**

### What to expect

- **Acknowledgment**: Within 48 hours
- **Fix timeline**: Critical issues within 7 days; non-critical within 30 days
- **Disclosure**: Coordinated disclosure after the fix is deployed

## Security Measures

- All API endpoints use JWT access + refresh tokens with httpOnly cookies
- Passwords hashed with bcryptjs (12 rounds)
- Rate limiting (100 req/min per IP, 300 req/min per user)
- CORS restricted to known origins
- Content-Security-Policy headers on both frontend (Vercel) and backend (Railway)
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- Zod validation on all API inputs
- SQL injection prevention via Drizzle ORM parameterized queries
- No sensitive data in localStorage (only UI preferences)
