/**
 * 备份自动恢复模块
 *
 * 职责：
 *  1. 扫描 backups/ 目录，按 createdAt 排序找出最新有效备份
 *  2. 与现有 data.json 对比"数据量"，决定是否需要恢复
 *  3. 完整地合并备份数据 → 当前 data.json（保留现有较新数据）
 *  4. 输出结构化日志，便于追溯
 *
 * 设计目标：
 *  - 启动时间增加 < 50ms（备份文件通常 < 1MB，O(n) 扫描可接受）
 *  - 失败容错：单个备份损坏不影响启动
 *  - 零硬依赖：仅使用 Node 内置 fs/path
 */

const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, 'backups');
const DATA_FILE = path.join(__dirname, 'data.json');

/**
 * 从文件名中提取 ISO 时间戳。
 * 兼容两种命名：
 *   - backup-2026-06-20T16-31-52-281Z.json
 *   - backup-2026-06-20.json
 */
function parseBackupTimestamp(filename) {
  const m = filename.match(/backup-([0-9T:\-]+Z?)\.json$/i);
  if (!m) return 0;
  const iso = m[1].endsWith('Z') ? m[1] : m[1] + 'Z';
  const t = Date.parse(iso);
  return isNaN(t) ? 0 : t;
}

/**
 * 尝试解析一个备份文件，失败返回 null。
 * 必须满足结构：{ version, createdAt, data: {...} }。
 */
function safeReadBackup(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size === 0 || stat.size > 50 * 1024 * 1024) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.data) return null;
    if (!Array.isArray(parsed.data.users)) return null;
    return { filePath, stat, backup: parsed };
  } catch (e) {
    console.warn(`[backup] 跳过损坏的备份文件 ${path.basename(filePath)}: ${e.message}`);
    return null;
  }
}

/**
 * 扫描备份目录，返回所有有效备份，按 createdAt 降序排列。
 */
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  let entries = [];
  try {
    entries = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup-') && f.endsWith('.json'));
  } catch (e) {
    console.warn('[backup] 无法读取备份目录:', e.message);
    return [];
  }
  const valid = [];
  for (const name of entries) {
    const r = safeReadBackup(path.join(BACKUP_DIR, name));
    if (r) valid.push(r);
  }
  // 文件名时间戳优先级最高（与文件 mtime 互补）
  valid.sort((a, b) => {
    const ta = parseBackupTimestamp(path.basename(a.filePath));
    const tb = parseBackupTimestamp(path.basename(b.filePath));
    if (ta !== tb) return tb - ta;
    return b.stat.mtimeMs - a.stat.mtimeMs;
  });
  return valid;
}

/**
 * 统计一份"业务数据对象"的关键体量。
 * 用于比较"现有 data.json"和"备份 data"哪个更新更全。
 */
function dataMetrics(d) {
  return {
    users: (d.users || []).length,
    goals: (d.goals || []).length,
    plans: (d.plans || []).length,
    tasks: (d.tasks || []).length,
    posts: (d.posts || []).length,
    comments: (d.comments || []).length,
    resources: (d.resources || []).length,
    announcements: (d.announcements || []).length,
    reminders: (d.reminders || []).length,
    rules: (d.reminderRules || []).length
  };
}

function metricSum(m) {
  return m.users + m.goals + m.plans + m.tasks + m.posts + m.comments +
    m.resources + m.announcements + m.reminders + m.rules;
}

/**
 * 智能合并：以备份数据为底，但保留当前 data.json 中"看起来更晚"的字段。
 * 这里采用简单策略——以备份为主体（因为备份是历史快照，体量通常更全），
 * 然后用当前 data.json 覆盖备份里缺失的字段（id 计数器等）。
 */
