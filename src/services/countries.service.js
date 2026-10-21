const repository = require('../repositories/countries.repository');

const fields = ['alpha2', 'alpha3', 'numeric_code', 'name', 'continent', 'population'];
function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
function normalize(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw fail('El cuerpo debe ser un objeto JSON.');
  }
  const country = {};
  for (const field of fields) {
    if (payload[field] !== undefined) country[field] = payload[field];
  }
  if (country.alpha2 !== undefined && typeof country.alpha2 === 'string') country.alpha2 = country.alpha2.trim().toUpperCase();
  if (country.alpha3 !== undefined && typeof country.alpha3 === 'string') country.alpha3 = country.alpha3.trim().toUpperCase();
  if (country.numeric_code !== undefined) country.numeric_code = String(country.numeric_code).trim().padStart(3, '0');
  for (const field of ['name', 'continent']) {
    if (country[field] !== undefined && typeof country[field] === 'string') country[field] = country[field].trim();
  }
  return country;
}
function validate(country, { partial = false } = {}) {
  const required = partial ? Object.keys(country) : fields;
  if (!partial) {
    for (const field of fields) {
      if (country[field] === undefined || country[field] === null || country[field] === '') {
        throw fail(`El campo "${field}" es obligatorio.`);
      }
    }
  } else if (required.length === 0) {
    throw fail('Debe enviar al menos un campo para actualizar.');
  }

  for (const field of ['alpha2', 'alpha3', 'numeric_code', 'name', 'continent']) {
    if (country[field] !== undefined && (typeof country[field] !== 'string' || country[field].length === 0)) {
      throw fail(`El campo "${field}" debe ser texto no vacío.`);
    }
  }
  if (country.alpha2 !== undefined && !/^[A-Z]{2}$/.test(country.alpha2)) throw fail('alpha2 debe contener exactamente 2 letras.');
  if (country.alpha3 !== undefined && !/^[A-Z]{3}$/.test(country.alpha3)) throw fail('alpha3 debe contener exactamente 3 letras.');
  if (country.numeric_code !== undefined && !/^\d{3}$/.test(country.numeric_code)) throw fail('numeric_code debe contener exactamente 3 dígitos.');
  if (country.name !== undefined && country.name.length > 100) throw fail('name no puede superar 100 caracteres.');
  if (country.continent !== undefined && country.continent.length > 60) throw fail('continent no puede superar 60 caracteres.');
  if (country.population !== undefined && (!Number.isSafeInteger(country.population) || country.population < 0)) {
    throw fail('population debe ser un entero seguro mayor o igual a cero.');
  }
  if (country.population === undefined && !partial) throw fail('El campo "population" es obligatorio.');
}

async function listCountries() { return repository.findAll(); }
async function getCountry(id) {
  if (typeof id !== 'string' || !/^[A-Za-z]{2}$/.test(id)) throw fail('El ID debe ser el código Alfa-2 de dos letras.');
  const country = await repository.findById(id.toUpperCase());
  if (!country) throw fail('País no encontrado.', 404);
  return country;
}
async function createCountry(payload) {
  const country = normalize(payload);
  validate(country);
  if (await repository.findById(country.alpha2)) throw fail('Ya existe un país con ese código Alfa-2.', 409);
  for (const [field, value] of [['alpha3', country.alpha3], ['numeric_code', country.numeric_code], ['name', country.name]]) {
    if (await repository.findByUniqueField(field, value)) throw fail(`Ya existe un país con ${field} "${value}".`, 409);
  }
  return repository.create(country);
}
async function updateCountry(id, payload, partial) {
  const existing = await getCountry(id);
  const changes = normalize(payload);
  validate(changes, { partial });
  const merged = { ...existing, ...changes, alpha2: existing.alpha2 };
  validate(merged);
  for (const [field, value] of [['alpha3', merged.alpha3], ['numeric_code', merged.numeric_code], ['name', merged.name]]) {
    const other = await repository.findByUniqueField(field, value);
    if (other && other.alpha2 !== existing.alpha2) throw fail(`Ya existe otro país con ${field} "${value}".`, 409);
  }
  return repository.update(existing.alpha2, merged);
}
async function deleteCountry(id) {
  await getCountry(id);
  await repository.remove(id.toUpperCase());
}
module.exports = { listCountries, getCountry, createCountry, updateCountry, deleteCountry };
