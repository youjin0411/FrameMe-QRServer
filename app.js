// const express = require('express');
// const mysql = require('mysql');
// const cors = require('cors');

// const app = express();
// const port = 3001;

// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ limit: '10mb', extended: true }));
// app.use(
//   cors({
//     origin: 'http://localhost:3000',
//     credentials: true,
//   })
// );

// const connection = mysql.createConnection({
//   host: 'localhost',
//   port: 3306,
//   user: 'root',
//   password: '1234',
//   database: 'frameme',
// });

// connection.connect(function (err) {
//   if (err) {
//     console.error('mysql connection error');
//     console.error(err);
//     throw err;
//   } else {
//     console.log('연결에 성공하였습니다.');
//   }
// });

// app.post('/upload', async (req, res) => {
//   try {
//     const { photos } = req.body;

//     // 이미지 경로를 image1, image2, image3, image4로 변환하여 MySQL 데이터베이스에 삽입
//     for (let i = 0; i < photos.length; i += 4) {
//       const image1 = `image${i + 1}`;
//       const image2 = `image${i + 2}`;
//       const image3 = `image${i + 3}`;
//       const image4 = `image${i + 4}`;

//       // 사진을 Blob 형태로 변환
//       const blobImage1 = Buffer.from(photos[i], 'base64');
//       const blobImage2 = Buffer.from(photos[i + 1], 'base64');
//       const blobImage3 = Buffer.from(photos[i + 2], 'base64');
//       const blobImage4 = Buffer.from(photos[i + 3], 'base64');

//       // MySQL 데이터베이스에 삽입하는 쿼리 실행
//       await connection.query(
//         'INSERT INTO photos (image1, image2, image3, image4) VALUES (?, ?, ?, ?)',
//         [blobImage1, blobImage2, blobImage3, blobImage4]
//       );
//     }

//     res.status(200).json({ message: 'Photos uploaded successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error uploading photos' });
//   }
// });

// // 서버 시작
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

// create database frameme;
// use frameme;
// mysql> CREATE TABLE photos (
//     ->   id INT AUTO_INCREMENT PRIMARY KEY,
//     ->   image1 VARCHAR(255),
//     ->   image2 VARCHAR(255),
//     ->   image3 VARCHAR(255),
//     ->   image4 VARCHAR(255)
//     -> );

const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3001;

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '1234',
  database: 'frameme',
});

connection.connect(function (err) {
  if (err) {
    console.error('mysql connection error');
    console.error(err);
    throw err;
  } else {
    console.log('연결에 성공하였습니다.');
  }
});

// uploads 폴더가 없을 경우 생성
const uploadsFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder);
}

app.post('/upload', async (req, res) => {
  try {
    const { photos } = req.body;

    // 이미지 파일을 서버에 업로드하고 경로를 데이터베이스에 삽입
    for (let i = 0; i < photos.length; i += 4) {
      const image1 = `image${i + 1}`;
      const image2 = `image${i + 2}`;
      const image3 = `image${i + 3}`;
      const image4 = `image${i + 4}`;

      // 이미지 파일을 서버의 파일 시스템에 저장하고 URL 생성
      const image1Url = saveImage(photos[i]);
      const image2Url = saveImage(photos[i + 1]);
      const image3Url = saveImage(photos[i + 2]);
      const image4Url = saveImage(photos[i + 3]);

      // 데이터베이스에 이미지 파일의 URL 삽입
      await connection.query(
        'INSERT INTO photos (image1, image2, image3, image4) VALUES (?, ?, ?, ?)',
        [image1Url, image2Url, image3Url, image4Url]
      );
    }

    res.status(200).json({ message: 'Photos uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading photos' });
  }
});

// 이미지 파일을 서버의 파일 시스템에 저장하는 함수
function saveImage(base64Data) {
  const fileName = uuidv4() + '.png';
  const filePath = path.join(uploadsFolder, fileName);
  const fileUrl = `http://localhost:3001/uploads/${fileName}`; // 이미지 URL 생성

  // base64 데이터를 파일로 변환하여 저장
  const imageData = base64Data.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(filePath, imageData, 'base64');

  // 저장된 파일의 URL 반환
  return fileUrl;
}

// 이미지 URL을 가져오는 API 엔드포인트로 요청을 보냅니다.
app.get('/images', (req, res) => {
  connection.query('SELECT image1, image2, image3, image4 FROM photos', (error, results) => {
    if (error) {
      console.error('Error fetching image data:', error);
      res.status(500).json({ message: 'Error fetching image data' });
    } else {
      const imageUrls = results.map((pathObj) => {
        return {
          image1: `${pathObj.image1}`,
          image2: `${pathObj.image2}`,
          image3: `${pathObj.image3}`,
          image4: `${pathObj.image4}`,
        };
      });

      res.status(200).json(imageUrls);
    }
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
