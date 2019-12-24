/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");
var MongoClient = require("mongodb");
const Store = require("../model/store");

chai.use(chaiHttp);
let initLike;

suite("Functional Tests", function () {
  this.beforeAll(function (done) {
    MongoClient.connect(process.env.DB, (err, db) => {
      const handler = new Store(db);
      handler.destroy().then(() => {
        done();
      })
        .catch(() => done());
    });
  });

  suite("GET /api/stock-prices => stockData object", function () {
    test("1 stock", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: "goog" })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(
            res.body,
            "stockData",
            "Body should contain stockData"
          );
          assert.property(
            res.body.stockData,
            "stock",
            "StockData should contain stock"
          );
          assert.property(
            res.body.stockData,
            "price",
            "StockData should contain price"
          );
          assert.property(
            res.body.stockData,
            "likes",
            "StockData should contain likes"
          );

          const { stock, price, likes } = res.body.stockData;
          assert.equal(typeof stock, "string", "stock should be a string");
          assert.equal(typeof price, "string", "price should be a string");
          assert.equal(typeof likes, "number", "likes should be a number");
          initLike = likes;
          done();
        });
    });

    test("1 stock with like", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: "goog", like: true })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          const { likes } = res.body.stockData;
          assert.equal(likes, 1, 'Likes should be equal 1');
          assert.isTrue(likes > initLike, 'Likes should be greater than Likes before set like=true');
          done();
        });
    });

    test("1 stock with like again (ensure likes arent double counted)", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: "goog", like: true })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          const { likes } = res.body.stockData;
          assert.equal(likes, 1, 'Likes should be equal 1');
          done();
        });
    });

    test("2 stocks", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: ["goog", "MSFT"] })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, "stockData", "Body should contain stockData");
          assert.isArray(res.body.stockData, 'this should be an array');
          assert.equal(res.body.stockData.length, 2);
          done();
        });
    });

    test("2 stocks with like", function (done) {
      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: ["goog", "MSFT"], like: true })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, "stockData", "Body should contain stockData"
          );

          assert.equal(res.body.stockData[0].rel_likes, 0);
          assert.equal(res.body.stockData[1].rel_likes, 0);

          done();
        });
    });
  });
});
