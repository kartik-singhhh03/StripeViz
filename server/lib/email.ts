/**
 * Email Service using Resend
 * 
 * Handles all transactional emails:
 * - Welcome emails
 * - Password reset
 * - Subscription confirmations
 * - Payment receipts
 * - Alert notifications
 * 
 * FREE TIER: 3,000 emails/month at https://resend.com
 */

import { config, isFeatureEnabled } from './env';

// ============================================
// Types
// ============================================

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// Email Client
// ============================================

/**
 * Send an email via Resend API
 * Falls back to console logging if Resend is not configured
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, text } = options;
  
  // If Resend is not configured, log to console (development mode)
  if (!isFeatureEnabled('email')) {
    console.log('\n📧 EMAIL (Dev Mode - Resend not configured)');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${text || html.substring(0, 200)}...`);
    console.log('');
    
    return { 
      success: true, 
      messageId: `dev-${Date.now()}`,
    };
  }
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.email.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.email.from,
        to,
        subject,
        html,
        text: text || stripHtml(html),
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Email] Send failed:', errorData);
      return {
        success: false,
        error: errorData.message || 'Failed to send email',
      };
    }
    
    const data = await response.json();
    console.log(`[Email] Sent successfully to ${to}: ${data.id}`);
    
    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    console.error('[Email] Error:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

// ============================================
// Email Templates
// ============================================

/**
 * Welcome email for new signups
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: 'Welcome to StripeViz! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to StripeViz! 🎉</h1>
          </div>
          
          <p>Hi ${name || 'there'},</p>
          
          <p>Thanks for signing up! You're all set to start tracking your Stripe metrics and gaining insights into your revenue.</p>
          
          <p>Here's what you can do with StripeViz:</p>
          <ul>
            <li>📊 View real-time revenue metrics</li>
            <li>📈 Track MRR, churn, and growth trends</li>
            <li>👥 Analyze customer behavior</li>
            <li>🔔 Set up smart alerts</li>
          </ul>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${config.frontendUrl}/dashboard" class="button">Go to Dashboard</a>
          </p>
          
          <p>Need help getting started? Just reply to this email - we're happy to help!</p>
          
          <p>Best,<br>The StripeViz Team</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} StripeViz. All rights reserved.</p>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to StripeViz!

Hi ${name || 'there'},

Thanks for signing up! You're all set to start tracking your Stripe metrics.

Visit your dashboard: ${config.frontendUrl}/dashboard

Best,
The StripeViz Team`,
  });
}

/**
 * Password reset email
 */
export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<EmailResult> {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
  
  return sendEmail({
    to,
    subject: 'Reset your StripeViz password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
          .warning { background: #fef3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Reset Your Password</h1>
          
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          
          <div class="warning">
            <strong>⚠️ This link expires in 1 hour.</strong><br>
            If you didn't request this, you can safely ignore this email.
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} StripeViz. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Reset Your Password

We received a request to reset your password.

Click here to reset: ${resetUrl}

This link expires in 1 hour.

If you didn't request this, you can safely ignore this email.`,
  });
}

/**
 * Subscription confirmation email
 */
export async function sendSubscriptionConfirmationEmail(
  to: string,
  plan: string,
  billingCycle: string
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `Welcome to StripeViz ${plan.charAt(0).toUpperCase() + plan.slice(1)}! 🚀`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .plan-badge { display: inline-block; background: #6366f1; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Thanks for upgrading! 🎉</h1>
          
          <p>Your subscription is now active:</p>
          
          <p>
            <span class="plan-badge">${plan.toUpperCase()} PLAN</span>
            <span style="color: #666; margin-left: 10px;">Billed ${billingCycle}</span>
          </p>
          
          <p>You now have access to all ${plan} features including:</p>
          <ul>
            ${plan === 'enterprise' ? `
            <li>✅ Unlimited team members</li>
            <li>✅ Priority support</li>
            <li>✅ Advanced analytics</li>
            <li>✅ Custom integrations</li>
            ` : `
            <li>✅ Unlimited Stripe connections</li>
            <li>✅ Advanced metrics</li>
            <li>✅ Smart alerts</li>
            <li>✅ Data export</li>
            `}
          </ul>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${config.frontendUrl}/dashboard" class="button">Go to Dashboard</a>
          </p>
          
          <p>Need help? Just reply to this email.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} StripeViz. All rights reserved.</p>
            <p><a href="${config.frontendUrl}/billing">Manage subscription</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Thanks for upgrading to ${plan}!

Your subscription is now active (billed ${billingCycle}).

Visit your dashboard: ${config.frontendUrl}/dashboard

Need help? Reply to this email.`,
  });
}

/**
 * Subscription canceled email
 */
export async function sendSubscriptionCanceledEmail(
  to: string,
  endDate: Date
): Promise<EmailResult> {
  const formattedDate = endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return sendEmail({
    to,
    subject: 'Your StripeViz subscription has been canceled',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
          .info-box { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 16px; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>We're sorry to see you go 😢</h1>
          
          <p>Your subscription has been canceled.</p>
          
          <div class="info-box">
            <strong>You'll have access until: ${formattedDate}</strong><br>
            After this date, your account will be downgraded to the free plan.
          </div>
          
          <p>Changed your mind? You can reactivate anytime before your subscription ends:</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${config.frontendUrl}/billing" class="button">Reactivate Subscription</a>
          </p>
          
          <p>We'd love to hear why you canceled - your feedback helps us improve. Just reply to this email.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} StripeViz. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Payment failed email
 */
export async function sendPaymentFailedEmail(to: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: '⚠️ Action required: Payment failed',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
          .warning { background: #fef2f2; border: 1px solid #ef4444; padding: 16px; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Payment Failed ⚠️</h1>
          
          <div class="warning">
            <strong>We couldn't process your payment.</strong><br>
            Please update your payment method to avoid service interruption.
          </div>
          
          <p>This could happen due to:</p>
          <ul>
            <li>Expired card</li>
            <li>Insufficient funds</li>
            <li>Card declined by your bank</li>
          </ul>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${config.frontendUrl}/billing" class="button">Update Payment Method</a>
          </p>
          
          <p>If you need any help, just reply to this email.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} StripeViz. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

// ============================================
// Helpers
// ============================================

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gs, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
