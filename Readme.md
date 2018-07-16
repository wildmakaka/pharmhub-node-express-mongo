### Тестовое задание

Дано:
Есть несколько прайс-листов, доступных в виде файлов формата CSV. Примеры:
https://niko-opt.com/price_two.csv
http://opt.10x10.com.ua/opt10x10.csv

В каждом прайсе есть код товара (артикул), его название и цена.

Цели:

1.  Написать Node.js сервер, который будет получать источник данных по его URL, парсить полученные данные из CSV, сохранять результаты в базе данных и возвращать в виде JSON по запросу.
2.  Сервер должен отвечать на два типа запросов:
    a. GET /:shopName/:productId — возвращает JSON-объект следующего формата:
    {
    "id": <ID товара>,
    "name": <название товара>,
    "price": <цена товара>
    }
    b. POST /:shopName — запускает обновление прайса данного магазина.
3.  Добавление новых магазинов должно осуществляться путём добавления файла конфигурации (JSON, YAML — на усмотрение разработчика). В конфигурационном файле должны указываться все необходимые опции: название магазина, ссылка на прайс, имена колонок для артикула, названия товара, его цены, используемые разделитель и тому подобное.
4.  Данные должны записываться и храниться в БД, а не в виде файла на диске.
5.  В файле README.md описать, как настраивать и запускать продукт.

Предлагаемый набор технологий:
Node.js >= 4.5
Express.js
MongoDB, Redis или PostgreSQL в качестве БД.

Результат:
Архив с кодом выполненного задания или ссылка на GitHub/BitBucket/GitLab.

===========================================


# Результаты:

Я использую базу данных mongodb от mlab.com.
Базу устанавливать не нужно.

<br/>

### Подготовка:

Необходимо заполнить в файле storesList.json необходимые данные для магазина.

    storeName - название магазина, аналогично тому, как сделано в примере
    dataUrl - откуда скачать файл по http
    fileName - под каким названием файл должен быть сохранен в файловой системе.
    separator - разделитель колонок в csv файле
    itemIdColumn - колонка с Id товара
    itemNameColumn - колонка с именем товара
    itemPriceColumn - колонка с ценой товара

<br/>

### Запуск:

    $ npm install
    $ npm start

На каталог datafiles должны быть установлены необходимые права для записи скачиваемых csv файлов. В моем случае это было 777.

### Результаты:

POST --> http://localhost/niko-opt/

<br/>

![Application](/img/pic1.png?raw=true)

<br/>

![Application](/img/pic2.png?raw=true)

<br/><br/>

GET --> http://localhost/niko-opt/BZ-1531C

<br/>

![Application](/img/pic3.png?raw=true)

Больше всего времени потерял на перекодировку текста из windows-1251 в UTF-8. Так и не удалось победить. О том, что это кодировка windows-1251 я пришел т.к. в libreoffice тоже отображалось все неправильно, пока не выбрал windows-1251.
