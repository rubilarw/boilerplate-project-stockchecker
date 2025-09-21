'use strict';

const axios = require('axios');
const mongoose = require('mongoose');
const getStockData = require('../utils/stockService');
const { registerLike, getLikes } = require('../utils/likeService');

// Esquema de acciones
const stockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true, unique: true },
  ips: { type: [String], default: [] }
});
const { normalizeIp, anonymizeIP } = require('../utils/ipUtils.js');

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


// Usá hashedIP para validar likes únicos

module.exports = function (app) {
  // Asegura que Express confíe en el proxy
  app.set('trust proxy', true);

  app.get('/api/stock-prices', async (req, res) => {
  const { stock, like } = req.query;
  const ip = anonymizeIP(normalizeIp(req));

  if (Array.isArray(stock)) {
    const [stock1, stock2] = stock;

    const [data1, data2] = await Promise.all([
      getStockData(stock1),
      getStockData(stock2)
    ]);

    if (data1.error || data2.error) {
      return res.json({ stockData: 'Error al obtener datos de una o ambas acciones' });
    }

    // Registrar likes si corresponde
    if (like === 'true') {
      await registerLike(data1.stock, ip);
      await registerLike(data2.stock, ip);
    }

    const likes1 = await getLikes(data1.stock);
    const likes2 = await getLikes(data2.stock);

    return res.json({
      stockData: [
        {
          stock: data1.stock,
          price: data1.price,
          rel_likes: likes1 - likes2
        },
        {
          stock: data2.stock,
          price: data2.price,
          rel_likes: likes2 - likes1
        }
      ]
    });
  }

  // Caso de una sola acción
  const data = await getStockData(stock);

  if (data.error) {
    return res.json({ stockData: { stock: data.stock, price: 'N/A', likes: 0 } });
  }

  if (like === 'true') {
    await registerLike(data.stock, ip);
  }

  const likes = await getLikes(data.stock);

  return res.json({
    stockData: {
      stock: data.stock,
      price: data.price,
      likes
    }
  });
});

}
