#!/usr/bin/env node
/**
 * 生成 Staging 用的 ACTOR_TRUST_TOKEN。
 * 用法：node scripts/generate-staging-token.mjs
 * 输出：一串可复制到 Railway / Vercel 环境变量里的值，以及简短说明。
 */
import crypto from "crypto";

const token = crypto.randomBytes(32).toString("hex");
console.log("");
console.log("========== 请复制下面这一整行（仅红色/高亮部分）到环境变量 ==========");
console.log("");
console.log(token);
console.log("");
console.log("========== 说明 ==========");
console.log("1. Railway（主线）里：变量名填 ACTOR_TRUST_TOKEN，值粘贴上面那串。");
console.log("2. Vercel（官网）里：变量名填 MAINLINE_ACTOR_TRUST_TOKEN，值粘贴同一串。");
console.log("3. 两边必须完全一致，否则官网请求主线时会校验失败。");
console.log("");
