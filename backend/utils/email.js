// OTP email sender. Uses Brevo's HTTPS transactional API in production because
// Render's free tier blocks all outbound SMTP (port 465 and 587 both unreachable),
// which would cause nodemailer to hang the HTTP request for ~2 minutes.
// Falls back to a console log when no provider is configured so local dev keeps
// working without any setup.

function parseSender(raw) {
    const fallback = { name: 'eventHub', email: 'no-reply@eventhub.local' };
    if (!raw) return fallback;
    const match = raw.match(/^\s*(.+?)\s*<\s*([^>]+)\s*>\s*$/);
    if (match) {
        return {
            name: match[1].trim().replace(/^"|"$/g, ''),
            email: match[2].trim(),
        };
    }
    // Plain "user@example.com" — keep default name
    return { name: fallback.name, email: raw.trim() };
}

function buildContent(otp, ttl) {
    const text = `Your password reset code is: ${otp}\n\nThis code will expire in ${ttl} minutes. If you didn't request this, you can safely ignore this email.`;
    const html = `
        <div style="font-family: Inter, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff; color: #0f172a;">
          <h1 style="font-size: 22px; margin: 0 0 16px;">eventHub password reset</h1>
          <p style="color: #475569; line-height: 1.6;">Use the verification code below to reset your password. The code expires in ${ttl} minutes.</p>
          <div style="margin: 24px 0; padding: 20px; background: #e6f7f7; border-radius: 12px; text-align: center;">
            <span style="font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #0c8e8e;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
    `;
    return { text, html };
}

async function sendViaBrevo({ to, subject, html, text }) {
    const sender = parseSender(process.env.EMAIL_FROM);
    // 10s hard cap so a flaky upstream can never hang the password-reset request.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json',
                accept: 'application/json',
            },
            body: JSON.stringify({
                sender,
                to: [{ email: to }],
                subject,
                htmlContent: html,
                textContent: text,
            }),
            signal: controller.signal,
        });

        if (!res.ok) {
            const body = await res.text().catch(() => '');
            throw new Error(`Brevo ${res.status}: ${body.slice(0, 200)}`);
        }
        return { provider: 'brevo' };
    } finally {
        clearTimeout(timeout);
    }
}

async function sendOtpEmail(to, otp) {
    const ttl = process.env.OTP_TTL_MINUTES || 10;
    const subject = 'Your eventHub password reset code';
    const { text, html } = buildContent(otp, ttl);

    if (process.env.BREVO_API_KEY) {
        return sendViaBrevo({ to, subject, html, text });
    }

    // Dev fallback: visibly log so the developer can copy the OTP from server output.
    console.log('\n========================================');
    console.log(`[email:dev] OTP for ${to}: ${otp} (valid ${ttl} min)`);
    console.log('========================================\n');
    if (process.env.NODE_ENV === 'production') {
        console.error('[email:fatal] BREVO_API_KEY missing in production — OTP emails are NOT being delivered. Set BREVO_API_KEY on the backend service.');
    }
    return { mocked: true };
}

module.exports = { sendOtpEmail };
