'use strict';

const axios = require('axios');
const mongoose = require('mongoose');

// Esquema de acciones
const stockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true, unique: true },
  ips: { type: [String], default: [] }
});
const Stock = mongoose.model('Stock', stockSchema);

// Obtener precio desde el proxy FCC
async function getStockPrice(symbol) {
  const url= `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;
  const res = await axios.get(url);
  return { symbol: res.data.symbol, price: Number(res.data.latestPrice) };
}

// Normalizar IP
function normalizeIp(req) {
  let ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.ip ||
    req.socket?.remoteAddress;

  if (!ip) return 'unknown';
  if (ip.includes('::ffff:')) ip = ip.split('::ffff:')[1];
  if (ip === '::1') ip = '127.0.0.1';

  return ip.trim();
}

module.exports = function (app) {
  // Asegura que Express confíe en el proxy
  app.set('trust proxy', true);

  app.get('/api/stock-prices', async (req, res) => {
  try {
    const stock = req.query.stock;
    const price = await getStockPrice(stock);

    res.json({
      stockData: {
        stock: stock.toUpperCase(),
        price,
        likes: 0
      }
    });
  } catch (err) {
    console.error('❌ Error en /api/stock-prices:', err.message);
    res.status(500).send('Error interno del servidor');
  }
});
}
