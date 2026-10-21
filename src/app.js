const express = require('express');
const cors = require('cors');
const countryRoutes = require('./routes/countries.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/countries', countryRoutes);

// JSON malformado
app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'El cuerpo JSON no es válido.' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;
