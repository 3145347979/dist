// EdgeOne Pages Worker - Kimi API Proxy
// 部署到根目录作为 _worker.js

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 处理 /api/kimi/* 请求
    if (url.pathname.startsWith('/api/kimi/')) {
      // 移除 /api/kimi 前缀，转发到 Kimi API
      const targetPath = url.pathname.replace('/api/kimi', '');
      const targetUrl = `https://api.moonshot.cn${targetPath}${url.search}`;

      // 复制请求头
      const headers = new Headers(request.headers);
      headers.delete('host');
      headers.set('host', 'api.moonshot.cn');

      // 创建转发请求
      const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.body,
      });

      try {
        const response = await fetch(proxyRequest);

        // 复制响应头并添加CORS
        const corsHeaders = new Headers(response.headers);
        corsHeaders.set('Access-Control-Allow-Origin', '*');
        corsHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        corsHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // 处理预检请求
        if (request.method === 'OPTIONS') {
          return new Response(null, {
            status: 204,
            headers: corsHeaders,
          });
        }

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: corsHeaders,
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // 其他请求走默认静态资源
    return env.ASSETS.fetch(request);
  },
};
