// utils/stockService.js
const axios = require('axios');

const getStockData = async (symbol) => {
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;

  try {
    const response = await axios.get(url);
    const price = response.data.latestPrice;

    return {
      stock: symbol.toUpperCase(),
      price,
      error: false
    };
  } catch (err) {
    console.error(`❌ Error al obtener precio de ${symbol}:`, err.message);

    return {
      stock: symbol.toUpperCase(),
      price: null,
      error: true
    };
  }
};

module.exports = getStockData;