function mergeData(baseData, overrideData) {
  const out = { ...baseData };
  for (const key of Object.keys(overrideData || {})) {
    // 数组类型：以 base 为主，追加 override 中 base 缺失的项
    if (Array.isArray(baseData[key]) && Array.isArray(overrideData[key])) {
      const seen = new Set();
      const merged = [];
      for (const item of baseData[key]) {
        const id = item && (item.id || item.email);
        if (id != null) seen.add(id);
        merged.push(item);
      }
      for (const item of overrideData[key]) {
        const id = item && (item.id || item.email);
        if (id == null || !seen.has(id)) {
          merged.push(item);
          if (id != null) seen.add(id);
        }
      }
      out[key] = merged;
    } else {
      // 标量/对象：override 优先
      if (overrideData[key] !== undefined && overrideData[key] !== null) {
        out[key] = overrideData[key];
      }
    }
  }
  return out;
}

/**
 * 备份自动恢复主入口。
 *
 * @param {object} options
 * @param {boolean} options.force           强制从最新备份恢复（忽略当前 data.json 体量）
 * @param {number}  options.emptyThreshold  现有 data.json 总记录数 < 此值时，判定为"空"并触发恢复
 * @returns {{ restored: boolean, source: string|null, message: string }}
 */
function autoRestoreFromLatestBackup(options = {}) {
  const t0 = Date.now();
  const force = options.force === true;
  const emptyThreshold = Number.isFinite(options.emptyThreshold) ? options.emptyThreshold : 5;

  const result = { restored: false, source: null, message: '未触发恢复', metrics: null };

  // 1. 扫描备份
  const backups = listBackups();
  if (backups.length === 0) {
    console.log('[backup] backups/ 目录无有效备份，跳过自动恢复');
    return result;
  }
  const latest = backups[0];
  const backupData = latest.backup.data;

  // 2. 读取当前 data.json（如不存在则视为空）
  let currentData = null;
  if (fs.existsSync(DATA_FILE)) {
    try {
      currentData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      console.warn('[backup] 当前 data.json 解析失败，将被备份覆盖:', e.message);
    }
  }

  const currentMetrics = currentData ? dataMetrics(currentData) : null;
  const backupMetrics = dataMetrics(backupData);
  const currentSum = currentMetrics ? metricSum(currentMetrics) : 0;
  const backupSum = metricSum(backupMetrics);

  console.log('[backup] 扫描到有效备份', backups.length, '个');
  console.log('[backup] 最新备份:', path.basename(latest.filePath),
    `(创建于 ${latest.backup.createdAt || '未知'})`);
  console.log('[backup] 当前 data.json 体量:', currentMetrics || '(不存在)');
  console.log('[backup] 最新备份体量:', backupMetrics);

  // 3. 决策：是否触发恢复
  const isCurrentEmpty = !currentData || currentSum < emptyThreshold;
  const backupIsRicher = backupSum > currentSum;
  let shouldRestore = false;
  let reason = '';

  if (force) {
    shouldRestore = true;
    reason = '强制模式 (force=true)';
  } else if (!currentData) {
    shouldRestore = true;
    reason = '当前 data.json 不存在';
  } else if (isCurrentEmpty && backupIsRicher) {
    shouldRestore = true;
    reason = `当前数据为空 (总记录数 ${currentSum} < 阈值 ${emptyThreshold}) 且备份数据更丰富`;
  }

  if (!shouldRestore) {
    result.message = `现有数据完整 (${currentSum} 条记录 ≥ 阈值)，跳过恢复`;
    console.log('[backup]', result.message);
    return result;
  }

  // 4. 合并并写回
  const merged = currentData
    ? mergeData(backupData, currentData) // 以备份为底，叠加当前不存在的项
    : backupData;

  try {
    // 写一份到 data.json（覆盖）
    fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    result.restored = true;
    result.source = path.basename(latest.filePath);
    result.message = `已从 ${result.source} 自动恢复 (${reason})`;
    result.metrics = dataMetrics(merged);
    console.log('[backup]', result.message);
    console.log('[backup] 合并后数据体量:', result.metrics);
  } catch (e) {
    console.error('[backup] 写入 data.json 失败:', e.message);
    result.message = '写入失败: ' + e.message;
  }

  const cost = Date.now() - t0;
  console.log(`[backup] 自动恢复流程耗时 ${cost}ms`);
  return result;
}

module.exports = {
  autoRestoreFromLatestBackup,
  listBackups,
  dataMetrics,
  parseBackupTimestamp,
  BACKUP_DIR,
  DATA_FILE
};
