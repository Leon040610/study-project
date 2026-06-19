/**
 * 通知发送服务
 * 支持邮件（HTML 模板）和推送通知两种渠道
 * 包含发送失败重试机制（指数退避）
 */

// ---- 通知类型 ----
export type NotificationChannel = 'email' | 'push' | 'both';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationPayload {
  userId: string;
  userEmail: string;
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  dueDate: string;
  priority: NotificationPriority;
  planTitle?: string;
  resourceLinks?: { title: string; url: string }[];
}

export interface NotificationLog {
  id: string;
  userId: string;
  taskId: string;
  channel: 'email' | 'push';
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: string;
  sentAt?: string;
  nextRetryAt?: string;
  payload: NotificationPayload;
}

// ---- 日志存储 ----
const notificationLogs: NotificationLog[] = [];

// ---- 重试配置 ----
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 30_000; // 30 秒基础延迟

/**
 * 指数退避延迟计算
 * 第 1 次重试：30s，第 2 次：60s，第 3 次：120s
 */
function getRetryDelay(attempt: number): number {
  return BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ---- 邮件模板 ----

/**
 * 生成 HTML 格式的学习提醒邮件
 */
export function generateEmailHtml(payload: NotificationPayload): string {
  const priorityColors: Record<NotificationPriority, string> = {
    low: '#64748b',
    normal: '#2563eb',
    high: '#d97706',
    urgent: '#dc2626',
  };

  const priorityLabels: Record<NotificationPriority, string> = {
    low: '一般',
    normal: '普通',
    high: '重要',
    urgent: '紧急',
  };

  const dueDate = new Date(payload.dueDate);
  const formattedDate = dueDate.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const resourceSection = payload.resourceLinks && payload.resourceLinks.length > 0
    ? `
      <tr>
        <td style="padding: 16px 24px; background: #f8fafc;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #64748b;">相关学习资源</p>
          ${payload.resourceLinks.map(r => `
            <a href="${r.url}" style="display: inline-block; margin: 4px 8px 4px 0; padding: 6px 14px; background: #eef2ff; color: #4f46e5; text-decoration: none; border-radius: 6px; font-size: 13px;">${r.title}</a>
          `).join('')}
        </td>
      </tr>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    <!-- 头部 -->
    <tr>
      <td style="padding: 24px; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">学习任务提醒</h1>
        <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">${payload.planTitle || '智能学习助手'}</p>
      </td>
    </tr>
    <!-- 优先级标签 -->
    <tr>
      <td style="padding: 16px 24px 0;">
        <span style="display: inline-block; padding: 4px 12px; background: ${priorityColors[payload.priority]}; color: #ffffff; border-radius: 4px; font-size: 12px; font-weight: 600;">
          ${priorityLabels[payload.priority]}优先级
        </span>
      </td>
    </tr>
    <!-- 任务详情 -->
    <tr>
      <td style="padding: 16px 24px;">
        <h2 style="margin: 0 0 8px; font-size: 18px; color: #0f172a;">${payload.taskTitle}</h2>
        ${payload.taskDescription ? `<p style="margin: 0 0 12px; font-size: 14px; color: #475569; line-height: 1.6;">${payload.taskDescription}</p>` : ''}
        <p style="margin: 0; font-size: 14px; color: #64748b;">
          截止时间：<strong style="color: #0f172a;">${formattedDate}</strong>
        </p>
      </td>
    </tr>
    ${resourceSection}
    <!-- 一键完成按钮 -->
    <tr>
      <td style="padding: 16px 24px 24px; text-align: center;">
        <a href="http://localhost:5173/plans?complete=${payload.taskId}"
           style="display: inline-block; padding: 12px 32px; background: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600;">
          一键完成任务
        </a>
      </td>
    </tr>
    <!-- 底部 -->
    <tr>
      <td style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
          此邮件由智能学习助手自动发送，请勿回复
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 生成邮件主题
 */
export function generateEmailSubject(payload: NotificationPayload): string {
  const priorityPrefix: Record<NotificationPriority, string> = {
    low: '[学习提醒]',
    normal: '[学习提醒]',
    high: '[重要提醒]',
    urgent: '[紧急提醒]',
  };
  return `${priorityPrefix[payload.priority]} ${payload.taskTitle} - 即将到期`;
}

// ---- 模拟发送器 ----

/**
 * 模拟邮件发送
 * 生产环境替换为 nodemailer.transporter.sendMail()
 */
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  console.log(`[邮件服务] 发送至 ${to} | 主题: ${subject}`);
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  // 模拟 5% 失败率用于测试重试机制
  if (Math.random() < 0.05) {
    throw new Error('SMTP 连接超时');
  }
  console.log(`[邮件服务] 发送成功`);
}

/**
 * 模拟推送通知发送
 * 生产环境替换为 web-push 或 APNs/FCM SDK 调用
 */
async function sendPushNotification(payload: NotificationPayload): Promise<void> {
  console.log(`[推送服务] 发送至用户 ${payload.userId} | 任务: ${payload.taskTitle}`);
  await new Promise(resolve => setTimeout(resolve, 150));
  if (Math.random() < 0.05) {
    throw new Error('推送服务不可用');
  }
  console.log(`[推送服务] 发送成功`);
}

// ---- 核心发送逻辑 ----

/**
 * 发送通知（带重试机制）
 */
export async function sendNotification(
  payload: NotificationPayload,
  channel: NotificationChannel
): Promise<NotificationLog[]> {
  const logs: NotificationLog[] = [];
  const channels: ('email' | 'push')[] =
    channel === 'both' ? ['email', 'push'] : [channel];

  for (const ch of channels) {
    const log: NotificationLog = {
      id: generateId(),
      userId: payload.userId,
      taskId: payload.taskId,
      channel: ch,
      status: 'pending',
      attempts: 0,
      maxAttempts: MAX_RETRIES + 1,
      createdAt: new Date().toISOString(),
      payload,
    };
    notificationLogs.push(log);
    logs.push(log);

    // 异步执行发送（不阻塞调度器）
    attemptSend(log).catch(err => {
      console.error(`[通知服务] 发送异常:`, err);
    });
  }

  return logs;
}

/**
 * 尝试发送单条通知（含重试逻辑）
 */
async function attemptSend(log: NotificationLog): Promise<void> {
  while (log.attempts < log.maxAttempts && log.status !== 'sent') {
    log.attempts++;
    log.status = 'retrying';

    try {
      if (log.channel === 'email') {
        await sendEmail(
          log.payload.userEmail,
          generateEmailSubject(log.payload),
          generateEmailHtml(log.payload)
        );
      } else {
        await sendPushNotification(log.payload);
      }

      log.status = 'sent';
      log.sentAt = new Date().toISOString();
      return;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      log.error = errorMsg;

      if (log.attempts < log.maxAttempts) {
        const delay = getRetryDelay(log.attempts);
        log.nextRetryAt = new Date(Date.now() + delay).toISOString();
        log.status = 'retrying';
        console.warn(`[通知服务] 第 ${log.attempts} 次发送失败，${delay / 1000}s 后重试: ${errorMsg}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        log.status = 'failed';
        console.error(`[通知服务] 发送失败，已达最大重试次数: ${errorMsg}`);
      }
    }
  }
}

// ---- 日志查询 ----

/**
 * 查询用户通知日志
 */
export function getNotificationLogs(userId: string, options?: {
  status?: NotificationLog['status'];
  limit?: number;
  offset?: number;
}): NotificationLog[] {
  let results = notificationLogs.filter(l => l.userId === userId);

  if (options?.status) {
    results = results.filter(l => l.status === options.status);
  }

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const offset = options?.offset || 0;
  const limit = options?.limit || 50;
  return results.slice(offset, offset + limit);
}

/**
 * 获取通知统计
 */
export function getNotificationStats(userId: string): {
  total: number;
  sent: number;
  failed: number;
  retrying: number;
} {
  const logs = notificationLogs.filter(l => l.userId === userId);
  return {
    total: logs.length,
    sent: logs.filter(l => l.status === 'sent').length,
    failed: logs.filter(l => l.status === 'failed').length,
    retrying: logs.filter(l => l.status === 'retrying').length,
  };
}
