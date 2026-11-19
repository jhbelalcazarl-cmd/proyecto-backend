const express = require('express');
const cors = require('cors');
const countryRoutes = require('./routes/countries.routes');

const app = express();

// Permite peticiones desde el servidor Vite del frontend.
// Las solicitudes sin Origin (por ejemplo, curl o Postman) también se permiten.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/countries', countryRoutes);

// JSON malformado y otros errores de middleware
app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'El cuerpo JSON no es válido.' });
  }
  if (err.message && err.message.startsWith('Origen no permitido por CORS:')) {
    return res.status(403).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;
