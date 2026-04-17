import twilio from 'twilio';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

// Initialize Twilio client if credentials are available
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
  logger.info('Twilio client initialized');
} else {
  logger.warn('Twilio credentials not found. SMS functionality will be disabled.');
}

export const twilioService = {
  /**
   * Send SMS message
   * @param {string} to - Recipient phone number (E.164 format)
   * @param {string} message - Message content
   * @returns {Promise<Object>} Twilio message object
   */
  async sendSMS(to, message) {
    if (!client) {
      throw new Error('Twilio client not initialized. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
    }

    if (!fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER not configured in .env');
    }

    try {
      const twilioMessage = await client.messages.create({
        body: message,
        from: fromNumber,
        to: to
      });

      logger.info(`SMS sent to ${to}: ${twilioMessage.sid}`);
      return twilioMessage;
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  },

  /**
   * Send consultation summary via SMS
   * @param {string} to - Recipient phone number
   * @param {Object} consultation - Consultation data
   * @returns {Promise<Object>} Twilio message object
   */
  async sendConsultationSummary(to, consultation) {
    const { summary, doctorName, patientName, createdAt } = consultation;

    let message = `Echo Consultation Summary\n`;
    message += `Doctor: ${doctorName}\n`;
    message += `Patient: ${patientName}\n`;
    message += `Date: ${new Date(createdAt).toLocaleDateString()}\n\n`;

    if (summary && summary.diagnosis && summary.diagnosis.length > 0) {
      message += `Diagnosis:\n`;
      summary.diagnosis.forEach(d => {
        message += `  ${d.title}\n`;
      });
      message += `\n`;
    }

    if (summary && summary.medications && summary.medications.length > 0) {
      message += `Medications:\n`;
      summary.medications.forEach(m => {
        message += `  ${m.name} - ${m.dose} (${m.frequency})\n`;
      });
      message += `\n`;
    }

    if (summary && summary.nextSteps && summary.nextSteps.length > 0) {
      message += `Next Steps:\n`;
      summary.nextSteps.slice(0, 3).forEach(s => {
        message += `  ${s.title}\n`;
      });
      message += `\n`;
    }

    message += `\nView full summary at your Echo dashboard.`;

    // Check if message exceeds SMS limit (1600 chars for concatenated SMS)
    if (message.length > 1600) {
      logger.warn(`Message too long (${message.length} chars). Truncating.`);
      message = message.substring(0, 1597) + '...';
    }

    return this.sendSMS(to, message);
  },

  /**
   * Send medication reminder via SMS
   * @param {string} to - Recipient phone number
   * @param {Object} medication - Medication details
   * @returns {Promise<Object>} Twilio message object
   */
  async sendMedicationReminder(to, medication) {
    const message = `Echo Medication Reminder\n\n`;
    message += `Medicine: ${medication.name}\n`;
    message += `Dose: ${medication.dose}\n`;
    message += `Frequency: ${medication.frequency}\n`;
    message += `Timing: ${medication.timing}\n\n`;
    message += `Take as prescribed by your doctor.`;

    return this.sendSMS(to, message);
  },

  /**
   * Verify phone number format (E.164)
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} True if valid
   */
  validatePhoneNumber(phoneNumber) {
    // E.164 format: +[country code][number]
    const e164Pattern = /^\+[1-9]\d{1,14}$/;
    return e164Pattern.test(phoneNumber);
  },

  /**
   * Format phone number to E.164
   * @param {string} phoneNumber - Phone number to format
   * @param {string} countryCode - Country code (e.g., '91' for India)
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber, countryCode = '91') {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // If number starts with 0, remove it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Add country code if not present
    if (!cleaned.startsWith('+')) {
      cleaned = `+${countryCode}${cleaned}`;
    }

    return cleaned;
  },

  /**
   * Check if Twilio is configured
   * @returns {boolean} True if configured
   */
  isConfigured() {
    return !!(client && fromNumber);
  }
};
