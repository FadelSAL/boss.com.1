const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { db, init } = require('./db');

const app = express();
const PORT = process.env.PORT || 5500;

app.use(cors());
app.use(bodyParser.json());

init();

// Products
app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products ORDER BY id DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Not found' });
        res.json(row);
    });
});

app.post('/api/products', (req, res) => {
    const { name, description, price, imageUrl, category } = req.body;
    const stmt = 'INSERT INTO products (name, description, price, imageUrl, category) VALUES (?, ?, ?, ?, ?)';
    db.run(stmt, [name, description, price, imageUrl, category], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID });
    });
});

app.put('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const { name, description, price, imageUrl, category } = req.body;
    const stmt = 'UPDATE products SET name = ?, description = ?, price = ?, imageUrl = ?, category = ? WHERE id = ?';
    db.run(stmt, [name, description, price, imageUrl, category, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

// Provinces
app.get('/api/provinces', (req, res) => {
    db.all('SELECT * FROM provinces ORDER BY id', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/provinces', (req, res) => {
    const { key, name, cost } = req.body;
    db.run('INSERT INTO provinces (key, name, cost) VALUES (?, ?, ?)', [key, name, cost], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID });
    });
});

app.put('/api/provinces/:id', (req, res) => {
    const id = req.params.id;
    const { key, name, cost } = req.body;
    db.run('UPDATE provinces SET key = ?, name = ?, cost = ? WHERE id = ?', [key, name, cost, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

app.delete('/api/provinces/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM provinces WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});

