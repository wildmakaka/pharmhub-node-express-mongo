const db = {
  dbHost: 'ds137631.mlab.com',
  dbPort: '37631',
  dbName: 'pharmhub-db',
  dbLogin: 'admin1',
  dbPassword: 'password1'
};

module.exports = {
  get DB_URI() {
    return `mongodb://${db.dbLogin}:${db.dbPassword}@${db.dbHost}:${
      db.dbPort
    }/${db.dbName}`;
  }
};
