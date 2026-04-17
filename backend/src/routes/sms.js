import express from 'express';
import { twilioService } from '../services/twilioService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post('/send', async (req, res, next) => {
  try {
    const { sessionId, phoneNumber, type } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing sessionId',
        message: 'Session ID is required'
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Missing phoneNumber',
        message: 'Phone number is required'
      });
    }

    if (!twilioService.isConfigured()) {
      return res.status(503).json({
        error: 'Twilio not configured',
        message: 'SMS service is not available. Please configure Twilio credentials.'
      });
    }

    // Validate phone number
    const isValid = twilioService.validatePhoneNumber(phoneNumber);
    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid phone number',
        message: 'Phone number must be in E.164 format (e.g., +1234567890)'
      });
    }

    // Get consultation data
    const { consultationModel } = await import('../models/consultationModel.js');
    const consultation = await consultationModel.getFullConsultation(sessionId);

    if (!consultation) {
      return res.status(404).json({
        error: 'Consultation not found',
        message: 'No consultation found with the provided ID'
      });
    }

    // Prepare consultation data for SMS
    const consultationData = {
      doctorName: consultation.doctor_name,
      patientName: consultation.patient_name,
      createdAt: consultation.created_at,
      summary: consultation.summary ? {
        diagnosis: consultation.summary.diagnosis || [],
        medications: consultation.summary.medications || [],
        nextSteps: consultation.summary.next_steps || []
      } : null
    };

    let message;
    if (type === 'summary') {
      message = await twilioService.sendConsultationSummary(phoneNumber, consultationData);
    } else {
      message = await twilioService.sendSMS(phoneNumber, 'Echo consultation summary available. Check your dashboard for details.');
    }

    logger.info(`SMS sent to ${phoneNumber}: ${message.sid}`);
    
    res.json({
      success: true,
      messageSid: message.sid,
      to: phoneNumber,
      status: message.status
    });
  } catch (error) {
    logger.error('SMS send error:', error);
    next(error);
  }
});

export default router;
