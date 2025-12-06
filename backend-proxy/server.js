const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 4000;
const TARGET_URL = 'https://sdhsafterproject2025-production.up.railway.app';

// 모든 출처에서의 CORS 요청 허용
app.use(cors({
  origin: true, // reflect origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
}));

// API 요청을 Railway 백엔드로 전달
app.use('/api', createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true, // 호스트 헤더를 타겟 URL로 변경
  secure: false, // SSL 인증서 검증 무시
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    // 백엔드를 속이기 위해 Origin 헤더 변경 (CORS 우회)
    proxyReq.setHeader('Origin', TARGET_URL);
    console.log(`[Proxy] Request: ${req.method} ${req.url} -> ${TARGET_URL}${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Proxy] Response: ${proxyRes.statusCode} ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err);
    res.status(500).send('Proxy Error');
  }
}));

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Proxy Server running on port ${PORT}`);
  console.log(`👉 Target Backend: ${TARGET_URL}`);
  console.log(`=========================================`);
});
