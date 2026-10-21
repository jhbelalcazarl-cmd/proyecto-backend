require('dotenv').config();
const app = require('./app');
const { initializeDatabase, closeDatabase } = require('./db/database');

const port = Number(process.env.PORT) || 3000;

initializeDatabase()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`API disponible en http://localhost:${port}`);
    });
    const shutdown = () => {
      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch((error) => {
    console.error('No fue posible inicializar SQLite:', error);
    process.exit(1);
  });
