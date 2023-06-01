const express = require('express');
const mysql = require('mysql');
const cors = require('cors'); // cors 미들웨어 추가

const app = express();
const port = 3001;
// create database frameme;
// use frameme
// CREATE TABLE photos (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     image1 VARCHAR(255),
//     image2 VARCHAR(255),
//     image3 VARCHAR(255),
//     image4 VARCHAR(255)
//   );
  

app.use(express.json({ limit: '10mb' })); // 요청의 크기 제한을 10MB로 설정
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
    database: 'frameme'
});

connection.connect(function(err){
    if(err){
        console.error('mysql connection error');
        console.error(err);
        throw err;
    }else{
        console.log('연결에 성공하였습니다.')
    }
});

app.post('/upload', async (req, res) => {
    try {
      const { photos } = req.body;
  
      // 배열을 4개씩 나누어 MySQL 데이터베이스에 삽입
      for (let i = 0; i < photos.length; i += 4) {
        const image1 = photos[i];
        const image2 = photos[i + 1];
        const image3 = photos[i + 2];
        const image4 = photos[i + 3];
  
        // 사진을 Blob 형태로 변환
        const blobImage1 = Buffer.from(image1, 'base64');
        const blobImage2 = Buffer.from(image2, 'base64');
        const blobImage3 = Buffer.from(image3, 'base64');
        const blobImage4 = Buffer.from(image4, 'base64');
  
        // MySQL 데이터베이스에 삽입하는 쿼리 실행
        await connection.query('INSERT INTO photos (image1, image2, image3, image4) VALUES (?, ?, ?, ?)', [blobImage1, blobImage2, blobImage3, blobImage4]);
      }
  
      res.status(200).json({ message: 'Photos uploaded successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error uploading photos' });
    }
  });
  
    
// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});