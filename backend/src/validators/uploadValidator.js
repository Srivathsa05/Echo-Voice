import Joi from 'joi';

export const uploadSchema = Joi.object({
  doctorName: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Doctor name is required',
    'string.min': 'Doctor name must be at least 2 characters',
    'string.max': 'Doctor name must not exceed 100 characters'
  }),
  patientName: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Patient name is required',
    'string.min': 'Patient name must be at least 2 characters',
    'string.max': 'Patient name must not exceed 100 characters'
  })
});

export const recordSchema = Joi.object({
  doctorName: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Doctor name is required',
    'string.min': 'Doctor name must be at least 2 characters',
    'string.max': 'Doctor name must not exceed 100 characters'
  }),
  patientName: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Patient name is required',
    'string.min': 'Patient name must be at least 2 characters',
    'string.max': 'Patient name must not exceed 100 characters'
  }),
  audioData: Joi.string().required().messages({
    'string.empty': 'Audio data is required'
  })
});

export const chatSchema = Joi.object({
  sessionId: Joi.string().uuid().required().messages({
    'string.empty': 'Session ID is required',
    'string.guid': 'Invalid session ID format'
  }),
  question: Joi.string().min(5).max(1000).required().messages({
    'string.empty': 'Question is required',
    'string.min': 'Question must be at least 5 characters',
    'string.max': 'Question must not exceed 1000 characters'
  })
});

export const exportSchema = Joi.object({
  sessionId: Joi.string().uuid().required().messages({
    'string.empty': 'Session ID is required',
    'string.guid': 'Invalid session ID format'
  }),
  format: Joi.string().valid('pdf').default('pdf')
});
