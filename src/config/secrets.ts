/**
 * 趣味解锁口令集中配置
 *
 * 仅用于生日小游戏的趣味解锁，不是安全认证。
 * 约定：正确口令不得出现在游戏界面、提示气泡或随包附带的使用说明中；需要修改时只改这里。
 */

/** 心愿扩容口令（含义：单选限制「不存在」） */
const WISH_EXPAND_CODE = '404';

/**
 * 校验心愿扩容口令：忽略前后空格，不区分全角 / 半角数字
 * @param input 玩家输入
 */
export function verifyWishExpandCode(input: string): boolean {
  const normalized = input
    .trim()
    .replace(/[\uff10-\uff19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30));
  return normalized === WISH_EXPAND_CODE;
}
