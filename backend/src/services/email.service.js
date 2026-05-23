import { Resend } from "resend";

// Initialize Resend with the API key from environment variables.
// If missing, we mock the key to prevent immediate crashes and handle it gracefully below.
const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

// Resend requires a verified domain to send FROM. 
// For testing/development, they provide a sandbox email:
const FROM_EMAIL = "onboarding@resend.dev";

export const emailService = {
  /**
   * Send an email when a booking is cancelled.
   */
  async sendCancellationEmail(booking) {
    if (!process.env.RESEND_API_KEY) {
      console.log(`[Email Service] (MOCK) Cancellation Email would be sent to: ${booking.bookerEmail}`);
      return;
    }

    try {
      const data = await resend.emails.send({
        from: `Scheduler <${FROM_EMAIL}>`,
        reply_to: booking.user?.email || undefined,
        to: booking.bookerEmail,
        subject: `Cancelled: ${booking.eventType?.title || 'Meeting'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 24px;">
            <h2 style="color: #dc2626; margin-top: 0;">Meeting Cancelled</h2>
            <p>Hi ${booking.bookerName},</p>
            <p>Your upcoming meeting has been cancelled.</p>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin: 20px 0; color: #333;">
              <strong>Event:</strong> ${booking.eventType?.title || 'Meeting'}<br/>
              <strong>Original Date:</strong> ${new Date(booking.startTime).toUTCString()}
            </div>
            <p>If you need to reschedule, please visit the booking page again.</p>
          </div>
        `,
      });
      console.log("[Email Service] Cancellation email sent:", data.id);
    } catch (error) {
      console.error("[Email Service] Failed to send cancellation email:", error);
    }
  },

  /**
   * Send an email when a booking is rescheduled.
   */
  async sendRescheduleEmail(booking) {
    if (!process.env.RESEND_API_KEY) {
      console.log(`[Email Service] (MOCK) Reschedule Email would be sent to: ${booking.bookerEmail}`);
      return;
    }

    try {
      const data = await resend.emails.send({
        from: `Scheduler <${FROM_EMAIL}>`,
        reply_to: booking.user?.email || undefined,
        to: booking.bookerEmail,
        subject: `Rescheduled: ${booking.eventType?.title || 'Meeting'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 24px;">
            <h2 style="color: #2563eb; margin-top: 0;">Meeting Rescheduled</h2>
            <p>Hi ${booking.bookerName},</p>
            <p>Your meeting has been successfully rescheduled. Here are the new details:</p>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin: 20px 0; color: #333;">
              <strong>Event:</strong> ${booking.eventType?.title || 'Meeting'}<br/>
              <strong>New Time:</strong> ${new Date(booking.startTime).toUTCString()}
            </div>
            <p>We look forward to speaking with you!</p>
          </div>
        `,
      });
      console.log("[Email Service] Reschedule email sent:", data.id);
    } catch (error) {
      console.error("[Email Service] Failed to send reschedule email:", error);
    }
  },

  /**
   * Send an email when a new booking is created.
   */
  async sendBookingEmail(booking) {
    if (!process.env.RESEND_API_KEY) {
      console.log(`[Email Service] (MOCK) New Booking Email would be sent to: ${booking.bookerEmail}`);
      return;
    }

    try {
      const data = await resend.emails.send({
        from: `Scheduler <${FROM_EMAIL}>`,
        reply_to: booking.user?.email || undefined,
        to: booking.bookerEmail,
        subject: `Confirmed: ${booking.eventType?.title || 'Meeting'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; padding: 24px;">
            <h2 style="color: #10b981; margin-top: 0;">Meeting Confirmed</h2>
            <p>Hi ${booking.bookerName},</p>
            <p>Your meeting has been successfully booked.</p>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin: 20px 0; color: #333;">
              <strong>Event:</strong> ${booking.eventType?.title || 'Meeting'}<br/>
              <strong>Date & Time:</strong> ${new Date(booking.startTime).toUTCString()}
            </div>
            <p>We look forward to speaking with you!</p>
          </div>
        `,
      });
      console.log("[Email Service] New booking email sent:", data.id);
    } catch (error) {
      console.error("[Email Service] Failed to send new booking email:", error);
    }
  }
};
