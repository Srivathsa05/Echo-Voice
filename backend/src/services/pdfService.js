import PDFDocument from 'pdfkit';
import fs from 'fs';
import { logger } from '../utils/logger.js';

export const pdfService = {
  async generateConsultationPDF(session, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        this.addHeader(doc, session);
        this.addSummary(doc, session);
        this.addMedications(doc, session);
        this.addQuestions(doc, session);
        this.addTranscript(doc, session);
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          logger.info('PDF generated successfully');
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          logger.error('PDF generation error:', error);
          reject(error);
        });
      } catch (error) {
        logger.error('PDF creation error:', error);
        reject(error);
      }
    });
  },

  addHeader(doc, session) {
    doc.fontSize(24).font('Helvetica-Bold').text('Echo Consultation Summary', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica');
    doc.text(`Doctor: ${session.doctorName}`);
    doc.text(`Patient: ${session.patientName}`);
    doc.text(`Date: ${new Date(session.createdAt).toLocaleDateString()}`);
    
    if (session.audioFile?.duration) {
      const minutes = Math.floor(session.audioFile.duration / 60);
      const seconds = Math.floor(session.audioFile.duration % 60);
      doc.text(`Duration: ${minutes}m ${seconds}s`);
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
  },

  addSummary(doc, session) {
    if (!session.summary) return;

    doc.fontSize(16).font('Helvetica-Bold').text('Consultation Summary');
    doc.moveDown();

    const sections = [
      { title: 'Diagnosis', items: session.summary.diagnosis },
      { title: 'Vital Signs', items: session.summary.vitals },
      { title: 'Lifestyle Recommendations', items: session.summary.lifestyle },
      { title: 'Lab Tests & Follow-ups', items: session.summary.labs },
      { title: 'Next Steps', items: session.summary.nextSteps },
      { title: 'Important Notes', items: session.summary.importantNotes },
      { title: 'Warnings', items: session.summary.warnings }
    ];

    sections.forEach(section => {
      if (section.items && section.items.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text(section.title);
        doc.moveDown(0.3);

        section.items.forEach(item => {
          const urgency = item.urgency || 'green';
          const urgencySymbol = urgency === 'red' ? '!' : urgency === 'amber' ? '!' : '';
          
          doc.fontSize(11).font('Helvetica');
          doc.text(`${urgencySymbol} ${item.title}`, { continued: false });
        });

        doc.moveDown();
      }
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
  },

  addMedications(doc, session) {
    if (!session.summary?.medications || session.summary.medications.length === 0) return;

    doc.fontSize(16).font('Helvetica-Bold').text('Medication Timeline');
    doc.moveDown();

    session.summary.medications.forEach(med => {
      doc.fontSize(12).font('Helvetica-Bold').text(med.name);
      doc.fontSize(10).font('Helvetica');
      doc.text(`  Dosage: ${med.dose}`);
      doc.text(`  Frequency: ${med.frequency}`);
      doc.text(`  Timing: ${med.timing}`);
      doc.moveDown();
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
  },

  addQuestions(doc, session) {
    if (!session.questions || session.questions.questions.length === 0) return;

    doc.fontSize(16).font('Helvetica-Bold').text('Forgotten Questions');
    doc.moveDown();

    session.questions.questions.forEach((question, index) => {
      doc.fontSize(11).font('Helvetica-Bold').text(`Q${index + 1}: ${question}`);
      
      if (session.questions.answers[index]) {
        doc.fontSize(10).font('Helvetica');
        doc.text(`A: ${session.questions.answers[index]}`);
      }
      
      doc.moveDown();
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
  },

  addTranscript(doc, session) {
    if (!session.transcript || !session.transcript.segments) return;

    doc.fontSize(16).font('Helvetica-Bold').text('Full Transcript');
    doc.moveDown();

    session.transcript.segments.forEach(segment => {
      const speaker = segment.speaker || 'Unknown';
      doc.fontSize(10).font('Helvetica-Bold').text(`${speaker}:`);
      doc.fontSize(9).font('Helvetica').text(segment.text);
      doc.moveDown(0.5);
    });
  },

  addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    const { start, end } = doc.bufferedPageRange();
    
    // Only add footer if pages exist
    if (pageCount > 0) {
      for (let i = start; i <= end; i++) {
        try {
          doc.switchToPage(i);
          doc.fontSize(8).font('Helvetica').text(
            `Generated by Echo - AI-Powered Patient Recall System`,
            50,
            doc.page.height - 30,
            { align: 'center' }
          );
        } catch (error) {
          // Skip if page doesn't exist
          continue;
        }
      }
    }
  }
};
