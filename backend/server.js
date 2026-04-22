const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// ── Customers ──────────────────────────────────────────────
app.get('/api/customers', (req, res) => {
  db.all('SELECT * FROM customers ORDER BY customerName', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

app.post('/api/customers', (req, res) => {
  const { customerName, address, contactNo, email, kindAttentionName } = req.body;
  if (!customerName?.trim()) return res.status(400).json({ error: 'customerName is required' });
  db.run(
    'INSERT INTO customers (customerName, address, contactNo, email, kindAttentionName) VALUES (?, ?, ?, ?, ?)',
    [
      customerName.trim(),
      String(address || '').trim(),
      String(contactNo || '').trim(),
      String(email || '').trim(),
      String(kindAttentionName || '').trim(),
    ],
    function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: 'Customer already exists' });
      return res.status(500).json({ error: err.message });
    }
    db.get('SELECT * FROM customers WHERE id = ?', [this.lastID], (fetchErr, saved) => {
      if (fetchErr) return res.status(500).json({ error: fetchErr.message });
      res.status(201).json({ data: saved });
    });
  });
});

app.put('/api/customers/:id', (req, res) => {
  const { customerName, address, contactNo, email, kindAttentionName } = req.body;
  if (!customerName?.trim()) return res.status(400).json({ error: 'customerName is required' });

  db.get('SELECT id FROM customers WHERE id = ?', [req.params.id], (existsErr, exists) => {
    if (existsErr) return res.status(500).json({ error: existsErr.message });
    if (!exists) {
      db.run(
        'INSERT INTO customers (customerName, address, contactNo, email, kindAttentionName) VALUES (?, ?, ?, ?, ?)',
        [
          customerName.trim(),
          String(address || '').trim(),
          String(contactNo || '').trim(),
          String(email || '').trim(),
          String(kindAttentionName || '').trim(),
        ],
        function(insertErr) {
          if (insertErr) {
            if (insertErr.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: 'Customer already exists' });
            return res.status(500).json({ error: insertErr.message });
          }
          db.get('SELECT * FROM customers WHERE id = ?', [this.lastID], (fetchErr, created) => {
            if (fetchErr) return res.status(500).json({ error: fetchErr.message });
            return res.status(201).json({ data: created });
          });
        }
      );
      return;
    }

    db.run(
      `UPDATE customers
       SET customerName = ?, address = ?, contactNo = ?, email = ?, kindAttentionName = ?
       WHERE id = ?`,
      [
        customerName.trim(),
        String(address || '').trim(),
        String(contactNo || '').trim(),
        String(email || '').trim(),
        String(kindAttentionName || '').trim(),
        req.params.id,
      ],
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: 'Customer already exists' });
          return res.status(500).json({ error: err.message });
        }
        db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (fetchErr, updated) => {
          if (fetchErr) return res.status(500).json({ error: fetchErr.message });
          res.json({ data: updated });
        });
      }
    );
  });
});

app.delete('/api/customers/:id', (req, res) => {
  db.run('DELETE FROM customers WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ── Quotations ─────────────────────────────────────────────
const parseQuotation = (row) => ({
  ...row,
  inputs: JSON.parse(row.inputs),
  rows: JSON.parse(row.rows),
  results: JSON.parse(row.results || '[]'),
});

app.get('/api/quotations', (req, res) => {
  db.all('SELECT * FROM quotations ORDER BY createdAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows.map(parseQuotation) });
  });
});

app.get('/api/quotations/:id', (req, res) => {
  db.get('SELECT * FROM quotations WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({ data: parseQuotation(row) });
  });
});

app.post('/api/quotations', (req, res) => {
  const { productType, inputs, rows, totalAmount, ratePerPiece, results } = req.body;
  db.run(`
    INSERT INTO quotations (productType, inputs, rows, totalAmount, ratePerPiece, results)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [productType, JSON.stringify(inputs), JSON.stringify(rows), totalAmount, ratePerPiece, JSON.stringify(results || [])], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM quotations WHERE id = ?', [this.lastID], (err, saved) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ data: parseQuotation(saved) });
    });
  });
});

app.put('/api/quotations/:id', (req, res) => {
  const { productType, inputs, rows, totalAmount, ratePerPiece, results } = req.body;
  db.get('SELECT id FROM quotations WHERE id = ?', [req.params.id], (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!exists) return res.status(404).json({ error: 'Not found' });
    db.run(`
      UPDATE quotations SET productType=?, inputs=?, rows=?, totalAmount=?, ratePerPiece=?, results=?, updatedAt=CURRENT_TIMESTAMP
      WHERE id=?
    `, [productType, JSON.stringify(inputs), JSON.stringify(rows), totalAmount, ratePerPiece, JSON.stringify(results || []), req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM quotations WHERE id = ?', [req.params.id], (err, updated) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: parseQuotation(updated) });
      });
    });
  });
});

app.delete('/api/quotations/:id', (req, res) => {
  db.run('DELETE FROM quotations WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
