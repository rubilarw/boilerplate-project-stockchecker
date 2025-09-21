'use strict';

const axios = require('axios');
const mongoose = require('mongoose');
const Stock = require('../models/Stock');
// Esquema de acciones
const stockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true, unique: true },
  ips: { type: [String], default: [] }
});

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.ip;
  return ip.trim();
}

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
      const stocks = Array.isArray(req.query.stock)
        ? req.query.stock.map(s => s.toUpperCase())
        : [req.query.stock.toUpperCase()];

      const like = req.query.like === 'true';
      const ip = getClientIP(req);

      const results = await Promise.all(
        stocks.map(async (symbol) => {
          const priceRes = await axios.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
          const price = priceRes.data.latestPrice;

          let stockDoc = await Stock.findOne({ stock: symbol });
          if (!stockDoc) stockDoc = new Stock({ stock: symbol, likes: 0, ips: [] });

          if (like && !stockDoc.ips.includes(ip)) {
            stockDoc.likes += 1;
            stockDoc.ips.push(ip);
          }

          await stockDoc.save();

          return {
            stock: symbol,
            price,
            likes: stockDoc.likes
        };
      })
    );

    // Si hay dos acciones, calcular rel_likes
    if (results.length === 2) {
      const relLikes = [
        {
          stock: results[0].stock,
          price: results[0].price,
          rel_likes: results[0].likes - results[1].likes
        },
        {
          stock: results[1].stock,
          price: results[1].price,
          rel_likes: results[1].likes - results[0].likes
        }
      ];
      return res.json({ stockData: relLikes });
    }

    // Si hay una sola acción
    res.json({ stockData: results[0] });

  } catch (err) {
    console.error('❌ Error en /api/stock-prices:', err.message);
    res.status(500).send('Error interno del servidor');
  }
});
}
