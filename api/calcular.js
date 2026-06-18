const jsonResponse = (res, statusCode, payload) => {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const parseNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return jsonResponse(res, 405, { error: 'Metodo no permitido. Usa POST.' });
  }

  const configuredApiKey = process.env.COTIZAAPI_API_KEY || process.env.API_KEY;
  const requestApiKey = req.headers['x-api-key'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!configuredApiKey) {
    return jsonResponse(res, 500, { error: 'La variable de entorno COTIZAAPI_API_KEY no esta configurada.' });
  }

  if (!requestApiKey || requestApiKey !== configuredApiKey) {
    return jsonResponse(res, 401, { error: 'API_KEY invalida o ausente.' });
  }

  const { precio, manoObra, iva } = req.body || {};
  const precioNumber = parseNumber(precio);
  const manoObraNumber = parseNumber(manoObra);
  const ivaNumber = parseNumber(iva);

  if ([precioNumber, manoObraNumber, ivaNumber].some((value) => Number.isNaN(value))) {
    return jsonResponse(res, 400, { error: 'precio, manoObra e iva deben ser numeros validos.' });
  }

  if (precioNumber < 0 || manoObraNumber < 0 || ivaNumber < 0) {
    return jsonResponse(res, 400, { error: 'Los valores no pueden ser negativos.' });
  }

  const subtotal = +(precioNumber + manoObraNumber).toFixed(2);
  const valorIVA = +(subtotal * ivaNumber).toFixed(2);
  const total = +(subtotal + valorIVA).toFixed(2);

  return jsonResponse(res, 200, { subtotal, valorIVA, total });
};
