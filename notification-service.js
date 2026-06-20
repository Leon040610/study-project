// notification-service.js
// 真实邮件发送 + 短信/推送控制台模拟
const nodemailer = require('nodemailer');

let transporter = null;
let smtpConfig = null;

// 加载 .env 或环境变量
function loadSmtpConfig() {
  if (smtpConfig) return smtpConfig;
  smtpConfig = {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: (process.env.SMTP_SECURE !== 'false'), // 默认 SSL
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromName: process.env.SMTP_FROM_NAME || '学习平台'
  };
  return smtpConfig;
}

function getTransporter() {
  const cfg = loadSmtpConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass }
    });
  }
  return transporter;
}

// 检查 SMTP 是否配置
function isSmtpConfigured() {
  const cfg = loadSmtpConfig();
  return !!(cfg.host && cfg.user && cfg.pass);
}

// 渲染 HTML 邮件
function renderEmailHtml(payload, channel = 'email') {
  const { taskTitle, taskDescription, dueDate, priority, planTitle } = payload;
  const priorityColor = priority === 'high' ? '#ef4444' : priority === 'low' ? '#94a3b8' : '#3b82f6';
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f8fafc;">
    <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; color: #fff;">
        <h1 style="margin: 0; font-size: 20px;">📚 学习提醒</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">智能学习平台 · 实时通知</p>
      </div>
      <div style="padding: 24px;">
        <div style="display: inline-block; padding: 4px 12px; background: ${priorityColor}22; color: ${priorityColor}; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
          优先级: ${priority || 'normal'}
        </div>
        <h2 style="margin: 0 0 12px; font-size: 18px; color: #1e293b;">${taskTitle || '学习任务提醒'}</h2>
        <p style="color: #475569; line-height: 1.6; font-size: 14px;">${taskDescription || '请按时完成学习任务'}</p>
        ${planTitle ? `<p style="color: #64748b; font-size: 13px;"><strong>所属计划:</strong> ${planTitle}</p>` : ''}
        ${dueDate ? `<p style="color: #64748b; font-size: 13px;"><strong>截止时间:</strong> ${new Date(dueDate).toLocaleString('zh-CN')}</p>` : ''}
        <div style="margin-top: 24px; padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e; font-size: 13px;">⏰ 请合理安排时间，及时完成学习任务</p>
        </div>
      </div>
      <div style="padding: 16px 24px; background: #f1f5f9; color: #94a3b8; font-size: 12px; text-align: center;">
        发送时间: ${new Date().toLocaleString('zh-CN')}<br>
        本邮件由学习平台自动发送，请勿直接回复
      </div>
    </div>
  </div>`;
}

// 发送邮件（真实 SMTP）
async function sendEmail({ to, subject, html, text }) {
  const cfg = loadSmtpConfig();
  const tx = getTransporter();
  if (!tx) {
    return { ok: false, reason: 'SMTP 未配置' };
  }
  if (!to) {
    return { ok: false, reason: '收件人邮箱为空' };
  }
  try {
    const info = await tx.sendMail({
      from: `"${cfg.fromName}" <${cfg.user}>`,
      to,
      subject: subject || '学习提醒',
      html: html || '',
      text: text || ''
    });
    return { ok: true, messageId: info.messageId, response: info.response };
  } catch (err) {
    return { ok: false, reason: err.message || String(err) };
  }
}

// 短信 - 控制台模拟
async function sendSms({ phone, payload }) {
  if (!phone) return { ok: false, reason: '手机号为空' };
  const text = `【学习提醒】${payload.taskTitle || '任务即将到期'}` +
    (payload.dueDate ? ` 截止:${new Date(payload.dueDate).toLocaleString('zh-CN')}` : '');
  console.log('\n========== SMS (Console Simulated) ==========');
  console.log('To:', phone);
  console.log('Content:', text);
  console.log('=============================================\n');
  return { ok: true, simulated: true, content: text };
}

// 站内推送 - 总是成功
async function sendPush({ userId, payload }) {
  console.log('\n========== PUSH (站内通知) ==========');
  console.log('UserId:', userId);
  console.log('Title:', payload.taskTitle);
  console.log('====================================\n');
  return { ok: true, simulated: false, content: payload.taskTitle };
}

// 主分发函数
async function dispatchNotification({ user, channel, payload, source = 'manual' }) {
  const result = { channel, status: 'failed', details: {} };
  if (channel === 'email') {
    if (!user.email) {
      result.details = { reason: '用户未设置邮箱' };
      return result;
    }
    const html = renderEmailHtml(payload, 'email');
    const text = `${payload.taskTitle || '学习提醒'}\n${payload.taskDescription || ''}\n截止:${payload.dueDate ? new Date(payload.dueDate).toLocaleString('zh-CN') : '无'}`;
    const r = await sendEmail({ to: user.email, subject: `学习提醒：${payload.taskTitle || '任务到期'}`, html, text });
    if (r.ok) {
      result.status = 'sent';
      result.details = { to: user.email, messageId: r.messageId };
    } else {
      result.details = { to: user.email, error: r.reason };
    }
  } else if (channel === 'sms') {
    if (!user.phone) {
      result.details = { reason: '用户未设置手机号' };
      return result;
    }
    const r = await sendSms({ phone: user.phone, payload });
    if (r.ok) {
      result.status = 'sent';
      result.details = { to: user.phone, simulated: r.simulated, content: r.content };
    } else {
      result.details = r;
    }
  } else if (channel === 'push') {
    const r = await sendPush({ userId: user.id, payload });
    if (r.ok) {
      result.status = 'sent';
      result.details = { userId: user.id, content: r.content };
    } else {
      result.details = r;
    }
  } else {
    result.details = { reason: `未知渠道: ${channel}` };
  }
  return result;
}

module.exports = {
  dispatchNotification,
  isSmtpConfigured,
  loadSmtpConfig,
  renderEmailHtml,
  sendEmail
};
