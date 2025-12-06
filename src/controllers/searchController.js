const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const pool = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const searchEvidenceAndSubmissions = async (req, res) => {
  try {
    const { q, case_id, start_date, end_date, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 'evidence' as type, e.id, e.filename as title, e.file_hash as hash, e.created_at, c.case_number
      FROM evidence e
      JOIN cases c ON e.case_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      query += ` AND e.filename ILIKE $${params.length}`;
    }
    if (case_id) {
      params.push(case_id);
      query += ` AND e.case_id = $${params.length}`;
    }
    if (start_date) {
      params.push(new Date(start_date));
      query += ` AND e.created_at >= $${params.length}`;
    }
    if (end_date) {
      params.push(new Date(end_date));
      query += ` AND e.created_at <= $${params.length}`;
    }

    query += ` UNION ALL SELECT 'submission' as type, s.id, s.name as title, s.email as hash, s.created_at, c.case_number
      FROM submissions s
      LEFT JOIN cases c ON s.case_id = c.id
      WHERE 1=1`;

    if (q) {
      params.push(`%${q}%`);
      query += ` AND (s.name ILIKE $${params.length} OR s.email ILIKE $${params.length})`;
      params.push(`%${q}%`);
    }
    if (start_date) {
      params.push(new Date(start_date));
      query += ` AND s.created_at >= $${params.length}`;
    }
    if (end_date) {
      params.push(new Date(end_date));
      query += ` AND s.created_at <= $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed' });
  }
};

const exportToPDF = async (req, res) => {
  try {
    const { case_id } = req.params;

    const caseResult = await pool.query('SELECT * FROM cases WHERE id = $1', [case_id]);
    if (caseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const evidenceResult = await pool.query('SELECT * FROM evidence WHERE case_id = $1', [case_id]);
    const submissionsResult = await pool.query('SELECT * FROM submissions WHERE case_id = $1', [case_id]);

    const caseData = caseResult.rows[0];
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="case-${caseData.case_number}.pdf"`);

    doc.pipe(res);

    // Title
    doc.fontSize(16).font('Helvetica-Bold').text(`Case Report: ${caseData.case_number}`, { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown();

    // Case details
    doc.fontSize(12).font('Helvetica-Bold').text('Case Details');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Title: ${caseData.title}`);
    doc.text(`Status: ${caseData.status}`);
    doc.text(`Description: ${caseData.description || 'N/A'}`);
    doc.moveDown();

    // Evidence
    doc.fontSize(12).font('Helvetica-Bold').text('Evidence');
    if (evidenceResult.rows.length > 0) {
      evidenceResult.rows.forEach((evidence) => {
        doc.fontSize(10).font('Helvetica');
        doc.text(`- ${evidence.filename} (Hash: ${evidence.file_hash}, Size: ${evidence.file_size} bytes)`);
      });
    } else {
      doc.text('No evidence');
    }
    doc.moveDown();

    // Submissions
    doc.fontSize(12).font('Helvetica-Bold').text('Submissions');
    if (submissionsResult.rows.length > 0) {
      submissionsResult.rows.forEach((submission) => {
        doc.fontSize(10).font('Helvetica');
        doc.text(`- ${submission.name} (${submission.email}), Age: ${submission.age}`);
      });
    } else {
      doc.text('No submissions');
    }

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error.message);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
};

const exportToCSV = async (req, res) => {
  try {
    const { type = 'submissions', case_id } = req.params;

    let result;
    if (type === 'submissions') {
      if (case_id) {
        result = await pool.query('SELECT * FROM submissions WHERE case_id = $1', [case_id]);
      } else {
        result = await pool.query('SELECT * FROM submissions');
      }
    } else if (type === 'evidence') {
      if (case_id) {
        result = await pool.query('SELECT * FROM evidence WHERE case_id = $1', [case_id]);
      } else {
        result = await pool.query('SELECT * FROM evidence');
      }
    }

    const parser = new Parser();
    const csv = parser.parse(result.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-${new Date().toISOString()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error.message);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
};

module.exports = { searchEvidenceAndSubmissions, exportToPDF, exportToCSV };
