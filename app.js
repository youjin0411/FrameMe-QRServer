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
        const qrimgLink = `https://port-0-framemeserver-7xwyjq992llisq9g9j.sel4.cloudtype.app/${qrCodePath}`;
        res.json({
            downloadLink: qrCodeData,
            qrimgLink: qrimgLink
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

app.listen(3001, () => {
    console.log('Server is running on port 3001');
});