export * from './kv-storage.base';
export * from './redis.kv-storage';
export * from './prisma.kv-storage';

export const WECHAT_KV_STORAGE = Symbol.for('WechatKeyValueStorage');
export const WXKF_KV_STORAGE = Symbol.for('WxkfKeyValueStorage');
