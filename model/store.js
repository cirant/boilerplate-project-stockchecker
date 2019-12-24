class Store {
  constructor(client) {
    const collection = process.env.NODE_ENV === 'test' ? 'stocks-test' : 'stocks';
    this.db = client.db('stock');
    this.collection = this.db.collection(collection)
  }

  destroy() {
    return this.collection.drop()
  }

  async setLike(name, ip) {
    const exist = await this.collection.findOne({ store: name, likes: { $in: [ip] } });
    const query = ip ? { $push: { likes: ip } } : {};

    if (!exist) {
      const updated = await this.collection.findAndModify(
        { store: name },
        {},
        {
          $setOnInsert: { store: name },
          ...query
        },
        { upsert: true, new: true },
      );
      return updated.value;
    } else {
      return exist
    }
  }
}

module.exports = Store