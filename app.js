const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');
const fs = require('fs');
const mysql = require('mysql2');
const config = require('./config');

const upload = multer({
    limits: {
        fieldSize: Infinity,
    },
    dest: 'uploads/',
});

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

const connection = mysql.createConnection(config);

app.post('/upload', upload.single('image'), async(req, res) => {
    try {
        if (!req.file) {
            console.error('No image uploaded');
            res.status(400).json({ error: 'No image uploaded' });
            return;
        }

        const filename = `${Date.now()}_${req.file.originalname}.png`;
        const imagePath = `uploads/${filename}`;

        fs.renameSync(req.file.path, imagePath);

        const qrCodeData = `https://port-0-framemeserver-7xwyjq992llisq9g9j.sel4.cloudtype.app/download/${filename}`;
        const qrCodeOptions = {
            type: 'png',
            quality: 0.92,
            width: 256,
            height: 256,
        };
        const qrCodePath = `uploads/${Date.now()}_qrcode.png`;
        await QRCode.toFile(qrCodePath, qrCodeData, qrCodeOptions);
        res.json({
            downloadLink: qrCodeData,
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//클라이언트가 요청한 파일을 다운로드할 수 있도록 서버의 기능을 제공
app.get('/download/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = `uploads/${filename}`;
    res.download(filePath, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
});

// 데이터 삽입 
app.post('/api/insert', (req, res) => {
    // 클라이언트로부터 전달받은 사용자 정보
    const { name, today, time, qrCodeImage, frameimage } = req.body;

    // TODO: 데이터베이스에 데이터 삽입 로직 구현
    const query = 'INSERT INTO gallery (name, day, time, qr, frame) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [name, today, time, qrCodeImage, frameimage], (error, results) => {
        if (error) {
            console.error('삽입 중 오류 발생:', error);
            res.status(500).json({ error: '삽입에 실패했습니다.' });
        }
        console.log('성공:', results);
        res.json({ message: '성공적으로 완료되었습니다.' });
    });
});

// 데이터 조회
app.get('/api/select', (req, res) => {
    // 실제 로그인 검증 로직
    const query = ' select * from gallery'
    connection.query(query, (err, results) => {
        if (err) {
            console.error('데이터베이스 조회 오류:', err);
            res.status(500).json({ message: '서버 오류' });
            return;
        }
        res.json({ message: '성공적으로 완료되었습니다.', results: results })
    })
});

connection.connect((error) => {
    if (error) {
        console.error('데이터베이스 연결 실패:', error);
        return;
    }
    console.log('데이터베이스에 연결되었습니다.');
    app.listen(3001, () => {
        console.log('Server is running on port 3001');
    });
});