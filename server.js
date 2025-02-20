const express = require('express');
const path = require('path');

const app = express();
const PORT = 10000;

// 현재 폴더의 index.html을 서빙
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express 서버가 실행 중: http://localhost:${PORT}`);
});
