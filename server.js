'use strict';
require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');



const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
    },
  })
);


app.use('/public', express.static(process.cwd() + '/public'));
app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Rutas FCC
fccTestingRoutes(app);

// Rutas API
apiRoutes(app);

// 404 handler
app.use((req, res) => res.status(404).type('text').send('Not Found'));

// Conectar a MongoDB
const MONGODB_URI = process.env.DB;
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB conectado'))
  .catch((err) => console.error('❌ Error MongoDB:', err.message));

// Servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en puerto ${port}`);

  // ⚡ Forzar ejecución del runner también con RUN_FCC_TESTS
  if (process.env.NODE_ENV === 'test' || process.env.RUN_FCC_TESTS === 'true') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (e) {
        console.error('Tests inválidos:', e);
      }
    }, 3500);
  }
});

module.exports = app;