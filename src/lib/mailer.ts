// SMTP health check on boot
async function smtpHealthCheck() {
  try {
    const host = process.env.SMTP_HOST
    const port = process.env.SMTP_PORT
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    if (!host || !port || !user || !pass) {
      console.warn('[Mailer] SMTP config missing: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS')
      return
    }
    const transport = createTransport()
    await transport.verify()
    console.info(`[Mailer] SMTP connection OK (${host}:${port} as ${user})`)
  } catch (e) {
    console.error('[Mailer] SMTP connection failed:', e)
  }
}

// Run health check on module load (server only)
if (typeof window === 'undefined') {
  smtpHealthCheck()
}
import nodemailer from 'nodemailer'

type ResetEmailParams = {
  to: string
  resetUrl: string
}

export function createTransport() {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) {
    throw new Error('SMTP configuration missing: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: { user, pass },
  })
}

export async function sendPasswordResetEmail({ to, resetUrl }: ResetEmailParams) {
  const from = process.env.EMAIL_FROM || 'no-reply@example.com'
  const transport = createTransport()
  const html = `
    <div>
      <p>You requested to reset your password.</p>
      <p>Click the link below to set a new password. This link will expire in ${process.env.PASSWORD_RESET_TTL_MIN || 60} minutes.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `
  await transport.sendMail({ to, from, subject: 'Reset your password', html })
}
