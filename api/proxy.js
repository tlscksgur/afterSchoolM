// Vercel Serverless Function - API Proxy
// 모든 /api/* 요청을 백엔드 서버로 전달합니다

const BACKEND_URL = 'https://sdhsafterproject2025-production.up.railway.app';

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // OPTIONS 요청 (preflight) 처리
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // URL 경로 추출 (예: /api/proxy?path=/api/auth/login)
    const path = req.query.path || '';
    const targetUrl = `${BACKEND_URL}${path}`;

    try {
        // 백엔드로 요청 전달
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
            },
            ...(req.method !== 'GET' && req.method !== 'HEAD' && { body: JSON.stringify(req.body) }),
        });

        // 백엔드 응답을 그대로 반환
        const data = await response.text();

        res.status(response.status);

        // Content-Type 헤더 복사
        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        res.send(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy request failed', message: error.message });
    }
}
