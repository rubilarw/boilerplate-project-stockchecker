const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
  test('Viewing one stock', function(done) {
    this.timeout(5000);
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.property(res.body.stockData, 'stock');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');
        done();
      });
  });
  test('2. Ver una acción y darle like: GET /api/stock-prices?stock=GOOG&like=true', function (done) {
  this.timeout(5000);

  chai
    .request(server)
    .get('/api/stock-prices?stock=GOOG&like=true')
    .end(function (err, res) {
      assert.equal(res.status, 200);
      assert.property(res.body, 'stockData');
      assert.property(res.body.stockData, 'stock');
      assert.property(res.body.stockData, 'price');
      assert.property(res.body.stockData, 'likes');
      assert.isAbove(res.body.stockData.likes, 0); 
      done();
    });
});
   test('3. Ver la misma acción y darle like otra vez: GET /api/stock-prices?stock=GOOG&like=true', function (done) {
  this.timeout(5000);

  chai
    .request(server)
    .get('/api/stock-prices?stock=GOOG&like=true')
    .end(function (err1, res1) {
      if (err1) return done(err1);

      const likesIniciales = res1.body.stockData.likes;

      chai
        .request(server)
        .get('/api/stock-prices?stock=GOOG&like=true')
        .end(function (err2, res2) {
          if (err2) return done(err2);

          const likesFinales = res2.body.stockData.likes;

          assert.equal(res2.status, 200);
          assert.equal(likesFinales, likesIniciales); 
          done();
        });
    });


});
  test('4. Ver dos acciones: GET /api/stock-prices?stock=GOOG&stock=MSFT', function (done) {
  this.timeout(5000);

  chai
    .request(server)
    .get('/api/stock-prices?stock=GOOG&stock=MSFT')
    .end(function (err, res) {
      assert.equal(res.status, 200);
      assert.isArray(res.body.stockData);
      assert.lengthOf(res.body.stockData, 2);

      res.body.stockData.forEach(stock => {
        assert.property(stock, 'stock');
        assert.property(stock, 'price');
        assert.property(stock, 'rel_likes');
        assert.isString(stock.stock);
        assert.isNumber(stock.price);
        assert.isNumber(stock.rel_likes);
      });

      done();
    });
});
  test('5. Ver dos acciones y darles like: GET /api/stock-prices?stock=GOOG&stock=MSFT&like=true', function (done) {
  this.timeout(5000);

  chai
    .request(server)
    .get('/api/stock-prices')
    .set('X-Forwarded-For', '222.222.222.222') // IP simulada para evitar duplicados
    .query({ stock: ['GOOG', 'MSFT'], like: true })
    .end(function (err, res) {
      assert.equal(res.status, 200);
      assert.isObject(res.body);
      assert.property(res.body, 'stockData');
      assert.isArray(res.body.stockData);
      assert.lengthOf(res.body.stockData, 2);

      const [stockA, stockB] = res.body.stockData;

      // Validar propiedades básicas
      [stockA, stockB].forEach(stock => {
        assert.property(stock, 'stock');
        assert.property(stock, 'price');
        assert.property(stock, 'rel_likes');
        assert.isString(stock.stock);
        assert.isNumber(stock.price);
        assert.isNumber(stock.rel_likes);
      });

      // Validación cruzada: rel_likes deben ser opuestos
      assert.equal(stockA.rel_likes, -stockB.rel_likes, 'rel_likes deben ser opuestos');

      // Validar que al menos uno tenga rel_likes distinto de 0
      assert.notEqual(stockA.rel_likes, 0, 'rel_likes no debe ser 0 en ambos');

      done();
    });
});

});
    