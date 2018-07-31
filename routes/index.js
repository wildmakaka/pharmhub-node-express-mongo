const csv = require('fast-csv');
const express = require('express');
const router = express.Router();
const StoresList = require('../storesList.json');
const fs = require('fs');
const path = require('path');
const Iconv = require('iconv').Iconv;
const Store = require('../models/Store');
const http = require('http');

let dataForImport = [];
let convertedData = [];

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
          convertCSVFile(store)
            .then(result => {
              console.log(result);
              convertedData = [];

              // Promise 4
              deleteStoreFromDB(store)
                .then(result => {
                  console.log(result);

                  // Promise 5
                  insertDataIntoDB(store)
                    .then(result => {
                      dataForImport = [];

                      res
                        .status(200)
                        .send('Магазин успешно обновлен / добавлен!');
                    })
                    .catch(err => {
                      return res.status(400).json({
                        error: `Ошибка на шаге добавления данных в базу. ${err}`
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
                error: `Ошибка на шаге конвертирования данных csv файла. ${err}`
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
    let filesForDeletion = [];

    const originalFile = path.resolve(
      __dirname,
      '..',
      'datafiles',
      store.fileName
    );
    const convertedFile = path.resolve(
      __dirname,
      '..',
      'datafiles',
      'conv-' + store.fileName
    );

    if (fs.existsSync(originalFile)) {
      filesForDeletion.push(originalFile);
    }

    if (fs.existsSync(convertedFile)) {
      filesForDeletion.push(convertedFile);
    }

    if (filesForDeletion.length > 0) {
      filesForDeletion.forEach(fileForDeletion => {
        fs.stat(fileForDeletion, err => {
          if (err) {
            reject(err);
          }

          fs.unlink(fileForDeletion, err => {
            if (err) {
              reject(err);
            }
            resolve('Файл успешно удален!');
          });
        });
      });
    } else {
      resolve('Файлы удалять не нужно!');
    }
  });
};

const downloadNewDataFile = store => {
  return new Promise((resolve, reject) => {
    const url = store.dataUrl;
    const dest = path.resolve(__dirname, '..', 'datafiles', store.fileName);

    const file = fs.createWriteStream(dest);
    const request = http
      .get(url, response => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve('Файл успешно скачан!');
        });
      })
      .on('error', err => {
        fs.unlink(dest);
        reject(err);
      });
  });
};

const deleteStoreFromDB = store => {
  return new Promise((resolve, reject) => {
    Store.collection.remove({ storeName: store.storeName }, err => {
      if (err) {
        reject(err);
      } else {
        resolve('Данные успешно удалены из базы!');
      }
    });
  });
};

const convertCSVFile = store => {
  return new Promise((resolve, reject) => {
    const originalFile = path.resolve(
      __dirname,
      '..',
      'datafiles',
      store.fileName
    );
    const convertedFile = path.resolve(
      __dirname,
      '..',
      'datafiles',
      'conv-' + store.fileName
    );

    const stream = fs.createReadStream(originalFile);
    const output = fs.createWriteStream(convertedFile);

    stream.on('data', data => {
      let iconv = new Iconv('windows-1251', 'UTF-8');
      let converted = iconv.convert(data).toString();

      convertedData.push(converted);
    });

    stream.on('end', () => {
      output.write(convertedData.toString());
      resolve('CSV был успешно сконвертирован!');
    });

    stream.on('error', err => {
      reject(err);
    });
  });
};

const insertDataIntoDB = store => {
  return new Promise((resolve, reject) => {
    const convertedFile = path.resolve(
      __dirname,
      '..',
      'datafiles',
      'conv-' + store.fileName
    );

    fs.createReadStream(convertedFile)
      .pipe(csv())

      .on('data', data => {
        prepareRow(data, store);
      })
      .on('end', () => {
        Store.collection.insert(dataForImport, err => {
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
