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

const app = express();
const port = 3001;

app.use(express.json({ limit: '10mb' }));
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

      // 이미지 파일을 서버의 파일 시스템에 저장
      const image1Path = saveImage(photos[i]);
      const image2Path = saveImage(photos[i + 1]);
      const image3Path = saveImage(photos[i + 2]);
      const image4Path = saveImage(photos[i + 3]);

      // 데이터베이스에 이미지 파일의 경로 삽입
      await connection.query(
        'INSERT INTO photos (image1, image2, image3, image4) VALUES (?, ?, ?, ?)',
        [image1Path, image2Path, image3Path, image4Path]
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
  const fileName = `${Date.now()}.png`;
  const filePath = path.join(uploadsFolder, fileName);

  // base64 데이터를 파일로 변환하여 저장
  fs.writeFileSync(filePath, base64Data, 'base64');

  // 저장된 파일의 경로 반환
  return filePath;
}

app.get('/images', (req, res) => {
  connection.query('SELECT image1, image2, image3, image4 FROM photos', (error, results) => {
    if (error) {
      console.error('Error fetching image URLs:', error);
      res.status(500).json({ message: 'Error fetching image URLs' });
    } else {
      res.status(200).json(results);
    }
  });
});

// 이미지 URL을 가져오는 API 엔드포인트로 요청을 보냅니다.
const fetchImageURLs = async () => {
  try {
    const response = await axios.get('http://localhost:3001/images');
    const imagePaths = response.data;

    // 이미지 파일의 경로에서 URL을 생성합니다.
    const imageURLs = imagePaths.map((pathObj) => {
      return {
        image1: `http://localhost:3001/${pathObj.image1}`,
        image2: `http://localhost:3001/${pathObj.image2}`,
        image3: `http://localhost:3001/${pathObj.image3}`,
        image4: `http://localhost:3001/${pathObj.image4}`,
      };
    });

    setImageURLs(imageURLs);
  } catch (error) {
    console.error('Error fetching image URLs:', error);
  }
};


// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});