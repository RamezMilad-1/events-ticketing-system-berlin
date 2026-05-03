const nodemailer = require('nodemailer');

let cachedTransporter = null;

function getTransporter() {
    if (cachedTransporter) return cachedTransporter;

    if (!process.env.EMAIL_HOST) {
        return null; // signal: dev fallback, log to console
    }

    cachedTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: Number(process.env.EMAIL_PORT) === 465,
        auth: process.env.EMAIL_USER
            ? {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            }
            : undefined,
    });

    return cachedTransporter;
}

async function sendOtpEmail(to, otp) {
    const transporter = getTransporter();
    const from = process.env.EMAIL_FROM || 'EventHub <no-reply@eventhub.local>';
    const ttl = process.env.OTP_TTL_MINUTES || 10;

    const subject = 'Your EventHub password reset code';
    const text = `Your password reset code is: ${otp}\n\nThis code will expire in ${ttl} minutes. If you didn't request this, you can safely ignore this email.`;
    const html = `
        <div style="font-family: Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff; color: #0f172a;">
          <h1 style="font-size: 22px; margin: 0 0 16px;">EventHub password reset</h1>
          <p style="color: #475569; line-height: 1.6;">Use the verification code below to reset your password. The code expires in ${ttl} minutes.</p>
          <div style="margin: 24px 0; padding: 20px; background: #eef2ff; border-radius: 12px; text-align: center;">
            <span style="font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #4338ca;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
    `;

    if (!transporter) {
        // Dev fallback: visibly log so the team can copy the OTP from server output
        console.log('\n========================================');
        console.log(`[email:dev] OTP for ${to}: ${otp} (valid ${ttl} min)`);
        console.log('========================================\n');
        return { mocked: true };
    }

    return transporter.sendMail({ from, to, subject, text, html });
}

module.exports = { sendOtpEmail };
