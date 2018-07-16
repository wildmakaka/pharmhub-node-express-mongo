const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const StoresList = require('../storesList.json');
const fs = require('fs');
const csv = require('fast-csv');
const path = require('path');
const Iconv = require('iconv').Iconv;
const Store = require('../models/Store');
const http = require('http');

router.get('/:shopName/:productId', (req, res) => {
  Store.findOne({
    storeName: req.params.shopName,
    id: req.params.productId
  })
    .select('-_id -storeName')
    .then(store => {
      if (store) {
        return res.status(200).json(store);
      }
      return res.status(400).json({ error: 'Продукт не найден' });
    })
    .catch(err => res.status(400).json({ error: err }));
});

router.post('/:shopName', (req, res) => {
  const shopName = req.params.shopName;

  const store = StoresList.find(obj => obj.storeName == shopName);

  if (!store) {
    return res.status(400).json({
      error: `Магазин ${shopName} не описан в конфигурационном файле`
    });
  }

  // Promise 1
  deleteOldDataFile(store)
    .then(result => {
      console.log(result);

      // Promise 2
      downloadNewDataFile(store)
        .then(result => {
          console.log(result);

          // Promise 3
          deleteStoreFromDB(store)
            .then(result => {
              console.log(result);

              // Promise 4
              insertDataToDB(store)
                .then(result => {
                  console.log(result);
                  res.status(200).send('Магазин успешно обновлен / добавлен!');
                })
                .catch(err => {
                  return res.status(400).json({
                    error: `Ошибка на шаге удаления данных из базы. ${err}`
                  });
                });
            })
            .catch(err => {
              return res.status(400).json({
                error: `Ошибка на шаге удаления данных из базы. ${err}`
              });
            });
        })
        .catch(err => {
          return res.status(400).json({
            error: `Ошибка на шаге скачивания нового файла данных. ${err}`
          });
        });
    })
    .catch(err => {
      return res.status(400).json({
        error: `Ошибка на шаге удаления файла данных. ${err}`
      });
    });
});

const deleteOldDataFile = store => {
  return new Promise((resolve, reject) => {
    const dest = path.resolve(__dirname, '..', 'datafiles', store.fileName);

    fs.stat(dest, function(err, stats) {
      if (err && err.code == 'ENOENT') {
        resolve('Файл отсутствует! Удалять не нужно. Все ОК!');
      }

      if (err) {
        reject(err);
      }

      fs.unlink(
        path.resolve(__dirname, '..', 'datafiles', store.fileName),
        function(err) {
          if (err) {
            reject(err);
          }

          resolve('Файл успешно удален!');
        }
      );
    });
  });
};

const downloadNewDataFile = store => {
  return new Promise((resolve, reject) => {
    const url = store.dataUrl;
    const dest = path.resolve(__dirname, '..', 'datafiles', store.fileName);

    const file = fs.createWriteStream(dest);
    const request = http
      .get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
          file.close();
          resolve('Файл успешно скачан!');
        });
      })
      .on('error', function(err) {
        fs.unlink(dest);
        reject(err);
      });
  });
};

const deleteStoreFromDB = store => {
  return new Promise((resolve, reject) => {
    Store.collection.remove({ storeName: store.storeName }, function(
      err,
      result
    ) {
      if (err) {
        reject(err);
      } else {
        resolve('Данные успешно удалены из базы!');
      }
    });
  });
};

let dataForImport = [];

const insertDataToDB = store => {
  return new Promise((resolve, reject) => {
    const dest = path.resolve(__dirname, '..', 'datafiles', store.fileName);

    fs.createReadStream(dest)
      .pipe(csv())
      .on('data', data => {
        prepareRow(data, store);
      })
      .on('end', data => {
        Store.collection.insert(dataForImport, function(err, docs) {
          if (err) {
            reject(err);
          } else {
            resolve('Данные успешно добавлены в базу!');
          }
        });
      });
  });
};

const prepareRow = (data, store) => {
  const dataToString = data.toString();

  // let iconv = new Iconv('windows-1251', 'UTF-8');
  // let str = iconv.convert(dataToString).toString();

  const separator = store.separator;
  const arrayOfStrings = dataToString.split(separator);

  dataForImport.push({
    storeName: store.storeName,
    id: arrayOfStrings[store.itemIdColumn],
    name: arrayOfStrings[store.itemNameColumn],
    price: arrayOfStrings[store.itemPriceColumn]
  });
};

module.exports = router;
