# AI 准入：通用 config + 前端门闩

## 目标

- 未在允许名单中的设备：**自动隐藏 AI 能力**，不影响主流程。
- 允许名单以数据库为真相；用**通用** `app_config`，不建白名单专用表。
- 前端经 RPC 只查「当前设备是否允许」，不暴露整份名单。
- 「我的 → 设备码」始终显示，并标 **已开通 / 未开通**。

## 数据

`app_config(key text PK, value jsonb, updated_at)`  

- 键 `ai.allow_device_ids`：字符串数组。缺键或 `[]` → 无人可用。
- anon 无直接读写；`ai_is_allowed(p_device_id text) → boolean`（SECURITY DEFINER）。

## Worker

- 从 `app_config` 读取名单（可短缓存），写入运行时 `quota.allowDeviceIds`。
- 不在名单 → `quota_users`；不再用 env 白名单 / 空名单先到先占作为生产真相。
- 日/分钟限额仍用环境变量。

## 前端

- `isAiAllowed(deviceId)` → RPC。
- 实现 AI 功能时：未允许则不渲染入口；`completeText` 调用前再断言。
- `DeviceIdRow`：显示开通状态。

## 冒烟

- 使用 `smoke.` + 高熵 hex（非 UUID、难猜）。
- 脚本用 service role 将 id 并入 `ai.allow_device_ids`，再入队；可选测后清理。
