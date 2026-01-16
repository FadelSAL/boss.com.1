START TRANSACTION;
CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name TEXT,
        description TEXT,
        price BIGINT,
        imageUrl TEXT,
        category TEXT
      );
CREATE TABLE IF NOT EXISTS provinces (
        id INT AUTO_INCREMENT PRIMARY KEY,
        `key` TEXT UNIQUE,
        name TEXT,
        cost INT
      );
INSERT INTO `products` (`id`,`name`,`description`,`price`,`imageUrl`,`category`) VALUES (1,'منتج تجريبي','وصف المنتج التجريبي',10000,'https://via.placeholder.com/400x300','rice'),
 (2,'zczxxckiu','sdfsdfsfs',1000,'D:\Nawar\Pictures\_ZnhMqKvIWc.jpg','breakfast'),
 (3,'zxfhaxfdafd','zczxczxcxzcz',10000000,'photo_2025-12-06_15-06-55.jpg','rice'),
 (5,'منتج تجريبي - شوكولاتة','شوكولاتة حليب عالية الجودة، 100 غرام',15000,'https://images.unsplash.com/photo-1548907042-0a1484d9d12d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80','chocolate'),
 (6,'zxjh','nnbffff',10000,'Pictures/photo_2025-12-06_15-06-55.jpg','rice'),
 (7,'zxfhaxfdafd','ggggggtt',100000,'Pictures/photo_2025-12-06_15-06-55.jpg','coffee'),
 (8,'zxjh','eeee',122222,'Pictures/photo_2025-12-06_15-06-55.jpg','breakfast'),
 (9,'fffffffffffffffffffff','jfjdfkdf',10000000,'Pictures/photo_2025-12-06_15-06-55.jpg','chocolate'),
 (10,'zxfhaxfdafd','jjjjjjjjjjjjjjjjj',1000000000000000,'Pictures/photo_2025-12-06_15-06-55.jpg','breakfast'),
 (11,'ffffffffffffffffffff','ggggggggggggggg',10,'Pictures/photo_2025-12-06_15-06-55.jpg','breakfast'),
 (12,'fefefefefe','ffefefefefejj',10,'Pictures/photo_2025-12-06_15-06-55.jpg','breakfast'),
 (13,'feo','hhhhhhh',10000000,'Pictures/IMG_20251217_221644_528.png','coffee'),
 (14,'feo','222',2222222222222,'Pictures/IMG_20251217_225358_389.png','breakfast');
INSERT INTO `provinces` (`id`,`key`,`name`,`cost`) VALUES (2,'aleppo','حلب',100000000),
 (3,'homs','حمص',10000),
 (4,'hama','حماة',10000),
 (5,'latakia','اللاذقية',12000),
 (6,'tartus','طرطوس',12000),
 (7,'daraa','درعا',8000),
 (8,'as-sweida','السويداء',8000),
 (9,'raqqa','الرقة',20000),
 (10,'deir-ez-zor','دير الزور',25000),
 (11,'al-hasakah','الحسكة',25000),
 (12,'idlib','إدلب',15000),
 (13,'rif-dimashq','ريف دمشق',7000),
 (14,'quneitra','القنيطرة',10000),
 (15,'prov_1765964582342','دمشق',5000);
COMMIT;
