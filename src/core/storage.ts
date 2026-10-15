/**
 * 安全存储封装
 *
 * 优先使用 localStorage；在 file:// 下部分浏览器策略、隐私模式或配额问题会导致不可用，
 * 此时自动降级为内存存储（仅本次运行有效），绝不抛错影响游戏。
 */

const memoryStore = new Map<string, string>();

let storageAvailable: boolean | null = null;

/**
 * 检测 localStorage 是否可用（带写入测试，结果缓存）
 * @returns 是否可用
 */
export function isStorageAvailable(): boolean {
  if (storageAvailable !== null) return storageAvailable;
  try {
    const testKey = '__mayi_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

/**
 * 读取并解析 JSON
 * @param key 存储键
 * @param fallback 读取失败或不存在时的默认值
 * @returns 解析结果
 */
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = isStorageAvailable() ? window.localStorage.getItem(key) : memoryStore.get(key) ?? null;
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * 序列化并写入 JSON
 * @param key 存储键
 * @param value 任意可序列化值
 * @returns 是否成功持久化到 localStorage（内存降级时返回 false）
 */
export function saveJSON(key: string, value: unknown): boolean {
  let raw: string;
  try {
    raw = JSON.stringify(value);
  } catch {
    return false;
  }
  if (isStorageAvailable()) {
    try {
      window.localStorage.setItem(key, raw);
      return true;
    } catch {
      // 配额或策略问题，降级
      storageAvailable = false;
    }
  }
  memoryStore.set(key, raw);
  return false;
}

/**
 * 删除键
 * @param key 存储键
 */
export function removeKey(key: string): void {
  try {
    if (isStorageAvailable()) window.localStorage.removeItem(key);
  } catch {
    /* 忽略 */
  }
  memoryStore.delete(key);
}
