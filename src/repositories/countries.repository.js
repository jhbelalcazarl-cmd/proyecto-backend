const { all, get, run } = require('../db/database');

const columns = 'alpha2, alpha3, numeric_code, name, continent, population, created_at, updated_at';
exports.findAll = () => all(`SELECT ${columns} FROM countries ORDER BY name`);
exports.findById = (id) => get(`SELECT ${columns} FROM countries WHERE alpha2 = ?`, [id]);
exports.findByUniqueField = (field, value) => {
  const allowed = new Set(['alpha3', 'numeric_code', 'name']);
  if (!allowed.has(field)) throw new Error('Campo de búsqueda no permitido.');
  return get(`SELECT alpha2 FROM countries WHERE ${field} = ?`, [value]);
};
exports.create = async (country) => {
  await run(
    `INSERT INTO countries(alpha2, alpha3, numeric_code, name, continent, population)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [country.alpha2, country.alpha3, country.numeric_code, country.name, country.continent, country.population]
  );
  return exports.findById(country.alpha2);
};
exports.update = async (id, country) => {
  await run(
    `UPDATE countries SET alpha3 = ?, numeric_code = ?, name = ?, continent = ?, population = ?,
     updated_at = CURRENT_TIMESTAMP WHERE alpha2 = ?`,
    [country.alpha3, country.numeric_code, country.name, country.continent, country.population, id]
  );
  return exports.findById(id);
};
exports.remove = (id) => run('DELETE FROM countries WHERE alpha2 = ?', [id]);
