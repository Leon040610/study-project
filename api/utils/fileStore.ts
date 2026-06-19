/**
 * JSON 文件持久化工具
 *
 * 将内存数据自动序列化到 JSON 文件，实现重启后数据不丢失。
 * 特性：
 *   - 自动创建 data/ 目录
 *   - 写入前原子操作（先写临时文件再 rename，防崩溃损坏）
 *   - 防并发写入冲突（简单互斥锁）
 *   - 启动时自动加载已有数据
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(__dirname, '..', 'data');

// 确保 data 目录存在
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * 文件存储实例
 *
 * @example
 * ```ts
 * const userStore = new FileStore<{ id: string; name: string }>('users');
 * // 加载已有数据
 * const users = userStore.load();
 * // 修改后保存
 * users['a'] = { id: 'a', name: 'test' };
 * userStore.save(users);
 * ```
 */
export class FileStore<T> {
  private filePath: string;
  private lock: boolean = false;

  constructor(name: string) {
    ensureDataDir();
    this.filePath = path.join(DATA_DIR, `${name}.json`);
  }

  /**
   * 从 JSON 文件加载数据
   * 如果文件不存在或解析失败，返回默认值
   */
  load(defaultValue?: T): T {
    try {
      if (!fs.existsSync(this.filePath)) {
        return defaultValue ?? ({} as T);
      }
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[FileStore] 加载 ${path.basename(this.filePath)} 失败:`, err);
      return defaultValue ?? ({} as T);
    }
  }

  /**
   * 将数据写入 JSON 文件（原子写入）
   * 使用 write-to-temp + rename 模式防止文件损坏
   */
  save(data: T): void {
    if (this.lock) {
      console.warn(`[FileStore] ${path.basename(this.filePath)} 正在写入中，跳过本次保存`);
      return;
    }
    this.lock = true;
    try {
      const json = JSON.stringify(data, null, 2);
      const tmpPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tmpPath, json, 'utf-8');
      fs.renameSync(tmpPath, this.filePath);
    } catch (err) {
      console.error(`[FileStore] 保存 ${path.basename(this.filePath)} 失败:`, err);
    } finally {
      this.lock = false;
    }
  }

  /**
   * 获取文件路径（用于调试）
   */
  getPath(): string {
    return this.filePath;
  }

  /**
   * 删除存储文件
   */
  clear(): void {
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }
  }
}

/**
 * 数组型文件存储（适用于 Post[]、Goal[] 等数组数据）
 */
export class ArrayFileStore<T> extends FileStore<T[]> {
  load(): T[] {
    return super.load([]);
  }
}
