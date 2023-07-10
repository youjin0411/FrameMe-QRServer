const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');
const fs = require('fs');

const upload = multer({
    limits: {
        fieldSize: Infinity,
    },
    dest: 'uploads/',
});

const app = express();

app.use(express.json());
app.use(express.static('uploads'));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

const MongoClient = require("mongodb").MongoClient;
const url = 'mongodb+srv://admin:1234@cluster0.eweii4t.mongodb.net/?retryWrites=true&w=majority';

var db;
MongoClient.connect(url, { useUnifiedTopology: true }, function(에러, client) {
    if (에러) console.log(에러);
    db = client.db('gallery'); //데이터베이스 명
    console.log('연결되었습니다!')
    app.listen(3001, () => {
        console.log('Server is running on port 3001');
    });
});

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
        const qrCodePath2 = `${Date.now()}_qrcode.png`;
        const qrCodePath = `uploads/${qrCodePath2}`;
        await QRCode.toFile(qrCodePath, qrCodeData, qrCodeOptions);
        const qrimgLink = `https://port-0-framemeserver-7xwyjq992llisq9g9j.sel4.cloudtype.app/download/${qrCodePath2}`;
        res.json({ downloadLink: qrCodeData, qrimgLinkprint: qrimgLink })
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//클라이언트가 요청한 파일을 다운로드할 수 있도록 서버의 기능을 제공
app.get('/download/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = `uploads/${filename}`;
    res.download(filePath, filename, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
});

app.post('/insert', (req, res) => {
    const { name, today, time, qrCodeImage, frameimage } = req.body;
    db.collection("gallery").insertOne({ name: name, day: today, time: time, qr: qrCodeImage, frame: frameimage },
        (error, result) => {
            if (error) {
                console.error('데이터 삽입 오류:', error);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            console.log('데이터 삽입 완료');
            res.end();
        }
    );
});

app.get("/select", (req, res) => {
    db.collection("gallery").find({}).toArray(function(error, result) {
        if (error) {
            console.log(error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        console.log(result)
        res.send(result);
    });
});