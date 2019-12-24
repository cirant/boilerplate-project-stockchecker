/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
const axios = require('axios');
const Store = require('../model/store');

const getData = (stock) => {
  return stock !== 'Unknown symbol' ? {
    stock: stock.symbol,
    price: stock.latestPrice.toString()
  } : { "error": "external source error" };
};

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async (req, res) => {
      const { stock, like } = req.query;
      var ip = like == 'true' ? (req.headers['x-forwarded-for'] || req.connection.remoteAddress).split(',')[0] : null;

      const client = await MongoClient.connect(process.env.DB);
      const handler = new Store(client)
      try {
        if (!Array.isArray(stock)) {
          const model = await handler.setLike(stock.toUpperCase(), ip);
          const stockQetter = await axios.get(`https://repeated-alpaca.glitch.me/v1/stock/${stock}/quote`);
          const dataToResponse = getData(stockQetter.data);
          res.status(200).json({ "stockData": { ...dataToResponse, likes: model.likes ? model.likes.length : 0 } })
        } else {
          const dataToResponse = stock.map(s => {
            return [axios.get(`https://repeated-alpaca.glitch.me/v1/stock/${s}/quote`), handler.setLike(s.toUpperCase(), ip)];
          });

          const allPromises = dataToResponse.reduce((acc, cur) => acc.concat(cur), []);

          Promise.all(allPromises).then(values => {
            client.close();
            const NASDAQ = values.filter(v => v.data);
            const LIKES = values.filter(v => !v.data);
            const likes_0 = LIKES[0].likes ? LIKES[0].likes.length : 0;
            const likes_1 = LIKES[1].likes ? LIKES[1].likes.length : 0;
            LIKES[0].difference = likes_0 - likes_1;
            LIKES[1].difference = likes_1 - likes_0;

            const dataToResponse = NASDAQ.map(({ data }) => {
              const entity = LIKES.find(el => el.store == data.symbol);
              return { ...getData(data), rel_likes: entity.difference }
            });
            res.status(200).json({ "stockData": dataToResponse })
          });
        }
      } catch (err) {
        client.close();
        res.status(400).json(err);
      }

    });

};
