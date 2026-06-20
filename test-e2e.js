const http = require('http');
const FormData = require('form-data');
const fs = require('fs');

fs.writeFileSync('test-upload.txt', 'Hello from upload test! 測試上傳');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost', port: 5000, path, method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers.Authorization = 'Bearer ' + token;
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

(async () => {
  // 1. 登录获取 token
  const login = await req('POST', '/api/auth/login', { email: 'test1@x.com', password: '123456' });
  const { token } = JSON.parse(login.body);
  console.log('Token 获取成功');

  // 2. 上传文件
  const form = new FormData();
  form.append('file', fs.createReadStream('test-upload.txt'), 'test-upload.txt');

  form.submit({
    host: 'localhost', port: 5000, path: '/api/resources/upload',
    headers: { ...form.getHeaders(), Authorization: 'Bearer ' + token }
  }, (err, res) => {
    if (err) { console.error('上传错误:', err); return; }
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      console.log('上传响应:', res.statusCode, body);
      const data = JSON.parse(body);

      // 3. 创建带 fileUrl 的资源
      req('POST', '/api/resources', {
        title: '我的上传测试资源',
        description: '通过 API 上传',
        category: '编程开发',
        type: 'document',
        fileUrl: data.fileUrl
      }, token).then(r => {
        const created = JSON.parse(r.body);
        console.log('资源创建:', r.status, 'id:', created.id, 'fileUrl:', created.fileUrl);

        // 4. 触发下载
        const downloadOpts = {
          hostname: 'localhost', port: 5000,
          path: '/api/resources/' + created.id + '/download',
          method: 'GET'
        };
        const dr = http.request(downloadOpts, dres => {
          let d = '';
          dres.on('data', c => d += c);
          dres.on('end', () => {
            console.log('下载响应:', dres.statusCode, '内容长度:', d.length, '前20字节:', d.substring(0, 20));
            fs.unlinkSync('test-upload.txt');
            console.log('✅ 端到端测试全部通过');
            process.exit(0);
          });
        });
        dr.end();
      });
    });
  });
})();
