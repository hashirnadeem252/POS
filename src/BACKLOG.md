# Backlog — Deferred Items

## 📌 Wire up password reset email
- **When:** During deployment
- **Why deferred:** Console-only works for local testing
- **Provider:** Resend (3k/month free) or Brevo
- **Steps:**
  1. Sign up at resend.com, verify domain
  2. Implement IEmailSender + ResendEmailSender
  3. Register based on environment in Program.cs
  4. Update AuthService.CreatePasswordResetTokenAsync to call _email.SendAsync(...)
  5. Test end-to-end
- **Current state:** console log shows token; works for testing