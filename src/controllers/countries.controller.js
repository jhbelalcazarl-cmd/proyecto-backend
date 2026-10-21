const service = require('../services/countries.service');

function handleError(error, res) {
  if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
  console.error(error);
  return res.status(500).json({ error: 'Error interno del servidor.' });
}

exports.list = async (_req, res) => {
  try {
    res.status(200).json(await service.listCountries());
  } catch (error) { handleError(error, res); }
};

exports.getById = async (req, res) => {
  try {
    const country = await service.getCountry(req.params.id);
    res.status(200).json(country);
  } catch (error) { handleError(error, res); }
};

exports.create = async (req, res) => {
  try {
    const country = await service.createCountry(req.body);
    res.status(201).location(`/api/countries/${country.alpha2}`).json(country);
  } catch (error) { handleError(error, res); }
};

exports.update = async (req, res) => {
  try {
    res.status(200).json(await service.updateCountry(req.params.id, req.body, false));
  } catch (error) { handleError(error, res); }
};

exports.patch = async (req, res) => {
  try {
    res.status(200).json(await service.updateCountry(req.params.id, req.body, true));
  } catch (error) { handleError(error, res); }
};

exports.remove = async (req, res) => {
  try {
    await service.deleteCountry(req.params.id);
    res.status(204).send();
  } catch (error) { handleError(error, res); }
};
