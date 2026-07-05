﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿/**
 * 平行时空档案馆 v0.27.0
 * Parallel Universe Archive — 让Roche拥有平行时空
 *
 * v0.27.0: 界面安全区域适配 — 顶栏/底栏 safe-area-inset 支持/设置页可自定义偏移/对话页面与主页面统一适配
 * v0.42.0: 记忆系统核心重写 — 数据结构升级/批次总结JSON/对话总结JSON/关系进展总结/手动总结确认对话框/提示词自定义/聊天记录过滤
 * v0.8.0: 预设系统/刷新模型列表/测试调用/BM25本地实现/向量召回/副API召回/分支记忆联动
 * v0.7.0: 美化分支存档配置 + 设置页面 + 记忆系统页面 + 自定义Checkbox
 * v0.1.9: 预设编辑器正式完成 — 增删排序/详情编辑/正则深度/持久化存储/导入导出/ES5修复
 * v0.1.7: 新增线下记录TXT导入功能 + 分支卡片显示来源标签
 * v0.1.6: 修复角色选择器默认值 + 增强记忆API日志 + 完善_onCharSelect容错
 * v0.1.5: 内置控制台日志面板 + 角色选择器（多char+群聊）+ 修复记忆获取
 * v0.1.4: modal overlay 改用 position:absolute + display:none（避免 fixed + pointer-events 在 WebView 中阻挡点击）
 * Phase 1: 骨架 + 分支存档 + 记忆获取
 *   - 插件注册 + App视图
 *   - 分支存档页面（按char分组）
 *   - 从当前对话获取上下文/事实/核心记忆
 *   - 悬浮球联动入口
 *
 * ES5 only — no const/let, template literals, arrow functions, optional chaining, spread, Object.assign, class
 */
;(function () {
  'use strict'

  /* ════════════════════════════════════════════════════════════
     CSS — 金色琉璃美学 (Gold & Glass)
     ════════════════════════════════════════════════════════════ */

  var sq = "'"
  var CSS = [
    '/* ── 基础重置 ── */',
    '.pua-root * { margin:0; padding:0; box-sizing:border-box; }',
    '.pua-root {',
    '  font-family:"LXGW WenKai Lite",-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;',
    '  color:var(--pua-text); background:var(--pua-bg); height:100%; width:100%;',
  '  position:relative; overflow:visible;',
    '  --pua-safe-top:env(safe-area-inset-top, 0px);',
    '  --pua-safe-bottom:env(safe-area-inset-bottom, 0px);',
    '  --pua-bg:rgba(18,18,22,0.96); --pua-bg-solid:#121216;',
    '  --pua-bg-card:rgba(28,28,36,0.88); --pua-bg-card-hover:rgba(36,36,48,0.92);',
    '  --pua-bg-input:rgba(0,0,0,0.25); --pua-glass:blur(24px) saturate(120%);',
    '  --pua-border:rgba(255,255,255,0.07); --pua-border-active:rgba(197,160,89,0.35);',
    '  --pua-accent:#C5A059; --pua-accent-dim:#957330; --pua-accent-glow:rgba(197,160,89,0.2);',
    '  --pua-text:#EAEAEA; --pua-text-sub:#A0A0A5; --pua-text-dim:#555560;',
    '  --pua-accent-text:#E8D5B0;',
    '  --pua-preset:#5b8def; --pua-char:#a76aef; --pua-user:#4ec9a0;',
    '  --pua-world:#e0a040; --pua-chat:#6a7a9a; --pua-mem:#ef6a8a;',
    '  --pua-danger:#ef4444; --pua-success:#4ec9a0;',
    '  --pua-radius:14px; --pua-radius-sm:8px;',
    '  --pua-shadow:0 8px 32px rgba(0,0,0,0.3);',
    '  --pua-transition:0.3s cubic-bezier(0.4,0,0.2,1);',
    '}',
    '.pua-root.pua-light {',
    '  --pua-bg:rgba(248,248,250,0.96); --pua-bg-solid:#f8f8fa;',
    '  --pua-bg-card:rgba(255,255,255,0.92); --pua-bg-card-hover:rgba(255,255,255,0.97);',
    '  --pua-bg-input:rgba(0,0,0,0.05); --pua-border:rgba(0,0,0,0.12);',
    '  --pua-border-active:rgba(149,115,48,0.5); --pua-accent:#957330; --pua-accent-dim:#7a5f28;',
    '  --pua-accent-glow:rgba(149,115,48,0.15); --pua-text:#1A1A1E; --pua-text-sub:#45454A;',
    '  --pua-text-dim:#888; --pua-accent-text:#3b352d; --pua-shadow:0 8px 32px rgba(0,0,0,0.08);',
    '}',

    '/* ── 布局 ── */',
    '.pua-layout { display:flex; height:100%; overflow:hidden; }',

    '/* ── 侧边栏 ── */',
    '.pua-sidebar { width:180px; min-width:180px; background:var(--pua-bg-card);',
    '  backdrop-filter:var(--pua-glass); -webkit-backdrop-filter:var(--pua-glass);',
    '  border-right:1px solid var(--pua-border); display:flex; flex-direction:column; }',
    '.pua-sidebar-brand { padding:20px 16px 16px; border-bottom:1px solid var(--pua-border); position:relative; overflow:hidden; }',
    '.pua-sidebar-brand::before { content:""; position:absolute; top:-20px; right:-20px;',
    '  width:80px; height:80px; border-radius:50%;',
    '  background:radial-gradient(circle,var(--pua-accent-glow),transparent 70%); pointer-events:none; }',
    '.pua-sidebar-brand h1 { font-size:13px; font-weight:700; letter-spacing:1px; color:var(--pua-accent); }',
    '.pua-sidebar-brand p { font-size:9.5px; color:var(--pua-text-dim); margin-top:3px; letter-spacing:0.3px; }',

    '.pua-nav { padding:10px 0; flex:1; overflow-y:auto; }',
    '.pua-nav-item { display:flex; align-items:center; gap:8px; padding:9px 16px;',
    '  cursor:pointer; color:var(--pua-text-sub); font-size:12px;',
    '  transition:var(--pua-transition); border-left:3px solid transparent; }',
    '.pua-nav-item:hover { color:var(--pua-text); background:rgba(255,255,255,0.03); }',
    '.pua-nav-item.active { color:var(--pua-accent); background:var(--pua-accent-glow); border-left-color:var(--pua-accent); }',
    '.pua-nav-icon { width:16px; text-align:center; font-size:12px; opacity:0.7; }',
    '.pua-nav-item.active .pua-nav-icon { opacity:1; }',
    '.pua-nav-badge { margin-left:auto; background:var(--pua-accent); color:#121216;',
    '  font-size:9px; padding:1px 5px; border-radius:7px; font-weight:700; }',

    '.pua-sidebar-footer { padding:10px 14px; border-top:1px solid var(--pua-border);',
    '  display:flex; align-items:center; justify-content:space-between; }',
    '.pua-theme-toggle { width:32px; height:18px; border-radius:9px; background:var(--pua-accent-dim);',
    '  cursor:pointer; position:relative; transition:var(--pua-transition); border:none; outline:none; }',
    '.pua-theme-toggle::after { content:""; position:absolute; top:2px; left:2px;',
    '  width:14px; height:14px; border-radius:50%; background:#fff; transition:var(--pua-transition); }',
    '.pua-root.pua-light .pua-theme-toggle::after { left:16px; }',
    '.pua-sidebar-footer span { font-size:10px; color:var(--pua-text-dim); }',

    '/* ── 主内容区 ── */',
    '.pua-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }',
    '.pua-topbar { min-height:48px; background:var(--pua-bg-card);',
    '  backdrop-filter:var(--pua-glass); -webkit-backdrop-filter:var(--pua-glass);',
    '  border-bottom:1px solid var(--pua-border); display:flex; align-items:center;',
    '  justify-content:space-between; padding:var(--pua-safe-top) 20px; }',
    '.pua-topbar-title { font-size:13px; font-weight:600; letter-spacing:0.3px; }',
    '.pua-topbar-actions { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }',
    '.pua-back-btn { width:28px; height:28px; border-radius:6px; border:1px solid var(--pua-border);',
    '  background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; font-size:14px;',
    '  display:flex; align-items:center; justify-content:center; transition:var(--pua-transition); margin-right:4px; }',
    '.pua-back-btn:hover { border-color:var(--pua-border-active); color:var(--pua-text); }',
    '.pua-theme-topbar-btn { width:28px; height:28px; border-radius:6px; border:1px solid var(--pua-border);',
    '  background:var(--pua-bg-card); cursor:pointer; font-size:14px;',
    '  display:flex; align-items:center; justify-content:center; transition:var(--pua-transition); margin-left:4px; }',
    '.pua-theme-topbar-btn:hover { border-color:var(--pua-border-active); }',

    '.pua-content { flex:1; overflow-y:auto; padding:16px 20px; }',
    '.pua-content::-webkit-scrollbar { width:4px; }',
    '.pua-content::-webkit-scrollbar-track { background:transparent; }',
    '.pua-content::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.06); border-radius:2px; }',

    '/* ── 按钮 ── */',
    '.pua-btn { padding:5px 12px; border-radius:var(--pua-radius-sm); border:1px solid var(--pua-border);',
    '  background:var(--pua-bg-card); color:var(--pua-text); font-size:11px; font-family:inherit;',
    '  cursor:pointer; transition:var(--pua-transition); display:flex; align-items:center; gap:4px;',
    '  backdrop-filter:blur(8px); }',
    '.pua-btn:hover { border-color:var(--pua-border-active); background:var(--pua-bg-card-hover); }',
    '.pua-btn-gold { background:linear-gradient(135deg,var(--pua-accent-dim),var(--pua-accent));',
    '  border-color:var(--pua-accent); color:#121216; font-weight:600; }',
    '.pua-btn-gold:hover { opacity:0.9; }',
    '.pua-btn-danger { border-color:var(--pua-danger); color:var(--pua-danger); }',
    '.pua-btn-danger:hover { background:rgba(239,68,68,0.1); }',
    '.pua-btn-sm { padding:3px 8px; font-size:10px; }',

    '/* ── 玻璃卡片 ── */',
    '.pua-glass { background:var(--pua-bg-card); backdrop-filter:var(--pua-glass);',
    '  -webkit-backdrop-filter:var(--pua-glass); border:1px solid var(--pua-border);',
    '  border-radius:var(--pua-radius); box-shadow:var(--pua-shadow); transition:var(--pua-transition); }',

    '/* ── 分支卡片 ── */',
    '.pua-branch-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; }',
    '.pua-branch-card { padding:16px; cursor:pointer; position:relative; overflow:hidden; }',
    '.pua-branch-card:hover { border-color:var(--pua-border-active); transform:translateY(-2px); }',
    '.pua-branch-card::before { content:""; position:absolute; top:0; left:0; right:0; height:2px;',
    '  background:linear-gradient(90deg,var(--pua-accent-dim),var(--pua-accent));',
    '  opacity:0; transition:var(--pua-transition); }',
    '.pua-branch-card:hover::before { opacity:1; }',
    '.pua-branch-name { font-size:13px; font-weight:700; margin-bottom:6px; color:var(--pua-accent-text); }',
    '.pua-branch-meta { font-size:10px; color:var(--pua-text-dim); display:flex; flex-direction:column; gap:1px; }',
    '.pua-branch-tags { display:flex; gap:4px; margin-top:8px; flex-wrap:wrap; }',
    '.pua-tag { font-size:9px; padding:1px 6px; border-radius:3px; background:rgba(255,255,255,0.05); color:var(--pua-text-sub); }',
    '.pua-tag-char { background:rgba(167,106,239,0.1); color:var(--pua-char); }',
    '.pua-tag-mem { background:rgba(239,106,138,0.1); color:var(--pua-mem); }',
    '.pua-tag-preset { background:rgba(91,141,239,0.1); color:var(--pua-preset); }',
    '.pua-tag-offline { background:rgba(78,201,160,0.1); color:var(--pua-success); }',
    '.pua-tag-online { background:rgba(106,122,154,0.1); color:var(--pua-chat); }',

    '/* ── 预设编辑器 ── */',
    '.pua-panel-layout { display:flex; gap:14px; height:100%; }',
    '.pua-panel-list { width:280px; min-width:280px; display:flex; flex-direction:column; }',
    '.pua-panel-header { padding:10px 14px; border-bottom:1px solid var(--pua-border); display:flex; align-items:center; justify-content:space-between; font-size:11px; font-weight:600; }',
    '.pua-panel-body { flex:1; overflow-y:auto; padding:4px; }',
    '.pua-entry-item { display:flex; align-items:center; gap:8px; padding:8px 10px; cursor:pointer; border-radius:6px; transition:var(--pua-transition); }',
    '.pua-entry-item:hover { background:var(--pua-bg-card-hover); }',
    '.pua-entry-item.selected { background:var(--pua-accent-glow); }',
    '.pua-drag-handle { cursor:grab; color:var(--pua-text-dim); font-size:14px; }',
    '.pua-role-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }',
    '.pua-role-system { background:var(--pua-preset); }',
    '.pua-role-user { background:var(--pua-user); }',
    '.pua-role-assistant { background:var(--pua-mem); }',
    '.pua-entry-info { flex:1; min-width:0; }',
    '.pua-entry-title { font-size:11px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
    '.pua-entry-sub { font-size:9px; color:var(--pua-text-dim); }',
    '.pua-panel-header { flex-wrap:wrap; gap:6px; }',
    '.pua-select-all-cb { width:15px; height:15px; cursor:pointer; accent-color:var(--pua-accent); flex-shrink:0; }',
    '.pua-item-cb { width:15px; height:15px; cursor:pointer; accent-color:var(--pua-accent); flex-shrink:0; margin-right:2px; }',
    '.pua-entry-checked { background:rgba(78,201,160,0.08) !important; }',
    '.pua-selected-count { font-size:10px; font-weight:700; color:var(--pua-accent-text); background:var(--pua-accent-glow); padding:1px 6px; border-radius:10px; }',
    '.pua-batch-del-bar { display:flex; gap:6px; padding:6px 14px; border-bottom:1px solid var(--pua-border); background:rgba(220,53,69,0.05); align-items:center; }',
    '.pua-group-header { padding:6px 14px 4px; font-size:10px; font-weight:700; color:var(--pua-accent-text); background:linear-gradient(90deg,var(--pua-accent-glow),transparent); border-left:3px solid var(--pua-accent); display:flex; align-items:center; justify-content:space-between; letter-spacing:0.5px; }',
    '.pua-panel-detail { flex:1; display:flex; flex-direction:column; overflow:hidden; }',
    '.pua-detail-header { padding:10px 14px; border-bottom:1px solid var(--pua-border); display:flex; align-items:center; gap:10px; flex-wrap:wrap; }',
    '.pua-detail-body { flex:1; overflow-y:auto; display:flex; flex-direction:column; }',
    '.pua-detail-content { flex:1; padding:10px 14px; display:flex; flex-direction:column; }',
    '.pua-detail-textarea { width:100%; min-height:280px; flex:1; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:6px; padding:8px 10px; color:var(--pua-text); font-size:11px; font-family:monospace; outline:none; resize:vertical; }',
    '.pua-detail-textarea:focus { border-color:var(--pua-accent); }',
    '.pua-regex-section { padding:8px 14px; border-top:1px solid var(--pua-border); }',
    '.pua-regex-section-title { font-size:10px; color:var(--pua-accent); font-weight:600; margin-bottom:6px; }',
    '.pua-regex-row { display:flex; align-items:center; gap:6px; margin-bottom:6px; }',
    '.pua-regex-row label { font-size:10px; color:var(--pua-text-dim); width:60px; flex-shrink:0; }',
    '.pua-regex-row input { flex:1; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:4px; padding:4px 6px; color:var(--pua-text); font-size:10px; font-family:monospace; outline:none; }',
    '.pua-regex-row input:focus { border-color:var(--pua-accent); }',
    '.pua-depth-row { display:flex; align-items:center; gap:6px; font-size:10px; color:var(--pua-text-sub); }',
    '.pua-depth-label { color:var(--pua-text-dim); }',
    '.pua-depth-input { width:50px; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:4px; padding:3px 5px; color:var(--pua-text); font-size:10px; outline:none; }',
    '.pua-depth-sep { color:var(--pua-text-dim); }',
    '.pua-detail-footer { padding:6px 14px; border-top:1px solid var(--pua-border); display:flex; gap:12px; font-size:9px; color:var(--pua-text-dim); }',
    '.pua-toggle-item { width:28px; height:16px; border-radius:8px; background:var(--pua-text-dim); cursor:pointer; position:relative; border:none; outline:none; flex-shrink:0; transition:var(--pua-transition); }',
    '.pua-toggle-item::after { content:""; position:absolute; top:2px; left:2px; width:12px; height:12px; border-radius:50%; background:#fff; transition:var(--pua-transition); }',
    '.pua-toggle-item.on { background:var(--pua-accent); }',
    '.pua-toggle-item.on::after { left:14px; }',
    '.pua-entry-item.dragging { opacity:0.5; }',
    '.pua-entry-item.drag-over { border-top:2px solid var(--pua-accent); }',

    '/* ── 正则管理 ── */',
    '.pua-regex-type { font-size:9px; padding:1px 5px; border-radius:3px; font-weight:600; }',
    '.pua-regex-type-render { background:rgba(239,106,138,0.12); color:var(--pua-mem); }',
    '.pua-regex-type-prompt { background:rgba(91,141,239,0.12); color:var(--pua-preset); }',
    '.pua-regex-type-filter { background:rgba(91,141,239,0.12); color:var(--pua-preset); }',
    '.pua-regex-type-replace { background:rgba(255,183,77,0.15); color:var(--pua-accent); }',
    '.pua-regex-textarea { width:100%; min-height:70px; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:6px; padding:8px 10px; color:var(--pua-text); font-size:11px; font-family:monospace; outline:none; resize:vertical; }',
    '.pua-regex-textarea:focus { border-color:var(--pua-accent); }',
    '.pua-regex-hint { font-size:9px; color:var(--pua-text-dim); margin-top:2px; }',

    '/* ── Char分组标题 ── */',
    '.pua-char-group { margin-bottom:20px; }',
    '.pua-char-group-header { display:flex; align-items:center; gap:10px; margin-bottom:12px; padding-bottom:8px;',
    '  border-bottom:1px solid var(--pua-border); cursor:pointer; }',
    '.pua-char-avatar { width:32px; height:32px; border-radius:50%; border:2px solid var(--pua-accent);',
    '  background:var(--pua-bg-input); display:flex; align-items:center; justify-content:center;',
    '  font-size:14px; color:var(--pua-accent); overflow:hidden; flex-shrink:0; }',
    '.pua-char-avatar img { width:100%; height:100%; object-fit:cover; }',
    '.pua-char-group-name { font-size:13px; font-weight:600; color:var(--pua-accent-text); }',
    '.pua-char-group-count { font-size:10px; color:var(--pua-text-dim); margin-left:auto; }',

    '/* ── 创建分支对话框 ── */',
    '.pua-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7);',
    '  backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px);',
    '  z-index:100; display:none; align-items:center;',
    '  justify-content:center; }',
    '.pua-modal-overlay.show { display:flex; animation:pua-modalIn 0.2s ease; }',
    '@keyframes pua-modalIn { from { opacity:0; } to { opacity:1; } }',
    '.pua-modal { width:500px; max-height:80vh; background:var(--pua-bg-solid); border:1px solid var(--pua-border);',
    '  border-radius:var(--pua-radius); overflow:hidden; display:flex; flex-direction:column;',
    '  transform:scale(0.95) translateY(10px); transition:var(--pua-transition); }',
    '.pua-modal-overlay.show .pua-modal { transform:scale(1) translateY(0); }',
    '.pua-modal-header { padding:12px 16px; border-bottom:1px solid var(--pua-border);',
    '  display:flex; align-items:center; justify-content:space-between; }',
    '.pua-modal-title { font-size:12px; font-weight:600; color:var(--pua-accent); }',
    '.pua-modal-close { width:24px; height:24px; border-radius:5px; border:none;',
    '  background:rgba(255,255,255,0.05); color:var(--pua-text-sub); cursor:pointer; font-size:13px;',
    '  display:flex; align-items:center; justify-content:center; transition:var(--pua-transition); }',
    '.pua-modal-close:hover { background:rgba(255,255,255,0.1); color:var(--pua-text); }',
    '.pua-modal-body { flex:1; overflow-y:auto; padding:16px; color:var(--pua-text); }',
    '.pua-modal-footer { padding:10px 16px; border-top:1px solid var(--pua-border);',
    '  display:flex; gap:8px; justify-content:flex-end; }',

    '/* ── 表单 ── */',
    '.pua-field { margin-bottom:12px; }',
    '.pua-field-label { font-size:10px; color:var(--pua-text-dim); margin-bottom:3px; font-weight:600;',
    '  text-transform:uppercase; letter-spacing:0.3px; }',
    '.pua-field-input { width:100%; background:var(--pua-bg-input); border:1px solid var(--pua-border);',
    '  border-radius:6px; padding:6px 10px; color:var(--pua-text); font-size:11.5px;',
    '  font-family:inherit; outline:none; transition:var(--pua-transition); }',
    '.pua-field-input:focus { border-color:var(--pua-accent); box-shadow:0 0 0 2px var(--pua-accent-glow); }',
    '.pua-field-select { cursor:pointer; -webkit-appearance:none; appearance:none; padding-right:20px;',
    '  background-image:url("data:image/svg+xml,%3Csvg xmlns=' + sq + 'http://www.w3.org/2000/svg' + sq + ' width=' + sq + '10' + sq + ' height=' + sq + '10' + sq + ' viewBox=' + sq + '0 0 10 10' + sq + '%3E%3Cpath d=' + sq + 'M2 3.5L5 6.5L8 3.5' + sq + ' stroke=' + sq + '%23999' + sq + ' stroke-width=' + sq + '1.2' + sq + ' fill=' + sq + 'none' + sq + '/%3E%3C/svg%3E");',
    '  background-repeat:no-repeat; background-position:right 7px center; }',
    '.pua-field-hint { font-size:9.5px; color:var(--pua-text-dim); margin-top:2px; }',

    '/* ── 空状态 ── */',
    '.pua-empty { display:flex; flex-direction:column; align-items:center; justify-content:center;',
    '  height:100%; color:var(--pua-text-dim); gap:10px; padding:40px; }',
    '.pua-empty-icon { font-size:36px; opacity:0.3; }',
    '.pua-empty-text { font-size:12px; }',

    '/* ── 加载状态 ── */',
    '.pua-loading { display:flex; align-items:center; justify-content:center; height:100%; }',
    '.pua-spinner { width:28px; height:28px; border:3px solid var(--pua-border);',
    '  border-top-color:var(--pua-accent); border-radius:50%; animation:pua-spin 0.8s linear infinite; }',
    '@keyframes pua-spin { to { transform:rotate(360deg); } }',

    '/* ── Toast ── */',
    '.pua-toast { position:absolute; bottom:24px; left:50%; transform:translateX(-50%) translateY(20px);',
    '  background:var(--pua-bg-card); backdrop-filter:var(--pua-glass); -webkit-backdrop-filter:var(--pua-glass);',
    '  border:1px solid var(--pua-border); border-radius:var(--pua-radius-sm);',
    '  padding:8px 16px; font-size:11px; color:var(--pua-text); z-index:200;',
    '  opacity:0; transition:opacity 0.3s,transform 0.3s; pointer-events:none; }',
    '.pua-toast.show { opacity:1; transform:translateX(-50%) translateY(0); }',

    '/* ── 占位页面 ── */',
    '.pua-placeholder { display:flex; flex-direction:column; align-items:center; justify-content:center;',
    '  height:100%; gap:12px; }',
    '.pua-placeholder-icon { font-size:48px; opacity:0.15; }',
    '.pua-placeholder-title { font-size:14px; color:var(--pua-text-sub); font-weight:600; }',
    '.pua-placeholder-desc { font-size:11px; color:var(--pua-text-dim); text-align:center; max-width:300px; line-height:1.6; }',

    '/* ── 日志面板 ── */',
    '.pua-log-panel { position:absolute; bottom:0; left:0; right:0; height:220px;',
    '  background:rgba(0,0,0,0.92); border-top:1px solid var(--pua-border);',
    '  z-index:150; display:none; flex-direction:column; }',
    '.pua-log-panel.open { display:flex; }',
    '.pua-log-toolbar { display:flex; align-items:center; justify-content:space-between;',
    '  padding:4px 10px; border-bottom:1px solid var(--pua-border);',
    '  background:rgba(255,255,255,0.03); flex-shrink:0; gap:4px; flex-wrap:wrap; }',
    '.pua-log-toolbar span { font-size:10px; color:var(--pua-accent); font-weight:600; }',
    '.pua-log-toolbar-btns { display:flex; gap:3px; align-items:center; }',
    '.pua-log-toolbar-btns button { padding:1px 5px; font-size:9px; border-radius:3px;',
    '  border:1px solid var(--pua-border); background:rgba(255,255,255,0.05);',
    '  color:var(--pua-text-sub); cursor:pointer; font-family:inherit; }',
    '.pua-log-toolbar-btns button:hover { background:rgba(255,255,255,0.1); color:var(--pua-text); }',
    '.pua-log-toolbar-btns button.active { background:var(--pua-accent-glow); color:var(--pua-accent-text); border-color:var(--pua-accent); }',
    '.pua-log-search { flex:1; min-width:60px; max-width:160px; padding:1px 6px; font-size:9px;',
    '  border-radius:3px; border:1px solid var(--pua-border); background:var(--pua-bg-input); color:var(--pua-text); outline:none; }',
    '.pua-log-search::placeholder { color:var(--pua-text-dim); }',
    '.pua-log-list { flex:1; overflow-y:auto; padding:4px 8px;',
    '  font-family:monospace; font-size:10px; line-height:1.5; }',
    '.pua-log-list::-webkit-scrollbar { width:3px; }',
    '.pua-log-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); }',
    '.pua-log-entry { padding:1px 0; border-bottom:1px solid rgba(255,255,255,0.02);',
    '  white-space:pre-wrap; word-break:break-all; }',
    '.pua-log-entry.log { color:#ccc; }',
    '.pua-log-entry.warn { color:#e0a040; }',
    '.pua-log-entry.error { color:#ef6a8a; }',
    '.pua-log-entry.info { color:#4ec9a0; }',
    '.pua-log-entry.hidden { display:none; }',
    '.pua-log-toggle { position:absolute; bottom:4px; right:4px; z-index:151;',
    '  width:22px; height:22px; border-radius:4px; border:1px solid var(--pua-border);',
    '  background:var(--pua-bg-card); color:var(--pua-text-dim); cursor:pointer;',
    '  font-size:10px; display:flex; align-items:center; justify-content:center; }',
    '.pua-log-toggle:hover { color:var(--pua-accent); border-color:var(--pua-accent); }',
    '.pua-log-count { background:var(--pua-accent); color:#121216; font-size:8px;',
    '  width:14px; height:14px; border-radius:50%; display:flex; align-items:center;',
    '  justify-content:center; position:absolute; top:-5px; right:-5px; }',

    '/* ── 配置区域美化（分支存档） ── */',
    '.pua-config-section { background:var(--pua-bg-card); border:1px solid var(--pua-border); border-radius:8px; padding:12px; margin-bottom:10px; position:relative; overflow:hidden; }',
    '.pua-config-section::before { content:""; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,var(--pua-accent-glow),transparent); }',
    '.pua-config-title { font-size:11px; font-weight:600; color:var(--pua-accent); margin-bottom:4px; display:flex; align-items:center; gap:6px; }',
    '.pua-config-title::before { content:""; width:3px; height:12px; border-radius:2px; background:var(--pua-accent); }',
    '.pua-config-desc { font-size:9px; color:var(--pua-text-dim); margin-bottom:8px; line-height:1.5; }',
    '.pua-config-list { max-height:140px; overflow-y:auto; }',
    '.pua-config-list::-webkit-scrollbar { width:3px; }',
    '.pua-config-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.06); border-radius:2px; }',
    '.pua-check-item { display:flex; align-items:center; gap:8px; padding:5px 8px; border-radius:6px; cursor:pointer; transition:var(--pua-transition); margin-bottom:1px; }',
    '.pua-check-item:hover { background:rgba(255,255,255,0.03); }',
    '.pua-check-box { width:16px; height:16px; border-radius:4px; border:1.5px solid var(--pua-border); background:var(--pua-bg-input); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:var(--pua-transition); position:relative; }',
    '.pua-check-item.checked .pua-check-box { background:var(--pua-accent); border-color:var(--pua-accent); }',
    '.pua-check-item.checked .pua-check-box::after { content:"\\2713"; font-size:10px; color:#121216; font-weight:700; }',
    '.pua-check-label { font-size:10.5px; color:var(--pua-text-sub); transition:var(--pua-transition); }',
    '.pua-check-item.checked .pua-check-label { color:var(--pua-text); }',
    '.pua-check-icon { font-size:12px; flex-shrink:0; }',
    '.pua-check-sub { margin-left:24px; }',
    '.pua-config-save { margin-top:8px; }',
    '.pua-wb-group { margin-bottom:4px; padding:4px 6px; background:var(--pua-bg-input); border-radius:6px; border:1px solid transparent; transition:var(--pua-transition); }',
    '.pua-wb-group.expanded { border-color:var(--pua-border-active); }',
    '.pua-wb-group-header { display:flex; align-items:center; gap:6px; cursor:pointer; }',
    '.pua-wb-group-name { font-size:10.5px; color:var(--pua-text-sub); flex:1; }',
    '.pua-wb-entries { margin-top:4px; padding-top:4px; border-top:1px solid var(--pua-border); display:none; }',
    '.pua-wb-group.expanded .pua-wb-entries { display:block; }',

    '/* ── 设置页面 ── */',
    '.pua-settings-section { background:var(--pua-bg-card); border:1px solid var(--pua-border); border-radius:8px; padding:14px; margin-bottom:12px; }',
    '.pua-settings-title { font-size:12px; font-weight:600; color:var(--pua-accent); margin-bottom:10px; display:flex; align-items:center; gap:6px; }',
    '.pua-settings-title::before { content:""; width:3px; height:14px; border-radius:2px; background:var(--pua-accent); }',
    '.pua-settings-row { display:flex; align-items:center; gap:8px; margin-bottom:8px; }',
    '.pua-settings-label { font-size:10.5px; color:var(--pua-text-sub); min-width:80px; }',
    '.pua-settings-input { flex:1; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:6px; padding:6px 10px; color:var(--pua-text); font-size:11px; font-family:inherit; outline:none; transition:var(--pua-transition); }',
    '.pua-settings-input:focus { border-color:var(--pua-accent); box-shadow:0 0 0 2px var(--pua-accent-glow); }',
    '.pua-settings-hint { font-size:9px; color:var(--pua-text-dim); margin-top:2px; }',
    '.pua-settings-toggle { display:flex; align-items:center; justify-content:space-between; padding:6px 0; }',
    '.pua-settings-toggle-label { font-size:10.5px; color:var(--pua-text-sub); }',

    '/* ── 记忆系统页面 ── */',
    '.pua-mem-layout { display:flex; gap:14px; height:100%; }',
    '.pua-mem-sidebar { width:220px; min-width:220px; display:flex; flex-direction:column; }',
    '.pua-mem-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }',
    '.pua-mem-card { background:var(--pua-bg-card); border:1px solid var(--pua-border); border-radius:8px; padding:12px; margin-bottom:8px; position:relative; }',
    '.pua-mem-card-title { font-size:11px; font-weight:600; color:var(--pua-accent-text); margin-bottom:4px; }',
    '.pua-mem-card-text { font-size:10px; color:var(--pua-text-sub); line-height:1.5; max-height:60px; overflow-y:auto; }',
    '.pua-mem-card-meta { font-size:9px; color:var(--pua-text-dim); margin-top:4px; display:flex; gap:8px; }',
    '.pua-mem-core { border-left:3px solid var(--pua-mem); }',
    '.pua-mem-fact { border-left:3px solid var(--pua-accent); }',
    '.pua-mem-recall { border-left:3px solid var(--pua-preset); }',
    '.pua-mem-empty { text-align:center; padding:30px; color:var(--pua-text-dim); font-size:11px; }',
    '.pua-mem-stat { display:flex; gap:12px; margin-bottom:12px; }',
    '.pua-mem-stat-item { background:var(--pua-bg-card); border:1px solid var(--pua-border); border-radius:8px; padding:10px 14px; flex:1; text-align:center; }',
    '.pua-mem-stat-num { font-size:20px; font-weight:700; color:var(--pua-accent); }',
    '.pua-mem-stat-label { font-size:9px; color:var(--pua-text-dim); margin-top:2px; }',
    '.pua-mem-actions { display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap; }',

    '/* ── 移动端响应式 ── */',
    '/* ── 上下文组装 ── */',
    '.asm-layout { display:flex; gap:16px; height:100%; }',
    '.asm-visual { flex:1; overflow-y:auto; padding-right:8px; }',
    '.asm-config { width:280px; min-width:280px; display:flex; flex-direction:column; gap:12px; }',
    '.asm-flow-title { font-size:11px; color:var(--pua-text-dim); margin-bottom:10px; }',
    '.asm-block { display:flex; align-items:stretch; margin-bottom:4px; }',
    '.asm-conn { width:20px; display:flex; flex-direction:column; align-items:center; position:relative; }',
    '.asm-dot { width:8px; height:8px; border-radius:50%; margin-top:12px; flex-shrink:0; }',
    '.asm-line { width:2px; flex:1; min-height:8px; }',
    '.asm-card { flex:1; background:var(--pua-bg-card); border-radius:8px; padding:8px 12px; border-left:3px solid var(--pua-border); cursor:pointer; transition:opacity 0.15s; min-height:36px; }',
    '.asm-card:hover { opacity:0.9; }',
    '.asm-card.draggable { cursor:grab; }',
    '.asm-card.draggable:active { cursor:grabbing; }',
    '.asm-card-head { display:flex; align-items:center; gap:6px; margin-bottom:4px; }',
    '.asm-card-title { font-size:12px; font-weight:600; color:var(--pua-text); }',
    '.asm-card-role { font-size:9px; padding:1px 5px; border-radius:3px; font-weight:600; }',
    '.asm-card-role-system { background:rgba(91,141,239,0.12); color:#5b8def; }',
    '.asm-card-role-user { background:rgba(78,201,160,0.12); color:#4ec9a0; }',
    '.asm-card-role-assistant { background:rgba(239,106,138,0.12); color:#ef6a8a; }',
    '.asm-card-meta { font-size:10px; color:var(--pua-text-dim); }',
    '.asm-card-body { font-size:10px; color:var(--pua-text-sub); line-height:1.4; }',
    '.asm-disabled .asm-card { opacity:0.4; border-left-style:dashed; }',
    '.asm-toggle-btn { cursor:pointer; font-size:14px; margin-left:auto; flex-shrink:0; }',
    '.asm-toggle-btn.on { color:#4ec9a0; }',
    '.asm-toggle-btn:not(.on) { color:var(--pua-text-dim); }',
    '.asm-type-preset .asm-dot, .asm-type-preset .asm-line { background:#5b8def; }',
    '.asm-type-preset .asm-card { border-left-color:#5b8def; }',
    '.asm-type-char .asm-dot, .asm-type-char .asm-line { background:#a76aef; }',
    '.asm-type-char .asm-card { border-left-color:#a76aef; }',
    '.asm-type-user .asm-dot, .asm-type-user .asm-line { background:#4ec9a0; }',
    '.asm-type-user .asm-card { border-left-color:#4ec9a0; }',
    '.asm-type-world .asm-dot, .asm-type-world .asm-line { background:#e0a040; }',
    '.asm-type-world .asm-card { border-left-color:#e0a040; }',
    '.asm-type-memory .asm-dot, .asm-type-memory .asm-line { background:#ef6a8a; }',
    '.asm-type-memory .asm-card { border-left-color:#ef6a8a; }',
    '.asm-type-recall .asm-dot, .asm-type-recall .asm-line { background:#c070e0; }',
    '.asm-type-recall .asm-card { border-left-color:#c070e0; }',
    '.asm-type-chat .asm-dot, .asm-type-chat .asm-line { background:#6a7a9a; }',
    '.asm-type-chat .asm-card { border-left-color:#6a7a9a; }',
    '.asm-config-section { background:var(--pua-bg-card); border-radius:8px; padding:12px; }',
    '.asm-config-title { font-size:11px; font-weight:600; color:var(--pua-text); margin-bottom:8px; }',
    '.asm-config-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }',
    '.asm-config-label { font-size:10px; color:var(--pua-text-sub); min-width:70px; }',
    '.asm-config-input { width:60px; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:4px; padding:4px 8px; color:var(--pua-text); font-size:11px; text-align:center; outline:none; }',
    '.asm-config-input:focus { border-color:var(--pua-accent); }',
    '.asm-legend { display:flex; flex-wrap:wrap; gap:6px; }',
    '.asm-legend-item { display:flex; align-items:center; gap:3px; font-size:9px; color:var(--pua-text-dim); }',
    '.asm-legend-dot { width:6px; height:6px; border-radius:50%; }',
    '.asm-block.drag-over .asm-card { border-top:2px solid var(--pua-accent); }',

    '/* ── 配置区域（分支详情内） ── */',
    '.pua-config-section { background:var(--pua-bg-card); border:1px solid var(--pua-border); border-radius:10px; padding:12px 14px; margin-bottom:12px; position:relative; overflow:hidden; }',
    '.pua-config-section::before { content:""; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,var(--pua-accent-glow),transparent); }',
    '.pua-config-section-title { font-size:11px; font-weight:600; color:var(--pua-accent); margin-bottom:4px; display:flex; align-items:center; gap:6px; }',
    '.pua-config-section-desc { font-size:9px; color:var(--pua-text-dim); margin-bottom:8px; line-height:1.5; }',
    '.pua-config-section-body { max-height:160px; overflow-y:auto; }',
    '.pua-config-section-body::-webkit-scrollbar { width:3px; }',
    '.pua-config-section-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.06); border-radius:2px; }',
    '.pua-config-save { margin-top:8px; }',

    '/* ── 自定义 Checkbox ── */',
    '.pua-check-item { display:flex; align-items:center; gap:8px; padding:5px 8px; border-radius:6px; cursor:pointer; transition:var(--pua-transition); margin-bottom:2px; }',
    '.pua-check-item:hover { background:rgba(255,255,255,0.03); }',
    '.pua-check-box { width:16px; height:16px; border-radius:4px; border:1.5px solid var(--pua-border); background:var(--pua-bg-input); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:var(--pua-transition); font-size:10px; color:transparent; }',
    '.pua-check-item.checked .pua-check-box { border-color:var(--pua-accent); background:var(--pua-accent); color:#121216; }',
    '.pua-check-label { font-size:10.5px; color:var(--pua-text-sub); flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
    '.pua-check-item.checked .pua-check-label { color:var(--pua-text); }',
    '.pua-check-icon { font-size:11px; margin-right:2px; }',
    '.pua-check-group { margin-bottom:4px; }',
    '.pua-check-group-header { display:flex; align-items:center; gap:6px; padding:5px 8px; border-radius:6px; cursor:pointer; transition:var(--pua-transition); }',
    '.pua-check-group-header:hover { background:rgba(255,255,255,0.03); }',
    '.pua-check-group-name { font-size:10.5px; color:var(--pua-text); font-weight:500; flex:1; }',
    '.pua-check-group-arrow { font-size:9px; color:var(--pua-text-dim); transition:transform 0.2s; }',
    '.pua-check-group.open .pua-check-group-arrow { transform:rotate(90deg); }',
    '.pua-check-group-entries { margin-left:24px; display:none; }',
    '.pua-check-group.open .pua-check-group-entries { display:block; }',

    '/* ── 设置页面 ── */',
    '.pua-settings-group { background:var(--pua-bg-card); border:1px solid var(--pua-border); border-radius:var(--pua-radius); padding:16px; margin-bottom:14px; position:relative; overflow:hidden; }',
    '.pua-settings-group::before { content:""; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,var(--pua-accent-glow),transparent); }',
    '.pua-settings-title { font-size:12px; font-weight:600; color:var(--pua-accent); margin-bottom:10px; display:flex; align-items:center; gap:6px; }',
    '.pua-settings-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }',
    '.pua-settings-label { font-size:11px; color:var(--pua-text-sub); min-width:90px; }',
    '.pua-settings-input { flex:1; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:6px; padding:6px 10px; color:var(--pua-text); font-size:11px; font-family:inherit; outline:none; transition:var(--pua-transition); }',
    '.pua-settings-input:focus { border-color:var(--pua-accent); box-shadow:0 0 0 2px var(--pua-accent-glow); }',
    '.pua-settings-hint { font-size:9px; color:var(--pua-text-dim); margin-top:2px; margin-left:100px; }',
    '.pua-settings-toggle-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }',
    '.pua-settings-toggle-label { font-size:11px; color:var(--pua-text-sub); }',
    '.pua-settings-select { flex:1; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:6px; padding:6px 10px; color:var(--pua-text); font-size:11px; font-family:inherit; outline:none; cursor:pointer; -webkit-appearance:none; appearance:none; }',

    '/* ── 记忆系统页面 ── */',
    '.pua-mem-layout { display:flex; gap:14px; height:100%; }',
    '.pua-mem-sidebar { width:240px; min-width:240px; display:flex; flex-direction:column; }',
    '.pua-mem-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }',
    '.pua-mem-card { background:var(--pua-bg-card); border:1px solid var(--pua-border); border-radius:10px; padding:14px; margin-bottom:10px; position:relative; overflow:hidden; }',
    '.pua-mem-card::before { content:""; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,var(--pua-accent-glow),transparent); }',
    '.pua-mem-card-title { font-size:12px; font-weight:600; color:var(--pua-accent-text); margin-bottom:6px; display:flex; align-items:center; gap:6px; }',
    '.pua-mem-card-body { font-size:11px; color:var(--pua-text-sub); line-height:1.6; white-space:pre-wrap; max-height:200px; overflow-y:auto; }',
    '.pua-mem-card-meta { font-size:9px; color:var(--pua-text-dim); margin-top:6px; display:flex; gap:8px; }',
    '.pua-mem-fact-item { padding:8px 10px; border-radius:6px; background:var(--pua-bg-card); border:1px solid var(--pua-border); margin-bottom:6px; cursor:pointer; transition:var(--pua-transition); }',
    '.pua-mem-fact-item:hover { border-color:var(--pua-border-active); }',
    '.pua-mem-fact-item.selected { border-color:var(--pua-accent); background:var(--pua-accent-glow); }',
    '.pua-mem-fact-summary { font-size:10.5px; color:var(--pua-text); margin-bottom:2px; }',
    '.pua-mem-fact-kw { font-size:9px; color:var(--pua-text-dim); }',
    '.pua-mem-fact-time { font-size:8px; color:var(--pua-text-dim); float:right; }',
    '.pua-mem-stat { display:flex; gap:12px; margin-bottom:14px; }',
    '.pua-mem-stat-item { background:var(--pua-bg-card); border:1px solid var(--pua-border); border-radius:8px; padding:10px 14px; flex:1; text-align:center; }',
    '.pua-mem-stat-num { font-size:20px; font-weight:700; color:var(--pua-accent); }',
    '.pua-mem-stat-label { font-size:9px; color:var(--pua-text-dim); margin-top:2px; }',
    '.pua-mem-detail { flex:1; overflow-y:auto; padding:10px; }',
    '.pua-mem-detail-textarea { width:100%; min-height:120px; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:6px; padding:8px 10px; color:var(--pua-text); font-size:11px; font-family:inherit; outline:none; resize:vertical; }',
    '.pua-mem-detail-textarea:focus { border-color:var(--pua-accent); }',

    '@media (max-width:767px) {',
    '.pua-mem-layout { flex-direction:column; }',
    '.pua-mem-sidebar { width:100%; min-width:100%; max-height:200px; }',
    '.pua-mem-sidebar.pua-mobile-hide { display:none; }',
    '.pua-mem-main { display:none; }',
    '.pua-mem-main.show { display:flex; }',
    '.pua-settings-row { flex-direction:column; align-items:flex-start; gap:4px; }',
    '.pua-settings-label { min-width:auto; }',
    '.pua-settings-hint { margin-left:0; }',
    '}',

    '.asm-empty { text-align:center; padding:40px 20px; color:var(--pua-text-dim); font-size:12px; }',
    '.asm-loading { text-align:center; padding:40px 20px; color:var(--pua-text-dim); font-size:12px; }',

    '@media (max-width:767px) {',
    '.pua-sidebar { position:fixed; top:0; bottom:0; left:0; width:220px; z-index:500;',
    '  background:var(--pua-bg-solid); border-right:1px solid var(--pua-border);',
    '  display:none; flex-direction:column; }',
    '.pua-sidebar.open { display:flex; }',
    '.pua-sidebar-mask { position:fixed; top:0; bottom:0; left:0; right:0;',
    '  background:rgba(0,0,0,0.5); z-index:499; display:none; }',
    '.pua-sidebar-mask.open { display:block; }',
    '.pua-sidebar-open-btn { display:flex; width:28px; height:28px; border-radius:6px;',
    '  border:1px solid var(--pua-border); background:var(--pua-bg-card);',
    '  color:var(--pua-text-sub); cursor:pointer; font-size:16px;',
    '  align-items:center; justify-content:center; margin-right:4px; }',
    '.pua-branch-grid { grid-template-columns:1fr; gap:10px; }',
    '.pua-panel-layout { flex-direction:column; gap:0px; }',
    '.pua-panel-list { width:100%; min-width:100%; }',
    // 移动端：列表面板默认隐藏（选中条目后），详情面板默认显示
    '.pua-panel-list.pua-mobile-hide { display:none; }',
    '.pua-panel-detail { display:none; }',
    '.pua-panel-detail.show { display:flex; }',
    '.pua-modal { width:90vw; max-height:85vh; }',
    '.pua-content { padding:12px; }',
    '.pua-topbar { padding:var(--pua-safe-top) 12px; }',
    '.pua-btn { min-height:36px; padding:6px 14px; font-size:12px; }',
    '.pua-btn-gold { min-height:40px; }',
    '.pua-nav-item { padding:12px 16px; font-size:13px; }',
    '.pua-branch-card { padding:14px; }',
    '.pua-branch-card:active { transform:scale(0.98); opacity:0.9; }',
    '.pua-branch-name { font-size:14px; }',
    '.pua-topbar { min-height:52px; }',
    '.pua-back-btn { width:34px; height:34px; font-size:16px; }',
    '.pua-sidebar-open-btn { width:34px; height:34px; font-size:18px; }',
    '.pua-field-input { font-size:13px; padding:8px 12px; }',
    '.pua-field-label { font-size:11px; }',
    '.pua-modal-body { padding:14px; }',
    '.pua-entry-item { padding:10px 12px; }',
    '.pua-entry-title { font-size:12px; }',
    '.pua-detail-textarea { font-size:12px; min-height:200px; }',
    '.pua-panel-header { padding:12px 14px; font-size:12px; }',
    '.pua-char-group-header { padding:10px 0; }',
    '.pua-char-avatar { width:36px; height:36px; font-size:16px; }',
    '.pua-char-group-name { font-size:14px; }',
    '.asm-layout { flex-direction:column; }',
    '.asm-config { width:100%; min-width:100%; }',
    '.asm-visual { min-height:300px; }',
    '.pua-mem-layout { flex-direction:column; }',
    '.pua-mem-sidebar { width:100%; min-width:100%; }',
    '.pua-topbar { height:auto; min-height:52px; flex-wrap:wrap; padding:calc(var(--pua-safe-top) + 8px) 12px 8px; }',
    '.pua-topbar-actions { flex-wrap:wrap; gap:4px; }',
    '.pua-btn { min-height:32px; padding:4px 10px; font-size:11px; }',
    '.pua-btn-gold { min-height:36px; }',
    '.pua-conv-topbar { flex-wrap:wrap; gap:4px; }',
    '.pua-conv-input-btns { flex-wrap:wrap; }',
    '}',
    '@media (min-width:768px) {',
    '.pua-sidebar-open-btn { display:none; }',
    '.pua-sidebar-mask { display:none; }',
    '}',

    '/* ── 对话页面动画 ── */',
    '@keyframes pua-chat-pulse {',
    '  0%, 100% { transform:scale(1); box-shadow:0 0 40px var(--pua-accent-glow); }',
    '  50% { transform:scale(1.08); box-shadow:0 0 60px var(--pua-accent-glow); }',
    '}',

    '/* ── 助手页面 ── */',
    '.pua-assistant-layout { display:flex; flex-direction:column; height:100%; }',
    '.pua-assistant-header { padding:8px 14px; border-bottom:1px solid var(--pua-border); display:flex; align-items:center; gap:10px; flex-wrap:wrap; }',
    '.pua-branch-bar { padding:6px 14px; border-bottom:1px solid var(--pua-border); display:flex; align-items:center; gap:6px; flex-wrap:wrap; }',
    '.pua-branch-select { background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:4px; padding:3px 6px; color:var(--pua-text); font-size:10px; font-family:inherit; outline:none; max-width:120px; }',
    '.pua-branch-select:focus { border-color:var(--pua-accent); }',
    '.pua-branch-btn { font-size:9px; padding:2px 6px; border-radius:3px; border:1px solid var(--pua-border); background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; transition:var(--pua-transition); }',
    '.pua-branch-btn:hover { border-color:var(--pua-accent); color:var(--pua-text); }',
    '.pua-branch-btn-danger:hover { border-color:var(--pua-danger); color:var(--pua-danger); }',
    '.pua-assistant-api-select { background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:4px; padding:4px 8px; color:var(--pua-text); font-size:10px; font-family:inherit; outline:none; }',
    '.pua-assistant-api-select:focus { border-color:var(--pua-accent); }',
    '.pua-assistant-chat { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:12px; }',
    '.pua-assistant-chat::-webkit-scrollbar { width:4px; }',
    '.pua-assistant-chat::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.06); border-radius:2px; }',
    '.pua-assistant-msg { max-width:85%; padding:10px 14px; border-radius:12px; font-size:11px; line-height:1.6; word-break:break-word; }',
    '.pua-assistant-msg-user { align-self:flex-end; background:var(--pua-accent-glow); border:1px solid var(--pua-border-active); color:var(--pua-accent-text); border-bottom-right-radius:4px; position:relative; }',
    '.pua-assistant-msg-user:hover .pua-assistant-edit-btn { opacity:1; }',
    '.pua-assistant-edit-btn { position:absolute; top:4px; right:4px; font-size:10px; padding:2px 5px; border-radius:3px; border:1px solid var(--pua-border); background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; opacity:0; transition:var(--pua-transition); }',
    '.pua-assistant-edit-btn:hover { border-color:var(--pua-accent); color:var(--pua-text); }',
    '.pua-assistant-msg-user.pua-msg-dimmed { opacity:0.45; }',
    '.pua-assistant-msg-user.pua-msg-dimmed .pua-assistant-msg-content { text-decoration:line-through; }',
    '.pua-assistant-msg-assistant { align-self:flex-start; background:var(--pua-bg-card); border:1px solid var(--pua-border); color:var(--pua-text); border-bottom-left-radius:4px; }',
    '.pua-assistant-msg-role { font-size:9px; font-weight:600; margin-bottom:4px; opacity:0.6; }',
    '.pua-assistant-attached-badges { display:flex; gap:4px; flex-wrap:wrap; margin-top:6px; }',
    '.pua-assistant-badge { font-size:8px; padding:2px 6px; border-radius:4px; background:rgba(255,183,77,0.15); border:1px solid rgba(255,183,77,0.3); color:var(--pua-accent-text); cursor:pointer; }',
    '.pua-assistant-badge:hover { background:rgba(255,183,77,0.25); }',
    '.pua-assistant-badge .badge-remove { margin-left:3px; opacity:0.6; }',
    '.pua-assistant-badge .badge-remove:hover { opacity:1; }',
    '.pua-assistant-action-card { margin-top:8px; padding:8px 10px; border-radius:8px; background:rgba(78,201,160,0.08); border:1px solid rgba(78,201,160,0.2); display:flex; align-items:center; gap:8px; flex-wrap:wrap; }',
    '.pua-assistant-action-label { font-size:10px; color:var(--pua-success); font-weight:600; }',
    '.pua-action-btns { display:flex; gap:4px; margin-left:auto; }',
    '.pua-assistant-confirm-btn { font-size:9px; padding:2px 8px; border-radius:4px; border:1px solid var(--pua-success); background:rgba(78,201,160,0.15); color:var(--pua-success); cursor:pointer; transition:var(--pua-transition); }',
    '.pua-assistant-confirm-btn:hover { background:rgba(78,201,160,0.3); }',
    '.pua-assistant-dismiss-btn { font-size:9px; padding:2px 8px; border-radius:4px; border:1px solid var(--pua-border); background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; transition:var(--pua-transition); }',
    '.pua-assistant-dismiss-btn:hover { border-color:var(--pua-danger); color:var(--pua-danger); }',
    '.pua-action-status { font-size:9px; color:var(--pua-text-dim); margin-left:auto; }',
    '.pua-action-confirmed { border-color:rgba(78,201,160,0.3); }',
    '.pua-action-ignored { opacity:0.5; border-color:var(--pua-border); }',
    '.pua-assistant-action-card { flex-direction:column; align-items:flex-start; }',
    '.pua-action-diff { width:100%; margin-top:6px; display:flex; flex-direction:column; gap:4px; }',
    '.pua-diff-before, .pua-diff-after { font-size:9px; padding:4px 6px; border-radius:4px; line-height:1.4; }',
    '.pua-diff-before { background:rgba(220,53,69,0.06); border:1px solid rgba(220,53,69,0.15); color:var(--pua-text-sub); }',
    '.pua-diff-after { background:rgba(78,201,160,0.08); border:1px solid rgba(78,201,160,0.2); color:var(--pua-text); }',
    '.pua-diff-before pre, .pua-diff-after pre { margin:2px 0 0 0; white-space:pre-wrap; word-break:break-all; font-size:8px; max-height:80px; overflow-y:auto; }',
    '.pua-action-preview { width:100%; margin-top:6px; font-size:9px; padding:4px 6px; border-radius:4px; background:var(--pua-bg-card); border:1px solid var(--pua-border); }',
    '.pua-action-preview pre { margin:2px 0 0 0; white-space:pre-wrap; word-break:break-all; font-size:8px; max-height:100px; overflow-y:auto; }',
    '.pua-batch-actions-bar { display:flex; align-items:center; gap:8px; padding:8px 10px; margin-top:8px; border-radius:8px; background:rgba(255,183,77,0.08); border:1px solid rgba(255,183,77,0.25); }',
    '.pua-batch-info { font-size:10px; color:var(--pua-accent-text); font-weight:600; margin-right:auto; }',
    '.pua-assistant-input-area { padding:10px 14px var(--pua-safe-bottom); border-top:1px solid var(--pua-border); }',
    '.pua-assistant-attach-row { display:flex; gap:6px; margin-bottom:6px; flex-wrap:wrap; align-items:center; }',
    '.pua-assistant-attach-btn { font-size:9px; padding:3px 8px; border-radius:4px; border:1px solid var(--pua-border); background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; transition:var(--pua-transition); }',
    '.pua-assistant-attach-btn:hover { border-color:var(--pua-accent); color:var(--pua-text); }',
    '.pua-assistant-attach-btn.active { border-color:var(--pua-accent); color:var(--pua-accent-text); background:rgba(255,183,77,0.1); }',
    '.pua-assistant-attach-dropdown { position:relative; display:inline-block; }',
    '.pua-assistant-attach-list { position:absolute; bottom:100%; left:0; margin-bottom:4px; min-width:220px; max-height:200px; overflow-y:auto; background:var(--pua-bg-solid); border:1px solid var(--pua-border); border-radius:8px; box-shadow:var(--pua-shadow); z-index:100; padding:6px; display:none; }',
    '.pua-assistant-attach-list.open { display:block; }',
    '.pua-assistant-attach-item { display:flex; align-items:center; gap:6px; padding:5px 6px; border-radius:4px; cursor:pointer; font-size:10px; color:var(--pua-text-sub); transition:var(--pua-transition); }',
    '.pua-assistant-attach-item:hover { background:var(--pua-bg-card-hover); color:var(--pua-text); }',
    '.pua-assistant-attach-item.selected { background:rgba(255,183,77,0.1); color:var(--pua-accent-text); }',
    '.pua-assistant-input-row { display:flex; gap:8px; }',
    '.pua-assistant-input { flex:1; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:8px; padding:8px 12px; color:var(--pua-text); font-size:11px; font-family:inherit; outline:none; resize:none; height:60px; min-height:60px; max-height:150px; transition:height 0.25s ease, min-height 0.25s ease; }',
    '.pua-assistant-input.expanded { height:150px; min-height:150px; }',
    '.pua-assistant-input:focus { border-color:var(--pua-accent); }',
    '.pua-assistant-send { padding:8px 16px; border-radius:8px; border:none; background:linear-gradient(135deg,var(--pua-accent-dim),var(--pua-accent)); color:#121216; font-size:11px; font-weight:600; cursor:pointer; transition:var(--pua-transition); align-self:flex-end; }',
    '.pua-assistant-send:hover { opacity:0.9; }',
    '.pua-assistant-send:disabled { opacity:0.4; cursor:default; }',
    '.pua-assistant-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--pua-text-dim); }',
    '.pua-assistant-empty-icon { font-size:32px; margin-bottom:10px; opacity:0.3; }',
    '.pua-assistant-empty-text { font-size:11px; }',
    '.pua-assistant-typing { font-size:10px; color:var(--pua-accent); opacity:0.7; padding:4px 0; display:flex; align-items:center; gap:6px; }',
    '.pua-assistant-typing::before { content:""; display:inline-block; width:12px; height:12px; border:2px solid var(--pua-accent); border-top-color:transparent; border-radius:50%; animation:pua-spin 0.8s linear infinite; }',
    '@keyframes pua-spin { to { transform:rotate(360deg); } }',
    // Code block styles
    '.pua-code-block { position:relative; margin:6px 0; border-radius:6px; overflow:hidden; background:var(--pua-bg-solid); border:1px solid var(--pua-border); }',
    '.pua-code-block-header { display:flex; align-items:center; justify-content:space-between; padding:4px 10px; background:rgba(255,255,255,0.04); font-size:9px; color:var(--pua-text-sub); }',
    '.pua-code-block-lang { font-weight:600; text-transform:uppercase; }',
    '.pua-code-block-actions { display:flex; gap:4px; }',
    '.pua-code-block-btn { font-size:8px; padding:2px 6px; border-radius:3px; border:1px solid var(--pua-border); background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; transition:var(--pua-transition); }',
    '.pua-code-block-btn:hover { border-color:var(--pua-accent); color:var(--pua-text); }',
    '.pua-code-block pre { margin:0; padding:10px; overflow-x:auto; font-size:10px; line-height:1.5; font-family:"Cascadia Code","Fira Code",monospace; color:var(--pua-text); }',
    '.pua-code-block pre::-webkit-scrollbar { height:3px; }',
    '.pua-code-block pre::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }',
    '.pua-inline-code { background:rgba(255,183,77,0.1); border:1px solid rgba(255,183,77,0.2); border-radius:3px; padding:1px 4px; font-size:10px; font-family:"Cascadia Code","Fira Code",monospace; color:var(--pua-accent-text); }',
    '.pua-bold-text { font-weight:700; color:var(--pua-text); }',
    // Preview iframe
    '.pua-preview-frame { width:100%; min-height:120px; border:1px solid var(--pua-border); border-radius:6px; background:#fff; margin-top:6px; }',
    // Regex preview
    '.pua-regex-preview { margin-top:6px; padding:8px; border:1px solid var(--pua-border); border-radius:6px; background:var(--pua-bg-card); }',
    '.pua-regex-preview-input { width:100%; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:4px; padding:4px 8px; color:var(--pua-text); font-size:10px; font-family:inherit; outline:none; margin-bottom:6px; }',
    '.pua-regex-preview-input:focus { border-color:var(--pua-accent); }',
    '.pua-regex-preview-output { padding:6px; border-radius:4px; background:rgba(0,0,0,0.2); min-height:30px; font-size:11px; }',
    // Element selection mode
    '.pua-elem-select-active .pua-regex-preview-output *:hover { outline:2px solid #4a9eff !important; outline-offset:1px; cursor:crosshair; }',
    '.pua-elem-select-active#regex-preview-result *:hover { outline:2px solid #4a9eff !important; outline-offset:1px; cursor:crosshair; }',
    '.pua-elem-info { margin-top:6px; padding:6px; border-radius:4px; background:rgba(74,158,255,0.08); border:1px solid rgba(74,158,255,0.2); font-size:9px; color:var(--pua-text-sub); max-height:300px; overflow-y:auto; }',
    '.pua-elem-info-label { font-weight:600; color:#4a9eff; margin-bottom:2px; }',
    // Element editor
    '.pua-elem-editor { }',
    '.pua-elem-editor-title { font-weight:600; color:var(--pua-accent); font-size:10px; margin-bottom:4px; }',
    '.pua-elem-editor-tag { font-size:9px; color:var(--pua-text-dim); margin-bottom:6px; padding-bottom:4px; border-bottom:1px solid var(--pua-border); }',
    '.pua-elem-editor-grid { display:grid; grid-template-columns:1fr 1fr; gap:3px 8px; }',
    '.pua-elem-editor-row { display:flex; align-items:center; gap:4px; margin-bottom:2px; }',
    '.pua-elem-editor-row label { font-size:9px; color:var(--pua-text-dim); min-width:40px; flex-shrink:0; }',
    '.pua-elem-editor-input { flex:1; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:3px; padding:2px 4px; color:var(--pua-text); font-size:9px; font-family:inherit; outline:none; min-width:0; }',
    '.pua-elem-editor-input:focus { border-color:var(--pua-accent); }',
    '.pua-elem-editor-unit { font-size:8px; color:var(--pua-text-dim); flex-shrink:0; }',
    '.pua-elem-color-picker { width:20px; height:20px; border:1px solid var(--pua-border); border-radius:3px; cursor:pointer; padding:0; background:none; flex-shrink:0; }',
    '.pua-elem-color-picker::-webkit-color-swatch-wrapper { padding:1px; }',
    '.pua-elem-color-picker::-webkit-color-swatch { border:none; border-radius:2px; }',
    '.pua-elem-editor-actions { display:flex; gap:4px; margin-top:6px; padding-top:4px; border-top:1px solid var(--pua-border); }',
    '.pua-elem-editor-range { -webkit-appearance:none; width:80px; height:4px; background:var(--pua-border); border-radius:2px; outline:none; }',
    '.pua-elem-editor-range::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; border-radius:50%; background:var(--pua-accent); cursor:pointer; }',
    // Prompt modal
    '.pua-prompt-modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.6); z-index:10000; display:flex; align-items:center; justify-content:center; }',
    '.pua-prompt-modal { width:90%; max-width:600px; max-height:80vh; background:var(--pua-bg-solid); border:1px solid var(--pua-border); border-radius:12px; box-shadow:var(--pua-shadow); display:flex; flex-direction:column; overflow:hidden; }',
    '.pua-prompt-modal-header { padding:12px 16px; border-bottom:1px solid var(--pua-border); display:flex; align-items:center; justify-content:space-between; }',
    '.pua-prompt-modal-title { font-size:13px; font-weight:600; color:#ffffff; }',
    '.pua-prompt-modal-close { font-size:16px; background:none; border:none; color:var(--pua-text-sub); cursor:pointer; padding:4px; }',
    '.pua-prompt-modal-close:hover { color:var(--pua-text); }',
    '.pua-prompt-modal-body { flex:1; overflow-y:auto; padding:16px; color:var(--pua-text); }',
    '.pua-prompt-modal-textarea { width:100%; min-height:200px; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:6px; padding:8px 10px; color:var(--pua-text); font-size:10px; font-family:"Cascadia Code","Fira Code",monospace; line-height:1.5; outline:none; resize:vertical; }',
    '.pua-prompt-modal-textarea:focus { border-color:var(--pua-accent); }',
    '.pua-prompt-modal-presets { margin-top:8px; display:flex; gap:6px; flex-wrap:wrap; align-items:center; }',
    '.pua-prompt-modal-preset-select { background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:6px; padding:4px 8px; color:var(--pua-text); font-size:10px; font-family:inherit; outline:none; cursor:pointer; min-width:120px; }',
    '.pua-prompt-modal-preset-select:focus { border-color:var(--pua-accent); }',
    '.pua-prompt-modal-preset-btn { padding:6px 10px; border-radius:6px; font-weight:600; font-size:11px; cursor:pointer; border:none; transition:all 0.2s; display:flex; align-items:center; gap:2px; }',
    '.pua-prompt-modal-save-btn { background:#c8a84e; color:#1a1a2e; }',
    '.pua-prompt-modal-save-btn:hover { background:#d4b85a; }',
    '.pua-prompt-modal-del-btn { background:transparent; border:1px solid #c8a84e; color:#c8a84e; }',
    '.pua-prompt-modal-del-btn:hover { background:rgba(200,168,78,0.15); }',
    '.pua-prompt-modal-name-input { background:#0d0d1a; border:1px solid #c8a84e; border-radius:6px; padding:4px 8px; color:#ffffff; font-size:10px; font-family:inherit; outline:none; width:100px; display:none; }',
    '.pua-prompt-modal-name-input.visible { display:inline-block; }',
    '.pua-prompt-modal-footer { padding:12px 16px; border-top:1px solid var(--pua-border); display:flex; gap:8px; justify-content:flex-end; align-items:center; }',
    '.pua-prompt-modal-footer .pua-btn { padding:8px 16px !important; border-radius:6px !important; font-weight:600 !important; font-size:11px !important; }',
    '.pua-prompt-modal-footer #ast-prompt-save, .pua-prompt-modal-footer #ast-preset-save-as { background:#c8a84e !important; color:#1a1a2e !important; border-color:#c8a84e !important; font-weight:700 !important; }',
    '.pua-prompt-modal-footer #ast-prompt-save:hover, .pua-prompt-modal-footer #ast-preset-save-as:hover { background:#d4b85a !important; }',
    '.pua-prompt-modal-footer #ast-prompt-reset { background:transparent !important; border:1px solid #c8a84e !important; color:#c8a84e !important; font-weight:600 !important; }',
    '.pua-prompt-modal-footer #ast-prompt-reset:hover { background:rgba(200,168,78,0.15) !important; }',

    '/* ── 对话页面 ── */',
    '.pua-conv-layout { display:flex; flex-direction:column; height:100%; overflow-x:hidden; }',
    '.pua-conv-topbar { padding:var(--pua-safe-top) 14px 6px; border-bottom:1px solid var(--pua-border); display:flex; align-items:center; gap:8px; flex-shrink:0; }',
    '.pua-conv-branch-name { font-size:12px; font-weight:600; color:var(--pua-accent-text); flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
    '.pua-conv-msg-count { font-size:9px; color:var(--pua-text-dim); background:var(--pua-bg-input); padding:2px 6px; border-radius:8px; }',
    '.pua-conv-topbar-btn { width:26px; height:26px; border-radius:6px; border:1px solid var(--pua-border); background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center; transition:var(--pua-transition); }',
    '.pua-conv-topbar-btn:hover { border-color:var(--pua-border-active); color:var(--pua-text); }',
    '.pua-conv-chat { flex:1; overflow-y:auto; overflow-x:hidden; padding:8px; display:flex; flex-direction:column; gap:10px; }',
    '.pua-conv-chat::-webkit-scrollbar { width:4px; }',
    '.pua-conv-chat::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.06); border-radius:2px; }',
    '.pua-conv-collapsed { text-align:center; padding:8px; font-size:10px; color:var(--pua-text-dim); cursor:pointer; }',
    '.pua-conv-collapsed:hover { color:var(--pua-accent); }',
    '.pua-conv-msg { width:100%; padding:10px 12px; border-radius:12px; font-size:12px; line-height:1.7; word-break:break-word; position:relative; margin:0 auto; box-sizing:border-box; }',
    '.pua-conv-msg-user { background:var(--pua-accent-glow); border:1px solid var(--pua-border-active); color:var(--pua-accent-text); border-bottom-right-radius:4px; text-align:left; }',
    '.pua-conv-msg-assistant { background:var(--pua-bg-card); border:1px solid var(--pua-border); color:var(--pua-text); border-bottom-left-radius:4px; text-align:left; }',
    '.pua-conv-msg-system { align-self:center; background:rgba(91,141,239,0.08); border:1px solid rgba(91,141,239,0.2); color:var(--pua-text-sub); border-radius:8px; font-size:10px; max-width:90%; }',
    '.pua-conv-msg-dimmed { opacity:0.4; }',
    '.pua-conv-msg-dimmed .pua-conv-msg-content { text-decoration:line-through; }',
    '.pua-conv-msg-header { display:flex; align-items:center; gap:6px; margin-bottom:4px; }',
    '.pua-conv-msg-floor { font-size:9px; color:var(--pua-text-dim); cursor:pointer; font-weight:600; }',
    '.pua-conv-msg-floor:hover { color:var(--pua-accent); }',
    '.pua-conv-msg-time { font-size:8px; color:var(--pua-text-dim); }',
    '.pua-conv-msg-content { white-space:pre-wrap; min-height:1em; overflow-x:auto; }',
    '.pua-conv-msg-actions { display:flex; gap:4px; margin-top:6px; opacity:0; transition:opacity 0.2s; flex-wrap:wrap; }',
    '.pua-conv-msg:hover .pua-conv-msg-actions { opacity:1; }',
    '.pua-conv-msg-action { font-size:10px; padding:3px 8px; border-radius:4px; border:1px solid var(--pua-border); background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; transition:var(--pua-transition); white-space:nowrap; }',
    '.pua-conv-msg-action:hover { border-color:var(--pua-accent); color:var(--pua-text); }',
    '.pua-conv-msg-action.active { border-color:var(--pua-accent); color:var(--pua-accent); background:var(--pua-accent-glow); }',
    '.pua-conv-status { font-size:10px; padding:2px 0; display:flex; align-items:center; gap:4px; }',
    '.pua-conv-status-dot { width:6px; height:6px; border-radius:50%; background:var(--pua-accent); animation:pua-spin 0.8s linear infinite; }',
    '.pua-conv-status-streaming { color:var(--pua-accent); }',
    '.pua-conv-status-error { color:var(--pua-danger); }',
    '.pua-conv-status-interrupted { color:var(--pua-text-dim); }',
    '.pua-conv-edit-mode { font-family:monospace; white-space:pre-wrap; background:var(--pua-bg-input); border:1px dashed var(--pua-border); border-radius:4px; padding:8px; }',
    '.pua-conv-edit-textarea { width:100%; min-height:120px; font-family:monospace; font-size:12px; line-height:1.5; background:var(--pua-bg-input); color:var(--pua-text); border:1px solid var(--pua-border); border-radius:4px; padding:8px; resize:vertical; white-space:pre-wrap; word-break:break-all; }',
    '.pua-conv-alt-tabs { display:flex; gap:3px; margin-top:4px; }',
    '.pua-conv-alt-tab { font-size:8px; padding:1px 5px; border-radius:3px; border:1px solid var(--pua-border); background:var(--pua-bg-input); color:var(--pua-text-dim); cursor:pointer; }',
    '.pua-conv-alt-tab.active { border-color:var(--pua-accent); color:var(--pua-accent); background:var(--pua-accent-glow); }',
    '.pua-conv-input-area { padding:10px 14px var(--pua-safe-bottom); border-top:1px solid var(--pua-border); flex-shrink:0; }',
    '.pua-conv-input-row { display:flex; gap:8px; align-items:flex-end; }',
    '.pua-conv-input { flex:1; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:8px; padding:8px 12px; color:var(--pua-text); font-size:11px; font-family:inherit; outline:none; resize:none; height:60px; min-height:60px; max-height:150px; transition:height 0.25s ease, min-height 0.25s ease; }',
    '.pua-conv-input.expanded { height:150px; min-height:150px; }',
    '.pua-conv-input:focus { border-color:var(--pua-accent); }',
    '.pua-conv-send { padding:8px 16px; border-radius:8px; border:none; background:linear-gradient(135deg,var(--pua-accent-dim),var(--pua-accent)); color:#121216; font-size:13px; font-weight:600; cursor:pointer; transition:var(--pua-transition); align-self:flex-end; }',
    '.pua-conv-send:hover { opacity:0.9; }',
    '.pua-conv-send:disabled { opacity:0.4; cursor:default; }',
    '.pua-conv-regen-btn { padding:8px 12px; border-radius:8px; border:1px solid var(--pua-border); background:var(--pua-bg-card); color:var(--pua-text-sub); font-size:16px; cursor:pointer; transition:var(--pua-transition); align-self:flex-end; }',
    '.pua-conv-regen-btn:hover { border-color:var(--pua-accent); color:var(--pua-accent); }',
    '.pua-conv-input-btns { display:flex; gap:4px; margin-top:6px; align-items:center; }',
    '.pua-conv-input-btn { font-size:10px; padding:3px 8px; border-radius:4px; border:1px solid var(--pua-border); background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; transition:var(--pua-transition); }',
    '.pua-conv-input-btn:hover { border-color:var(--pua-accent); color:var(--pua-text); }',
    '.pua-conv-jump-input { width:60px; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:4px; padding:3px 6px; color:var(--pua-text); font-size:10px; outline:none; text-align:center; }',
    '.pua-conv-jump-input:focus { border-color:var(--pua-accent); }',
    '.pua-conv-jump-row { display:none; align-items:center; gap:4px; margin-top:4px; }',
    '.pua-conv-jump-row.show { display:flex; }',
    '.pua-conv-bottom-btn { position:absolute; bottom:calc(80px + var(--pua-safe-bottom)); right:20px; width:32px; height:32px; border-radius:50%; border:1px solid var(--pua-border); background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; transition:var(--pua-transition); z-index:50; box-shadow:var(--pua-shadow); }',
    '.pua-conv-bottom-btn:hover { border-color:var(--pua-accent); color:var(--pua-accent); }',
    '.pua-conv-settings-panel { position:absolute; top:calc(48px + var(--pua-safe-top)); right:10px; width:240px; background:var(--pua-bg-solid); border:1px solid var(--pua-border); border-radius:10px; box-shadow:var(--pua-shadow); z-index:100; padding:14px; display:none; }',
    '.pua-conv-settings-panel.show { display:block; animation:pua-modalIn 0.2s ease; }',
    '.pua-conv-settings-title { font-size:11px; font-weight:600; color:var(--pua-accent); margin-bottom:8px; }',
    '.pua-conv-settings-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }',
    '.pua-conv-settings-label { font-size:10px; color:var(--pua-text-sub); }',
    '.pua-conv-settings-input { width:50px; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:4px; padding:3px 6px; color:var(--pua-text); font-size:10px; text-align:center; outline:none; }',
    '.pua-conv-settings-input:focus { border-color:var(--pua-accent); }',
    '.pua-conv-typing { font-size:10px; color:var(--pua-accent); opacity:0.7; padding:4px 0; display:flex; align-items:center; gap:6px; }',
    '.pua-conv-typing::before { content:""; display:inline-block; width:12px; height:12px; border:2px solid var(--pua-accent); border-top-color:transparent; border-radius:50%; animation:pua-spin 0.8s linear infinite; }',

    '/* ── 悬浮球 ── */',
    '.pua-fab { position:fixed; bottom:20px; right:20px; z-index:200; }',
    '.pua-fab-btn { width:40px; height:40px; border-radius:50%; border:none; background:linear-gradient(135deg,var(--pua-accent-dim),var(--pua-accent)); color:#121216; font-size:16px; cursor:pointer; box-shadow:0 4px 20px var(--pua-accent-glow); display:flex; align-items:center; justify-content:center; transition:var(--pua-transition); animation:pua-fab-pulse 2s ease-in-out infinite; }',
    '.pua-fab-btn:hover { transform:scale(1.1); }',
    '@keyframes pua-fab-pulse { 0%,100%{ box-shadow:0 4px 20px var(--pua-accent-glow); } 50%{ box-shadow:0 4px 30px rgba(197,160,89,0.4); } }',
    '.pua-fab-menu { position:absolute; bottom:50px; right:0; width:220px; background:var(--pua-bg-solid); border:1px solid var(--pua-border); border-radius:12px; box-shadow:var(--pua-shadow); padding:10px; display:none; }',
    '.pua-fab-menu.show { display:block; animation:pua-modalIn 0.2s ease; }',
    '.pua-fab-menu-title { font-size:9px; color:var(--pua-text-dim); font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; padding-bottom:4px; border-bottom:1px solid var(--pua-border); }',
    '.pua-fab-menu-item { display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px; cursor:pointer; font-size:10px; color:var(--pua-text-sub); transition:var(--pua-transition); }',
    '.pua-fab-menu-item:hover { background:var(--pua-bg-card-hover); color:var(--pua-text); }',
    '.pua-fab-menu-item-icon { width:18px; text-align:center; font-size:12px; }',
    '.pua-fab-toggle-row { display:flex; align-items:center; justify-content:space-between; padding:4px 8px; font-size:10px; color:var(--pua-text-sub); }',
    '.pua-fab-slider-row { display:flex; align-items:center; gap:6px; padding:4px 8px; font-size:10px; color:var(--pua-text-sub); }',
    '.pua-fab-slider { -webkit-appearance:none; width:80px; height:4px; background:var(--pua-border); border-radius:2px; outline:none; }',
    '.pua-fab-slider::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; border-radius:50%; background:var(--pua-accent); cursor:pointer; }',

    '/* ── 收藏页面 ── */',
    '.pua-fav-item { background:var(--pua-bg-card); border:1px solid var(--pua-border); border-radius:10px; padding:12px 14px; margin-bottom:8px; transition:var(--pua-transition); position:relative; }',
    '.pua-fav-item:hover { border-color:var(--pua-border-active); }',
    '.pua-fav-item-header { display:flex; align-items:center; gap:8px; margin-bottom:6px; }',
    '.pua-fav-branch { font-size:10px; color:var(--pua-accent); font-weight:600; }',
    '.pua-fav-floor { font-size:9px; color:var(--pua-text-dim); background:var(--pua-bg-input); padding:1px 5px; border-radius:4px; }',
    '.pua-fav-role { font-size:9px; padding:1px 5px; border-radius:3px; font-weight:600; }',
    '.pua-fav-role-user { background:rgba(78,201,160,0.12); color:var(--pua-user); }',
    '.pua-fav-role-assistant { background:rgba(239,106,138,0.12); color:var(--pua-mem); }',
    '.pua-fav-content { font-size:10.5px; color:var(--pua-text-sub); line-height:1.5; max-height:60px; overflow:hidden; white-space:pre-wrap; }',
    '.pua-fav-note { font-size:9px; color:var(--pua-accent-text); margin-top:4px; font-style:italic; }',
    '.pua-fav-actions { display:flex; gap:4px; margin-top:8px; }',
    '.pua-fav-warning { font-size:9px; color:var(--pua-danger); display:flex; align-items:center; gap:4px; }',
  ].join('\n')

  /* ════════════════════════════════════════════════════════════
     ParallelUniverse 主类
     ════════════════════════════════════════════════════════════ */

  function ParallelUniverse(roche) {
    this.roche = roche
    this.container = null
    this.styleEl = null
    this.currentPage = 'branches'
    this.theme = 'dark'
    this.branches = []
    this.toastTimer = null
    this._pendingConvId = ''
    this._pendingCharId = ''
    this._pendingCharName = ''
    this._pendingCharAvatar = ''
    // 关键DOM元素引用（避免依赖 document.getElementById）
    this._modalOverlay = null
    this._toastEl = null
    this._contentEl = null
    this._titleEl = null
    this._actionsEl = null
    this._logPanel = null
    this._logList = null
    this._logToggle = null
    this._logCount = null
    // 日志缓冲
    this._logBuffer = []
    this._originalConsole = {}
    // 角色/会话列表缓存
    this._charList = []
    this._convList = []
    // 预设编辑器数据
    this.presets = []
    this.selPreset = ''
    this._promptPresetData = null
    // 正则管理数据
    this.regexes = []
    this.selRegex = ''
    this._regexPresetData = null
    // 上下文组装数据
    this.asmBranchId = ''
    this.asmConfig = {
      contextDepth: 40
    }
    this.asmData = {
      branch: null,
      char: null,
      chars: [],
      userPersona: null,
      shortTerm: [],
      longTerm: null,
      worldbook: [],
      worldEntries: []
    }
    this.asmOrder = []
    this._asmOrderLoaded = false
    this.asmLoading = false
    // 顺序预设
    this.asmOrderPresets = []
    this._asmOrderPresetsLoaded = false
    // 助手数据
    this._assistantData = null
    this._assistantSending = false
    this._assistantAttached = { presets: [], regexes: [] }
    // 移动端状态
    this._sidebarOpen = false
    this._mobileDetailOpen = false
    // 设置数据
    this.settings = null
    // 对话系统数据
    this._convMessages = []
    this._convBranchId = ''
    this._convSending = false
    this._convStreamingMsg = null
    this._editingMsgId = null
    this._convRenderLimit = 10
    this._convContextDepth = 30
    this._convAutoScroll = false
    this._convShowSettings = false
    this._convShowJump = false
    this._msgSinceLastSummary = 0
    // 悬浮球状态
    this._fabExpanded = false
    this._fabPos = null
    try { var _fp = localStorage.getItem('pua_fab_pos'); if (_fp) this._fabPos = JSON.parse(_fp) } catch(e) {}
  }

  var P = ParallelUniverse.prototype

  /* ── 初始化 ── */
  P.init = function(container) {
    this.container = container
    // 重置渲染状态
    this._rendering = false

    // 注入样式
    if (!this.styleEl) {
      this.styleEl = document.createElement('style')
      this.styleEl.textContent = CSS
      document.head.appendChild(this.styleEl)
    }

    // 注入自定义主题CSS
    this._applyThemeCSS()

    // 加载LXGW字体
    if (!document.getElementById('pua-font-link')) {
      var link = document.createElement('link')
      link.id = 'pua-font-link'
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-lite-webfont@1.1.0/style.css'
      document.head.appendChild(link)
    }

    // 捕获控制台日志
    this._captureConsole()

    // 诊断 roche API 可用性
    if (this.roche) {
      var memDiag = {
        hasMemory: !!this.roche.memory,
        memoryKeys: this.roche.memory ? Object.keys(this.roche.memory) : [],
        getShortTerm: !!(this.roche.memory && this.roche.memory.getShortTerm),
        getLongTerm: !!(this.roche.memory && this.roche.memory.getLongTerm),
        search: !!(this.roche.memory && this.roche.memory.search),
        write: !!(this.roche.memory && this.roche.memory.write),
        update: !!(this.roche.memory && this.roche.memory.update),
        delete: !!(this.roche.memory && this.roche.memory.delete),
        hasConversation: !!this.roche.conversation,
        conversationKeys: this.roche.conversation ? Object.keys(this.roche.conversation) : [],
        hasCharacter: !!this.roche.character,
        characterKeys: this.roche.character ? Object.keys(this.roche.character) : [],
        hasPersona: !!this.roche.persona,
        personaKeys: this.roche.persona ? Object.keys(this.roche.persona) : [],
        hasWorldbook: !!this.roche.worldbook,
        worldbookKeys: this.roche.worldbook ? Object.keys(this.roche.worldbook) : [],
        hasAi: !!this.roche.ai,
        hasStorage: !!this.roche.storage,
        hasUi: !!this.roche.ui
      }
      console.log('[PUA] roche API diagnostic: ' + JSON.stringify(memDiag))
      // 测试调用
      if (this.roche.memory && this.roche.memory.getLongTerm) {
        this.roche.memory.getLongTerm({ conversationId: 'test', limit: 1 }).then(function(d) {
          console.log('[PUA] getLongTerm test call: returned=' + JSON.stringify(d).substring(0, 200))
        }).catch(function(e) {
          console.log('[PUA] getLongTerm test call FAILED: ' + (e.message || e))
        })
      }
    } else {
      console.warn('[PUA] roche object is null/undefined!')
    }

    // 加载已保存的分支和预设（同步数据）
    this._loadPresets()
    this._loadRegexes()
    this._loadRegexPresets()
    this._loadPromptPresets()
    this._loadAsmConfig()
    this._loadAsmOrder()
    this._loadAsmOrderPresets()
    this._loadSettings()
    this._loadAssistantData()

    // Migrate font size from old localStorage key to settings
    var oldFontSize = localStorage.getItem('pua_conv_font_size')
    if (oldFontSize && !this._loadSettings().convFontSize) {
      var s = this._loadSettings()
      s.convFontSize = parseInt(oldFontSize) || 14
      this._saveSettings(s)
      localStorage.removeItem('pua_conv_font_size')
    }

    this._currentMemBranchId = ''

    // 异步加载分支，完成后渲染
    this._loadBranches()

    // Handle page visibility - refresh streaming display when coming back
    var self = this
    if (!this._visHandler) {
      this._visHandler = function() {
        if (!document.hidden && self._convSending && self._convStreamingMsg) {
          // Page became visible while streaming - just update the streaming message display
          var contentEl = self._contentEl
          if (contentEl) {
            self._updateStreamingMessage(contentEl, self._escHtml(self._convStreamingMsg.content || ''), true)
          }
        }
      }
      document.addEventListener('visibilitychange', this._visHandler)
    }
  }

  /* ── 捕获控制台日志 ── */
  P._captureConsole = function() {
    if (this._originalConsole.log) return // 已捕获
    var self = this
    this._originalConsole.log = console.log
    this._originalConsole.warn = console.warn
    this._originalConsole.error = console.error

    console.log = function() {
      self._addLog('log', arguments)
      self._originalConsole.log.apply(console, arguments)
    }
    console.warn = function() {
      self._addLog('warn', arguments)
      self._originalConsole.warn.apply(console, arguments)
    }
    console.error = function() {
      self._addLog('error', arguments)
      self._originalConsole.error.apply(console, arguments)
    }
  }

  P._addLog = function(level, args) {
    var text = ''
    for (var i = 0; i < args.length; i++) {
      if (i > 0) text += ' '
      var a = args[i]
      try {
        if (a instanceof Error) {
          text += a.message + (a.stack ? '\n' + a.stack : '')
        } else if (typeof a === 'object' && a !== null) {
          try { text += JSON.stringify(a, null, 2) } catch(e2) { text += String(a) }
        } else {
          text += String(a)
        }
      } catch(e) {
        text += String(a)
      }
    }
    var entry = {
      level: level,
      text: text,
      time: new Date().toLocaleTimeString('zh-CN')
    }
    this._logBuffer.push(entry)
    if (this._logBuffer.length > 500) this._logBuffer.shift()
    // 如果日志面板已打开，实时更新
    if (this._logList && this._logPanel && this._logPanel.classList.contains('open')) {
      this._appendLogEntry(entry)
    }
    if (this._logCount) {
      var cnt = this._logBuffer.length
      this._logCount.textContent = cnt > 99 ? '99+' : String(cnt)
      this._logCount.style.display = cnt > 0 ? 'flex' : 'none'
    }
  }

  /* ── 卸载App视图（保留样式和实例） ── */
  P.unmountAppView = function() {
    if (this.container) { this.container.innerHTML = ''; this.container = null }
    this._modalOverlay = null
    this._toastEl = null
    this._contentEl = null
    this._titleEl = null
    this._actionsEl = null
    this._logPanel = null
    this._logList = null
    this._logToggle = null
    this._logCount = null
  }

  /* ── 完全销毁（插件卸载时调用） ── */
  P.destroy = function() {
    if (this.styleEl) { this.styleEl.remove(); this.styleEl = null }
    if (this.container) { this.container.innerHTML = ''; this.container = null }
    this._modalOverlay = null
    this._toastEl = null
    this._contentEl = null
    this._titleEl = null
    this._actionsEl = null
    this._logPanel = null
    this._logList = null
    this._logToggle = null
    this._logCount = null
    // 恢复原始console
    if (this._originalConsole.log) {
      console.log = this._originalConsole.log
      console.warn = this._originalConsole.warn
      console.error = this._originalConsole.error
      this._originalConsole = {}
    }
  }

  /* ════════════════════════════════════════════════════════════
     存储
     ════════════════════════════════════════════════════════════ */

  P._loadBranches = function() {
    var self = this
    if (!this.roche || !this.roche.storage) {
      // storage 不可用时也要渲染
      this._render()
      return
    }
    this.roche.storage.get('pua_branches').then(function(data) {
      if (data && data.branches) self.branches = data.branches
      self._render()
    }).catch(function() { self.branches = []; self._render() })
  }

  P._saveBranches = function() {
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.set('pua_branches', { branches: this.branches }).catch(function(e) {
      console.error('[PUA] save failed', e)
    })
  }

  P._loadPresets = function() {
    var self = this
    console.log('[PUA] _loadPresets called')
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.get('pua_presets').then(function(data) {
      if (data && data.presets && data.presets.length) {
        self.presets = data.presets
        if (self.selPreset) {
          var found = false
          for (var i = 0; i < self.presets.length; i++) {
            if (self.presets[i].id === self.selPreset) { found = true; break }
          }
          if (!found) self.selPreset = self.presets.length > 0 ? self.presets[0].id : ''
        }
      }
    }).catch(function() {})
  }

  P._savePresets = function() {
    console.log('[PUA] _savePresets called')
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.set('pua_presets', { presets: this.presets }).catch(function(e) {
      console.error('[PUA] save presets failed', e)
    })
  }

  P._loadRegexes = function() {
    var self = this
    console.log('[PUA] _loadRegexes called')
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.get('pua_regexes').then(function(data) {
      if (data && data.regexes && data.regexes.length) {
        self.regexes = data.regexes
        if (self.selRegex) {
          var found = false
          for (var i = 0; i < self.regexes.length; i++) {
            if (self.regexes[i].id === self.selRegex) { found = true; break }
          }
          if (!found) self.selRegex = self.regexes.length > 0 ? self.regexes[0].id : ''
        }
        // Re-render if on conversation page to apply render regexes (but not during streaming)
        if (self._currentPage === 'conversation' && !self._convSending) {
          self._renderPage()
        }
      }
    }).catch(function() {})
  }

  P._saveRegexes = function() {
    console.log('[PUA] _saveRegexes called')
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.set('pua_regexes', { regexes: this.regexes }).catch(function(e) {
      console.error('[PUA] save regexes failed', e)
    })
  }

  P._rebuildAsmOrder = function() {
    // Rebuild asmOrder from current presets and regexes
    var order = []
    for (var i = 0; i < this.presets.length; i++) {
      if (this.presets[i].on) {
        order.push({ type: 'preset', id: this.presets[i].id })
      }
    }
    for (var j = 0; j < this.regexes.length; j++) {
      if (this.regexes[j].on) {
        order.push({ type: 'regex', id: this.regexes[j].id })
      }
    }
    // Always include char, persona, worldbook, memory, chat
    var baseTypes = ['character', 'persona', 'worldbook', 'memory', 'chat']
    for (var k = 0; k < baseTypes.length; k++) {
      var exists = false
      for (var l = 0; l < order.length; l++) {
        if (order[l].type === baseTypes[k]) { exists = true; break }
      }
      if (!exists) order.push({ type: baseTypes[k] })
    }
    this.asmOrder = order
    this._saveAsmOrder()
    console.log('[PUA] _rebuildAsmOrder: rebuilt order length=' + order.length)
  }

  P._doSummarizeCore = function() {
    var self = this
    var preset = this._getActivePreset()
    if (!preset || !preset.subEndpoint || !preset.subApiKey || !preset.subModel) {
      this._toast('\u8BF7\u5148\u914D\u7F6E\u526F API')
      return
    }
    var memData = this._loadMemData(this.asmBranchId)
    if (!memData || !memData.facts || memData.facts.length === 0) {
      this._toast('\u65E0\u4E8B\u5B9E\u8BB0\u5FC6\u53EF\u603B\u7ED3')
      return
    }
    this._toast('\u5F00\u59CB\u603B\u7ED3\u6838\u5FC3\u8BB0\u5FC6...')
    var allFacts = ''
    for (var i = 0; i < memData.facts.length; i++) {
      var f = memData.facts[i]
      allFacts += (i + 1) + '. ' + (f.summary || f.summaryText || f.text) + '\n'
    }
    var settings = this._loadSettings()
    var charLimit = settings.coreCharLimit || 2000
    var prompt = '\u8BF7\u5C06\u4EE5\u4E0B\u4E8B\u5B9E\u8BB0\u5FC6\u6574\u5408\u4E3A\u4E00\u6BB5\u6838\u5FC3\u8BB0\u5FC6\u6982\u8FF0\uFF0C\u4FDD\u7559\u6700\u91CD\u8981\u7684\u4FE1\u606F\uFF0C\u5B57\u6570\u4E0D\u8D85\u8FC7' + charLimit + '\u5B57\u3002\n\n' + allFacts
    var url = preset.subEndpoint.replace(/\/+$/, '') + '/chat/completions'
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + preset.subApiKey },
      body: JSON.stringify({
        model: preset.subModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: charLimit
      })
    }).then(function(r) { return r.json() }).then(function(data) {
      if (data.choices && data.choices[0]) {
        var result = (data.choices[0].message || {}).content || ''
        if (result) {
          memData.coreMemory = result
          self._saveMemData(memData, self.asmBranchId)
          self._toast('\u6838\u5FC3\u8BB0\u5FC6\u603B\u7ED3\u5B8C\u6210')
        } else {
          self._toast('\u6838\u5FC3\u8BB0\u5FC6\u603B\u7ED3\u5931\u8D25\uFF1A\u65E0\u8FD4\u56DE\u5185\u5BB9')
        }
      } else {
        self._toast('\u6838\u5FC3\u8BB0\u5FC6\u603B\u7ED3\u5931\u8D25')
      }
    }).catch(function(e) {
      self._toast('\u6838\u5FC3\u8BB0\u5FC6\u603B\u7ED3\u51FA\u9519: ' + (e.message || ''))
    })
  }

  /* ── 正则预设管理 ── */
  P._loadRegexPresets = function() {
    var self = this
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.get('pua_regex_presets').then(function(data) {
      if (data && data.presets && data.presets.length) {
        self._regexPresetData = data
      } else {
        self._regexPresetData = {
          presets: [{ id: 'rpreset-default', name: '\u9ED8\u8BA4\u9884\u8BBE', regexes: self.regexes.slice() }],
          activePresetId: 'rpreset-default'
        }
        self._saveRegexPresets()
      }
    }).catch(function() {
      self._regexPresetData = {
        presets: [{ id: 'rpreset-default', name: '\u9ED8\u8BA4\u9884\u8BBE', regexes: self.regexes.slice() }],
        activePresetId: 'rpreset-default'
      }
      self._saveRegexPresets()
    })
  }

  P._saveRegexPresets = function() {
    if (!this.roche || !this.roche.storage) return
    if (!this._regexPresetData) return
    this.roche.storage.set('pua_regex_presets', this._regexPresetData).catch(function(e) {
      console.error('[PUA] save regex presets failed', e)
    })
  }

  P._getActiveRegexPreset = function() {
    if (!this._regexPresetData) return null
    var presets = this._regexPresetData.presets || []
    var activeId = this._regexPresetData.activePresetId || ''
    for (var i = 0; i < presets.length; i++) {
      if (presets[i].id === activeId) return presets[i]
    }
    return presets[0] || null
  }

  /* ── 预设编辑器预设管理 ── */
  P._loadPromptPresets = function() {
    var self = this
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.get('pua_prompt_presets').then(function(data) {
      if (data && data.presets && data.presets.length) {
        self._promptPresetData = data
      } else {
        self._promptPresetData = {
          presets: [{ id: 'ppreset-default', name: '\u9ED8\u8BA4\u9884\u8BBE', items: self.presets.slice() }],
          activePresetId: 'ppreset-default'
        }
        self._savePromptPresets()
      }
    }).catch(function() {
      self._promptPresetData = {
        presets: [{ id: 'ppreset-default', name: '\u9ED8\u8BA4\u9884\u8BBE', items: self.presets.slice() }],
        activePresetId: 'ppreset-default'
      }
      self._savePromptPresets()
    })
  }

  P._savePromptPresets = function() {
    if (!this.roche || !this.roche.storage) return
    if (!this._promptPresetData) return
    this.roche.storage.set('pua_prompt_presets', this._promptPresetData).catch(function(e) {
      console.error('[PUA] save prompt presets failed', e)
    })
  }

  P._getActivePromptPreset = function() {
    if (!this._promptPresetData) return null
    var presets = this._promptPresetData.presets || []
    var activeId = this._promptPresetData.activePresetId || ''
    for (var i = 0; i < presets.length; i++) {
      if (presets[i].id === activeId) return presets[i]
    }
    return presets[0] || null
  }

  /* ════════════════════════════════════════════════════════════
     渲染主框架
     ════════════════════════════════════════════════════════════ */

  P._render = function() {
    console.log('[PUA] _render called, page=' + this._currentPage)
    if (!this.container) return
    // 防止重入
    if (this._rendering) return
    this._rendering = true
    var self = this
    var c = this.container

    // Save scroll positions before DOM rebuild
    var savedScrolls = {}
    var chatEl = this._contentEl ? this._contentEl.querySelector('#conv-chat') : null
    if (chatEl) savedScrolls.convChat = chatEl.scrollTop
    var presetList = this._contentEl ? this._contentEl.querySelector('#pua-preset-list') : null
    if (presetList) savedScrolls.presetList = presetList.scrollTop
    var regexList = this._contentEl ? this._contentEl.querySelector('#pua-regex-list') : null
    if (regexList) savedScrolls.regexList = regexList.scrollTop

    // 调试：渲染计数
    this._renderCount = (this._renderCount || 0) + 1
    var renderId = this._renderCount

    try {
    c.innerHTML = ''

    var root = document.createElement('div')
    root.className = 'pua-root' + (this.theme === 'light' ? ' pua-light' : '')

    // Layout
    var layout = document.createElement('div')
    layout.className = 'pua-layout'
    root.appendChild(layout)

    // Sidebar
    layout.appendChild(this._renderSidebar())

    // Main
    var main = document.createElement('div')
    main.className = 'pua-main'
    main.appendChild(this._renderTopbar())
    var content = document.createElement('div')
    content.className = 'pua-content'
    main.appendChild(content)
    layout.appendChild(main)

    // Sidebar mask (mobile overlay)
    var sidebarMask = document.createElement('div')
    sidebarMask.className = 'pua-sidebar-mask'
    sidebarMask.addEventListener('click', function() { self._toggleSidebar() })
    root.appendChild(sidebarMask)

    // Modal overlay — 必须包含内部结构
    var overlay = document.createElement('div')
    overlay.className = 'pua-modal-overlay'
    overlay.innerHTML = '<div class="pua-modal"><div class="pua-modal-header"><div class="pua-modal-title"></div><button class="pua-modal-close">&times;</button></div><div class="pua-modal-body"></div></div>'
    overlay.querySelector('.pua-modal-close').addEventListener('click', function() { self._closeModal() })
    overlay.addEventListener('click', function(e) { if (e.target === overlay) self._closeModal() })
    root.appendChild(overlay)

    // Toast
    var toast = document.createElement('div')
    toast.className = 'pua-toast'
    root.appendChild(toast)

    // 日志面板
    var logPanel = document.createElement('div')
    logPanel.className = 'pua-log-panel'
    var logToolbar = document.createElement('div')
    logToolbar.className = 'pua-log-toolbar'
    logToolbar.innerHTML = '<span>\u63A7\u5236\u53F0</span>'
    var logBtns = document.createElement('div')
    logBtns.className = 'pua-log-toolbar-btns'
    // Filter buttons
    var filterAll = document.createElement('button')
    filterAll.textContent = '\u5168\u90E8'
    filterAll.className = 'active'
    filterAll.setAttribute('data-filter', 'all')
    var filterErr = document.createElement('button')
    filterErr.textContent = '\u9519\u8BEF'
    filterErr.setAttribute('data-filter', 'error')
    var filterWarn = document.createElement('button')
    filterWarn.textContent = '\u8B66\u544A'
    filterWarn.setAttribute('data-filter', 'warn')
    var filterPUA = document.createElement('button')
    filterPUA.textContent = 'PUA'
    filterPUA.setAttribute('data-filter', 'pua')
    // Search input
    var searchInput = document.createElement('input')
    searchInput.className = 'pua-log-search'
    searchInput.placeholder = '\u641C\u7D22...'
    searchInput.type = 'text'
    // Action buttons
    var copyBtn = document.createElement('button')
    copyBtn.textContent = '\u590D\u5236'
    copyBtn.addEventListener('click', function() { self._copyLogs() })
    var exportBtn = document.createElement('button')
    exportBtn.textContent = '\u5BFC\u51FA'
    exportBtn.addEventListener('click', function() { self._exportLogs() })
    var clearBtn = document.createElement('button')
    clearBtn.textContent = '\u6E05\u9664'
    clearBtn.addEventListener('click', function() { self._clearLogs() })
    logBtns.appendChild(filterAll)
    logBtns.appendChild(filterErr)
    logBtns.appendChild(filterWarn)
    logBtns.appendChild(filterPUA)
    logBtns.appendChild(searchInput)
    logBtns.appendChild(copyBtn)
    logBtns.appendChild(exportBtn)
    logBtns.appendChild(clearBtn)
    logToolbar.appendChild(logBtns)
    logPanel.appendChild(logToolbar)
    var logList = document.createElement('div')
    logList.className = 'pua-log-list'
    logPanel.appendChild(logList)
    root.appendChild(logPanel)

    // Filter and search logic
    var activeFilter = 'all'
    function applyLogFilter() {
      var entries = logList.querySelectorAll('.pua-log-entry')
      var keyword = searchInput.value.trim().toLowerCase()
      for (var ei = 0; ei < entries.length; ei++) {
        var entry = entries[ei]
        var text = (entry.textContent || '').toLowerCase()
        var level = entry.className.replace('pua-log-entry', '').trim().split(' ')[0]
        var show = true
        if (activeFilter === 'error' && level !== 'error') show = false
        if (activeFilter === 'warn' && level !== 'error' && level !== 'warn') show = false
        if (activeFilter === 'pua' && text.indexOf('[pua]') < 0) show = false
        if (keyword && text.indexOf(keyword) < 0) show = false
        if (show) { entry.classList.remove('hidden') } else { entry.classList.add('hidden') }
      }
    }
    var filterBtns = [filterAll, filterErr, filterWarn, filterPUA]
    for (var fbi = 0; fbi < filterBtns.length; fbi++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          activeFilter = btn.getAttribute('data-filter')
          for (var j = 0; j < filterBtns.length; j++) filterBtns[j].classList.remove('active')
          btn.classList.add('active')
          applyLogFilter()
        })
      })(filterBtns[fbi])
    }
    searchInput.addEventListener('input', function() { applyLogFilter() })

    // 日志切换按钮
    var logToggle = document.createElement('div')
    logToggle.className = 'pua-log-toggle'
    logToggle.title = '\u63A7\u5236\u53F0'
    logToggle.textContent = '>_'
    logToggle.addEventListener('click', function() { self._toggleLogPanel() })
    var logCount = document.createElement('div')
    logCount.className = 'pua-log-count'
    logCount.style.display = 'none'
    logToggle.appendChild(logCount)
    root.appendChild(logToggle)

    // 悬浮球
    root.appendChild(this._renderFloatingBall())

    // 界面适配：注入安全区域 CSS 变量
    var _settings = this._loadSettings()
    var _safeTop = _settings.safeTop != null ? _settings.safeTop + 'px' : 'env(safe-area-inset-top, 0px)'
    var _safeBottom = _settings.safeBottom != null ? _settings.safeBottom + 'px' : 'env(safe-area-inset-bottom, 0px)'
    root.style.setProperty('--pua-safe-top', _safeTop)
    root.style.setProperty('--pua-safe-bottom', _safeBottom)

    c.appendChild(root)

    // 存储关键元素引用（不再依赖 document.getElementById）
    this._modalOverlay = overlay
    this._toastEl = toast
    this._sidebarEl = layout.querySelector('.pua-sidebar')
    this._sidebarMask = sidebarMask
    this._contentEl = content
    this._titleEl = root.querySelector('.pua-topbar-title')
    this._actionsEl = root.querySelector('.pua-topbar-actions')
    this._logPanel = logPanel
    this._logList = logList
    this._logToggle = logToggle
    this._logCount = logCount

    // 填充已有日志
    this._refreshLogList()

    // Render page content
    this._renderPage()

    // Restore scroll positions after DOM rebuild
    if (savedScrolls.convChat !== undefined) {
      var newChatEl = this._contentEl ? this._contentEl.querySelector('#conv-chat') : null
      if (newChatEl) newChatEl.scrollTop = savedScrolls.convChat
    }
    if (savedScrolls.presetList !== undefined) {
      var newPresetList = this._contentEl ? this._contentEl.querySelector('#pua-preset-list') : null
      if (newPresetList) newPresetList.scrollTop = savedScrolls.presetList
    }
    if (savedScrolls.regexList !== undefined) {
      var newRegexList = this._contentEl ? this._contentEl.querySelector('#pua-regex-list') : null
      if (newRegexList) newRegexList.scrollTop = savedScrolls.regexList
    }

    // 调试日志
    if (this._originalConsole && this._originalConsole.log) {
      this._originalConsole.log('[PUA] render #' + renderId + ' page=' + this.currentPage)
    }

    } catch(e) {
      // 全局渲染错误保护
      try {
        c.innerHTML = '<div style="padding:20px;color:#ff6b6b;font-size:14px;max-width:600px;margin:40px auto">'
          + '<h3 style="color:#ff6b6b">\u274C \u6E32\u67D3\u9519\u8BEF</h3>'
          + '<p>' + (e.message || String(e)) + '</p>'
          + '<p style="font-size:11px;color:#999;margin-top:10px">' + (e.stack || '').substring(0, 500) + '</p>'
          + '<button onclick="localStorage.removeItem(\'pua-mem-data\');location.reload()" style="margin-top:10px;padding:8px 16px;background:#ff6b6b;color:#fff;border:none;border-radius:4px;cursor:pointer">\u6E05\u9664\u8BB0\u5FC6\u6570\u636E\u5E76\u91CD\u8BD5</button>'
          + '</div>'
      } catch(e2) {
        c.innerHTML = '<div style="padding:20px;color:#ff6b6b">\u4E25\u91CD\u9519\u8BEF: ' + (e2.message || '') + '</div>'
      }
    } finally {
      this._rendering = false
    }
  }

  P._renderSidebar = function() {
    var self = this
    var sidebar = document.createElement('div')
    sidebar.className = 'pua-sidebar'

    // Brand
    var brand = document.createElement('div')
    brand.className = 'pua-sidebar-brand'
    brand.innerHTML = '<h1>\u5E73\u884C\u65F6\u7A7A</h1><p>Parallel Universe</p>'
    sidebar.appendChild(brand)

    // Nav
    var nav = document.createElement('div')
    nav.className = 'pua-nav'

    var pages = [
      { id: 'branches', icon: '\u2606', label: '\u5206\u652F\u5B58\u6863', badge: this.branches.length },
      { id: 'presets', icon: '\u270E', label: '\u9884\u8BBE\u7F16\u8F91\u5668' },
      { id: 'regex', icon: '\u2733', label: '\u6B63\u5219\u7BA1\u7406', badge: this.regexes.length },
      { id: 'assembly', icon: '\u2699', label: '\u4E0A\u4E0B\u6587\u7EC4\u88C5', badge: this.asmBranchId ? 1 : 0 },
      { id: 'memory', icon: '\u263D', label: '\u8BB0\u5FC6\u7CFB\u7EDF' },
      { id: 'chat', icon: '\u2709', label: '\u5BF9\u8BDD', badge: 0 },
      { id: 'favorites', icon: '\u271A', label: '\u6536\u85CF', badge: 0 },
      { id: 'theme', icon: '\u25C8', label: '\u7F8E\u5316', badge: 0 },
      { id: 'assistant', icon: '\u2731', label: '\u52A9\u624B', badge: 0 },
      { id: 'settings', icon: '\u2691', label: '\u8BBE\u7F6E' },
    ]

    pages.forEach(function(pg) {
      var item = document.createElement('div')
      item.className = 'pua-nav-item' + (pg.id === self.currentPage ? ' active' : '')
      item.setAttribute('data-page', pg.id)
      item.innerHTML = '<span class="pua-nav-icon">' + pg.icon + '</span>' + pg.label
      if (pg.badge) item.innerHTML += '<span class="pua-nav-badge">' + pg.badge + '</span>'
      item.addEventListener('click', function() {
        self.currentPage = pg.id
        self._render()
      })
      nav.appendChild(item)
    })
    sidebar.appendChild(nav)

    // Footer
    var footer = document.createElement('div')
    footer.className = 'pua-sidebar-footer'
    footer.innerHTML = '<span>\u6697/\u4EAE</span>'
    var toggle = document.createElement('button')
    toggle.className = 'pua-theme-toggle'
    toggle.addEventListener('click', function() {
      self.theme = self.theme === 'dark' ? 'light' : 'dark'
      self._render()
    })
    footer.appendChild(toggle)
    sidebar.appendChild(footer)

    return sidebar
  }

  P._renderTopbar = function() {
    var self = this
    var topbar = document.createElement('div')
    topbar.className = 'pua-topbar'

    var leftArea = document.createElement('div')
    leftArea.style.cssText = 'display:flex;align-items:center;gap:8px'

    var menuBtn = document.createElement('button')
    menuBtn.className = 'pua-sidebar-open-btn'
    menuBtn.textContent = '\u2630'
    menuBtn.title = '\u83DC\u5355'
    menuBtn.addEventListener('click', function() { self._toggleSidebar() })
    leftArea.appendChild(menuBtn)

    var backBtn = document.createElement('button')
    backBtn.className = 'pua-back-btn'
    backBtn.textContent = '\u2190'
    backBtn.title = '\u8FD4\u56DE'
    backBtn.addEventListener('click', function() {
      if (self.roche && self.roche.ui) self.roche.ui.closeApp()
    })
    leftArea.appendChild(backBtn)

    var title = document.createElement('div')
    title.className = 'pua-topbar-title'
    leftArea.appendChild(title)
    topbar.appendChild(leftArea)

    var actions = document.createElement('div')
    actions.className = 'pua-topbar-actions'
    topbar.appendChild(actions)

    // Theme toggle in topbar (always visible, even on mobile)
    var themeBtn = document.createElement('button')
    themeBtn.className = 'pua-theme-topbar-btn'
    themeBtn.title = '切换日夜模式'
    themeBtn.textContent = this.theme === 'dark' ? '☀️' : '🌙'
    themeBtn.addEventListener('click', function() {
      self.theme = self.theme === 'dark' ? 'light' : 'dark'
      themeBtn.textContent = self.theme === 'dark' ? '☀️' : '🌙'
      self._render()
    })
    topbar.appendChild(themeBtn)

    return topbar
  }

  /* ════════════════════════════════════════════════════════════
     页面路由
     ════════════════════════════════════════════════════════════ */

  P._renderPage = function() {
    var titleEl = this._titleEl
    var actionsEl = this._actionsEl
    var contentEl = this._contentEl
    if (!titleEl || !contentEl) return

    // 切换页面时清除记忆缓存，防止旧数据
    this._memDataCache = null
    this._memDataCacheKey = null

    switch (this.currentPage) {
      case 'branches': this._renderBranches(titleEl, actionsEl, contentEl); break
      case 'presets': this._renderPresets(titleEl, actionsEl, contentEl); break
      case 'regex': this._renderRegexes(titleEl, actionsEl, contentEl); break
      case 'assembly': this._renderAssembly(titleEl, actionsEl, contentEl); break
      case 'memory': this._renderMemory(titleEl, actionsEl, contentEl); break
      case 'chat': this._renderConversation(titleEl, actionsEl, contentEl); break
      case 'favorites': this._renderFavorites(titleEl, actionsEl, contentEl); break
      case 'theme': this._renderTheme(titleEl, actionsEl, contentEl); break
      case 'assistant': this._renderAssistant(titleEl, actionsEl, contentEl); break
      case 'settings': this._renderSettings(titleEl, actionsEl, contentEl); break
    }
  }

  /* ════════════════════════════════════════════════════════════
     分支存档页面
     ════════════════════════════════════════════════════════════ */

  P._renderBranches = function(titleEl, actionsEl, contentEl) {
    var self = this
    var savedScrollTop = contentEl.scrollTop
    titleEl.textContent = '\u5206\u652F\u5B58\u6863'
    actionsEl.innerHTML = ''

    var createBtn = document.createElement('button')
    createBtn.className = 'pua-btn pua-btn-gold'
    createBtn.textContent = '+ \u4ECE\u5F53\u524D\u5BF9\u8BDD\u521B\u5EFA'
    createBtn.addEventListener('click', function() { self._showCreateBranchModal() })
    actionsEl.appendChild(createBtn)

    var importBtn = document.createElement('button')
    importBtn.className = 'pua-btn'
    importBtn.textContent = '\u5BFC\u5165\u7EBF\u4E0B\u8BB0\u5F55'
    importBtn.addEventListener('click', function() { self._showImportModal() })
    actionsEl.appendChild(importBtn)

    // 按char分组
    var groups = {}
    this.branches.forEach(function(b) {
      var key = b.charId || 'unknown'
      if (!groups[key]) groups[key] = { charId: b.charId, charName: b.charName, avatar: b.charAvatar || '', branches: [] }
      groups[key].branches.push(b)
    })

    if (Object.keys(groups).length === 0) {
      contentEl.innerHTML = '<div class="pua-empty"><div class="pua-empty-icon">\u2606</div><div class="pua-empty-text">\u8FD8\u6CA1\u6709\u5206\u652F\u5B58\u6863\uFF0C\u70B9\u51FB\u53F3\u4E0A\u89D2\u521B\u5EFA\u7B2C\u4E00\u4E2A</div></div>'
      return
    }

    contentEl.innerHTML = ''
    var groupKeys = Object.keys(groups)
    groupKeys.forEach(function(key) {
      var g = groups[key]
      var group = document.createElement('div')
      group.className = 'pua-char-group'

      // Group header
      var header = document.createElement('div')
      header.className = 'pua-char-group-header'
      var avatar = document.createElement('div')
      avatar.className = 'pua-char-avatar'
      if (g.avatar) {
        var img = document.createElement('img')
        img.src = g.avatar
        avatar.appendChild(img)
      } else {
        avatar.textContent = g.charName ? g.charName.charAt(0) : '?'
      }
      header.appendChild(avatar)
      var name = document.createElement('div')
      name.className = 'pua-char-group-name'
      name.textContent = g.charName || '\u672A\u77E5\u89D2\u8272'
      header.appendChild(name)
      var count = document.createElement('div')
      count.className = 'pua-char-group-count'
      count.textContent = g.branches.length + ' \u4E2A\u5B58\u6863'
      header.appendChild(count)
      group.appendChild(header)

      // Branch cards
      var grid = document.createElement('div')
      grid.className = 'pua-branch-grid'
      g.branches.forEach(function(b) {
        var card = document.createElement('div')
        card.className = 'pua-glass pua-branch-card'
        card.addEventListener('click', function() { self._openBranch(b.id) })

        var bName = document.createElement('div')
        bName.className = 'pua-branch-name'
        bName.textContent = b.name
        card.appendChild(bName)

        var meta = document.createElement('div')
        meta.className = 'pua-branch-meta'
        var metaHtml = '<span>\u6D88\u606F: ' + (b.msgCount || 0) + ' \u6761</span><span>\u521B\u5EFA: ' + (b.createdAt || '-') + '</span>'
        if (b.userPersona && b.userPersona.name) {
          metaHtml += '<span>\u4EBA\u8BBE: ' + self._escHtml(b.userPersona.name) + '</span>'
        }
        meta.innerHTML = metaHtml
        card.appendChild(meta)

        if (b.tags && b.tags.length) {
          var tags = document.createElement('div')
          tags.className = 'pua-branch-tags'
          // 来源标签
          var srcTag = document.createElement('span')
          if (b.source === 'fork') {
            srcTag.className = 'pua-tag pua-tag-preset'
            srcTag.textContent = '\u5206\u652F'
          } else {
            srcTag.className = 'pua-tag ' + (b.source === 'offline' ? 'pua-tag-offline' : 'pua-tag-online')
            srcTag.textContent = b.source === 'offline' ? '\u7EBF\u4E0B' : '\u7EBF\u4E0A'
          }
          tags.appendChild(srcTag)
          b.tags.forEach(function(t) {
            var tag = document.createElement('span')
            tag.className = 'pua-tag'
            if (t.indexOf('\u9884\u8BBE') >= 0) tag.className += ' pua-tag-preset'
            else if (t.indexOf('\u8BB0\u5FC6') >= 0) tag.className += ' pua-tag-mem'
            else tag.className += ' pua-tag-char'
            tag.textContent = t
            tags.appendChild(tag)
          })
          card.appendChild(tags)
        } else if (b.source) {
          var tags = document.createElement('div')
          tags.className = 'pua-branch-tags'
          var srcTag = document.createElement('span')
          if (b.source === 'fork') {
            srcTag.className = 'pua-tag pua-tag-preset'
            srcTag.textContent = '\u5206\u652F'
          } else {
            srcTag.className = 'pua-tag ' + (b.source === 'offline' ? 'pua-tag-offline' : 'pua-tag-online')
            srcTag.textContent = b.source === 'offline' ? '\u7EBF\u4E0B' : '\u7EBF\u4E0A'
          }
          tags.appendChild(srcTag)
          card.appendChild(tags)
        }

        grid.appendChild(card)
      })
      group.appendChild(grid)
      contentEl.appendChild(group)
    })
    contentEl.scrollTop = savedScrollTop
  }

  /* ── 创建分支对话框 ── */
  P._showCreateBranchModal = function() {
    console.log('[PUA] _showCreateBranchModal called')
    var self = this
    var modal = this._modalOverlay
    if (!modal) {
      console.warn('[PUA] modal overlay not found')
      return
    }

    // 先渲染模态框，再异步填充角色信息
    var body = ''

    // 分支名称
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">\u5206\u652F\u540D\u79F0</div>'
    body += '<input class="pua-field-input" id="pua-branch-name" placeholder="\u7ED9\u8FD9\u4E2A\u5206\u652F\u8D77\u4E2A\u540D\u5B57..." value="">'
    body += '</div>'

    // 来源角色 — 下拉选择
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">\u6765\u6E90\u89D2\u8272 / \u4F1A\u8BDD</div>'
    body += '<select class="pua-field-input pua-field-select" id="pua-branch-char">'
    body += '<option value="">\u52A0\u8F7D\u4E2D...</option>'
    body += '</select>'
    body += '<div class="pua-field-hint">\u9009\u62E9\u8981\u521B\u5EFA\u5206\u652F\u7684\u89D2\u8272\u6216\u7FA4\u804A</div>'
    body += '</div>'

    // 用户人设/面具
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">\u7528\u6237\u4EBA\u8BBE/\u9762\u5177</div>'
    body += '<select class="pua-field-input pua-field-select" id="pua-branch-persona">'
    body += '<option value="">\u9ED8\u8BA4</option>'
    body += '</select>'
    body += '</div>'

    // 上下文深度
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">\u83B7\u53D6\u4E0A\u4E0B\u6587\u6DF1\u5EA6</div>'
    body += '<input class="pua-field-input" type="number" id="pua-branch-depth" value="50" min="1" max="200">'
    body += '<div class="pua-field-hint">\u4ECE\u5F53\u524D\u5BF9\u8BDD\u83B7\u53D6\u6700\u8FD1N\u6761\u6D88\u606F\uFF08\u6700\u5927200\uFF09</div>'
    body += '</div>'

    // 标签
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">\u6807\u7B7E\uFF08\u9017\u53F7\u5206\u9694\uFF09</div>'
    body += '<input class="pua-field-input" id="pua-branch-tags" placeholder="\u5173\u952E\u6296\u62E9, \u756A\u5916, ...">'
    body += '</div>'

    // 记忆获取选项
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">\u8BB0\u5FC6\u83B7\u53D6</div>'
    body += '<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--pua-text-sub);margin-bottom:4px">'
    body += '<input type="checkbox" id="pua-branch-mem-short" checked> \u4E0A\u4E0B\u6587\u8BB0\u5FC6\uFF08\u77ED\u671F\uFF09</label>'
    body += '<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--pua-text-sub);margin-bottom:4px">'
    body += '<input type="checkbox" id="pua-branch-mem-long" checked> \u4E8B\u5B9E\u8BB0\u5FC6 + \u6838\u5FC3\u8BB0\u5FC6\uFF08\u957F\u671F\uFF09</label>'
    body += '</div>'

    var modalBody = modal.querySelector('.pua-modal-body')
    if (!modalBody) {
      console.warn('[PUA] modal body not found')
      return
    }
    modalBody.innerHTML = body

    // 绑定选择变化事件
    var selectEl = modal.querySelector('#pua-branch-char')
    if (selectEl) {
      selectEl.addEventListener('change', function() { self._onCharSelect() })
    }

    var modalTitle = modal.querySelector('.pua-modal-title')
    if (modalTitle) modalTitle.textContent = '\u521B\u5EFA\u5206\u652F\u5B58\u6863'

    // Footer buttons
    var footer = modal.querySelector('.pua-modal-footer')
    if (footer) footer.remove()
    footer = document.createElement('div')
    footer.className = 'pua-modal-footer'

    var cancelBtn = document.createElement('button')
    cancelBtn.className = 'pua-btn'
    cancelBtn.textContent = '\u53D6\u6D88'
    cancelBtn.addEventListener('click', function() { self._closeModal() })

    var createBtn = document.createElement('button')
    createBtn.className = 'pua-btn pua-btn-gold'
    createBtn.textContent = '\u521B\u5EFA'
    createBtn.addEventListener('click', function() { self._doCreateBranch() })

    footer.appendChild(cancelBtn)
    footer.appendChild(createBtn)

    var modalInner = modal.querySelector('.pua-modal')
    if (modalInner) modalInner.appendChild(footer)

    modal.classList.add('show')

    // 异步获取所有角色和会话列表
    this._loadCharOptions()
  }

  /* ── 加载角色选择器选项 ── */
  P._loadCharOptions = function() {
    var self = this
    var modal = this._modalOverlay
    var selectEl = modal ? modal.querySelector('#pua-branch-char') : null
    if (!selectEl) return

    console.log('[PUA] _loadCharOptions: fetching character list...')

    // 先清空加载中
    selectEl.innerHTML = '<option value="">\u52A0\u8F7D\u4E2D...</option>'

    // 收集所有选项
    var options = [] // { label, value, convId, charId, charName, charAvatar, isGroup }

    var fetchPromises = []

    // 获取角色列表
    if (this.roche && this.roche.character && this.roche.character.list) {
      fetchPromises.push(
        this.roche.character.list().then(function(chars) {
          console.log('[PUA] character.list returned ' + (chars ? chars.length : 0) + ' chars')
          if (chars && chars.length) {
            self._charList = chars
            chars.forEach(function(ch) {
              var convId = ch.conversationId || ''
              var name = ch.handle || ch.name || '\u672A\u77E5'
              options.push({
                label: ' ' + name + ' (\u5355\u804A)',
                value: 'char_' + (ch.id || ''),
                convId: convId,
                charId: ch.id || '',
                charName: name,
                charAvatar: ch.avatar || '',
                isGroup: false
              })
            })
          }
        }).catch(function(e) {
          console.warn('[PUA] character.list failed', e)
        })
      )
    }

    // 获取会话列表（群聊等）
    var convListAvailable = !!(this.roche && this.roche.conversation && this.roche.conversation.list)
    console.log('[PUA] _loadCharOptions: conversation.list available=' + convListAvailable)
    if (convListAvailable) {
      fetchPromises.push(
        this.roche.conversation.list().then(function(convs) {
          console.log('[PUA] conversation.list returned ' + (convs ? convs.length : 0) + ' convs')
          if (convs && convs.length) {
            self._convList = convs
            var groupCount = 0
            convs.forEach(function(cv) {
              var convId = cv.conversationId || cv.id || ''
              var name = cv.name || cv.handle || '\u672A\u77E5'
              var isGroup = cv.type === 'group' || cv.isGroup || (cv.members && cv.members.length > 2)
              if (isGroup) groupCount++
              console.log('[PUA] conv: name=' + name + ' cv.id=' + cv.id + ' cv.conversationId=' + cv.conversationId + ' convId=' + convId + ' isGroup=' + isGroup + ' type=' + cv.type)
              // 检查是否已存在（只跳过和角色单聊完全相同的会话）
              var dup = false
              for (var i = 0; i < options.length; i++) {
                if (options[i].convId === convId && !options[i].isGroup && !isGroup) { dup = true; break }
              }
              if (!dup && convId) {
                options.push({
                  label: (isGroup ? ' ' : ' ') + name + (isGroup ? ' (\u7FA4\u804A)' : ''),
                  value: 'conv_' + convId,
                  convId: convId,
                  charId: cv.contactId || '',
                  charName: name,
                  charAvatar: cv.avatar || '',
                  isGroup: isGroup
                })
              } else if (dup) {
                console.log('[PUA] skipped dup conv: name=' + name + ' convId=' + convId)
              } else if (!convId) {
                console.warn('[PUA] skipped conv with empty convId: name=' + name)
              }
            })
            console.log('[PUA] conversation.list: found ' + groupCount + ' group chats')
          } else {
            console.warn('[PUA] conversation.list returned empty or null')
          }
        }).catch(function(e) {
          console.warn('[PUA] conversation.list failed: ' + (e.message || e))
        })
      )
    } else {
      console.warn('[PUA] conversation.list not available, group chats will not be shown')
    }

    if (fetchPromises.length === 0) {
      selectEl.innerHTML = '<option value="">\u65E0API\u53EF\u7528</option>'
      return
    }

    Promise.all(fetchPromises).then(function() {
      console.log('[PUA] total options: ' + options.length)
      selectEl.innerHTML = ''
      if (options.length === 0) {
        selectEl.innerHTML = '<option value="">未找到任何角色或会话</option>'
        return
      }
      // 填充选项
      options.forEach(function(opt, idx) {
        var optEl = document.createElement('option')
        optEl.value = opt.value
        optEl.textContent = opt.label
        selectEl.appendChild(optEl)
      })
      // 显式设置 select 的 value 为第一个选项（避免 selected 属性不生效）
      selectEl.value = options[0].value
      // 直接设置 pending 值（不依赖_onCharSelect读select.value）
      var first = options[0]
      self._pendingConvId = first.convId || ''
      self._pendingCharId = first.charId || ''
      self._pendingCharName = first.charName || ''
      self._pendingCharAvatar = first.charAvatar || ''
      console.log('[PUA] default selected: ' + first.label + ' convId=' + self._pendingConvId + ' charId=' + self._pendingCharId)
      // 触发change事件同步
      self._onCharSelect()

      // 加载用户人设列表
      self._loadPersonaOptions()
    })
  }

  /* ── 角色选择变化时更新pending信息 ── */
  P._onCharSelect = function() {
    var modal = this._modalOverlay
    var selectEl = modal ? modal.querySelector('#pua-branch-char') : null
    if (!selectEl) return

    var selectedValue = selectEl.value || ''
    console.log('[PUA] _onCharSelect: value="' + selectedValue + '"')

    // 如果select.value为空但pending已有值，说明是初始默认设置，跳过
    if (!selectedValue && this._pendingConvId) {
      console.log('[PUA] _onCharSelect: empty value but pending already set, skip')
      return
    }
    if (!selectedValue) {
      console.warn('[PUA] _onCharSelect: empty value and no pending, nothing to do')
      return
    }

    if (selectedValue.indexOf('char_') === 0) {
      // 角色单聊
      var charId = selectedValue.replace('char_', '')
      var found = null
      for (var i = 0; i < this._charList.length; i++) {
        if (this._charList[i].id === charId) { found = this._charList[i]; break }
      }
      if (found) {
        this._pendingConvId = found.conversationId || ''
        this._pendingCharId = found.id || ''
        this._pendingCharName = found.handle || found.name || ''
        this._pendingCharAvatar = found.avatar || ''
        console.log('[PUA] selected char: ' + this._pendingCharName + ' convId=' + this._pendingConvId + ' charId=' + this._pendingCharId)
      } else {
        console.warn('[PUA] char not found in _charList for id=' + charId + ', _charList length=' + this._charList.length)
      }
    } else if (selectedValue.indexOf('conv_') === 0) {
      // 会话/群聊
      var convId = selectedValue.replace('conv_', '')
      var found = null
      for (var j = 0; j < this._convList.length; j++) {
        var cid = this._convList[j].conversationId || this._convList[j].id || ''
        if (cid === convId) { found = this._convList[j]; break }
      }
      if (found) {
        this._pendingConvId = convId
        this._pendingCharId = found.contactId || ''
        this._pendingCharName = found.name || found.handle || ''
        this._pendingCharAvatar = found.avatar || ''
        console.log('[PUA] selected conv: ' + this._pendingCharName + ' convId=' + this._pendingConvId + ' isGroup=' + (found.type === 'group'))
      } else {
        console.warn('[PUA] conv not found in _convList for id=' + convId + ', _convList length=' + this._convList.length)
      }
    }
  }

  /* ── 加载用户人设选择器选项 ── */
  P._loadPersonaOptions = function(targetId) {
    var self = this
    var modal = this._modalOverlay
    var personaId = targetId || 'pua-branch-persona'
    var personaSelect = modal ? modal.querySelector('#' + personaId) : null
    if (!personaSelect) return

    if (!this.roche || !this.roche.persona || !this.roche.persona.getUserPersonas) {
      personaSelect.innerHTML = '<option value="">\u9ED8\u8BA4</option>'
      return
    }

    this.roche.persona.getUserPersonas().then(function(personas) {
      if (!personas || !personas.length) {
        personaSelect.innerHTML = '<option value="">\u9ED8\u8BA4</option>'
        return
      }
      personaSelect.innerHTML = '<option value="">\u9ED8\u8BA4</option>'
      var activeId = ''
      for (var i = 0; i < personas.length; i++) {
        var p = personas[i]
        var optEl = document.createElement('option')
        optEl.value = p.id || ''
        optEl.textContent = p.name || ('\u4EBA\u8BBE ' + (i + 1))
        optEl.setAttribute('data-persona-name', p.name || '')
        personaSelect.appendChild(optEl)
        if (p.active || p.isDefault) activeId = p.id || ''
      }
      // 尝试获取当前激活的人设
      if (self.roche.persona.getActiveUserPersona) {
        self.roche.persona.getActiveUserPersona().then(function(active) {
          if (active && active.id) {
            personaSelect.value = active.id
          } else if (activeId) {
            personaSelect.value = activeId
          }
        }).catch(function() {
          if (activeId) personaSelect.value = activeId
        })
      } else if (activeId) {
        personaSelect.value = activeId
      }
    }).catch(function(e) {
      console.warn('[PUA] getUserPersonas failed', e)
      personaSelect.innerHTML = '<option value="">\u9ED8\u8BA4</option>'
    })
  }

  /* ── 从当前进度新建分支（Fork） ── */
  P._showForkBranchModal = function() {
    var branch = null
    for (var i = 0; i < this.branches.length; i++) {
      if (this.branches[i].id === this._convBranchId) { branch = this.branches[i]; break }
    }
    if (!branch) {
      this._toast('请先选择一个分支')
      return
    }
    var defaultName = branch.name ? (branch.name + ' - 分支') : '新分支'
    var body = '<div class="pua-field">'
    body += '<div class="pua-field-label">新分支名称</div>'
    body += '<input class="pua-field-input" id="fork-branch-name" value="' + this._escHtml(defaultName) + '" style="width:100%">'
    body += '</div>'
    body += '<div style="font-size:10px;color:var(--pua-text-dim);margin-top:8px">'
    body += '将从「' + this._escHtml(branch.name || '未命名') + '」的当前进度创建新分支，继承所有对话和记忆数据。之后两个分支独立互不影响。'
    body += '</div>'
    this._openModal('新建分支', body)
    var self = this
    var modal = this._modalOverlay
    var nameInput = modal ? modal.querySelector('#fork-branch-name') : null
    if (nameInput) {
      nameInput.focus()
      nameInput.select()
    }
    var modalInner = modal ? modal.querySelector('.pua-modal') : null
    if (modalInner) {
      var oldFooter = modalInner.querySelector('.pua-modal-footer')
      if (oldFooter) oldFooter.remove()
      var footer = document.createElement('div')
      footer.className = 'pua-modal-footer'
      var confirmBtn = document.createElement('button')
      confirmBtn.className = 'pua-btn pua-btn-gold'
      confirmBtn.textContent = '创建分支'
      confirmBtn.addEventListener('click', function() {
        var newName = nameInput ? nameInput.value.trim() : ''
        if (!newName) { self._toast('请输入分支名称'); return }
        self._closeModal()
        self._forkBranch(newName)
      })
      var cancelBtn = document.createElement('button')
      cancelBtn.className = 'pua-btn'
      cancelBtn.textContent = '取消'
      cancelBtn.addEventListener('click', function() { self._closeModal() })
      footer.appendChild(cancelBtn)
      footer.appendChild(confirmBtn)
      modalInner.appendChild(footer)
    }
  }

  P._forkBranch = function(name) {
    var sourceBranch = null
    for (var i = 0; i < this.branches.length; i++) {
      if (this.branches[i].id === this._convBranchId) { sourceBranch = this.branches[i]; break }
    }
    if (!sourceBranch) {
      this._toast('未找到当前分支')
      return
    }
    // 深拷贝消息和长期记忆
    var clonedMessages = JSON.parse(JSON.stringify(sourceBranch.messages || []))
    var clonedLongTerm = sourceBranch.longTermMemory ? JSON.parse(JSON.stringify(sourceBranch.longTermMemory)) : null
    var clonedMountedWorldbooks = sourceBranch.mountedWorldbooks ? JSON.parse(JSON.stringify(sourceBranch.mountedWorldbooks)) : { global: true, local: {} }
    var clonedMemoryConvIds = (sourceBranch.memoryConvIds || []).slice()
    var clonedSelectedCharIds = (sourceBranch.selectedCharIds || []).slice()
    var clonedMountedSources = (sourceBranch.mountedSources || []).slice()
    var clonedTags = (sourceBranch.tags || []).slice()

    var newBranch = {
      id: 'b' + Date.now(),
      name: name,
      charId: sourceBranch.charId,
      charName: sourceBranch.charName,
      charAvatar: sourceBranch.charAvatar,
      sourceConvId: sourceBranch.sourceConvId,
      source: 'fork',
      forkedFrom: sourceBranch.id,
      msgCount: clonedMessages.length,
      createdAt: new Date().toLocaleString('zh-CN'),
      tags: clonedTags,
      contextDepth: sourceBranch.contextDepth,
      longTermMemory: clonedLongTerm,
      messages: clonedMessages,
      userPersona: sourceBranch.userPersona ? JSON.parse(JSON.stringify(sourceBranch.userPersona)) : null,
      mountedSources: clonedMountedSources,
      memoryConvIds: clonedMemoryConvIds,
      mountedWorldbooks: clonedMountedWorldbooks,
      selectedCharIds: clonedSelectedCharIds
    }
    this.branches.push(newBranch)
    this._saveBranches()
    // 复制对话页面的消息到新分支的 localStorage key
    try {
      localStorage.setItem('pua_conv_' + newBranch.id, JSON.stringify(this._convMessages.slice()))
    } catch(e) {}
    // 自动切换到新分支
    this._convBranchId = newBranch.id
    this._toast('已创建分支: ' + name)
    this._render()
    console.log('[PUA] _forkBranch: created fork branch id=' + newBranch.id + ' from id=' + sourceBranch.id)
  }

  /* ── 执行创建分支 ── */
  P._doCreateBranch = function() {
    console.log('[PUA] _doCreateBranch called')
    var self = this
    var modal = this._modalOverlay

    // 优先从modal内部查找，备选从document查找
    var nameInput = null
    var depthInput = null
    var tagsInput = null
    var memShortCheck = null
    var memLongCheck = null

    if (modal) {
      nameInput = modal.querySelector('#pua-branch-name')
      depthInput = modal.querySelector('#pua-branch-depth')
      tagsInput = modal.querySelector('#pua-branch-tags')
      memShortCheck = modal.querySelector('#pua-branch-mem-short')
      memLongCheck = modal.querySelector('#pua-branch-mem-long')
    }

    var branchName = nameInput ? nameInput.value.trim() : ''
    var depth = depthInput ? parseInt(depthInput.value) || 50 : 50
    var tagsStr = tagsInput ? tagsInput.value.trim() : ''
    var getShort = memShortCheck ? memShortCheck.checked : true
    var getLong = memLongCheck ? memLongCheck.checked : true

    // 使用异步获取的对话信息
    var convId = this._pendingConvId || ''
    var charId = this._pendingCharId || ''
    var charName = this._pendingCharName || ''
    var charAvatar = this._pendingCharAvatar || ''

    // 读取选中的用户人设
    var personaSelect = modal ? modal.querySelector('#pua-branch-persona') : null
    var userPersona = null
    if (personaSelect && personaSelect.value) {
      var personaOpt = personaSelect.options[personaSelect.selectedIndex]
      userPersona = {
        id: personaSelect.value,
        name: personaOpt ? (personaOpt.getAttribute('data-persona-name') || personaOpt.textContent || '') : ''
      }
    }

    console.log('[PUA] _doCreateBranch: convId=' + convId + ' charId=' + charId + ' charName=' + charName + ' depth=' + depth + ' getShort=' + getShort + ' getLong=' + getLong)

    if (!branchName) {
      branchName = '\u5206\u652F \u00B7 ' + new Date().toLocaleString('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' })
    }

    var tags = tagsStr ? tagsStr.split(/[,，]/).map(function(t) { return t.trim() }).filter(function(t) { return t }) : []

    var branch = {
      id: 'b' + Date.now(),
      name: branchName,
      charId: charId,
      charName: charName,
      charAvatar: charAvatar,
      sourceConvId: convId,
      source: 'online',
      msgCount: 0,
      createdAt: new Date().toLocaleString('zh-CN'),
      tags: tags,
      contextDepth: depth,
      longTermMemory: null,
      messages: [],
      userPersona: userPersona,
      mountedSources: [],
      memoryConvIds: convId ? [convId] : [],
      mountedWorldbooks: { global: true, local: {} },
      selectedCharIds: charId ? [charId] : []
    }

    // 获取记忆
    var promises = []

    if (getShort && this.roche && this.roche.memory && convId) {
      console.log('[PUA] getShortTerm: convId=' + convId + ' depth=' + depth)
      promises.push(
        this.roche.memory.getShortTerm({ conversationId: convId, limit: depth }).then(function(data) {
          if (data) {
            var msgs = data.messages || data
            if (Array.isArray(msgs)) {
              branch.messages = msgs
              branch.msgCount = msgs.length
            }
            console.log('[PUA] getShortTerm OK: ' + branch.msgCount + ' messages, first=' + (msgs.length > 0 ? JSON.stringify(msgs[0]).substring(0, 80) : 'none') + ' dataKeys=' + Object.keys(data).join(','))
          } else {
            console.warn('[PUA] getShortTerm returned empty data')
          }
          return data
        }).catch(function(e) { console.warn('[PUA] getShortTerm failed', e) })
      )
    }

    if (getLong && this.roche && this.roche.memory && convId) {
      console.log('[PUA] getLongTerm: convId=' + convId)
      promises.push(
        this.roche.memory.getLongTerm({ conversationId: convId }).then(function(data) {
          if (data) {
            branch.longTermMemory = data
            console.log('[PUA] getLongTerm OK: dataKeys=' + Object.keys(data).join(','))
          } else {
            console.warn('[PUA] getLongTerm returned empty data')
          }
          return data
        }).catch(function(e) { console.warn('[PUA] getLongTerm failed', e) })
      )
    }

    // 尝试获取会话的挂载信息
    if (self.roche.conversation && self.roche.conversation.get && convId) {
      promises.push(
        self.roche.conversation.get(convId).then(function(conv) {
          if (conv && conv.mountedMemorySources) {
            branch.mountedSources = conv.mountedMemorySources
          }
          // 群聊：提取所有成员的角色 ID 到 selectedCharIds
          if (conv && conv.members && Array.isArray(conv.members) && conv.members.length > 0) {
            var memberIds = []
            for (var mi = 0; mi < conv.members.length; mi++) {
              var m = conv.members[mi]
              var memberId = m.id || m.charId || m.characterId || (typeof m === 'string' ? m : '')
              if (memberId && memberIds.indexOf(memberId) === -1) memberIds.push(memberId)
            }
            if (memberIds.length > 0) {
              // 确保主角色也在列表中
              if (branch.charId && memberIds.indexOf(branch.charId) === -1) {
                memberIds.unshift(branch.charId)
              }
              branch.selectedCharIds = memberIds
              console.log('[PUA] _doCreateBranch: group chat detected, selectedCharIds=' + JSON.stringify(memberIds))
            }
          }
        }).catch(function() {})
      )
    }

    if (promises.length === 0) {
      self.branches.push(branch)
      self._saveBranches()
      self._closeModal()
      self._toast('\u5206\u652F\u521B\u5EFA\u6210\u529F\uFF08\u672A\u83B7\u53D6\u8BB0\u5FC6\uFF09')
      self._render()
      return
    }

    // 显示加载
    this._toast('\u6B63\u5728\u83B7\u53D6\u8BB0\u5FC6...')

    Promise.all(promises).then(function() {
      self.branches.push(branch)
      self._saveBranches()
      self._closeModal()
      console.log('[PUA] branch created: id=' + branch.id + ' name=' + branch.name + ' convId=' + branch.sourceConvId + ' charId=' + branch.charId + ' msgs=' + branch.msgCount)
      self._toast('\u5206\u652F\u521B\u5EFA\u6210\u529F\uFF01\u5DF2\u83B7\u53D6 ' + branch.msgCount + ' \u6761\u6D88\u606F')
      self._render()
    }).catch(function(e) {
      console.error('[PUA] create branch failed', e)
      self.branches.push(branch)
      self._saveBranches()
      self._closeModal()
      self._toast('\u5206\u652F\u5DF2\u521B\u5EFA\uFF0C\u4F46\u8BB0\u5FC6\u83B7\u53D6\u53EF\u80FD\u4E0D\u5B8C\u6574')
      self._render()
    })
  }

  /* ── 打开分支 ── */
  P._openBranch = function(branchId) {
    console.log('[PUA] _openBranch called, id=' + branchId)
    var self = this
    var branch = null
    for (var i = 0; i < this.branches.length; i++) {
      if (this.branches[i].id === branchId) { branch = this.branches[i]; break }
    }
    if (!branch) return

    var modal = this._modalOverlay
    if (!modal) {
      console.warn('[PUA] modal overlay not found in _openBranch')
      return
    }

    var body = '<div style="margin-bottom:12px">'
    body += '<div style="font-size:14px;font-weight:700;color:var(--pua-accent-text);margin-bottom:8px">' + this._escHtml(branch.name) + '</div>'
    body += '<div style="font-size:11px;color:var(--pua-text-dim);display:flex;flex-direction:column;gap:2px">'
    body += '<span>\u89D2\u8272: ' + this._escHtml(branch.charName || '\u672A\u77E5') + '</span>'
    body += '<span>\u6D88\u606F: ' + branch.msgCount + ' \u6761</span>'
    body += '<span>\u521B\u5EFA: ' + this._escHtml(branch.createdAt || '-') + '</span>'
    body += '<span>\u6765\u6E90: ' + (branch.source === 'offline' ? '\u7EBF\u4E0B\u8BB0\u5F55' : branch.source === 'fork' ? '\u5206\u652F\u5F00\u65B0' : '\u7EBF\u4E0A\u5BF9\u8BDD') + '</span>'
    if (branch.source === 'fork' && branch.forkedFrom) {
      var forkSourceName = ''
      for (var fi = 0; fi < this.branches.length; fi++) {
        if (this.branches[fi].id === branch.forkedFrom) { forkSourceName = this.branches[fi].name; break }
      }
      body += '<span>\u6E90\u5206\u652F: ' + this._escHtml(forkSourceName || branch.forkedFrom) + '</span>'
    }
    if (branch.source === 'offline' && branch.offlineMeta) {
      var om = branch.offlineMeta
      if (om.offlineSource) body += '<span>\u7C7B\u578B: ' + this._escHtml(om.offlineSource) + '</span>'
      if (om.recordTime) body += '<span>\u8BB0\u5F55\u65F6\u95F4: ' + this._escHtml(om.recordTime) + '</span>'
      if (om.fileName) body += '<span>\u6587\u4EF6: ' + this._escHtml(om.fileName) + '</span>'
    } else {
      body += '<span>\u4E0A\u4E0B\u6587\u6DF1\u5EA6: ' + (branch.contextDepth || 50) + '</span>'
    }
    body += '</div></div>'

    // 记忆概览
    if (branch.longTermMemory) {
      body += '<div style="margin-bottom:12px">'
      body += '<div style="font-size:11px;font-weight:600;color:var(--pua-accent);margin-bottom:4px">\u957F\u671F\u8BB0\u5FC6</div>'
      if (branch.longTermMemory.core) {
        var coreText = branch.longTermMemory.core.summary || branch.longTermMemory.core.text || String(branch.longTermMemory.core)
        body += '<div style="font-size:10.5px;color:var(--pua-text-sub);background:var(--pua-bg-input);border-radius:6px;padding:8px;margin-bottom:4px;max-height:80px;overflow-y:auto">'
        body += '<b>\u6838\u5FC3:</b> ' + this._escHtml(coreText.substring(0, 200))
        if (coreText.length > 200) body += '...'
        body += '</div>'
      }
      if (branch.longTermMemory.facts) {
        var factCount = Array.isArray(branch.longTermMemory.facts) ? branch.longTermMemory.facts.length : 0
        body += '<div style="font-size:10px;color:var(--pua-text-dim)">\u4E8B\u5B9E\u8BB0\u5FC6: ' + factCount + ' \u6761</div>'
      }
      if (branch.longTermMemory.vectors) {
        var vecCount = Array.isArray(branch.longTermMemory.vectors) ? branch.longTermMemory.vectors.length : 0
        if (vecCount > 0) body += '<div style="font-size:10px;color:var(--pua-text-dim)">\u5411\u91CF\u8BB0\u5FC6: ' + vecCount + ' \u6761</div>'
      }
      body += '</div>'
    }

    // 消息预览
    if (branch.messages && branch.messages.length) {
      body += '<div style="margin-bottom:12px">'
      body += '<div style="font-size:11px;font-weight:600;color:var(--pua-accent);margin-bottom:4px">\u804A\u5929\u8BB0\u5F55 (' + branch.messages.length + ' \u6761)</div>'
      if (branch.userPersona) {
        body += '<div style="font-size:9px;color:var(--pua-text-dim);margin-bottom:4px">\u7528\u6237\u4EBA\u8BBE: ' + this._escHtml(branch.userPersona.name || branch.userPersona.id) + '</div>'
      }
      body += '<div style="max-height:200px;overflow-y:auto;font-size:10.5px;line-height:1.6">'
      var previewCount = Math.min(branch.messages.length, 10)
      for (var j = branch.messages.length - previewCount; j < branch.messages.length; j++) {
        var msg = branch.messages[j]
        var roleLabel = ''
        var roleColor = ''
        if (msg.type === 'system') {
          roleLabel = 'SYS'
          roleColor = 'var(--pua-world)'
        } else if (msg.type === 'user') {
          roleLabel = 'USR'
          roleColor = 'var(--pua-user)'
        } else if (msg.type === 'assistant') {
          roleLabel = 'AST'
          roleColor = 'var(--pua-mem)'
        } else {
          // unknown or missing — show sender name directly
          roleLabel = msg.senderName || msg.senderHandle || '?'
          roleColor = 'var(--pua-chat)'
        }
        var content = (msg.text || msg.content || '').substring(0, 100)
        body += '<div style="margin-bottom:4px;padding:4px 6px;border-radius:4px;background:rgba(255,255,255,0.02)">'
        body += '<span style="color:' + roleColor + ';font-weight:600;font-size:9px">[' + this._escHtml(roleLabel) + ']</span> '
        body += '<span style="color:var(--pua-text-sub)">' + this._escHtml(content) + '</span>'
        body += '</div>'
      }
      if (branch.messages.length > 10) {
        body += '<div style="font-size:9px;color:var(--pua-text-dim);text-align:center">\u4EC5\u663E\u793A\u6700\u8FD1 10 \u6761</div>'
      }
      body += '</div></div>'
    }

    // ===== 记忆绑定配置 =====
    body += '<div class="pua-config-section">'
    body += '<div class="pua-config-section-title">\u8BB0\u5FC6\u7ED1\u5B9A</div>'
    body += '<div class="pua-config-section-desc">\u9009\u62E9\u8981\u5173\u8054\u7684\u4F1A\u8BDD\uFF0C\u83B7\u53D6\u5176\u6838\u5FC3\u8BB0\u5FC6\u548C\u4E8B\u5B9E\u8BB0\u5FC6</div>'
    body += '<div class="pua-config-section-body" id="branch-mem-list">'
    body += '<div style="text-align:center;padding:12px;color:var(--pua-text-dim);font-size:10px">\u52A0\u8F7D\u4E2D...</div>'
    body += '</div>'
    body += '<button class="pua-btn pua-btn-sm pua-config-save" id="branch-mem-save">\u4FDD\u5B58\u8BB0\u5FC6\u7ED1\u5B9A</button>'
    body += '</div>'

    // ===== 世界书挂载配置 =====
    body += '<div class="pua-config-section">'
    body += '<div class="pua-config-section-title">\u4E16\u754C\u4E66\u6302\u8F7D</div>'
    body += '<div class="pua-config-section-desc">\u5168\u5C40\u4E16\u754C\u4E66\u81EA\u52A8\u6302\u8F7D\uFF0C\u672C\u5730\u4E16\u754C\u4E66\u9700\u624B\u52A8\u9009\u62E9</div>'
    body += '<div id="branch-wb-global-item" class="pua-check-item checked">'
    body += '<div class="pua-check-box">\u2713</div>'
    body += '<span class="pua-check-icon"></span>'
    body += '<span class="pua-check-label">\u5168\u5C40\u4E16\u754C\u4E66\uFF08\u81EA\u52A8\u6302\u8F7D\uFF09</span>'
    body += '</div>'
    body += '<input type="checkbox" id="branch-wb-global" checked style="display:none">'
    body += '<div class="pua-config-section-body" id="branch-wb-local">'
    body += '<div style="text-align:center;padding:12px;color:var(--pua-text-dim);font-size:10px">\u52A0\u8F7D\u4E2D...</div>'
    body += '</div>'
    body += '<button class="pua-btn pua-btn-sm pua-config-save" id="branch-wb-save">\u4FDD\u5B58\u4E16\u754C\u4E66\u6302\u8F7D</button>'
    body += '</div>'

    // ===== 角色人设配置 =====
    body += '<div class="pua-config-section">'
    body += '<div class="pua-config-section-title">\u89D2\u8272\u4EBA\u8BBE</div>'
    body += '<div class="pua-config-section-desc">\u9009\u62E9\u8981\u5305\u542B\u7684\u89D2\u8272\u4EBA\u8BBE\uFF08\u7FA4\u804A\u9700\u624B\u52A8\u9009\u62E9\uFF09</div>'
    body += '<div class="pua-config-section-body" id="branch-char-list">'
    body += '<div style="text-align:center;padding:12px;color:var(--pua-text-dim);font-size:10px">\u52A0\u8F7D\u4E2D...</div>'
    body += '</div>'
    body += '<button class="pua-btn pua-btn-sm pua-config-save" id="branch-char-save">\u4FDD\u5B58\u89D2\u8272\u4EBA\u8BBE</button>'
    body += '</div>'

    var modalBody = modal.querySelector('.pua-modal-body')
    if (!modalBody) {
      console.warn('[PUA] modal body not found in _openBranch')
      return
    }
    modalBody.innerHTML = body

    var modalTitle = modal.querySelector('.pua-modal-title')
    if (modalTitle) modalTitle.textContent = '\u5206\u652F\u8BE6\u60C5'

    // Footer
    var footer = modal.querySelector('.pua-modal-footer')
    if (footer) footer.remove()
    footer = document.createElement('div')
    footer.className = 'pua-modal-footer'

    var closeBtn = document.createElement('button')
    closeBtn.className = 'pua-btn'
    closeBtn.textContent = '\u5173\u95ED'
    closeBtn.addEventListener('click', function() { self._closeModal() })

    var deleteBtn = document.createElement('button')
    deleteBtn.className = 'pua-btn pua-btn-danger'
    deleteBtn.textContent = '\u5220\u9664\u5206\u652F'
    deleteBtn.addEventListener('click', function() {
      self.branches = self.branches.filter(function(b) { return b.id !== branchId })
      self._saveBranches()
      self._closeModal()
      self._toast('\u5206\u652F\u5DF2\u5220\u9664')
      self._render()
    })

    var toAsmBtn = document.createElement('button')
    toAsmBtn.className = 'pua-btn pua-btn-gold'
    toAsmBtn.textContent = '\u53D1\u9001\u5230\u4E0A\u4E0B\u6587\u7EC4\u88C5'
    toAsmBtn.setAttribute('data-id', branch.id)
    toAsmBtn.addEventListener('click', function() {
      self._closeModal()
      self.asmBranchId = branch.id
      self._currentMemBranchId = branch.id
      self.currentPage = 'assembly'
      self._render()
      self._fetchAsmData()
      if (branch.memoryConvIds && branch.memoryConvIds.length > 0) {
        self._loadMemFromBranches(branch.memoryConvIds, branch.id)
      }
    })

    footer.appendChild(toAsmBtn)
    footer.appendChild(deleteBtn)
    footer.appendChild(closeBtn)

    var modalInner = modal.querySelector('.pua-modal')
    if (modalInner) modalInner.appendChild(footer)

    // ===== 异步加载会话列表（记忆绑定） =====
    if (this.roche.conversation && this.roche.conversation.list) {
      this.roche.conversation.list().then(function(convs) {
        console.log('[PUA] _openBranch: conversation.list returned ' + (convs ? convs.length : 0) + ' convs, branch.sourceConvId=' + branch.sourceConvId + ' branch.memoryConvIds=' + JSON.stringify(branch.memoryConvIds || []))
        var memList = modal.querySelector('#branch-mem-list')
        if (!memList) return
        var h = ''
        for (var i = 0; i < (convs || []).length; i++) {
          var cv = convs[i]
          var cvId = cv.conversationId || cv.id
          var cvIdAlt = cv.id || cv.conversationId  // 备选ID，兼容旧数据
          var cvName = cv.handle || cv.name || cv.title || '?'
          var isGroup = cv.isGroup || cv.type === 'group'
          var isBound = false
          for (var bi = 0; bi < (branch.memoryConvIds || []).length; bi++) {
            if (branch.memoryConvIds[bi] === cvId || branch.memoryConvIds[bi] === cvIdAlt) { isBound = true; break }
          }
          if (branch.sourceConvId === cvId || branch.sourceConvId === cvIdAlt) isBound = true
          console.log('[PUA] _openBranch: conv[' + i + '] name=' + cvName + ' cv.id=' + cv.id + ' cv.conversationId=' + cv.conversationId + ' cvId=' + cvId + ' isBound=' + isBound)
          h += '<div class="pua-check-item' + (isBound ? ' checked' : '') + '" data-conv-id="' + cvId + '">'
          h += '<div class="pua-check-box">\u2713</div>'
          h += '<span class="pua-check-icon">' + (isGroup ? '' : '') + '</span>'
          h += '<span class="pua-check-label">' + self._escHtml(cvName) + '</span>'
          h += '</div>'
        }
        if (!h) h = '<div style="font-size:10px;color:var(--pua-text-dim);text-align:center;padding:8px">\u65E0\u4F1A\u8BDD</div>'
        memList.innerHTML = h
        // 绑定点击事件
        var items = memList.querySelectorAll('.pua-check-item')
        for (var ii = 0; ii < items.length; ii++) {
          items[ii].addEventListener('click', function() {
            this.classList.toggle('checked')
          })
        }
      }).catch(function(e) {
        console.warn('[PUA] conversation.list failed: ' + (e.message || e))
        var memList = modal.querySelector('#branch-mem-list')
        if (memList) memList.innerHTML = '<div style="font-size:10px;color:var(--pua-text-dim);text-align:center;padding:8px">\u52A0\u8F7D\u5931\u8D25: ' + self._escHtml(e.message || '') + '</div>'
      })
    } else {
      var memListEl = modal.querySelector('#branch-mem-list')
      if (memListEl) memListEl.innerHTML = '<div style="font-size:10px;color:var(--pua-text-dim);text-align:center;padding:8px">\u8BB0\u5FC6\u7ED1\u5B9A\u9700\u8981 conversation API</div>'
    }

    // ===== 异步加载世界书 =====
    if (this.roche.worldbook && this.roche.worldbook.list) {
      this.roche.worldbook.list().then(function(cats) {
        var wbLocal = modal.querySelector('#branch-wb-local')
        var wbGlobalItem = modal.querySelector('#branch-wb-global-item')
        var wbGlobalCheck = modal.querySelector('#branch-wb-global')
        if (!wbLocal) return

        // 全局checkbox
        if (wbGlobalCheck) {
          wbGlobalCheck.checked = branch.mountedWorldbooks ? (branch.mountedWorldbooks.global !== false) : true
        }
        if (wbGlobalItem) {
          if (wbGlobalCheck && !wbGlobalCheck.checked) wbGlobalItem.classList.remove('checked')
          wbGlobalItem.addEventListener('click', function() {
            this.classList.toggle('checked')
            wbGlobalCheck.checked = this.classList.contains('checked')
          })
        }

        // 本地世界书
        var localCats = []
        for (var i = 0; i < (cats || []).length; i++) {
          if (cats[i].scope === 'local') localCats.push(cats[i])
        }

        var h = ''
        for (var li = 0; li < localCats.length; li++) {
          var cat = localCats[li]
          var isMounted = branch.mountedWorldbooks && branch.mountedWorldbooks.local && branch.mountedWorldbooks.local[cat.id]
          h += '<div class="pua-check-group' + (isMounted ? ' open' : '') + '" data-cat-id="' + cat.id + '">'
          h += '<div class="pua-check-group-header">'
          h += '<div class="pua-check-item' + (isMounted ? ' checked' : '') + ' branch-wb-cat-check" data-cat-id="' + cat.id + '">'
          h += '<div class="pua-check-box">\u2713</div>'
          h += '<span class="pua-check-icon"></span>'
          h += '<span class="pua-check-label">' + self._escHtml(cat.name || cat.id) + '</span>'
          h += '</div>'
          h += '<span class="pua-check-group-arrow">\u25B6</span>'
          h += '</div>'
          h += '<div class="pua-check-group-entries" data-cat-id="' + cat.id + '"></div>'
          h += '</div>'
        }
        if (!h) h = '<div style="font-size:10px;color:var(--pua-text-dim);text-align:center;padding:8px">\u65E0\u672C\u5730\u4E16\u754C\u4E66</div>'
        wbLocal.innerHTML = h

        // 绑定分组点击事件
        var groups = wbLocal.querySelectorAll('.pua-check-group')
        for (var gi = 0; gi < groups.length; gi++) {
          (function(group) {
            var header = group.querySelector('.pua-check-group-header')
            var catCheck = group.querySelector('.branch-wb-cat-check')
            if (header) {
              header.addEventListener('click', function(e) {
                // 如果点击的是checkbox区域，切换checked
                if (catCheck && catCheck.contains(e.target)) {
                  catCheck.classList.toggle('checked')
                  if (catCheck.classList.contains('checked')) {
                    group.classList.add('open')
                    // 勾选所有词条
                    var entryChecks = group.querySelectorAll('.branch-wb-entry-check')
                    for (var eci = 0; eci < entryChecks.length; eci++) {
                      entryChecks[eci].classList.add('checked')
                    }
                  }
                } else {
                  // 点击箭头区域，切换展开/折叠
                  group.classList.toggle('open')
                }
              })
            }
          })(groups[gi])
        }

        // 加载每个本地分类的词条
        for (var ci = 0; ci < localCats.length; ci++) {
          (function(cat) {
            if (self.roche.worldbook && self.roche.worldbook.getEntries) {
              self.roche.worldbook.getEntries({ categoryId: cat.id }).then(function(entries) {
                var entriesDiv = wbLocal.querySelector('.pua-check-group-entries[data-cat-id="' + cat.id + '"]')
                if (!entriesDiv) return
                var eh = ''
                for (var ei = 0; ei < (entries || []).length; ei++) {
                  var entry = entries[ei]
                  var isEntryMounted = branch.mountedWorldbooks && branch.mountedWorldbooks.local && branch.mountedWorldbooks.local[cat.id]
                  var entryChecked = isEntryMounted ? true : false
                  if (isEntryMounted && Array.isArray(isEntryMounted)) {
                    entryChecked = false
                    for (var emi = 0; emi < isEntryMounted.length; emi++) {
                      if (isEntryMounted[emi] === entry.id) { entryChecked = true; break }
                    }
                  }
                  eh += '<div class="pua-check-item branch-wb-entry-check' + (entryChecked ? ' checked' : '') + '" data-cat-id="' + cat.id + '" data-entry-id="' + entry.id + '">'
                  eh += '<div class="pua-check-box">\u2713</div>'
                  eh += '<span class="pua-check-label">' + self._escHtml(entry.name || entry.key || entry.id) + '</span>'
                  eh += '</div>'
                }
                entriesDiv.innerHTML = eh || '<div style="font-size:9px;color:var(--pua-text-dim);padding:4px 8px">\u65E0\u8BCD\u6761</div>'
                // 绑定词条点击
                var entryItems = entriesDiv.querySelectorAll('.pua-check-item')
                for (var eii = 0; eii < entryItems.length; eii++) {
                  entryItems[eii].addEventListener('click', function() {
                    this.classList.toggle('checked')
                  })
                }
              }).catch(function() {})
            }
          })(localCats[ci])
        }
      }).catch(function() {
        var wbLocal = modal.querySelector('#branch-wb-local')
        if (wbLocal) wbLocal.innerHTML = '<div style="font-size:10px;color:var(--pua-text-dim);text-align:center;padding:8px">\u52A0\u8F7D\u5931\u8D25</div>'
      })
    } else {
      var wbLocalEl = modal.querySelector('#branch-wb-local')
      if (wbLocalEl) wbLocalEl.innerHTML = '<div style="font-size:10px;color:var(--pua-text-dim);text-align:center;padding:8px">\u4E0D\u53EF\u7528</div>'
    }

    // ===== 异步加载角色列表 =====
    if (this.roche.character && this.roche.character.list) {
      this.roche.character.list().then(function(chars) {
        var charList = modal.querySelector('#branch-char-list')
        if (!charList) return
        var h = ''
        for (var i = 0; i < (chars || []).length; i++) {
          var ch = chars[i]
          var isSelected = false
          for (var si = 0; si < (branch.selectedCharIds || []).length; si++) {
            if (branch.selectedCharIds[si] === ch.id) { isSelected = true; break }
          }
          if (branch.charId === ch.id) isSelected = true
          var displayName = ch.handle || ch.name || '?'
          h += '<div class="pua-check-item' + (isSelected ? ' checked' : '') + ' branch-char-check" data-char-id="' + ch.id + '">'
          h += '<div class="pua-check-box">\u2713</div>'
          h += '<span class="pua-check-icon"></span>'
          h += '<span class="pua-check-label">' + self._escHtml(displayName) + '</span>'
          h += '</div>'
        }
        if (!h) h = '<div style="font-size:10px;color:var(--pua-text-dim);text-align:center;padding:8px">\u65E0\u89D2\u8272</div>'
        charList.innerHTML = h
        // 绑定点击事件
        var items = charList.querySelectorAll('.pua-check-item')
        for (var ii = 0; ii < items.length; ii++) {
          items[ii].addEventListener('click', function() {
            this.classList.toggle('checked')
          })
        }
      }).catch(function() {
        var charList = modal.querySelector('#branch-char-list')
        if (charList) charList.innerHTML = '<div style="font-size:10px;color:var(--pua-text-dim);text-align:center;padding:8px">\u52A0\u8F7D\u5931\u8D25</div>'
      })
    } else {
      var charListEl = modal.querySelector('#branch-char-list')
      if (charListEl) charListEl.innerHTML = '<div style="font-size:10px;color:var(--pua-text-dim);text-align:center;padding:8px">\u4E0D\u53EF\u7528</div>'
    }

    // ===== 保存按钮事件 =====
    // 保存记忆绑定
    var memSaveBtn = modal.querySelector('#branch-mem-save')
    if (memSaveBtn) {
      memSaveBtn.addEventListener('click', function() {
        var items = modal.querySelectorAll('#branch-mem-list .pua-check-item')
        var ids = []
        for (var i = 0; i < items.length; i++) {
          if (items[i].classList.contains('checked')) ids.push(items[i].getAttribute('data-conv-id'))
        }
        branch.memoryConvIds = ids
        self._saveBranches()
        self._toast('\u8BB0\u5FC6\u7ED1\u5B9A\u5DF2\u4FDD\u5B58')

        // 加载绑定的记忆到我们的记忆系统
        self._loadMemFromBranches(ids, branch.id)
      })
    }

    // 保存世界书挂载
    var wbSaveBtn = modal.querySelector('#branch-wb-save')
    if (wbSaveBtn) {
      wbSaveBtn.addEventListener('click', function() {
        var globalCheck = modal.querySelector('#branch-wb-global')
        var local = {}
        var catChecks = modal.querySelectorAll('.branch-wb-cat-check')
        for (var i = 0; i < catChecks.length; i++) {
          if (catChecks[i].classList.contains('checked')) {
            var catId = catChecks[i].getAttribute('data-cat-id')
            var entryChecks = modal.querySelectorAll('.branch-wb-entry-check[data-cat-id="' + catId + '"]')
            if (entryChecks.length > 0) {
              var entryIds = []
              for (var ei = 0; ei < entryChecks.length; ei++) {
                if (entryChecks[ei].classList.contains('checked')) entryIds.push(entryChecks[ei].getAttribute('data-entry-id'))
              }
              local[catId] = entryIds.length === entryChecks.length ? true : entryIds
            } else {
              local[catId] = true
            }
          }
        }
        branch.mountedWorldbooks = {
          global: globalCheck ? globalCheck.checked : true,
          local: local
        }
        self._saveBranches()
        self._toast('\u4E16\u754C\u4E66\u6302\u8F7D\u5DF2\u4FDD\u5B58')
      })
    }

    // 保存角色人设
    var charSaveBtn = modal.querySelector('#branch-char-save')
    if (charSaveBtn) {
      charSaveBtn.addEventListener('click', function() {
        var items = modal.querySelectorAll('#branch-char-list .pua-check-item')
        var ids = []
        for (var i = 0; i < items.length; i++) {
          if (items[i].classList.contains('checked')) ids.push(items[i].getAttribute('data-char-id'))
        }
        branch.selectedCharIds = ids
        self._saveBranches()
        self._toast('\u89D2\u8272\u4EBA\u8BBE\u5DF2\u4FDD\u5B58')
      })
    }

    modal.classList.add('show')
  }

  /* ════════════════════════════════════════════════════════════
     导入线下记录 TXT
     ════════════════════════════════════════════════════════════ */

  P._showImportModal = function() {
    console.log('[PUA] _showImportModal called')
    var self = this
    var modal = this._modalOverlay
    if (!modal) { console.warn('[PUA] modal overlay not found'); return }

    var body = ''
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">\u5BFC\u5165\u7EBF\u4E0B\u8BB0\u5F55 TXT</div>'
    body += '<div style="border:2px dashed var(--pua-border);border-radius:8px;padding:20px;text-align:center;cursor:pointer;transition:var(--pua-transition)" id="pua-import-dropzone">'
    body += '<div style="font-size:24px;opacity:0.3;margin-bottom:8px">\u2B07</div>'
    body += '<div style="font-size:11px;color:var(--pua-text-sub)">\u70B9\u51FB\u9009\u62E9\u6587\u4EF6\u6216\u62D6\u62FD\u5230\u8FD9\u91CC</div>'
    body += '<div style="font-size:9px;color:var(--pua-text-dim);margin-top:4px">\u652F\u6301 Roche \u5BFC\u51FA\u7684\u7EBF\u4E0B\u8BB0\u5F55 / \u5F52\u6863\u8BB0\u5F55 TXT\uFF0C\u53EF\u591A\u9009</div>'
    body += '<input type="file" id="pua-import-file" accept=".txt" multiple style="display:none">'
    body += '</div>'
    body += '</div>'

    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">\u5206\u652F\u540D\u79F0</div>'
    body += '<input class="pua-field-input" id="pua-import-name" placeholder="\u7559\u7A7A\u5219\u81EA\u52A8\u4ECE\u6587\u4EF6\u540D\u751F\u6210...">'
    body += '</div>'

    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">\u6807\u7B7E\uFF08\u9017\u53F7\u5206\u9694\uFF09</div>'
    body += '<input class="pua-field-input" id="pua-import-tags" placeholder="\u7EBF\u4E0B, \u5F52\u6863, ...">'
    body += '</div>'

    // 关联角色选择器
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">\u5173\u8054\u89D2\u8272</div>'
    body += '<select class="pua-field-input pua-field-select" id="pua-import-char">'
    body += '<option value="">\u81EA\u52A8\u5339\u914D...</option>'
    body += '</select>'
    body += '<div class="pua-field-hint">\u9009\u62E9\u6216\u786E\u8BA4\u5BFC\u5165\u8BB0\u5F55\u5BF9\u5E94\u7684\u89D2\u8272</div>'
    body += '</div>'

    // 用户人设/面具
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">\u7528\u6237\u4EBA\u8BBE/\u9762\u5177</div>'
    body += '<select class="pua-field-input pua-field-select" id="pua-import-persona">'
    body += '<option value="">\u9ED8\u8BA4</option>'
    body += '</select>'
    body += '</div>'

    // 预览区
    body += '<div id="pua-import-preview" style="display:none">'
    body += '<div style="font-size:10px;color:var(--pua-accent);font-weight:600;margin-bottom:6px">\u89E3\u6790\u9884\u89C8</div>'
    body += '<div id="pua-import-preview-content" style="max-height:200px;overflow-y:auto;font-size:10px;color:var(--pua-text-sub);background:var(--pua-bg-input);border-radius:6px;padding:8px;line-height:1.5"></div>'
    body += '</div>'

    var modalBody = modal.querySelector('.pua-modal-body')
    if (!modalBody) { console.warn('[PUA] modal body not found'); return }
    modalBody.innerHTML = body

    var modalTitle = modal.querySelector('.pua-modal-title')
    if (modalTitle) modalTitle.textContent = '\u5BFC\u5165\u7EBF\u4E0B\u8BB0\u5F55'

    // Footer
    var footer = modal.querySelector('.pua-modal-footer')
    if (footer) footer.remove()
    footer = document.createElement('div')
    footer.className = 'pua-modal-footer'

    var cancelBtn = document.createElement('button')
    cancelBtn.className = 'pua-btn'
    cancelBtn.textContent = '\u53D6\u6D88'
    cancelBtn.addEventListener('click', function() { self._closeModal() })

    var confirmBtn = document.createElement('button')
    confirmBtn.className = 'pua-btn pua-btn-gold'
    confirmBtn.textContent = '\u786E\u8BA4\u5BFC\u5165'
    confirmBtn.id = 'pua-import-confirm'
    confirmBtn.addEventListener('click', function() { self._doImport() })

    footer.appendChild(cancelBtn)
    footer.appendChild(confirmBtn)

    var modalInner = modal.querySelector('.pua-modal')
    if (modalInner) modalInner.appendChild(footer)

    // 绑定文件选择事件
    var dropzone = modal.querySelector('#pua-import-dropzone')
    var fileInput = modal.querySelector('#pua-import-file')
    if (dropzone && fileInput) {
      dropzone.addEventListener('click', function() { fileInput.click() })
      dropzone.addEventListener('dragover', function(e) {
        e.preventDefault()
        dropzone.style.borderColor = 'var(--pua-accent)'
        dropzone.style.background = 'var(--pua-accent-glow)'
      })
      dropzone.addEventListener('dragleave', function() {
        dropzone.style.borderColor = 'var(--pua-border)'
        dropzone.style.background = ''
      })
      dropzone.addEventListener('drop', function(e) {
        e.preventDefault()
        dropzone.style.borderColor = 'var(--pua-border)'
        dropzone.style.background = ''
        self._handleImportFiles(e.dataTransfer.files)
      })
      fileInput.addEventListener('change', function() {
        if (fileInput.files && fileInput.files.length) {
          self._handleImportFiles(fileInput.files)
        }
      })
    }

    modal.classList.add('show')
  }

  /* ── 处理导入文件 ── */
  P._handleImportFiles = function(fileList) {
    var self = this
    var modal = this._modalOverlay
    if (!fileList || fileList.length === 0) return

    console.log('[PUA] _handleImportFiles: ' + fileList.length + ' files')

    // 存储解析结果
    this._importParsed = []

    var filesRead = 0
    var totalFiles = fileList.length

    for (var i = 0; i < fileList.length; i++) {
      (function(file) {
        var reader = new FileReader()
        reader.onload = function(e) {
          var text = e.target.result
          var parsed = self._parseRocheTxt(text, file.name)
          if (parsed) {
            self._importParsed.push(parsed)
            console.log('[PUA] parsed: ' + file.name + ' -> ' + parsed.messages.length + ' msgs, char=' + parsed.charName)
          } else {
            console.warn('[PUA] failed to parse: ' + file.name)
          }
          filesRead++
          if (filesRead === totalFiles) {
            self._showImportPreview()
          }
        }
        reader.readAsText(file, 'UTF-8')
      })(fileList[i])
    }
  }

  /* ── 解析 Roche 导出的 TXT 格式 ── */
  P._parseRocheTxt = function(text, fileName) {
    if (!text || !text.trim()) return null

    var lines = text.split('\n')
    var header = {}
    var messages = []
    var currentMsg = null
    var inHeader = true
    var separatorSeen = false

    // 解析头部元信息
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i]
      var trimmed = line.trim()

      // 检查分隔线
      if (!separatorSeen && trimmed.match(/^-+$/)) {
        separatorSeen = true
        inHeader = false
        continue
      }

      if (inHeader) {
        // 解析 "key: value" 格式
        var colonIdx = trimmed.indexOf('\uFF1A') // 全角冒号
        if (colonIdx < 0) colonIdx = trimmed.indexOf(':') // 半角冒号
        if (colonIdx > 0) {
          var key = trimmed.substring(0, colonIdx).trim()
          var val = trimmed.substring(colonIdx + 1).trim()
          // 标准化 key
          if (key === '\u4F1A\u8BDD') header.charName = val
          else if (key === '\u6765\u6E90') header.source = val
          else if (key === '\u5BFC\u51FA\u65F6\u95F4') header.exportTime = val
          else if (key.indexOf('\u8BB0\u5F55\u65F6\u95F4') >= 0) header.recordTime = val
          else if (key === '\u6D88\u606F\u6570') header.msgCount = parseInt(val) || 0
        }
        continue
      }

      // 解析消息行: #N [timestamp] senderName
      var msgMatch = trimmed.match(/^#(\d+)\s+\[([^\]]+)\]\s+(.+)$/)
      if (msgMatch) {
        // 保存上一条消息
        if (currentMsg) {
          currentMsg.text = currentMsg.text.trim()
          messages.push(currentMsg)
        }
        currentMsg = {
          index: parseInt(msgMatch[1]),
          timestamp: msgMatch[2],
          senderName: msgMatch[3].trim(),
          text: ''
        }
        continue
      }

      // 消息内容
      if (currentMsg) {
        currentMsg.text += line + '\n'
      }
    }

    // 保存最后一条消息
    if (currentMsg) {
      currentMsg.text = currentMsg.text.trim()
      messages.push(currentMsg)
    }

    if (messages.length === 0) {
      console.warn('[PUA] _parseRocheTxt: no messages found in ' + fileName)
      return null
    }

    // 从文件名提取额外信息
    // 格式: 本次线下记录_谢猫猫_20260605_084527.txt 或 归档记录_Nikto_20260519_085025.txt
    var nameMatch = fileName.match(/(?:本次线下记录|归档记录)_(.+?)_(\d{8}_\d{6})\.txt/)
    var fileCharName = nameMatch ? nameMatch[1] : ''
    var fileDate = nameMatch ? nameMatch[2] : ''

    // 确定角色发送者名称：与 charName 匹配的 senderName
    var charSenderName = header.charName || fileCharName || ''
    if (charSenderName && messages.length > 0) {
      // 尝试精确匹配
      var found = false
      for (var k = 0; k < messages.length; k++) {
        if (messages[k].senderName === charSenderName) { found = true; break }
      }
      // 如果没有精确匹配，尝试模糊匹配（包含关系）
      if (!found) {
        for (var k2 = 0; k2 < messages.length; k2++) {
          if (messages[k2].senderName.indexOf(charSenderName) >= 0 || charSenderName.indexOf(messages[k2].senderName) >= 0) {
            charSenderName = messages[k2].senderName
            found = true
            break
          }
        }
      }
    }

    return {
      charName: header.charName || fileCharName || '\u672A\u77E5',
      charSenderName: charSenderName,
      source: header.source || '',
      exportTime: header.exportTime || '',
      recordTime: header.recordTime || '',
      expectedMsgCount: header.msgCount || 0,
      fileCharName: fileCharName,
      fileDate: fileDate,
      fileName: fileName,
      messages: messages
    }
  }

  /* ── 显示导入预览 ── */
  P._showImportPreview = function() {
    var modal = this._modalOverlay
    if (!modal) return
    var previewEl = modal.querySelector('#pua-import-preview')
    var previewContent = modal.querySelector('#pua-import-preview-content')
    if (!previewEl || !previewContent) return

    if (!this._importParsed || this._importParsed.length === 0) {
      previewContent.textContent = '\u672A\u80FD\u89E3\u6790\u51FA\u4EFB\u4F55\u6D88\u606F\uFF0C\u8BF7\u68C0\u67E5\u6587\u4EF6\u683C\u5F0F'
      previewEl.style.display = 'block'
      return
    }

    var html = ''
    for (var i = 0; i < this._importParsed.length; i++) {
      var p = this._importParsed[i]
      html += '<div style="margin-bottom:10px;padding:8px;border:1px solid var(--pua-border);border-radius:6px">'
      html += '<div style="font-weight:600;color:var(--pua-accent-text);margin-bottom:4px">' + this._escHtml(p.fileName) + '</div>'
      html += '<div style="font-size:9px;color:var(--pua-text-dim)">'
      html += '\u89D2\u8272: ' + this._escHtml(p.charName)
      html += ' | \u6765\u6E90: ' + this._escHtml(p.source)
      html += ' | \u6D88\u606F: ' + p.messages.length + ' \u6761'
      if (p.recordTime) html += ' | \u65F6\u95F4: ' + this._escHtml(p.recordTime)
      html += '</div>'
      // 消息预览
      var previewCount = Math.min(p.messages.length, 3)
      for (var j = 0; j < previewCount; j++) {
        var msg = p.messages[j]
        var preview = msg.text.substring(0, 80).replace(/<[^>]+>/g, '').trim()
        if (msg.text.length > 80) preview += '...'
        html += '<div style="font-size:9px;color:var(--pua-text-sub);margin-top:2px;padding:2px 4px;background:rgba(255,255,255,0.02);border-radius:3px">'
        html += '<b style="color:var(--pua-accent)">#' + msg.index + '</b> '
        html += '<span style="color:var(--pua-char)">' + this._escHtml(msg.senderName) + '</span>: '
        html += this._escHtml(preview)
        html += '</div>'
      }
      if (p.messages.length > 3) {
        html += '<div style="font-size:8px;color:var(--pua-text-dim);text-align:center">\u8FD8\u6709 ' + (p.messages.length - 3) + ' \u6761\u6D88\u606F...</div>'
      }
      html += '</div>'
    }
    previewContent.innerHTML = html
    previewEl.style.display = 'block'

    // 自动填充分支名称
    var nameInput = modal.querySelector('#pua-import-name')
    if (nameInput && !nameInput.value && this._importParsed.length > 0) {
      var first = this._importParsed[0]
      nameInput.value = first.charName + ' \u00B7 ' + (first.recordTime || first.exportTime || '\u7EBF\u4E0B\u8BB0\u5F55')
    }

    // 异步获取角色列表并自动匹配
    var charSelect = modal.querySelector('#pua-import-char')
    if (charSelect && this.roche && this.roche.character && this.roche.character.list) {
      var self = this
      var firstParsed = this._importParsed[0]
      var matchCharName = firstParsed ? firstParsed.charName : ''
      this.roche.character.list().then(function(chars) {
        if (!chars || !chars.length) return
        charSelect.innerHTML = '<option value="">\u672A\u5339\u914D</option>'
        var matchedIdx = -1
        for (var i = 0; i < chars.length; i++) {
          var ch = chars[i]
          var chName = ch.handle || ch.name || ''
          var optEl = document.createElement('option')
          optEl.value = ch.id || ''
          optEl.textContent = chName
          optEl.setAttribute('data-char-name', chName)
          optEl.setAttribute('data-char-avatar', ch.avatar || '')
          charSelect.appendChild(optEl)
          // 自动匹配：handle或name与解析出的charName一致
          if (matchCharName && (chName === matchCharName || ch.name === matchCharName)) {
            matchedIdx = i
          }
        }
        if (matchedIdx >= 0) {
          charSelect.selectedIndex = matchedIdx + 1 // +1 因为第一个是"未匹配"
        }
      }).catch(function(e) {
        console.warn('[PUA] import char list failed', e)
      })
    }

    // 加载用户人设列表
    this._loadPersonaOptions('pua-import-persona')
  }

  /* ── 执行导入 ── */
  P._doImport = function() {
    console.log('[PUA] _doImport called')
    var self = this
    var modal = this._modalOverlay
    if (!this._importParsed || this._importParsed.length === 0) {
      this._toast('\u6CA1\u6709\u53EF\u5BFC\u5165\u7684\u6570\u636E')
      return
    }

    var nameInput = modal ? modal.querySelector('#pua-import-name') : null
    var tagsInput = modal ? modal.querySelector('#pua-import-tags') : null
    var charSelect = modal ? modal.querySelector('#pua-import-char') : null

    var branchName = nameInput ? nameInput.value.trim() : ''
    var tagsStr = tagsInput ? tagsInput.value.trim() : ''
    var tags = tagsStr ? tagsStr.split(/[,，]/).map(function(t) { return t.trim() }).filter(function(t) { return t }) : []

    // 读取选中的角色信息
    var selectedCharId = ''
    var selectedCharName = ''
    var selectedCharAvatar = ''
    if (charSelect && charSelect.value) {
      selectedCharId = charSelect.value
      var selOpt = charSelect.options[charSelect.selectedIndex]
      if (selOpt) {
        selectedCharName = selOpt.getAttribute('data-char-name') || selOpt.textContent || ''
        selectedCharAvatar = selOpt.getAttribute('data-char-avatar') || ''
      }
    }

    // 读取选中的用户人设
    var personaSelect = modal ? modal.querySelector('#pua-import-persona') : null
    var importUserPersona = null
    if (personaSelect && personaSelect.value) {
      var personaOpt = personaSelect.options[personaSelect.selectedIndex]
      importUserPersona = {
        id: personaSelect.value,
        name: personaOpt ? (personaOpt.getAttribute('data-persona-name') || personaOpt.textContent || '') : ''
      }
    }

    // 为每个解析结果创建一个分支
    var created = 0
    for (var i = 0; i < this._importParsed.length; i++) {
      var p = this._importParsed[i]

      // 将消息转为统一格式
      var charMatchName = p.charSenderName || p.charName || selectedCharName || ''
      var msgs = p.messages.map(function(m) {
        var msgType = 'user'
        if (charMatchName && m.senderName === charMatchName) {
          msgType = 'assistant'
        } else if (!charMatchName) {
          // No char name to match: try heuristics - if senderName looks like a char name (not user/you), treat as assistant
          var sn = (m.senderName || '').toLowerCase()
          if (sn !== 'user' && sn !== '用户' && sn !== '你' && sn !== 'me' && sn !== '我') {
            msgType = 'assistant'
          }
        }
        return {
          type: msgType,
          senderName: m.senderName,
          senderHandle: m.senderName,
          text: m.text,
          timestamp: m.timestamp
        }
      })

      var bName = branchName
      if (!bName) {
        bName = p.charName + ' \u00B7 ' + (p.recordTime || p.exportTime || '\u7EBF\u4E0B\u8BB0\u5F55')
      } else if (self._importParsed.length > 1) {
        bName = branchName + ' (' + p.charName + ')'
      }

      var branch = {
        id: 'b' + Date.now() + '_' + i,
        name: bName,
        charId: selectedCharId || '',
        charName: selectedCharId ? selectedCharName : p.charName,
        charAvatar: selectedCharId ? selectedCharAvatar : '',
        sourceConvId: '',
        source: 'offline',
        msgCount: msgs.length,
        createdAt: new Date().toLocaleString('zh-CN'),
        tags: tags.length > 0 ? tags : ['\u7EBF\u4E0B'],
        contextDepth: msgs.length,
        longTermMemory: null,
        messages: msgs,
        userPersona: importUserPersona,
        offlineMeta: {
          fileName: p.fileName,
          fileCharName: p.fileCharName,
          fileDate: p.fileDate,
          exportTime: p.exportTime,
          recordTime: p.recordTime,
          offlineSource: p.source
        },
        memoryConvIds: [],
        mountedWorldbooks: { global: true, local: {} },
        selectedCharIds: selectedCharId ? [selectedCharId] : []
      }

      this.branches.push(branch)
      created++
      console.log('[PUA] imported branch: id=' + branch.id + ' name=' + branch.name + ' msgs=' + branch.msgCount + ' char=' + branch.charName)
    }

    this._saveBranches()
    this._closeModal()
    this._importParsed = []
    this._toast('\u5DF2\u5BFC\u5165 ' + created + ' \u4E2A\u7EBF\u4E0B\u5206\u652F\uFF0C\u5171 ' + this.branches.filter(function(b) { return b.source === 'offline' }).length + ' \u6761\u6D88\u606F')
    this._render()
  }

  P._renderPlaceholder = function(titleEl, actionsEl, contentEl, icon, title, desc) {
    titleEl.textContent = title
    actionsEl.innerHTML = '<span style="font-size:10px;color:var(--pua-text-dim)">\u5F85\u5F00\u53D1</span>'
    contentEl.innerHTML = '<div class="pua-placeholder">'
      + '<div class="pua-placeholder-icon">' + icon + '</div>'
      + '<div class="pua-placeholder-title">' + title + '</div>'
      + '<div class="pua-placeholder-desc">' + desc + '</div>'
      + '</div>'
  }

  /* ════════════════════════════════════════════════════════════
     预设编辑器页面
     ════════════════════════════════════════════════════════════ */

  P._renderPresets = function(titleEl, actionsEl, contentEl) {
    var self = this
    titleEl.textContent = '\u9884\u8BBE\u7F16\u8F91\u5668'
    actionsEl.innerHTML = ''
    
    // Import button
    var importBtn = document.createElement('button')
    importBtn.className = 'pua-btn'
    importBtn.textContent = '\u5BFC\u5165'
    importBtn.addEventListener('click', function() { self._importPresetDialog() })
    actionsEl.appendChild(importBtn)
    
    // Export button
    var exportBtn = document.createElement('button')
    exportBtn.className = 'pua-btn'
    exportBtn.textContent = '\u21E1 \u5BFC\u51FA'
    exportBtn.addEventListener('click', function() { self._exportPresets() })
    actionsEl.appendChild(exportBtn)
    
    // Add button
    var addBtn = document.createElement('button')
    addBtn.className = 'pua-btn pua-btn-gold'
    addBtn.textContent = '+ \u65B0\u589E'
    addBtn.addEventListener('click', function() { self._addPreset() })
    actionsEl.appendChild(addBtn)

    var selPreset = null
    for (var i = 0; i < this.presets.length; i++) {
      if (this.presets[i].id === this.selPreset) { selPreset = this.presets[i]; break }
    }

    // ── 预设编辑器预设选择器 ──
    var ppData = this._promptPresetData || { presets: [], activePresetId: '' }
    var ppPresets = ppData.presets || []
    var ppActiveId = ppData.activePresetId || ''

    var presetBar = '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;flex-wrap:wrap">'
    presetBar += '<select class="pua-settings-select" id="prompt-preset-select" style="flex:1;min-width:120px">'
    for (var ppi = 0; ppi < ppPresets.length; ppi++) {
      presetBar += '<option value="' + ppPresets[ppi].id + '"' + (ppPresets[ppi].id === ppActiveId ? ' selected' : '') + '>' + self._escHtml(ppPresets[ppi].name) + '</option>'
    }
    presetBar += '</select>'
    presetBar += '<button class="pua-btn pua-btn-sm" id="prompt-preset-save">\u4FDD\u5B58\u9884\u8BBE</button>'
    presetBar += '<button class="pua-btn pua-btn-sm" id="prompt-preset-new">\u65B0\u5EFA\u9884\u8BBE</button>'
    presetBar += '<button class="pua-btn pua-btn-sm" id="prompt-preset-rename">\u91CD\u547D\u540D</button>'
    presetBar += '<button class="pua-btn pua-btn-sm pua-btn-danger" id="prompt-preset-delete">\u5220\u9664\u9884\u8BBE</button>'
    presetBar += '</div>'

    var h = presetBar + '<div class="pua-panel-layout">'

    // === Left: Item list ===
    var mobileHideList = (window.innerWidth < 768 && selPreset) ? ' pua-mobile-hide' : ''
    var selPresetIds = this._selPresetIds || []
    var hasSelected = selPresetIds.length > 0
    h += '<div class="pua-glass pua-panel-list' + mobileHideList + '">'
    h += '<div class="pua-panel-header">'
    h += '<input type="checkbox" class="pua-select-all-cb" id="preset-select-all"' + (hasSelected && selPresetIds.length === this.presets.length ? ' checked' : '') + '>'
    h += '<span>\u6761\u76EE\u5217\u8868</span><span style="font-size:10px;color:var(--pua-text-dim)">' + this.presets.length + ' \u9879</span>'
    if (hasSelected) { h += '<span class="pua-selected-count">' + selPresetIds.length + '</span>' }
    h += '</div>'
    if (hasSelected) {
      h += '<div class="pua-batch-del-bar"><button class="pua-btn pua-btn-danger pua-btn-sm" id="preset-batch-del">\u1F5D1 \u5220\u9664\u9009\u4E2D (' + selPresetIds.length + ')</button><button class="pua-btn pua-btn-sm" id="preset-move-to">\u2192 \u79FB\u52A8\u5230</button><button class="pua-btn pua-btn-sm" id="preset-clear-sel">\u53D6\u6D88\u9009\u4E2D</button></div>'
    }
    h += '<div class="pua-panel-body" id="pua-preset-list">'

    // Group presets by 'group' field, render group headers
    var groups = {}
    var groupOrder = []
    for (var gi = 0; gi < this.presets.length; gi++) {
      var gName = this.presets[gi].group || '\u9ED8\u8BA4'
      if (!groups[gName]) { groups[gName] = []; groupOrder.push(gName) }
      groups[gName].push(this.presets[gi])
    }
    for (var goi = 0; goi < groupOrder.length; goi++) {
      var gk = groupOrder[goi]
      var gItems = groups[gk]
      if (groupOrder.length > 1 || gk !== '\u9ED8\u8BA4') {
        h += '<div class="pua-group-header"><span>' + self._escHtml(gk) + '</span><span style="font-size:9px;color:var(--pua-text-dim)">' + gItems.length + ' \u9879</span></div>'
      }
      for (var j = 0; j < gItems.length; j++) {
        var e = gItems[j]
        var rc = e.role === 'system' ? 'pua-role-system' : (e.role === 'user' ? 'pua-role-user' : 'pua-role-assistant')
        var rl = e.role === 'system' ? 'SYS' : (e.role === 'user' ? 'USR' : 'AST')
        var isChecked = selPresetIds.indexOf(e.id) >= 0
        h += '<div class="pua-entry-item' + (e.id === this.selPreset ? ' selected' : '') + (isChecked ? ' pua-entry-checked' : '') + '" data-id="' + e.id + '" draggable="true">'
        h += '<input type="checkbox" class="pua-item-cb" data-id="' + e.id + '"' + (isChecked ? ' checked' : '') + '>'
        h += '<span class="pua-drag-handle">\u2630</span>'
        h += '<span class="pua-role-dot ' + rc + '"></span>'
        h += '<div class="pua-entry-info"><div class="pua-entry-title">' + self._escHtml(e.title) + '</div>'
        h += '<div class="pua-entry-sub">' + rl + (e.on ? '' : ' \u00B7 \u7981\u7528') + '</div></div>'
        h += '<button class="pua-toggle-item' + (e.on ? ' on' : '') + '" data-id="' + e.id + '"></button>'
        h += '</div>'
      }
    }
    h += '</div></div>'

    // === Right: Detail editor ===
    var mobileShowClass = (window.innerWidth < 768 && selPreset) ? ' show' : ''
    h += '<div class="pua-glass pua-panel-detail' + mobileShowClass + '">'
    if (selPreset) {
      // Header: title + role + delete
      h += '<div class="pua-detail-header">'
      h += '<div class="pua-field" style="margin:0"><div class="pua-field-label">\u6807\u9898</div>'
      h += '<input class="pua-field-input pua-preset-title" style="width:180px" value="' + self._escHtml(selPreset.title) + '" data-id="' + selPreset.id + '"></div>'
      h += '<div class="pua-field" style="margin:0"><div class="pua-field-label">\u89D2\u8272</div>'
      h += '<select class="pua-field-input pua-field-select pua-preset-role" style="width:100px" data-id="' + selPreset.id + '">'
      h += '<option value="system"' + (selPreset.role === 'system' ? ' selected' : '') + '>System</option>'
      h += '<option value="user"' + (selPreset.role === 'user' ? ' selected' : '') + '>User</option>'
      h += '<option value="assistant"' + (selPreset.role === 'assistant' ? ' selected' : '') + '>Assistant</option>'
      h += '</select></div>'
      h += '<div style="flex:1"></div>'
      h += '<button class="pua-btn pua-btn-sm pua-mobile-back" style="display:none" data-id="' + selPreset.id + '">\u2190 \u8FD4\u56DE\u5217\u8868</button>'
      h += '<button class="pua-btn pua-btn-danger pua-btn-sm pua-preset-delete" data-id="' + selPreset.id + '">\u5220\u9664</button>'
      h += '<button class="pua-btn pua-btn-sm" id="preset-save-btn" style="background:var(--pua-accent);color:#000">\u4FDD\u5B58</button>'
      h += '</div>'
      // Content textarea
      h += '<div class="pua-detail-body">'
      h += '<div class="pua-detail-content"><textarea class="pua-detail-textarea pua-preset-content" data-id="' + selPreset.id + '" placeholder="\u8F93\u5165\u9884\u8BBE\u5185\u5BB9...">' + self._escHtml(selPreset.content) + '</textarea></div>'
      // Regex section
      h += '<div class="pua-regex-section">'
      h += '<div class="pua-regex-section-title"> \u63D0\u793A\u8BCD\u66FF\u6362\uFF08\u4FEE\u6539\u53D1\u7ED9AI\u7684\u6587\u672C\uFF09</div>'
      h += '<div class="pua-regex-row"><label>\u6392\u9664\u8FC7\u6EE4</label>'
      h += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600;background:rgba(220,53,69,0.15);color:#dc3545">\u9ED1\u540D\u5355</span>'
      h += '<input type="text" class="pua-preset-outregex" value="' + self._escHtml(selPreset.outRegex) + '" placeholder="\u5339\u914D\u5230\u7684\u5185\u5BB9\u4E0D\u8FDB\u5165\u4E0a\u4e0b\u6587" data-id="' + selPreset.id + '">'
      h += '<button class="pua-toggle-item' + (selPreset.outRegexOn ? ' on' : '') + ' pua-preset-oregex-toggle" data-id="' + selPreset.id + '"></button></div>'
      h += '<div class="pua-regex-row"><label>\u4FDD\u7559\u8FC7\u6EE4</label>'
      h += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600;background:rgba(40,167,69,0.15);color:#28a745">\u767d\u540D\u5355</span>'
      h += '<input type="text" class="pua-preset-inregex" value="' + self._escHtml(selPreset.inRegex) + '" placeholder="\u53ea\u6709\u5339\u914D\u5230\u7684\u624d\u8fdb\u5165\u4e0a\u4e0b\u6587" data-id="' + selPreset.id + '">'
      h += '<button class="pua-toggle-item' + (selPreset.inRegexOn ? ' on' : '') + ' pua-preset-iregex-toggle" data-id="' + selPreset.id + '"></button></div>'
      // Depth
      var dMin = selPreset.dMin || 0
      var dMaxStr = selPreset.dMax === Infinity ? '' : String(selPreset.dMax || '')
      h += '<div class="pua-depth-row"><span class="pua-depth-label">\u751F\u6548\u6DF1\u5EA6</span>'
      h += '<input class="pua-depth-input pua-preset-dmin" type="number" value="' + dMin + '" min="0" data-id="' + selPreset.id + '">'
      h += '<span class="pua-depth-sep">~</span>'
      h += '<input class="pua-depth-input pua-preset-dmax" type="number" value="' + dMaxStr + '" min="0" placeholder="\u221E" data-id="' + selPreset.id + '">'
      h += '<span class="pua-depth-label">(0=\u6700\u65B0,\u7A7A=\u221E)</span></div>'
      h += '</div></div>'
      // Footer
      var contentLen = selPreset.content ? selPreset.content.length : 0
      h += '<div class="pua-detail-footer">'
      h += '<span>\u5B57\u7B26: ' + contentLen + '</span>'
      h += '<span>\u89D2\u8272: ' + selPreset.role.toUpperCase() + '</span>'
      h += '<span>\u6DF1\u5EA6: ' + dMin + ' ~ ' + (selPreset.dMax === Infinity ? '\u221E' : String(selPreset.dMax)) + '</span>'
      h += '</div>'
    } else {
      // Empty state
      h += '<div class="pua-empty" style="height:100%"><div class="pua-empty-icon">\u270E</div><div class="pua-empty-text">\u9009\u62E9\u5DE6\u4FA7\u7684\u6761\u76EE\u6765\u7F16\u8F91</div></div>'
    }
    h += '</div></div>'

    contentEl.innerHTML = h

    // ── 预设编辑器预设事件绑定 ──
    var ppSelect = contentEl.querySelector('#prompt-preset-select')
    if (ppSelect) {
      ppSelect.addEventListener('change', function() {
        if (!self._promptPresetData) return
        // \u5148\u4FDD\u5B58\u5F53\u524D\u5DE5\u4F5C\u533A\u7684 items
        var oldActiveId = self._promptPresetData.activePresetId
        var oldPs = self._promptPresetData.presets || []
        for (var ok = 0; ok < oldPs.length; ok++) {
          if (oldPs[ok].id === oldActiveId) { oldPs[ok].items = self.presets.slice(); break }
        }
        self._promptPresetData.activePresetId = this.value
        var target = null
        var ps = self._promptPresetData.presets || []
        for (var k = 0; k < ps.length; k++) {
          if (ps[k].id === this.value) { target = ps[k]; break }
        }
        if (target && target.items) {
          self.presets = target.items
          self.selPreset = self.presets.length > 0 ? self.presets[0].id : ''
          self._savePresets()
        }
        // \u91CD\u5EFA asmOrder \u4EE5\u5339\u914D\u65B0\u5DE5\u4F5C\u533A\u7684\u9884\u8BBE ID
        self.asmOrder = self._defaultAsmOrder()
        console.log('[PUA] workspace switch: new asmOrder length=' + self.asmOrder.length + ' presets length=' + self.presets.length)
        for (var ai = 0; ai < self.asmOrder.length; ai++) {
          if (self.asmOrder[ai].type === 'preset') console.log('[PUA] workspace switch asmOrder preset: id=' + self.asmOrder[ai].id)
        }
        for (var ap = 0; ap < self.presets.length; ap++) {
          console.log('[PUA] workspace switch preset[' + ap + ']: id=' + self.presets[ap].id + ' on=' + self.presets[ap].on + ' title=' + (self.presets[ap].title||''))
        }
        self._saveAsmOrder()
        self._savePromptPresets()
        self._render()
      })
    }
    var ppSaveBtn = contentEl.querySelector('#prompt-preset-save')
    if (ppSaveBtn) {
      ppSaveBtn.addEventListener('click', function() {
        if (!self._promptPresetData) return
        var activeId = self._promptPresetData.activePresetId
        var ps = self._promptPresetData.presets || []
        for (var k = 0; k < ps.length; k++) {
          if (ps[k].id === activeId) { ps[k].items = self.presets.slice(); break }
        }
        self._savePromptPresets()
        self._toast('\u9884\u8BBE\u5DF2\u4FDD\u5B58')
      })
    }
    var ppNewBtn = contentEl.querySelector('#prompt-preset-new')
    if (ppNewBtn) {
      ppNewBtn.addEventListener('click', function() {
        var name = prompt('\u8BF7\u8F93\u5165\u9884\u8BBE\u540D\u79F0', '\u65B0\u9884\u8BBE\u96C6')
        if (!name) return
        if (!self._promptPresetData) {
          self._promptPresetData = { presets: [], activePresetId: '' }
        }
        var newP = { id: 'ppreset-' + Date.now(), name: name, items: self.presets.slice() }
        self._promptPresetData.presets.push(newP)
        self._promptPresetData.activePresetId = newP.id
        self._savePromptPresets()
        self._render()
      })
    }
    var ppRenameBtn = contentEl.querySelector('#prompt-preset-rename')
    if (ppRenameBtn) {
      ppRenameBtn.addEventListener('click', function() {
        if (!self._promptPresetData) return
        var cur = self._promptPresetData.activePresetId
        var p = null
        var ps = self._promptPresetData.presets || []
        for (var k = 0; k < ps.length; k++) {
          if (ps[k].id === cur) { p = ps[k]; break }
        }
        if (!p) return
        var name = prompt('\u91CD\u547D\u540D\u9884\u8BBE', p.name)
        if (!name) return
        p.name = name
        self._savePromptPresets()
        self._render()
      })
    }
    var ppDeleteBtn = contentEl.querySelector('#prompt-preset-delete')
    if (ppDeleteBtn) {
      ppDeleteBtn.addEventListener('click', function() {
        if (!self._promptPresetData) return
        var ps = self._promptPresetData.presets || []
        if (ps.length <= 1) { self._toast('\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u9884\u8BBE'); return }
        if (!confirm('\u786E\u5B9A\u5220\u9664\u5F53\u524D\u9884\u8BBE\uFF1F')) return
        var cur = self._promptPresetData.activePresetId
        var newPs = []
        for (var k = 0; k < ps.length; k++) {
          if (ps[k].id !== cur) newPs.push(ps[k])
        }
        self._promptPresetData.presets = newPs
        self._promptPresetData.activePresetId = newPs[0] ? newPs[0].id : ''
        var target = null
        for (var k2 = 0; k2 < newPs.length; k2++) {
          if (newPs[k2].id === self._promptPresetData.activePresetId) { target = newPs[k2]; break }
        }
        if (target && target.items) {
          self.presets = target.items
          self.selPreset = self.presets.length > 0 ? self.presets[0].id : ''
          self._savePresets()
        }
        self._savePromptPresets()
        self._render()
      })
    }

    this._bindPresetEvents()

    // 恢复列表滚动位置到选中条目
    if (this.selPreset) {
      var listBody = this._contentEl ? this._contentEl.querySelector('#pua-preset-list') : null
      if (listBody) {
        var selItem = listBody.querySelector('.pua-entry-item.selected')
        if (selItem) {
          selItem.scrollIntoView({ block: 'nearest', behavior: 'instant' })
        }
      }
    }
  }

  /* ── 绑定预设编辑器事件 ── */
  P._bindPresetEvents = function() {
    var self = this
    var listEl = this._contentEl ? this._contentEl.querySelector('#pua-preset-list') : null
    if (!listEl) return

    // Item click → select (ES5: manual for loop instead of forEach)
    var entryItems = listEl.querySelectorAll('.pua-entry-item')
    for (var ei = 0; ei < entryItems.length; ei++) {
      (function(el) {
        el.addEventListener('click', function(e) {
          if (e.target.classList.contains('pua-toggle-item') || e.target.classList.contains('pua-drag-handle') || e.target.classList.contains('pua-item-cb')) return
          self.selPreset = this.getAttribute('data-id')
          self._render()
        })
        // Drag start
        el.addEventListener('dragstart', function(e) {
          this.classList.add('dragging')
          e.dataTransfer.setData('text/plain', this.getAttribute('data-id'))
        })
        el.addEventListener('dragend', function() { this.classList.remove('dragging') })
        el.addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('drag-over') })
        el.addEventListener('dragleave', function() { this.classList.remove('drag-over') })
        el.addEventListener('drop', function(e) {
          e.preventDefault()
          this.classList.remove('drag-over')
          self._reorderPreset(e.dataTransfer.getData('text/plain'), this.getAttribute('data-id'))
        })
      })(entryItems[ei])
    }

    // Toggle on/off in list (ES5: manual for loop)
    var toggleItems = listEl.querySelectorAll('.pua-toggle-item')
    for (var ti = 0; ti < toggleItems.length; ti++) {
      (function(el) {
        el.addEventListener('click', function(e) {
          e.stopPropagation()
          var id = this.getAttribute('data-id')
          for (var i = 0; i < self.presets.length; i++) {
            if (self.presets[i].id === id) { self.presets[i].on = !self.presets[i].on; break }
          }
          self._savePresets()
          self._render()
        })
      })(toggleItems[ti])
    }

    // --- Detail editor events ---

    // Title change (no auto-save, just update memory)
    var titleInput = this._contentEl ? this._contentEl.querySelector('.pua-preset-title') : null
    if (titleInput) {
      titleInput.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.presets.length; i++) {
          if (self.presets[i].id === id) { self.presets[i].title = this.value; break }
        }
      })
    }

    // Role change (no auto-save, just update memory)
    var roleSelect = this._contentEl ? this._contentEl.querySelector('.pua-preset-role') : null
    if (roleSelect) {
      roleSelect.addEventListener('change', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.presets.length; i++) {
          if (self.presets[i].id === id) { self.presets[i].role = this.value; break }
        }
      })
    }

    // Content change (no auto-save, just update memory)
    var contentTextarea = this._contentEl ? this._contentEl.querySelector('.pua-preset-content') : null
    if (contentTextarea) {
      contentTextarea.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.presets.length; i++) {
          if (self.presets[i].id === id) { self.presets[i].content = this.value; break }
        }
      })
    }

    // Output regex change (no auto-save, just update memory)
    var outRegexInput = this._contentEl ? this._contentEl.querySelector('.pua-preset-outregex') : null
    if (outRegexInput) {
      outRegexInput.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.presets.length; i++) {
          if (self.presets[i].id === id) { self.presets[i].outRegex = this.value; break }
        }
      })
    }

    // Input regex change (no auto-save, just update memory)
    var inRegexInput = this._contentEl ? this._contentEl.querySelector('.pua-preset-inregex') : null
    if (inRegexInput) {
      inRegexInput.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.presets.length; i++) {
          if (self.presets[i].id === id) { self.presets[i].inRegex = this.value; break }
        }
      })
    }

    // Output regex toggle
    var oRegexToggle = this._contentEl ? this._contentEl.querySelector('.pua-preset-oregex-toggle') : null
    if (oRegexToggle) {
      oRegexToggle.addEventListener('click', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.presets.length; i++) {
          if (self.presets[i].id === id) { self.presets[i].outRegexOn = !self.presets[i].outRegexOn; break }
        }
        self._savePresets()
        self._render()
      })
    }

    // Input regex toggle
    var iRegexToggle = this._contentEl ? this._contentEl.querySelector('.pua-preset-iregex-toggle') : null
    if (iRegexToggle) {
      iRegexToggle.addEventListener('click', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.presets.length; i++) {
          if (self.presets[i].id === id) { self.presets[i].inRegexOn = !self.presets[i].inRegexOn; break }
        }
        self._savePresets()
        self._render()
      })
    }

    // Depth min (no auto-save, just update memory)
    var dMinInput = this._contentEl ? this._contentEl.querySelector('.pua-preset-dmin') : null
    if (dMinInput) {
      dMinInput.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        var val = parseInt(this.value) || 0
        for (var i = 0; i < self.presets.length; i++) {
          if (self.presets[i].id === id) { self.presets[i].dMin = val; break }
        }
      })
    }

    // Depth max (no auto-save, just update memory)
    var dMaxInput = this._contentEl ? this._contentEl.querySelector('.pua-preset-dmax') : null
    if (dMaxInput) {
      dMaxInput.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        var val = this.value ? parseInt(this.value) : Infinity
        if (val < 0) val = 0
        for (var i = 0; i < self.presets.length; i++) {
          if (self.presets[i].id === id) { self.presets[i].dMax = val; break }
        }
      })
    }

    // Delete button
    var delBtn = this._contentEl ? this._contentEl.querySelector('.pua-preset-delete') : null
    if (delBtn) {
      delBtn.addEventListener('click', function() {
        var id = this.getAttribute('data-id')
        self._delPreset(id)
      })
    }

    // Checkbox: individual item select
    var itemCbs = listEl.querySelectorAll('.pua-item-cb')
    for (var ci = 0; ci < itemCbs.length; ci++) {
      (function(cb) {
        cb.addEventListener('change', function(e) {
          e.stopPropagation()
          var itemId = this.getAttribute('data-id')
          if (!self._selPresetIds) self._selPresetIds = []
          if (this.checked) {
            if (self._selPresetIds.indexOf(itemId) < 0) self._selPresetIds.push(itemId)
          } else {
            var ni = []
            for (var si = 0; si < self._selPresetIds.length; si++) {
              if (self._selPresetIds[si] !== itemId) ni.push(self._selPresetIds[si])
            }
            self._selPresetIds = ni
          }
          self._renderPresetsOnly()
        })
        cb.addEventListener('click', function(e) { e.stopPropagation() })
      })(itemCbs[ci])
    }

    // Checkbox: select all
    var selectAllCb = this._contentEl ? this._contentEl.querySelector('#preset-select-all') : null
    if (selectAllCb) {
      selectAllCb.addEventListener('change', function() {
        if (this.checked) {
          self._selPresetIds = []
          for (var ai = 0; ai < self.presets.length; ai++) self._selPresetIds.push(self.presets[ai].id)
        } else {
          self._selPresetIds = []
        }
        self._renderPresetsOnly()
      })
    }

    // Batch delete
    var batchDelBtn = this._contentEl ? this._contentEl.querySelector('#preset-batch-del') : null
    if (batchDelBtn) {
      batchDelBtn.addEventListener('click', function() {
        if (!self._selPresetIds || self._selPresetIds.length === 0) return
        if (!confirm('\u786E\u5B9A\u5220\u9664 ' + self._selPresetIds.length + ' \u4E2A\u9009\u4E2D\u7684\u9884\u8BBE\uFF1F')) return
        self._batchDelPresets()
      })
    }

    // Clear selection
    var clearSelBtn = this._contentEl ? this._contentEl.querySelector('#preset-clear-sel') : null
    if (clearSelBtn) {
      clearSelBtn.addEventListener('click', function() {
        self._selPresetIds = []
        self._renderPresetsOnly()
      })
    }

    // Move selected presets to another group
    var presetMoveBtn = this._contentEl ? this._contentEl.querySelector('#preset-move-to') : null
    if (presetMoveBtn) {
      presetMoveBtn.addEventListener('click', function() {
        self._showMoveToGroupDialog('preset')
      })
    }

    // Save button
    var saveBtn = this._contentEl ? this._contentEl.querySelector('#preset-save-btn') : null
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        self._savePresets()
        self._toast('\u9884\u8BBE\u5DF2\u4FDD\u5B58')
      })
    }

    // Mobile back button
    var mobileBackBtn = this._contentEl ? this._contentEl.querySelector('.pua-mobile-back') : null
    if (mobileBackBtn) {
      if (window.innerWidth < 768) mobileBackBtn.style.display = ''
      mobileBackBtn.addEventListener('click', function() {
        self.selPreset = ''
        self._render()
      })
    }
  }

  /* ── 预设排序 ── */
  P._reorderPreset = function(fromId, toId) {
    var fi = -1, ti = -1
    for (var i = 0; i < this.presets.length; i++) {
      if (this.presets[i].id === fromId) fi = i
      if (this.presets[i].id === toId) ti = i
    }
    if (fi < 0 || ti < 0) return
    var item = this.presets.splice(fi, 1)[0]
    this.presets.splice(ti, 0, item)
    this._savePresets()

    // 保存滚动位置
    var self = this
    var listBody = this._contentEl ? this._contentEl.querySelector('#pua-preset-list') : null
    var savedScroll = listBody ? listBody.scrollTop : 0

    this._render()

    // 下一帧恢复滚动位置
    setTimeout(function() {
      var newListBody = self._contentEl ? self._contentEl.querySelector('#pua-preset-list') : null
      if (newListBody && savedScroll > 0) {
        newListBody.scrollTop = savedScroll
      }
    }, 0)
  }

  /* ── 新增预设 ── */
  P._addPreset = function() {
    var id = 'p' + Date.now()
    this.presets.push({
      id: id,
      title: '\u65B0\u6761\u76EE',
      role: 'system',
      on: true,
      content: '',
      outRegex: '',
      outRegexOn: false,
      inRegex: '',
      inRegexOn: false,
      dMin: 0,
      dMax: Infinity
    })
    this.selPreset = id
    this._savePresets()
    this._render()
  }

  /* ── 删除预设 ── */
  P._delPreset = function(id) {
    var newPresets = []
    for (var i = 0; i < this.presets.length; i++) {
      if (this.presets[i].id !== id) newPresets.push(this.presets[i])
    }
    this.presets = newPresets
    if (this.selPreset === id) {
      this.selPreset = this.presets.length > 0 ? this.presets[0].id : ''
    }
    this._savePresets()
    this._render()
  }

  P._batchDelPresets = function() {
    if (!this._selPresetIds || this._selPresetIds.length === 0) return
    var delMap = {}
    for (var di = 0; di < this._selPresetIds.length; di++) delMap[this._selPresetIds[di]] = true
    var newPresets = []
    for (var i = 0; i < this.presets.length; i++) {
      if (!delMap[this.presets[i].id]) newPresets.push(this.presets[i])
    }
    this.presets = newPresets
    if (delMap[this.selPreset]) {
      this.selPreset = this.presets.length > 0 ? this.presets[0].id : ''
    }
    this._selPresetIds = []
    this._savePresets()
    this._toast('\u5DF2\u5220\u9664 ' + Object.keys(delMap).length + ' \u4E2A\u9884\u8BBE')
    this._render()
  }

  /* ── 移动选中条目到其他分组 ── */
  P._showMoveToGroupDialog = function(type) {
    var self = this
    var items = type === 'preset' ? this.presets : this.regexes
    var selIds = type === 'preset' ? (this._selPresetIds || []) : (this._selRegexIds || [])

    if (selIds.length === 0) {
      this._toast('\u8BF7\u5148\u9009\u4E2D\u8981\u79FB\u52A8\u7684\u6761\u76EE')
      return
    }

    // 收集现有分组名
    var groupSet = {}
    for (var i = 0; i < items.length; i++) {
      var g = items[i].group || '\u9ED8\u8BA4'
      groupSet[g] = true
    }
    var groupNames = Object.keys(groupSet)

    var modal = this._modalOverlay
    if (!modal) return

    var body = '<div style="margin-bottom:12px;font-size:11px;color:var(--pua-text-sub)">\u5C06 ' + selIds.length + ' \u4E2A\u6761\u76EE\u79FB\u52A8\u5230\uFF1A</div>'
    body += '<div style="display:flex;flex-direction:column;gap:8px">'

    // 现有分组选项
    for (var gi = 0; gi < groupNames.length; gi++) {
      body += '<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--pua-border);border-radius:8px;cursor:pointer;transition:var(--pua-transition)" class="pua-move-group-opt">'
      body += '<input type="radio" name="move-group-target" value="' + self._escHtml(groupNames[gi]) + '">'
      body += '<span style="font-size:11px;color:var(--pua-text)">' + self._escHtml(groupNames[gi]) + '</span>'
      body += '</label>'
    }

    // 新建分组选项
    body += '<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--pua-border);border-radius:8px;cursor:pointer;transition:var(--pua-transition)" class="pua-move-group-opt">'
    body += '<input type="radio" name="move-group-target" value="__new__">'
    body += '<span style="font-size:11px;color:var(--pua-accent-text)">\u65B0\u5EFA\u5206\u7EC4</span>'
    body += '</label>'
    body += '<input type="text" id="pua-move-new-group" class="pua-settings-input" placeholder="\u8F93\u5165\u65B0\u5206\u7EC4\u540D..." style="display:none;margin-top:4px">'
    body += '</div>'

    var modalBody = modal.querySelector('.pua-modal-body')
    if (!modalBody) return
    modalBody.innerHTML = body

    var modalTitle = modal.querySelector('.pua-modal-title')
    if (modalTitle) modalTitle.textContent = '\u79FB\u52A8\u5230\u5206\u7EC4'

    var footer = modal.querySelector('.pua-modal-footer')
    if (footer) footer.remove()
    footer = document.createElement('div')
    footer.className = 'pua-modal-footer'

    var cancelBtn = document.createElement('button')
    cancelBtn.className = 'pua-btn'
    cancelBtn.textContent = '\u53D6\u6D88'
    cancelBtn.addEventListener('click', function() { self._closeModal() })

    var confirmBtn = document.createElement('button')
    confirmBtn.className = 'pua-btn pua-btn-gold'
    confirmBtn.textContent = '\u786E\u8BA4\u79FB\u52A8'
    confirmBtn.addEventListener('click', function() {
      var radio = modal.querySelector('input[name="move-group-target"]:checked')
      if (!radio) {
        self._toast('\u8BF7\u9009\u62E9\u76EE\u6807\u5206\u7EC4')
        return
      }
      var targetGroup = radio.value
      if (targetGroup === '__new__') {
        var newGroupInput = modal.querySelector('#pua-move-new-group')
        targetGroup = newGroupInput ? newGroupInput.value.trim() : ''
        if (!targetGroup) {
          self._toast('\u8BF7\u8F93\u5165\u65B0\u5206\u7EC4\u540D')
          return
        }
      }
      self._moveItemsToGroup(type, selIds, targetGroup)
    })

    footer.appendChild(cancelBtn)
    footer.appendChild(confirmBtn)
    var modalInner = modal.querySelector('.pua-modal')
    if (modalInner) modalInner.appendChild(footer)

    // 监听"新建分组"选项，显示/隐藏输入框
    var newGroupInput = modal.querySelector('#pua-move-new-group')
    var radios = modal.querySelectorAll('input[name="move-group-target"]')
    for (var ri = 0; ri < radios.length; ri++) {
      radios[ri].addEventListener('change', function() {
        if (newGroupInput) {
          newGroupInput.style.display = this.value === '__new__' ? '' : 'none'
        }
      })
    }

    modal.classList.add('show')
  }

  P._moveItemsToGroup = function(type, selIds, targetGroup) {
    var items = type === 'preset' ? this.presets : this.regexes
    var moved = 0
    for (var i = 0; i < items.length; i++) {
      if (selIds.indexOf(items[i].id) >= 0) {
        items[i].group = targetGroup
        moved++
      }
    }
    if (type === 'preset') {
      this._selPresetIds = []
      this._savePresets()
    } else {
      this._selRegexIds = []
      this._saveRegexes()
    }
    this._closeModal()
    this._toast('\u5DF2\u79FB\u52A8 ' + moved + ' \u4E2A\u6761\u76EE\u5230 [' + targetGroup + ']')
    this._render()
  }

  P._renderPresetsOnly = function() {
    var titleEl = this._titleEl
    var actionsEl = this._actionsEl
    var contentEl = this._contentEl
    if (titleEl && actionsEl && contentEl) {
      this._renderPresets(titleEl, actionsEl, contentEl)
    } else {
      this._render()
    }
  }

  /* ── 导入Roche预设对话框 ── */
  P._importPresetDialog = function() {
    var self = this
    var modal = this._modalOverlay
    console.log('[PUA] _importPresetDialog called, modal=' + (modal ? 'exists' : 'NULL'))
    if (!modal) return

    var body = ''
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">\u5BFC\u5165 Roche \u9884\u8BBE</div>'
    body += '<div style="border:2px dashed var(--pua-border);border-radius:8px;padding:20px;text-align:center;cursor:pointer;transition:var(--pua-transition)" id="pua-preset-import-zone">'
    body += '<div style="font-size:24px;opacity:0.3;margin-bottom:8px">\u2B07</div>'
    body += '<div style="font-size:11px;color:var(--pua-text-sub)">\u70B9\u51FB\u9009\u62E9 Roche \u5BFC\u51FA\u7684\u9884\u8BBE JSON \u6587\u4EF6</div>'
    body += '<input type="file" id="pua-preset-import-file" accept=".json" style="display:none">'
    body += '</div>'
    body += '<div class="pua-field-hint">\u652F\u6301 Roche \u5BFC\u51FA\u7684\u9884\u8BBE JSON \u683C\u5F0F\uFF0C\u5305\u542B\u5206\u7C7B\u548C\u6761\u76EE</div>'
    body += '</div>'
    body += '<div id="pua-preset-import-preview" style="display:none">'
    body += '<div style="font-size:10px;color:var(--pua-accent);font-weight:600;margin-bottom:6px">\u89E3\u6790\u7ED3\u679C\u9884\u89C8</div>'
    body += '<div id="pua-preset-import-result" style="max-height:200px;overflow-y:auto;font-size:10px;color:var(--pua-text-sub);background:var(--pua-bg-input);border-radius:6px;padding:8px;line-height:1.5"></div>'
    body += '</div>'

    var modalBody = modal.querySelector('.pua-modal-body')
    if (!modalBody) return
    modalBody.innerHTML = body

    var modalTitle = modal.querySelector('.pua-modal-title')
    if (modalTitle) modalTitle.textContent = '\u5BFC\u5165\u9884\u8BBE'

    var footer = modal.querySelector('.pua-modal-footer')
    if (footer) footer.remove()
    footer = document.createElement('div')
    footer.className = 'pua-modal-footer'
    var cancelBtn = document.createElement('button')
    cancelBtn.className = 'pua-btn'
    cancelBtn.textContent = '\u53D6\u6D88'
    cancelBtn.addEventListener('click', function() { self._closeModal() })
    var confirmBtn = document.createElement('button')
    confirmBtn.className = 'pua-btn pua-btn-gold'
    confirmBtn.textContent = '\u786E\u8BA4\u5BFC\u5165'
    confirmBtn.id = 'pua-preset-import-confirm'
    confirmBtn.style.display = 'none'
    confirmBtn.addEventListener('click', function() { self._doImportPreset() })
    footer.appendChild(cancelBtn)
    footer.appendChild(confirmBtn)
    var modalInner = modal.querySelector('.pua-modal')
    if (modalInner) modalInner.appendChild(footer)

    // File selection
    var zone = modal.querySelector('#pua-preset-import-zone')
    var fileInput = modal.querySelector('#pua-preset-import-file')
    if (zone && fileInput) {
      zone.addEventListener('click', function() { fileInput.click() })
      fileInput.addEventListener('change', function() {
        if (fileInput.files && fileInput.files.length) {
          self._readPresetFile(fileInput.files[0])
        }
      })
    }

    modal.classList.add('show')
  }

  /* ── 读取预设文件 ── */
  P._readPresetFile = function(file) {
    var self = this
    console.log('[PUA] _readPresetFile called, file=' + file.name)
    var reader = new FileReader()
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result)
        self._parsedPresetData = data
        var modal = self._modalOverlay
        console.log('[PUA] _readPresetFile parsed, modal=' + (modal ? 'exists' : 'NULL') + ' data type=' + data.type + ' has categories=' + !!(data.categories) + ' has presets=' + !!(data.presets))
        var previewEl = modal ? modal.querySelector('#pua-preset-import-preview') : null
        var resultEl = modal ? modal.querySelector('#pua-preset-import-result') : null
        var confirmBtn = modal ? modal.querySelector('#pua-preset-import-confirm') : null
        console.log('[PUA] _readPresetFile elements: preview=' + (previewEl ? 'found' : 'NULL') + ' result=' + (resultEl ? 'found' : 'NULL') + ' confirm=' + (confirmBtn ? 'found' : 'NULL'))
        if (!previewEl || !resultEl) return

        if (data && data.type === 'pua_plugin_presets' && data.presets && Array.isArray(data.presets)) {
          // 插件格式
          var html = '<div style="margin-bottom:6px;padding:6px;border:1px solid var(--pua-border);border-radius:4px">'
          html += '<div style="font-weight:600;color:var(--pua-accent-text)">\u63D2\u4EF6\u683C\u5F0F\u5BFC\u5165</div>'
          html += '<div style="font-size:9px;color:var(--pua-text-dim)">' + data.presets.length + ' \u4E2A\u6761\u76EE</div>'
          html += '</div>'
          html += '<div style="font-size:11px;color:var(--pua-user);font-weight:600;margin-top:4px">\u5171 ' + data.presets.length + ' \u4E2A\u9884\u8BBE\u6761\u76EE\uFF0C\u70B9\u51FB\u786E\u8BA4\u5BFC\u5165</div>'
          resultEl.innerHTML = html
          previewEl.style.display = 'block'
          if (confirmBtn) confirmBtn.style.display = ''
        } else if (data && data.categories && Array.isArray(data.categories)) {
          var count = 0
          var html = ''
          for (var ci = 0; ci < data.categories.length; ci++) {
            var cat = data.categories[ci]
            var presets = cat.presets || cat.entries || []
            html += '<div style="margin-bottom:6px;padding:6px;border:1px solid var(--pua-border);border-radius:4px">'
            html += '<div style="font-weight:600;color:var(--pua-accent-text)">' + self._escHtml(cat.name || '\u672A\u547D\u540D\u5206\u7C7B') + '</div>'
            html += '<div style="font-size:9px;color:var(--pua-text-dim)">' + presets.length + ' \u4E2A\u6761\u76EE</div>'
            html += '</div>'
            count += presets.length
          }
          html += '<div style="font-size:11px;color:var(--pua-user);font-weight:600;margin-top:4px">\u5171 ' + count + ' \u4E2A\u9884\u8BBE\u6761\u76EE\uFF0C\u70B9\u51FB\u786E\u8BA4\u5BFC\u5165</div>'
          resultEl.innerHTML = html
          previewEl.style.display = 'block'
          if (confirmBtn) confirmBtn.style.display = ''
        } else if (data && data.presets && Array.isArray(data.presets)) {
          // Direct presets array (Roche single-category format)
          var html = '<div style="margin-bottom:6px;padding:6px;border:1px solid var(--pua-border);border-radius:4px">'
          html += '<div style="font-weight:600;color:var(--pua-accent-text)">\u5BFC\u5165\u9884\u8BBE</div>'
          html += '<div style="font-size:9px;color:var(--pua-text-dim)">' + data.presets.length + ' \u4E2A\u6761\u76EE</div>'
          html += '</div>'
          html += '<div style="font-size:11px;color:var(--pua-user);font-weight:600;margin-top:4px">\u5171 ' + data.presets.length + ' \u4E2A\u9884\u8BBE\u6761\u76EE\uFF0C\u70B9\u51FB\u786E\u8BA4\u5BFC\u5165</div>'
          resultEl.innerHTML = html
          previewEl.style.display = 'block'
          if (confirmBtn) confirmBtn.style.display = ''
        } else {
          resultEl.textContent = '\u65E0\u6CD5\u8BC6\u522B\u7684\u683C\u5F0F\uFF0C\u8BF7\u786E\u8BA4\u6587\u4EF6\u4E3A\u6709\u6548\u7684\u9884\u8BBE JSON'
          previewEl.style.display = 'block'
        }
      } catch(err) {
        console.warn('[PUA] preset parse error', err)
        var modal = self._modalOverlay
        var resultEl = modal ? modal.querySelector('#pua-preset-import-result') : null
        if (resultEl) resultEl.textContent = '\u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u786E\u8BA4\u6587\u4EF6\u4E3A\u6709\u6548\u7684 JSON \u683C\u5F0F'
        var previewEl = modal ? modal.querySelector('#pua-preset-import-preview') : null
        if (previewEl) previewEl.style.display = 'block'
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  /* ── 执行导入预设 ── */
  P._doImportPreset = function() {
    console.log('[PUA] _doImportPreset called, parsedData=' + (this._parsedPresetData ? 'exists' : 'NULL'))
    if (!this._parsedPresetData) {
      this._toast('\u6CA1\u6709\u53EF\u5BFC\u5165\u7684\u6570\u636E')
      return
    }
    var data = this._parsedPresetData
    console.log('[PUA] _doImportPreset data type=' + data.type + ' has categories=' + !!(data.categories) + ' has presets=' + !!(data.presets))
    var count = 0
    var importName = data.groupName || ('\u5BFC\u5165-' + new Date().toLocaleString('zh-CN', {month:'2-digit',day:'numeric',hour:'2-digit',minute:'2-digit'}))

    // 构建导入条目数组（不直接操作 this.presets）
    var newItems = []

    if (data.type === 'pua_plugin_presets' && data.presets && Array.isArray(data.presets)) {
      for (var pi0 = 0; pi0 < data.presets.length; pi0++) {
        var src0 = data.presets[pi0]
        newItems.push({
          id: 'p' + Date.now() + '_' + count,
          title: (src0.title || '\u672A\u547D\u540D') + ' [' + importName + ']',
          role: src0.role || 'system',
          on: src0.on !== undefined ? src0.on : true,
          content: src0.content || '',
          outRegex: src0.outRegex || '',
          outRegexOn: src0.outRegexOn || false,
          inRegex: src0.inRegex || '',
          inRegexOn: src0.inRegexOn || false,
          dMin: src0.dMin || 0,
          dMax: src0.dMax || Infinity,
          group: '\u9ED8\u8BA4'
        })
        count++
      }
    } else if (data.categories && Array.isArray(data.categories)) {
      for (var ci = 0; ci < data.categories.length; ci++) {
        var cat = data.categories[ci]
        var catName = cat.name || '\u672A\u547D\u540D\u5206\u7C7B'
        var presets = cat.presets || cat.entries || []
        for (var pi = 0; pi < presets.length; pi++) {
          var src = presets[pi]
          newItems.push({
            id: 'p' + Date.now() + '_' + count,
            title: (src.title || '\u672A\u547D\u540D') + ' [' + catName + ']',
            role: 'system',
            on: true,
            content: src.content || '',
            outRegex: src.outputRegex || '',
            outRegexOn: src.isOutputRegexEnabled || false,
            inRegex: src.inputRegex || '',
            inRegexOn: src.isInputRegexEnabled || false,
            dMin: 0,
            dMax: Infinity,
            group: catName
          })
          count++
        }
      }
    } else if (data.presets && Array.isArray(data.presets)) {
      for (var pi2 = 0; pi2 < data.presets.length; pi2++) {
        var src2 = data.presets[pi2]
        newItems.push({
          id: 'p' + Date.now() + '_' + pi2,
          title: (src2.title || '\u672A\u547D\u540D') + ' [' + importName + ']',
          role: 'system',
          on: true,
          content: src2.content || '',
          outRegex: src2.outputRegex || '',
          outRegexOn: src2.isOutputRegexEnabled || false,
          inRegex: src2.inputRegex || '',
          inRegexOn: src2.isInputRegexEnabled || false,
          dMin: 0,
          dMax: Infinity,
          group: '\u9ED8\u8BA4'
        })
        count++
      }
    }

    if (newItems.length === 0) {
      this._toast('\u6CA1\u6709\u53EF\u5BFC\u5165\u7684\u6761\u76EE')
      return
    }

    // 在 _promptPresetData 中新建一个预设工作区
    if (!this._promptPresetData) {
      this._promptPresetData = { presets: [], activePresetId: '' }
    }
    var newWorkspace = {
      id: 'ppreset-' + Date.now(),
      name: importName,
      items: newItems
    }
    this._promptPresetData.presets.push(newWorkspace)
    this._promptPresetData.activePresetId = newWorkspace.id

    // 切换到新工作区
    this.presets = newItems
    this.selPreset = newItems.length > 0 ? newItems[0].id : ''
    this._selPresetIds = []

    this._parsedPresetData = null
    this._savePresets()
    this._savePromptPresets()
    this._closeModal()
    this._toast('\u5DF2\u5BFC\u5165 ' + count + ' \u4E2A\u9884\u8BBE\u6761\u76EE \u2192 [' + importName + ']')
    this._render()
  }

  /* ── 导出Roche预设 ── */
  P._exportPresets = function() {
    if (this.presets.length === 0) {
      this._toast('\u6CA1\u6709\u53EF\u5BFC\u51FA\u7684\u9884\u8BBE')
      return
    }
    var self = this
    var modal = this._modalOverlay
    if (!modal) return

    var body = '<div style="margin-bottom:12px;font-size:11px;color:var(--pua-text-sub)">\u8BF7\u9009\u62E9\u5BFC\u51FA\u683C\u5F0F\uFF1A</div>'
    body += '<div style="display:flex;flex-direction:column;gap:8px">'
    body += '<label style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--pua-border);border-radius:8px;cursor:pointer;transition:var(--pua-transition)" id="export-preset-roche">'
    body += '<input type="radio" name="export-preset-fmt" value="roche" checked>'
    body += '<div><div style="font-size:11px;font-weight:600;color:var(--pua-accent-text)">Roche \u539F\u751F\u683C\u5F0F</div><div style="font-size:9px;color:var(--pua-text-dim)">\u53EF\u76F4\u63A5\u5BFC\u5165 Roche \u7684\u9884\u8BBE\u7CFB\u7EDF</div></div>'
    body += '</label>'
    body += '<label style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--pua-border);border-radius:8px;cursor:pointer;transition:var(--pua-transition)" id="export-preset-plugin">'
    body += '<input type="radio" name="export-preset-fmt" value="plugin">'
    body += '<div><div style="font-size:11px;font-weight:600;color:var(--pua-accent-text)">\u63D2\u4EF6\u683C\u5F0F</div><div style="font-size:9px;color:var(--pua-text-dim)">\u5E73\u884C\u65F6\u7A7A\u63D2\u4EF6\u5185\u90E8\u683C\u5F0F\uFF0C\u5305\u542B\u5B8C\u6574\u914D\u7F6E</div></div>'
    body += '</label>'
    body += '</div>'

    var modalBody = modal.querySelector('.pua-modal-body')
    if (!modalBody) return
    modalBody.innerHTML = body

    var modalTitle = modal.querySelector('.pua-modal-title')
    if (modalTitle) modalTitle.textContent = '\u5BFC\u51FA\u9884\u8BBE'

    var footer = modal.querySelector('.pua-modal-footer')
    if (footer) footer.remove()
    footer = document.createElement('div')
    footer.className = 'pua-modal-footer'
    var cancelBtn = document.createElement('button')
    cancelBtn.className = 'pua-btn'
    cancelBtn.textContent = '\u53D6\u6D88'
    cancelBtn.addEventListener('click', function() { self._closeModal() })
    var confirmBtn = document.createElement('button')
    confirmBtn.className = 'pua-btn pua-btn-gold'
    confirmBtn.textContent = '\u786E\u8BA4\u5BFC\u51FA'
    confirmBtn.addEventListener('click', function() {
      var radio = modal.querySelector('input[name="export-preset-fmt"]:checked')
      var fmt = radio ? radio.value : 'roche'
      var data, filename
      if (fmt === 'roche') {
        var exportPresets = []
        for (var i = 0; i < self.presets.length; i++) {
          var p = self.presets[i]
          exportPresets.push({
            title: p.title,
            content: p.content,
            outputRegex: p.outRegex || '',
            isOutputRegexEnabled: p.outRegexOn || false,
            inputRegex: p.inRegex || '',
            isInputRegexEnabled: p.inRegexOn || false
          })
        }
        data = {
          version: 1,
          type: 'roche_presets',
          categories: [{ name: '\u5E73\u884C\u65F6\u7A7A\u5BFC\u51FA', presets: exportPresets }]
        }
        filename = 'parallel-universe-presets-' + Date.now() + '.json'
      } else {
        data = { version: 1, type: 'pua_plugin_presets', presets: self.presets }
        filename = 'parallel-universe-presets-plugin-' + Date.now() + '.json'
      }
      self._downloadFile(JSON.stringify(data, null, 2), filename, 'application/json')
      self._toast('\u9884\u8BBE\u5DF2\u5BFC\u51FA: ' + filename)
      self._closeModal()
    })
    footer.appendChild(cancelBtn)
    footer.appendChild(confirmBtn)
    var modalInner = modal.querySelector('.pua-modal')
    if (modalInner) modalInner.appendChild(footer)

    modal.classList.add('show')
  }

  /* ════════════════════════════════════════════════════════════
     正则管理页面
     ════════════════════════════════════════════════════════════ */

  P._renderRegexes = function(titleEl, actionsEl, contentEl) {
    var self = this
    titleEl.textContent = '\u6B63\u5219\u7BA1\u7406'
    actionsEl.innerHTML = ''

    // Import button
    var importBtn = document.createElement('button')
    importBtn.className = 'pua-btn'
    importBtn.textContent = '\u5BFC\u5165'
    importBtn.addEventListener('click', function() { self._importRegexDialog() })
    actionsEl.appendChild(importBtn)

    // Export button
    var exportBtn = document.createElement('button')
    exportBtn.className = 'pua-btn'
    exportBtn.textContent = '\u21E1 \u5BFC\u51FA'
    exportBtn.addEventListener('click', function() { self._exportRegexes() })
    actionsEl.appendChild(exportBtn)

    // Add button
    var addBtn = document.createElement('button')
    addBtn.className = 'pua-btn pua-btn-gold'
    addBtn.textContent = '+ \u65B0\u589E'
    addBtn.addEventListener('click', function() { self._addRegex() })
    actionsEl.appendChild(addBtn)

    var selRegex = null
    for (var i = 0; i < this.regexes.length; i++) {
      if (this.regexes[i].id === this.selRegex) { selRegex = this.regexes[i]; break }
    }

    // ── 正则预设选择器 ──
    var rpData = this._regexPresetData || { presets: [], activePresetId: '' }
    var rpPresets = rpData.presets || []
    var rpActiveId = rpData.activePresetId || ''

    var presetBar = '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;flex-wrap:wrap">'
    presetBar += '<select class="pua-settings-select" id="regex-preset-select" style="flex:1;min-width:120px">'
    for (var rpi = 0; rpi < rpPresets.length; rpi++) {
      presetBar += '<option value="' + rpPresets[rpi].id + '"' + (rpPresets[rpi].id === rpActiveId ? ' selected' : '') + '>' + self._escHtml(rpPresets[rpi].name) + '</option>'
    }
    presetBar += '</select>'
    presetBar += '<button class="pua-btn pua-btn-sm" id="regex-preset-save">\u4FDD\u5B58\u9884\u8BBE</button>'
    presetBar += '<button class="pua-btn pua-btn-sm" id="regex-preset-new">\u65B0\u5EFA\u9884\u8BBE</button>'
    presetBar += '<button class="pua-btn pua-btn-sm" id="regex-preset-rename">\u91CD\u547D\u540D</button>'
    presetBar += '<button class="pua-btn pua-btn-sm pua-btn-danger" id="regex-preset-delete">\u5220\u9664\u9884\u8BBE</button>'
    presetBar += '</div>'

    var h = presetBar + '<div class="pua-panel-layout">'

    // === Left: Item list ===
    var mobileHideList = (window.innerWidth < 768 && selRegex) ? ' pua-mobile-hide' : ''
    var selRegexIds = this._selRegexIds || []
    var hasSelRegex = selRegexIds.length > 0
    h += '<div class="pua-glass pua-panel-list' + mobileHideList + '">'
    h += '<div class="pua-panel-header">'
    h += '<input type="checkbox" class="pua-select-all-cb" id="regex-select-all"' + (hasSelRegex && selRegexIds.length === this.regexes.length ? ' checked' : '') + '>'
    h += '<span>\u6B63\u5219\u6761\u76EE</span><span style="font-size:10px;color:var(--pua-text-dim)">' + this.regexes.length + ' \u9879</span>'
    if (hasSelRegex) { h += '<span class="pua-selected-count">' + selRegexIds.length + '</span>' }
    h += '</div>'
    if (hasSelRegex) {
      h += '<div class="pua-batch-del-bar"><button class="pua-btn pua-btn-danger pua-btn-sm" id="regex-batch-del">\u1F5D1 \u5220\u9664\u9009\u4E2D (' + selRegexIds.length + ')</button><button class="pua-btn pua-btn-sm" id="regex-move-to">\u2192 \u79FB\u52A8\u5230</button><button class="pua-btn pua-btn-sm" id="regex-clear-sel">\u53D6\u6D88\u9009\u4E2D</button></div>'
    }
    h += '<div class="pua-panel-body" id="pua-regex-list">'

    // Group regexes by 'group' field
    var rGroups = {}
    var rGroupOrder = []
    for (var rgi = 0; rgi < this.regexes.length; rgi++) {
      var rgName = this.regexes[rgi].group || '\u9ED8\u8BA4'
      if (!rGroups[rgName]) { rGroups[rgName] = []; rGroupOrder.push(rgName) }
      rGroups[rgName].push(this.regexes[rgi])
    }
    for (var rgoi = 0; rgoi < rGroupOrder.length; rgoi++) {
      var rgk = rGroupOrder[rgoi]
      var rgItems = rGroups[rgk]
      if (rGroupOrder.length > 1 || rgk !== '\u9ED8\u8BA4') {
        h += '<div class="pua-group-header"><span>' + self._escHtml(rgk) + '</span><span style="font-size:9px;color:var(--pua-text-dim)">' + rgItems.length + ' \u9879</span></div>'
      }
      for (var j = 0; j < rgItems.length; j++) {
      var r = rgItems[j]
      var typeClass, typeLabel
      if (r.type === 'render') {
        typeClass = 'pua-regex-type-render'
        typeLabel = '前端渲染'
      } else if (r.type === 'filter') {
        typeClass = 'pua-regex-type-filter'
        typeLabel = '后端过滤'
      } else if (r.type === 'replace') {
        typeClass = 'pua-regex-type-replace'
        typeLabel = '后端替换'
      } else {
        typeClass = 'pua-regex-type-prompt'
        typeLabel = '后端过滤'
      }
      var isRChecked = selRegexIds.indexOf(r.id) >= 0
      h += '<div class="pua-entry-item' + (r.id === this.selRegex ? ' selected' : '') + (isRChecked ? ' pua-entry-checked' : '') + '" data-id="' + r.id + '" draggable="true">'
      h += '<input type="checkbox" class="pua-item-cb" data-id="' + r.id + '"' + (isRChecked ? ' checked' : '') + '>'
      h += '<span class="pua-drag-handle">\u2630</span>'
      h += '<div class="pua-entry-info"><div class="pua-entry-title">' + self._escHtml(r.name) + '</div>'
      h += '<div class="pua-entry-sub"><span class="pua-regex-type ' + typeClass + '">' + typeLabel + '</span>' + (r.on ? '' : ' \u00B7 \u7981\u7528') + '</div></div>'
        h += '<button class="pua-toggle-item' + (r.on ? ' on' : '') + '" data-id="' + r.id + '"></button>'
        h += '</div>'
      }
    }
    h += '</div></div>'

    // === Right: Detail editor ===
    var mobileShowClass = (window.innerWidth < 768 && selRegex) ? ' show' : ''
    h += '<div class="pua-glass pua-panel-detail' + mobileShowClass + '">'
    if (selRegex) {
      // Header: name + type + delete + mobile back
      h += '<div class="pua-detail-header">'
      h += '<div class="pua-field" style="margin:0"><div class="pua-field-label">\u540D\u79F0</div>'
      h += '<input class="pua-field-input pua-regex-name" style="width:180px" value="' + self._escHtml(selRegex.name) + '" data-id="' + selRegex.id + '"></div>'
      h += '<div class="pua-field" style="margin:0"><div class="pua-field-label">\u7C7B\u578B</div>'
      h += '<select class="pua-field-input pua-field-select pua-regex-type-select" style="width:150px" data-id="' + selRegex.id + '">'
      h += '<option value="render"' + (selRegex.type === 'render' ? ' selected' : '') + '>前端渲染 (Render)</option>'
      h += '<option value="prompt"' + (selRegex.type === 'prompt' ? ' selected' : '') + '>后端过滤 (Prompt)</option>'
      h += '<option value="filter"' + (selRegex.type === 'filter' ? ' selected' : '') + '>后端过滤 (Filter)</option>'
      h += '<option value="replace"' + (selRegex.type === 'replace' ? ' selected' : '') + '>后端替换 (Replace)</option>'
      h += '</select></div>'
      h += '<div style="flex:1"></div>'
      h += '<button class="pua-btn pua-btn-sm pua-mobile-back-regex" style="display:none" data-id="' + selRegex.id + '">\u2190 \u8FD4\u56DE\u5217\u8868</button>'
      h += '<button class="pua-btn pua-btn-danger pua-btn-sm pua-regex-delete" data-id="' + selRegex.id + '">\u5220\u9664</button>'
      h += '<button class="pua-btn pua-btn-sm" id="regex-save-btn" style="background:var(--pua-accent);color:#000">\u4FDD\u5B58</button>'
      h += '</div>'
      // Content area
      h += '<div class="pua-detail-body">'
      h += '<div class="pua-detail-content">'
      // Regex pattern textarea
      h += '<div style="margin-bottom:8px">'
      h += '<div class="pua-field-label" style="margin-bottom:3px">\u5339\u914D\u6A21\u5F0F</div>'
      h += '<textarea class="pua-regex-textarea pua-regex-pattern" data-id="' + selRegex.id + '" placeholder="\u8F93\u5165\u6B63\u5219\u8868\u8FBE\u5F0F...">' + self._escHtml(selRegex.regex) + '</textarea>'
      h += '<div class="pua-regex-hint">\u6B63\u5219\u8868\u8FBE\u5F0F\uFF0C\u7528\u4E8E\u5339\u914D\u6587\u672C\u5185\u5BB9</div>'
      h += '</div>'
      // Replacement template textarea
      h += '<div style="flex:1;display:flex;flex-direction:column">'
      h += '<div class="pua-field-label" style="margin-bottom:3px">\u66FF\u6362\u6A21\u677F</div>'
      h += '<textarea class="pua-detail-textarea pua-regex-html" data-id="' + selRegex.id + '" placeholder="\u8F93\u5165\u66FF\u6362\u6A21\u677F...">' + self._escHtml(selRegex.html) + '</textarea>'
      var typeHint = selRegex.type === 'render' ? '前端渲染：仅影响显示，不影响发送给AI的内容' : selRegex.type === 'replace' ? '后端替换：替换发送给AI的文本内容' : '后端过滤：过滤/替换发送给AI的文本内容'
      h += '<div class="pua-regex-hint">' + typeHint + '</div>'
      h += '</div>'
      h += '</div>'
      // 如果是 render 类型，添加预览区域
      if (selRegex.type === 'render') {
        h += '<div class="pua-field" style="margin-top:10px">'
        h += '<div class="pua-field-label">\u6E32\u67D3\u9884\u89C8</div>'
        h += '<div style="display:flex;gap:6px;margin-bottom:6px">'
        h += '<button class="pua-btn pua-btn-sm" id="regex-template-preview-btn">\u6A21\u677F\u9884\u89C8</button>'
        h += '</div>'
        h += '<div id="regex-preview-result" style="background:var(--pua-bg-input);border:1px solid var(--pua-border);border-radius:6px;padding:10px;min-height:60px;font-size:12px;color:var(--pua-text);overflow:auto;max-height:200px"></div>'
        h += '</div>'
      }
      // Depth section
      var dMin = selRegex.dMin || 0
      var dMaxStr = selRegex.dMax === Infinity ? '' : String(selRegex.dMax || '')
      h += '<div class="pua-regex-section">'
      h += '<div class="pua-regex-section-title"> \u751F\u6548\u6DF1\u5EA6</div>'
      h += '<div class="pua-depth-row"><span class="pua-depth-label">\u6DF1\u5EA6\u8303\u56F4</span>'
      h += '<input class="pua-depth-input pua-regex-dmin" type="number" value="' + dMin + '" min="0" data-id="' + selRegex.id + '">'
      h += '<span class="pua-depth-sep">~</span>'
      h += '<input class="pua-depth-input pua-regex-dmax" type="number" value="' + dMaxStr + '" min="0" placeholder="\u221E" data-id="' + selRegex.id + '">'
      h += '<span class="pua-depth-label">(0=\u6700\u65B0,\u7A7A=\u221E)</span></div>'
      h += '</div>'
      // Footer
      var regexLen = selRegex.regex ? selRegex.regex.length : 0
      var htmlLen = selRegex.html ? selRegex.html.length : 0
      h += '<div class="pua-detail-footer">'
      h += '<span>\u5339\u914D: ' + regexLen + ' \u5B57\u7B26</span>'
      h += '<span>\u66FF\u6362: ' + htmlLen + ' \u5B57\u7B26</span>'
      h += '<span>\u7C7B\u578B: ' + (selRegex.type === 'render' ? '前端渲染' : selRegex.type === 'replace' ? '后端替换' : '后端过滤') + '</span>'
      h += '<span>\u6DF1\u5EA6: ' + dMin + ' ~ ' + (selRegex.dMax === Infinity ? '\u221E' : String(selRegex.dMax)) + '</span>'
      h += '</div>'
    } else {
      // Empty state
      h += '<div class="pua-empty" style="height:100%"><div class="pua-empty-icon">\u2733</div><div class="pua-empty-text">\u9009\u62E9\u5DE6\u4FA7\u7684\u6761\u76EE\u6765\u7F16\u8F91</div></div>'
    }
    h += '</div></div>'

    contentEl.innerHTML = h

    // ── 正则预设事件绑定 ──
    var rpSelect = contentEl.querySelector('#regex-preset-select')
    if (rpSelect) {
      rpSelect.addEventListener('change', function() {
        if (!self._regexPresetData) return
        // \u5148\u4FDD\u5B58\u5F53\u524D\u5DE5\u4F5C\u533A\u7684 regexes
        var oldActiveId = self._regexPresetData.activePresetId
        var oldPs = self._regexPresetData.presets || []
        for (var ok = 0; ok < oldPs.length; ok++) {
          if (oldPs[ok].id === oldActiveId) { oldPs[ok].regexes = self.regexes.slice(); break }
        }
        self._regexPresetData.activePresetId = this.value
        var target = null
        var ps = self._regexPresetData.presets || []
        for (var k = 0; k < ps.length; k++) {
          if (ps[k].id === this.value) { target = ps[k]; break }
        }
        if (target && target.regexes) {
          self.regexes = target.regexes
          self.selRegex = self.regexes.length > 0 ? self.regexes[0].id : ''
          self._saveRegexes()
        }
        self._saveRegexPresets()
        self._render()
      })
    }
    var rpSaveBtn = contentEl.querySelector('#regex-preset-save')
    if (rpSaveBtn) {
      rpSaveBtn.addEventListener('click', function() {
        if (!self._regexPresetData) return
        var activeId = self._regexPresetData.activePresetId
        var ps = self._regexPresetData.presets || []
        for (var k = 0; k < ps.length; k++) {
          if (ps[k].id === activeId) { ps[k].regexes = self.regexes.slice(); break }
        }
        self._saveRegexPresets()
        self._toast('\u6B63\u5219\u9884\u8BBE\u5DF2\u4FDD\u5B58')
      })
    }
    var rpNewBtn = contentEl.querySelector('#regex-preset-new')
    if (rpNewBtn) {
      rpNewBtn.addEventListener('click', function() {
        var name = prompt('\u8BF7\u8F93\u5165\u9884\u8BBE\u540D\u79F0', '\u65B0\u6B63\u5219\u9884\u8BBE')
        if (!name) return
        if (!self._regexPresetData) {
          self._regexPresetData = { presets: [], activePresetId: '' }
        }
        var newP = { id: 'rpreset-' + Date.now(), name: name, regexes: self.regexes.slice() }
        self._regexPresetData.presets.push(newP)
        self._regexPresetData.activePresetId = newP.id
        self._saveRegexPresets()
        self._render()
      })
    }
    var rpRenameBtn = contentEl.querySelector('#regex-preset-rename')
    if (rpRenameBtn) {
      rpRenameBtn.addEventListener('click', function() {
        if (!self._regexPresetData) return
        var cur = self._regexPresetData.activePresetId
        var p = null
        var ps = self._regexPresetData.presets || []
        for (var k = 0; k < ps.length; k++) {
          if (ps[k].id === cur) { p = ps[k]; break }
        }
        if (!p) return
        var name = prompt('\u91CD\u547D\u540D\u9884\u8BBE', p.name)
        if (!name) return
        p.name = name
        self._saveRegexPresets()
        self._render()
      })
    }
    var rpDeleteBtn = contentEl.querySelector('#regex-preset-delete')
    if (rpDeleteBtn) {
      rpDeleteBtn.addEventListener('click', function() {
        if (!self._regexPresetData) return
        var ps = self._regexPresetData.presets || []
        if (ps.length <= 1) { self._toast('\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u9884\u8BBE'); return }
        if (!confirm('\u786E\u5B9A\u5220\u9664\u5F53\u524D\u9884\u8BBE\uFF1F')) return
        var cur = self._regexPresetData.activePresetId
        var newPs = []
        for (var k = 0; k < ps.length; k++) {
          if (ps[k].id !== cur) newPs.push(ps[k])
        }
        self._regexPresetData.presets = newPs
        self._regexPresetData.activePresetId = newPs[0] ? newPs[0].id : ''
        // 加载新激活预设的正则
        var target = null
        for (var k2 = 0; k2 < newPs.length; k2++) {
          if (newPs[k2].id === self._regexPresetData.activePresetId) { target = newPs[k2]; break }
        }
        if (target && target.regexes) {
          self.regexes = target.regexes
          self.selRegex = self.regexes.length > 0 ? self.regexes[0].id : ''
          self._saveRegexes()
        }
        self._saveRegexPresets()
        self._render()
      })
    }

    this._bindRegexEvents()

    // 恢复列表滚动位置到选中条目
    if (this.selRegex) {
      var listBody = this._contentEl ? this._contentEl.querySelector('#pua-regex-list') : null
      if (listBody) {
        var selItem = listBody.querySelector('.pua-entry-item.selected')
        if (selItem) {
          selItem.scrollIntoView({ block: 'nearest', behavior: 'instant' })
        }
      }
    }
  }

  /* ── 绑定正则管理事件 ── */
  P._bindRegexEvents = function() {
    var self = this
    var listEl = this._contentEl ? this._contentEl.querySelector('#pua-regex-list') : null
    if (!listEl) return

    // Item click → select
    var entryItems = listEl.querySelectorAll('.pua-entry-item')
    for (var ei = 0; ei < entryItems.length; ei++) {
      (function(el) {
        el.addEventListener('click', function(e) {
          if (e.target.classList.contains('pua-toggle-item') || e.target.classList.contains('pua-drag-handle') || e.target.classList.contains('pua-item-cb')) return
          self.selRegex = this.getAttribute('data-id')
          self._render()
        })
        // Drag start
        el.addEventListener('dragstart', function(e) {
          this.classList.add('dragging')
          e.dataTransfer.setData('text/plain', this.getAttribute('data-id'))
        })
        el.addEventListener('dragend', function() { this.classList.remove('dragging') })
        el.addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('drag-over') })
        el.addEventListener('dragleave', function() { this.classList.remove('drag-over') })
        el.addEventListener('drop', function(e) {
          e.preventDefault()
          this.classList.remove('drag-over')
          self._reorderRegex(e.dataTransfer.getData('text/plain'), this.getAttribute('data-id'))
        })
      })(entryItems[ei])
    }

    // Toggle on/off in list
    var toggleItems = listEl.querySelectorAll('.pua-toggle-item')
    for (var ti = 0; ti < toggleItems.length; ti++) {
      (function(el) {
        el.addEventListener('click', function(e) {
          e.stopPropagation()
          var id = this.getAttribute('data-id')
          for (var i = 0; i < self.regexes.length; i++) {
            if (self.regexes[i].id === id) { self.regexes[i].on = !self.regexes[i].on; break }
          }
          self._saveRegexes()
          self._render()
        })
      })(toggleItems[ti])
    }

    // --- Detail editor events ---

    // Name change (no auto-save, just update memory)
    var nameInput = this._contentEl ? this._contentEl.querySelector('.pua-regex-name') : null
    if (nameInput) {
      nameInput.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.regexes.length; i++) {
          if (self.regexes[i].id === id) { self.regexes[i].name = this.value; break }
        }
      })
    }

    // Type change (no auto-save, just update memory + re-render for preview area)
    var typeSelect = this._contentEl ? this._contentEl.querySelector('.pua-regex-type-select') : null
    if (typeSelect) {
      typeSelect.addEventListener('change', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.regexes.length; i++) {
          if (self.regexes[i].id === id) { self.regexes[i].type = this.value; break }
        }
        self._render()
      })
    }

    // Regex pattern change (no auto-save, just update memory)
    var patternTextarea = this._contentEl ? this._contentEl.querySelector('.pua-regex-pattern') : null
    if (patternTextarea) {
      patternTextarea.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.regexes.length; i++) {
          if (self.regexes[i].id === id) { self.regexes[i].regex = this.value; break }
        }
      })
    }

    // HTML template change (no auto-save, just update memory)
    var htmlTextarea = this._contentEl ? this._contentEl.querySelector('.pua-regex-html') : null
    if (htmlTextarea) {
      htmlTextarea.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.regexes.length; i++) {
          if (self.regexes[i].id === id) { self.regexes[i].html = this.value; break }
        }
      })
    }

    // Depth min (no auto-save, just update memory)
    var dMinInput = this._contentEl ? this._contentEl.querySelector('.pua-regex-dmin') : null
    if (dMinInput) {
      dMinInput.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        var val = parseInt(this.value) || 0
        for (var i = 0; i < self.regexes.length; i++) {
          if (self.regexes[i].id === id) { self.regexes[i].dMin = val; break }
        }
      })
    }

    // Depth max (no auto-save, just update memory)
    var dMaxInput = this._contentEl ? this._contentEl.querySelector('.pua-regex-dmax') : null
    if (dMaxInput) {
      dMaxInput.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        var val = this.value ? parseInt(this.value) : Infinity
        if (val < 0) val = 0
        for (var i = 0; i < self.regexes.length; i++) {
          if (self.regexes[i].id === id) { self.regexes[i].dMax = val; break }
        }
      })
    }

    // Delete button
    var delBtn = this._contentEl ? this._contentEl.querySelector('.pua-regex-delete') : null
    if (delBtn) {
      delBtn.addEventListener('click', function() {
        var id = this.getAttribute('data-id')
        self._delRegex(id)
      })
    }

    // Checkbox: individual item select
    var rItemCbs = listEl.querySelectorAll('.pua-item-cb')
    for (var rci = 0; rci < rItemCbs.length; rci++) {
      (function(cb) {
        cb.addEventListener('change', function(e) {
          e.stopPropagation()
          var itemId = this.getAttribute('data-id')
          if (!self._selRegexIds) self._selRegexIds = []
          if (this.checked) {
            if (self._selRegexIds.indexOf(itemId) < 0) self._selRegexIds.push(itemId)
          } else {
            var ni2 = []
            for (var si2 = 0; si2 < self._selRegexIds.length; si2++) {
              if (self._selRegexIds[si2] !== itemId) ni2.push(self._selRegexIds[si2])
            }
            self._selRegexIds = ni2
          }
          self._renderRegexesOnly()
        })
        cb.addEventListener('click', function(e) { e.stopPropagation() })
      })(rItemCbs[rci])
    }

    // Checkbox: select all
    var rSelectAllCb = this._contentEl ? this._contentEl.querySelector('#regex-select-all') : null
    if (rSelectAllCb) {
      rSelectAllCb.addEventListener('change', function() {
        if (this.checked) {
          self._selRegexIds = []
          for (var rai = 0; rai < self.regexes.length; rai++) self._selRegexIds.push(self.regexes[rai].id)
        } else {
          self._selRegexIds = []
        }
        self._renderRegexesOnly()
      })
    }

    // Batch delete
    var rBatchDelBtn = this._contentEl ? this._contentEl.querySelector('#regex-batch-del') : null
    if (rBatchDelBtn) {
      rBatchDelBtn.addEventListener('click', function() {
        if (!self._selRegexIds || self._selRegexIds.length === 0) return
        if (!confirm('\u786E\u5B9A\u5220\u9664 ' + self._selRegexIds.length + ' \u4E2A\u9009\u4E2D\u7684\u6B63\u5219\uFF1F')) return
        self._batchDelRegexes()
      })
    }

    // Clear selection
    var rClearSelBtn = this._contentEl ? this._contentEl.querySelector('#regex-clear-sel') : null
    if (rClearSelBtn) {
      rClearSelBtn.addEventListener('click', function() {
        self._selRegexIds = []
        self._renderRegexesOnly()
      })
    }

    // Move selected regexes to another group
    var regexMoveBtn = this._contentEl ? this._contentEl.querySelector('#regex-move-to') : null
    if (regexMoveBtn) {
      regexMoveBtn.addEventListener('click', function() {
        self._showMoveToGroupDialog('regex')
      })
    }

    // Save button
    var regexSaveBtn = this._contentEl ? this._contentEl.querySelector('#regex-save-btn') : null
    if (regexSaveBtn) {
      regexSaveBtn.addEventListener('click', function() {
        self._saveRegexes()
        self._toast('\u6B63\u5219\u5DF2\u4FDD\u5B58')
      })
    }

    // Mobile back button
    var mobileBackBtn = this._contentEl ? this._contentEl.querySelector('.pua-mobile-back-regex') : null
    if (mobileBackBtn) {
      if (window.innerWidth < 768) mobileBackBtn.style.display = ''
      mobileBackBtn.addEventListener('click', function() {
        self.selRegex = ''
        self._render()
      })
    }

    // Regex render preview - auto-render with placeholders on load
    var selectedRegex = null
    for (var sri = 0; sri < self.regexes.length; sri++) {
      if (self.regexes[sri].id === self.selRegex) { selectedRegex = self.regexes[sri]; break }
    }
    var regexResultElAuto = this._contentEl ? this._contentEl.querySelector('#regex-preview-result') : null
    if (regexResultElAuto && selectedRegex && selectedRegex.type === 'render') {
      var htmlTpl = selectedRegex.html || selectedRegex.replace || ''
      if (htmlTpl) {
        var autoPreview = htmlTpl
        autoPreview = autoPreview.replace(/\$&/g, '<span style="color:#ffa500;font-style:italic">$&amp;</span>')
        autoPreview = autoPreview.replace(/\$0/g, '<span style="color:#ffa500;font-style:italic">$0</span>')
        for (var agi = 1; agi <= 9; agi++) {
          autoPreview = autoPreview.replace(new RegExp('\\$' + agi, 'g'), '<span style="color:#ffa500;font-style:italic">$' + agi + '</span>')
        }
        regexResultElAuto.innerHTML = '<div style="font-size:9px;color:var(--pua-accent);margin-bottom:4px">\u6A21\u677F\u6E32\u67D3\u9884\u89C8</div>' + autoPreview
      }
    }

    // Regex management page: element selection mode for preview result
    var regexResultEl = this._contentEl ? this._contentEl.querySelector('#regex-preview-result') : null
    if (regexResultEl) {
      var regexElemSelectActive = false
      var regexSelectedEl = null
      var regexOriginalStyles = null
      var regexElemInfoDiv = null
      // Add element select toggle button after the preview result
      var regexElemSelectBtn = document.createElement('button')
      regexElemSelectBtn.className = 'pua-code-block-btn'
      regexElemSelectBtn.textContent = '\u9009\u4E2D\u5143\u7D20'
      regexElemSelectBtn.style.marginTop = '4px'
      regexResultEl.parentNode.insertBefore(regexElemSelectBtn, regexResultEl.nextSibling)
      // Add elem info div
      regexElemInfoDiv = document.createElement('div')
      regexElemInfoDiv.className = 'pua-elem-info'
      regexElemInfoDiv.style.display = 'none'
      regexResultEl.parentNode.insertBefore(regexElemInfoDiv, regexElemSelectBtn.nextSibling)

      regexElemSelectBtn.addEventListener('click', function() {
        regexElemSelectActive = !regexElemSelectActive
        if (regexElemSelectActive) {
          regexResultEl.classList.add('pua-elem-select-active')
          this.textContent = '\u53D6\u6D88\u9009\u4E2D'
          this.style.borderColor = '#4a9eff'
          this.style.color = '#4a9eff'
          regexResultEl.addEventListener('click', onRegexElemClick)
        } else {
          regexResultEl.classList.remove('pua-elem-select-active')
          this.textContent = '\u9009\u4E2D\u5143\u7D20'
          this.style.borderColor = ''
          this.style.color = ''
          regexResultEl.removeEventListener('click', onRegexElemClick)
          regexElemInfoDiv.style.display = 'none'
        }
      })

      function onRegexElemClick(e2) {
        if (!regexElemSelectActive) return
        e2.stopPropagation()
        e2.preventDefault()
        var el = e2.target
        if (el === regexResultEl) return
        regexSelectedEl = el
        var computed = window.getComputedStyle(el)
        regexOriginalStyles = {
          width: el.style.width, height: el.style.height, fontSize: el.style.fontSize,
          color: el.style.color, backgroundColor: el.style.backgroundColor,
          padding: el.style.padding, margin: el.style.margin, borderRadius: el.style.borderRadius,
          textContent: el.textContent
        }
        // Build property editor
        var editorHtml = '<div class="pua-elem-editor">'
        editorHtml += '<div class="pua-elem-editor-title">\u5143\u7D20\u7F16\u8F91\u5668</div>'
        editorHtml += '<div class="pua-elem-editor-tag">\u6807\u7B7E: &lt;' + el.tagName.toLowerCase() + '&gt;  \u7C7B\u540D: ' + (el.className || '\u65E0') + '</div>'
        editorHtml += '<div class="pua-elem-editor-grid">'
        editorHtml += _regPropField('\u5BBD\u5EA6', 'width', _regPxVal(computed.width), 'px', 0, 500, 1)
        editorHtml += _regPropField('\u9AD8\u5EA6', 'height', _regPxVal(computed.height), 'px', 0, 500, 1)
        editorHtml += _regPropField('\u5B57\u53F7', 'fontSize', _regPxVal(computed.fontSize), 'px', 8, 72, 1)
        editorHtml += _regPropFieldColor('\u989C\u8272', 'color', computed.color)
        editorHtml += _regPropFieldColor('\u80CC\u666F', 'backgroundColor', computed.backgroundColor)
        editorHtml += _regPropField('\u5185\u8FB9\u8DDD', 'padding', _regPxVal(computed.padding), 'px', 0, 50, 1)
        editorHtml += _regPropField('\u5916\u8FB9\u8DDD', 'margin', _regPxVal(computed.margin), 'px', 0, 50, 1)
        editorHtml += _regPropField('\u5706\u89D2', 'borderRadius', _regPxVal(computed.borderRadius), 'px', 0, 50, 1)
        editorHtml += '</div>'
        editorHtml += '<div class="pua-elem-editor-row"><label>\u6587\u672C\u5185\u5BB9</label><input class="pua-elem-editor-input" data-prop="textContent" value="' + self._escHtml(el.textContent) + '"></div>'
        editorHtml += '<div class="pua-elem-editor-actions">'
        editorHtml += '<button class="pua-code-block-btn pua-elem-apply-btn">\u5E94\u7528\u4FEE\u6539</button>'
        editorHtml += '<button class="pua-code-block-btn pua-elem-reset-btn">\u91CD\u7F6E</button>'
        editorHtml += '</div></div>'
        regexElemInfoDiv.innerHTML = editorHtml
        regexElemInfoDiv.style.display = 'block'

        // Bind color picker sync + instant preview
        var colorInputs = regexElemInfoDiv.querySelectorAll('.pua-elem-color-group')
        for (var ci = 0; ci < colorInputs.length; ci++) {
          (function(group) {
            var textIn = group.querySelector('.pua-elem-editor-input')
            var colorIn = group.querySelector('.pua-elem-color-picker')
            if (textIn && colorIn) {
              colorIn.addEventListener('input', function() { textIn.value = this.value; _regApplyToEl() })
              textIn.addEventListener('input', function() { try { colorIn.value = this.value } catch(e) {}; _regApplyToEl() })
            }
          })(colorInputs[ci])
        }

        // Bind range slider sync + instant preview
        var rangeInputs = regexElemInfoDiv.querySelectorAll('.pua-elem-editor-range')
        for (var ri = 0; ri < rangeInputs.length; ri++) {
          (function(range) {
            var prop = range.getAttribute('data-prop')
            var textIn = regexElemInfoDiv.querySelector('.pua-elem-editor-input[data-prop="' + prop + '"]')
            if (textIn) {
              range.addEventListener('input', function() { textIn.value = this.value; _regApplyToEl() })
              textIn.addEventListener('input', function() { var v = parseFloat(this.value); if (!isNaN(v)) range.value = v; _regApplyToEl() })
            }
          })(rangeInputs[ri])
        }

        // Bind textContent input instant preview
        var textContentIn = regexElemInfoDiv.querySelector('.pua-elem-editor-input[data-prop="textContent"]')
        if (textContentIn) {
          textContentIn.addEventListener('input', function() { _regApplyToEl() })
        }

        // Instant preview: apply current editor values to the element
        function _regApplyToEl() {
          if (!regexSelectedEl) return
          var inputs = regexElemInfoDiv.querySelectorAll('.pua-elem-editor-input')
          for (var ii = 0; ii < inputs.length; ii++) {
            var prop = inputs[ii].getAttribute('data-prop')
            var val = inputs[ii].value
            if (prop === 'textContent') {
              regexSelectedEl.textContent = val
            } else if (val) {
              regexSelectedEl.style[prop] = val
            }
          }
        }

        // Apply button - update the HTML textarea with the modified template
        var applyBtn = regexElemInfoDiv.querySelector('.pua-elem-apply-btn')
        if (applyBtn) {
          applyBtn.addEventListener('click', function() {
            if (!regexSelectedEl) return
            // Values are already applied via instant preview, just update textarea
            var htmlTextarea = self._contentEl ? self._contentEl.querySelector('.pua-regex-html') : null
            if (htmlTextarea && regexSelectedEl) {
              // Find the selected element's position in the preview and update template
              var currentResult = regexResultEl.innerHTML
              // Remove the match count header
              var headerDiv = regexResultEl.querySelector('div[style]')
              if (headerDiv) currentResult = currentResult.replace(headerDiv.outerHTML, '')
              htmlTextarea.value = currentResult.trim()
            }
            self._toast('\u4FEE\u6539\u5DF2\u5E94\u7528\u5230\u6A21\u677F')
          })
        }

        // Reset button
        var resetBtn = regexElemInfoDiv.querySelector('.pua-elem-reset-btn')
        if (resetBtn) {
          resetBtn.addEventListener('click', function() {
            if (!regexSelectedEl || !regexOriginalStyles) return
            var props = ['width','height','fontSize','color','backgroundColor','padding','margin','borderRadius']
            for (var pi = 0; pi < props.length; pi++) {
              regexSelectedEl.style[props[pi]] = regexOriginalStyles[props[pi]] || ''
            }
            if (regexOriginalStyles.textContent !== undefined) regexSelectedEl.textContent = regexOriginalStyles.textContent
            self._toast('\u5DF2\u91CD\u7F6E')
          })
        }
      }

      function _regPxVal(val) {
        if (!val || val === 'auto' || val === 'none') return ''
        var m = val.match(/^([\d.]+)px/)
        return m ? m[1] : val
      }

      function _regPropField(label, prop, val, unit, min, max, step) {
        var sliderHtml = ''
        if (min !== undefined && max !== undefined) {
          var numVal = parseFloat(val) || 0
          sliderHtml = '<input type="range" class="pua-elem-editor-range" data-prop="' + prop + '" min="' + min + '" max="' + max + '" step="' + (step || 1) + '" value="' + numVal + '">'
        }
        return '<div class="pua-elem-editor-row"><label>' + label + '</label>' + sliderHtml + '<input class="pua-elem-editor-input" data-prop="' + prop + '" value="' + self._escHtml(val) + '"><span class="pua-elem-editor-unit">' + unit + '</span></div>'
      }

      function _regPropFieldColor(label, prop, val) {
        var hexVal = val
        try {
          var tmp = document.createElement('div'); tmp.style.color = val; document.body.appendChild(tmp)
          hexVal = getComputedStyle(tmp).color; document.body.removeChild(tmp)
        } catch(e) {}
        var colorHex = '#000000'
        var m = hexVal.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (m) {
          colorHex = '#' + ((1 << 24) + (parseInt(m[1]) << 16) + (parseInt(m[2]) << 8) + parseInt(m[3])).toString(16).slice(1)
        }
        return '<div class="pua-elem-editor-row pua-elem-color-group"><label>' + label + '</label><input class="pua-elem-editor-input" data-prop="' + prop + '" value="' + self._escHtml(val) + '"><input type="color" class="pua-elem-color-picker" value="' + colorHex + '"></div>'
      }
    }

    // Template preview button
    var tplPreviewBtn = this._contentEl ? this._contentEl.querySelector('#regex-template-preview-btn') : null
    if (tplPreviewBtn) {
      var selectedRegexForTpl = null
      for (var sri2 = 0; sri2 < self.regexes.length; sri2++) {
        if (self.regexes[sri2].id === self.selRegex) { selectedRegexForTpl = self.regexes[sri2]; break }
      }
      tplPreviewBtn.addEventListener('click', function() {
        var resultEl = self._contentEl ? self._contentEl.querySelector('#regex-preview-result') : null
        if (!resultEl || !selectedRegexForTpl) return
        var htmlTpl = selectedRegexForTpl.html || selectedRegexForTpl.replace || ''
        if (!htmlTpl) {
          resultEl.innerHTML = '<span style="color:var(--pua-text-dim)">\u65E0\u66FF\u6362\u6A21\u677F</span>'
          return
        }
        var preview = htmlTpl
        preview = preview.replace(/\$&/g, '<span style="color:#ffa500;font-style:italic">$&amp;</span>')
        preview = preview.replace(/\$0/g, '<span style="color:#ffa500;font-style:italic">$0</span>')
        for (var gi = 1; gi <= 9; gi++) {
          preview = preview.replace(new RegExp('\\$' + gi, 'g'), '<span style="color:#ffa500;font-style:italic">$' + gi + '</span>')
        }
        resultEl.innerHTML = '<div style="font-size:9px;color:var(--pua-accent);margin-bottom:4px">\u6A21\u677F\u6E32\u67D3\u9884\u89C8</div>' + preview
      })
    }
  }

  /* ── 新增正则 ── */
  P._addRegex = function() {
    var id = 'r' + Date.now()
    this.regexes.push({
      id: id, name: '\u65B0\u6B63\u5219', regex: '', html: '', type: 'render',
      on: true, dMin: 0, dMax: Infinity
    })
    this.selRegex = id
    this._saveRegexes()
    this._render()
  }

  /* ── 删除正则 ── */
  P._delRegex = function(id) {
    var newRegexes = []
    for (var i = 0; i < this.regexes.length; i++) {
      if (this.regexes[i].id !== id) newRegexes.push(this.regexes[i])
    }
    this.regexes = newRegexes
    if (this.selRegex === id) {
      this.selRegex = this.regexes.length > 0 ? this.regexes[0].id : ''
    }
    this._saveRegexes()
    this._render()
  }

  P._batchDelRegexes = function() {
    if (!this._selRegexIds || this._selRegexIds.length === 0) return
    var delMap = {}
    for (var di = 0; di < this._selRegexIds.length; di++) delMap[this._selRegexIds[di]] = true
    var newRegexes = []
    for (var i = 0; i < this.regexes.length; i++) {
      if (!delMap[this.regexes[i].id]) newRegexes.push(this.regexes[i])
    }
    this.regexes = newRegexes
    if (delMap[this.selRegex]) {
      this.selRegex = this.regexes.length > 0 ? this.regexes[0].id : ''
    }
    this._selRegexIds = []
    this._saveRegexes()
    this._toast('\u5DF2\u5220\u9664 ' + Object.keys(delMap).length + ' \u4E2A\u6B63\u5219')
    this._render()
  }

  P._renderRegexesOnly = function() {
    var titleEl = this._titleEl
    var actionsEl = this._actionsEl
    var contentEl = this._contentEl
    if (titleEl && actionsEl && contentEl) {
      this._renderRegexes(titleEl, actionsEl, contentEl)
    } else {
      this._render()
    }
  }

  /* ── 正则排序 ── */
  P._reorderRegex = function(fromId, toId) {
    var fi = -1, ti = -1
    for (var i = 0; i < this.regexes.length; i++) {
      if (this.regexes[i].id === fromId) fi = i
      if (this.regexes[i].id === toId) ti = i
    }
    if (fi < 0 || ti < 0) return
    var item = this.regexes.splice(fi, 1)[0]
    this.regexes.splice(ti, 0, item)
    this._saveRegexes()

    // 保存滚动位置
    var self = this
    var listBody = this._contentEl ? this._contentEl.querySelector('#pua-regex-list') : null
    var savedScroll = listBody ? listBody.scrollTop : 0

    this._render()

    // 下一帧恢复滚动位置
    setTimeout(function() {
      var newListBody = self._contentEl ? self._contentEl.querySelector('#pua-regex-list') : null
      if (newListBody && savedScroll > 0) {
        newListBody.scrollTop = savedScroll
      }
    }, 0)
  }

  /* ── 导入Roche正则对话框 ── */
  P._importRegexDialog = function() {
    var self = this
    var modal = this._modalOverlay
    if (!modal) return

    var body = ''
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">\u5BFC\u5165 Roche \u6B63\u5219</div>'
    body += '<div style="border:2px dashed var(--pua-border);border-radius:8px;padding:20px;text-align:center;cursor:pointer;transition:var(--pua-transition)" id="pua-regex-import-zone">'
    body += '<div style="font-size:24px;opacity:0.3;margin-bottom:8px">\u2B07</div>'
    body += '<div style="font-size:11px;color:var(--pua-text-sub)">\u70B9\u51FB\u9009\u62E9 Roche \u5BFC\u51FA\u7684\u6B63\u5219 JSON \u6587\u4EF6</div>'
    body += '<input type="file" id="pua-regex-import-file" accept=".json" style="display:none">'
    body += '</div>'
    body += '<div class="pua-field-hint">\u652F\u6301 Roche \u5BFC\u51FA\u7684\u6B63\u5219 JSON \u683C\u5F0F\uFF0C\u5305\u542B\u5206\u7C7B\u548C\u6761\u76EE</div>'
    body += '</div>'
    body += '<div id="pua-regex-import-preview" style="display:none">'
    body += '<div style="font-size:10px;color:var(--pua-accent);font-weight:600;margin-bottom:6px">\u89E3\u6790\u7ED3\u679C\u9884\u89C8</div>'
    body += '<div id="pua-regex-import-result" style="max-height:200px;overflow-y:auto;font-size:10px;color:var(--pua-text-sub);background:var(--pua-bg-input);border-radius:6px;padding:8px;line-height:1.5"></div>'
    body += '</div>'

    var modalBody = modal.querySelector('.pua-modal-body')
    if (!modalBody) return
    modalBody.innerHTML = body

    var modalTitle = modal.querySelector('.pua-modal-title')
    if (modalTitle) modalTitle.textContent = '\u5BFC\u5165\u6B63\u5219'

    var footer = modal.querySelector('.pua-modal-footer')
    if (footer) footer.remove()
    footer = document.createElement('div')
    footer.className = 'pua-modal-footer'
    var cancelBtn = document.createElement('button')
    cancelBtn.className = 'pua-btn'
    cancelBtn.textContent = '\u53D6\u6D88'
    cancelBtn.addEventListener('click', function() { self._closeModal() })
    var confirmBtn = document.createElement('button')
    confirmBtn.className = 'pua-btn pua-btn-gold'
    confirmBtn.textContent = '\u786E\u8BA4\u5BFC\u5165'
    confirmBtn.id = 'pua-regex-import-confirm'
    confirmBtn.style.display = 'none'
    confirmBtn.addEventListener('click', function() { self._doImportRegex() })
    footer.appendChild(cancelBtn)
    footer.appendChild(confirmBtn)
    var modalInner = modal.querySelector('.pua-modal')
    if (modalInner) modalInner.appendChild(footer)

    // File selection
    var zone = modal.querySelector('#pua-regex-import-zone')
    var fileInput = modal.querySelector('#pua-regex-import-file')
    if (zone && fileInput) {
      zone.addEventListener('click', function() { fileInput.click() })
      fileInput.addEventListener('change', function() {
        if (fileInput.files && fileInput.files.length) {
          self._readRegexFile(fileInput.files[0])
        }
      })
    }

    modal.classList.add('show')
  }

  /* ── 读取正则文件 ── */
  P._readRegexFile = function(file) {
    var self = this
    console.log('[PUA] _readRegexFile called, file=' + file.name)
    var reader = new FileReader()
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result)
        self._parsedRegexData = data
        var modal = self._modalOverlay
        console.log('[PUA] _readRegexFile parsed, modal=' + (modal ? 'exists' : 'NULL') + ' data type=' + data.type + ' has categories=' + !!(data.categories))
        var previewEl = modal ? modal.querySelector('#pua-regex-import-preview') : null
        var resultEl = modal ? modal.querySelector('#pua-regex-import-result') : null
        var confirmBtn = modal ? modal.querySelector('#pua-regex-import-confirm') : null
        console.log('[PUA] _readRegexFile elements: preview=' + (previewEl ? 'found' : 'NULL') + ' result=' + (resultEl ? 'found' : 'NULL') + ' confirm=' + (confirmBtn ? 'found' : 'NULL'))
        if (!previewEl || !resultEl) return

        if (data && data.type === 'pua_plugin_regexes' && data.regexes && Array.isArray(data.regexes)) {
          // 插件格式
          var html = '<div style="margin-bottom:6px;padding:6px;border:1px solid var(--pua-border);border-radius:4px">'
          html += '<div style="font-weight:600;color:var(--pua-accent-text)">\u63D2\u4EF6\u683C\u5F0F\u5BFC\u5165</div>'
          html += '<div style="font-size:9px;color:var(--pua-text-dim)">' + data.regexes.length + ' \u4E2A\u6761\u76EE</div>'
          html += '</div>'
          html += '<div style="font-size:11px;color:var(--pua-user);font-weight:600;margin-top:4px">\u5171 ' + data.regexes.length + ' \u4E2A\u6B63\u5219\u6761\u76EE\uFF0C\u70B9\u51FB\u786E\u8BA4\u5BFC\u5165</div>'
          resultEl.innerHTML = html
          previewEl.style.display = 'block'
          if (confirmBtn) confirmBtn.style.display = ''
        } else if (data && data.categories && Array.isArray(data.categories)) {
          var count = 0
          var html = ''
          for (var ci = 0; ci < data.categories.length; ci++) {
            var cat = data.categories[ci]
            var entries = cat.presets || cat.entries || []
            html += '<div style="margin-bottom:6px;padding:6px;border:1px solid var(--pua-border);border-radius:4px">'
            html += '<div style="font-weight:600;color:var(--pua-accent-text)">' + self._escHtml(cat.name || '\u672A\u547D\u540D\u5206\u7C7B') + '</div>'
            html += '<div style="font-size:9px;color:var(--pua-text-dim)">' + entries.length + ' \u4E2A\u6761\u76EE</div>'
            html += '</div>'
            count += entries.length
          }
          html += '<div style="font-size:11px;color:var(--pua-user);font-weight:600;margin-top:4px">\u5171 ' + count + ' \u4E2A\u6B63\u5219\u6761\u76EE\uFF0C\u70B9\u51FB\u786E\u8BA4\u5BFC\u5165</div>'
          resultEl.innerHTML = html
          previewEl.style.display = 'block'
          if (confirmBtn) confirmBtn.style.display = ''
        } else {
          resultEl.textContent = '\u65E0\u6CD5\u8BC6\u522B\u7684\u683C\u5F0F\uFF0C\u8BF7\u786E\u8BA4\u6587\u4EF6\u4E3A\u6709\u6548\u7684\u6B63\u5219 JSON'
          previewEl.style.display = 'block'
        }
      } catch(err) {
        console.warn('[PUA] regex parse error', err)
        var modal = self._modalOverlay
        var resultEl = modal ? modal.querySelector('#pua-regex-import-result') : null
        if (resultEl) resultEl.textContent = '\u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u786E\u8BA4\u6587\u4EF6\u4E3A\u6709\u6548\u7684 JSON \u683C\u5F0F'
        var previewEl = modal ? modal.querySelector('#pua-regex-import-preview') : null
        if (previewEl) previewEl.style.display = 'block'
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  /* ── 执行导入正则 ── */
  P._doImportRegex = function() {
    console.log('[PUA] _doImportRegex called, parsedData=' + (this._parsedRegexData ? 'exists' : 'NULL'))
    if (!this._parsedRegexData) {
      this._toast('\u6CA1\u6709\u53EF\u5BFC\u5165\u7684\u6570\u636E')
      return
    }
    var data = this._parsedRegexData
    console.log('[PUA] _doImportRegex data type=' + data.type + ' has categories=' + !!(data.categories) + ' has regexes=' + !!(data.regexes))
    var count = 0
    var rImportName = data.groupName || ('\u5BFC\u5165-' + new Date().toLocaleString('zh-CN', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}))

    // 构建导入条目数组（不直接操作 this.regexes）
    var newRItems = []

    try {
      if (data.type === 'pua_plugin_regexes' && data.regexes && Array.isArray(data.regexes)) {
        console.log('[PUA] _doImportRegex: plugin format, regexes count=' + data.regexes.length)
        for (var ri = 0; ri < data.regexes.length; ri++) {
          var src0 = data.regexes[ri]
          newRItems.push({
            id: 'r' + Date.now() + '_' + count,
            name: (src0.name || '\u672A\u547D\u540D') + ' [' + rImportName + ']',
            regex: src0.regex || '',
            html: src0.html || '',
            type: src0.type || 'render',
            on: src0.on !== undefined ? src0.on : true,
            dMin: src0.dMin || 0,
            dMax: src0.dMax || Infinity,
            group: '\u9ED8\u8BA4'
          })
          count++
        }
      } else if (data.categories && Array.isArray(data.categories)) {
        console.log('[PUA] _doImportRegex: roche format, categories count=' + data.categories.length)
        for (var ci = 0; ci < data.categories.length; ci++) {
          var cat = data.categories[ci]
          var catName = cat.name || '\u672A\u547D\u540D\u5206\u7C7B'
          var entries = cat.presets || cat.entries || []
          console.log('[PUA] _doImportRegex category[' + ci + '] name=' + catName + ' entries count=' + entries.length)
          for (var pi = 0; pi < entries.length; pi++) {
            var src = entries[pi]
            // \u5224\u65AD\u662F\u6B63\u5219\u6761\u76EE\uFF08\u6709regex+html\uFF09\u8FD8\u662F\u9884\u8BBE\u6761\u76EE\uFF08\u6709outputRegex/inputRegex\uFF09
            if (src.regex) {
              // Roche\u6B63\u5219\u683C\u5F0F\uFF1A\u6709name+regex+html\uFF0C\u662F\u6E32\u67D3/\u66FF\u6362\u89C4\u5219
              var rType = 'render'
              if (src.html === '' || src.html === ' ' || src.html === '$0') {
                rType = 'replace'
              }
              newRItems.push({
                id: 'r' + Date.now() + '_' + count,
                name: (src.name || '\u672A\u547D\u540D') + ' [' + catName + ']',
                regex: src.regex,
                html: src.html || '',
                type: rType,
                on: true,
                dMin: 0,
                dMax: Infinity,
                group: catName
              })
              count++
              console.log('[PUA] _doImportRegex: added regex entry ' + (src.name||'') + ' type=' + rType)
            } else if (src.outputRegex || src.inputRegex) {
              // Roche\u9884\u8BBE\u683C\u5F0F\uFF1A\u6709outputRegex/inputRegex\uFF0C\u662F\u8FC7\u6EE4\u89C4\u5219
              var baseName = (src.title || src.name || '\u672A\u547D\u540D') + ' [' + catName + ']'
              if (src.isOutputRegexEnabled && src.outputRegex) {
                newRItems.push({
                  id: 'r' + Date.now() + '_' + count,
                  name: baseName + ' [\u6392\u9664\u8FC7\u6EE4]',
                  regex: src.outputRegex,
                  html: '',
                  type: 'filter',
                  on: true,
                  dMin: 0,
                  dMax: Infinity,
                  group: catName
                })
                count++
              }
              if (src.isInputRegexEnabled && src.inputRegex) {
                newRItems.push({
                  id: 'r' + Date.now() + '_' + count,
                  name: baseName + ' [\u4FDD\u7559\u8FC7\u6EE4]',
                  regex: src.inputRegex,
                  html: '',
                  type: 'filter',
                  on: true,
                  dMin: 0,
                  dMax: Infinity,
                  group: catName
                })
                count++
              }
            }
          }
        }
      } else {
        console.warn('[PUA] _doImportRegex: no matching format, type=' + data.type)
      }
    } catch(loopErr) {
      console.error('[PUA] _doImportRegex loop error:', loopErr.message, loopErr.stack)
      this._toast('\u5BFC\u5165\u8FC7\u7A0B\u51FA\u9519: ' + loopErr.message)
      return
    }

    console.log('[PUA] _doImportRegex: newRItems length=' + newRItems.length + ' count=' + count)

    if (newRItems.length === 0) {
      this._toast('\u6CA1\u6709\u53EF\u5BFC\u5165\u7684\u6B63\u5219\u6761\u76EE')
      return
    }

    // 在 _regexPresetData 中新建一个预设工作区
    console.log('[PUA] _doImportRegex: creating workspace, _regexPresetData exists=' + !!this._regexPresetData)
    if (!this._regexPresetData) {
      this._regexPresetData = { presets: [], activePresetId: '' }
    }
    var newRWorkspace = {
      id: 'rpreset-' + Date.now(),
      name: rImportName,
      regexes: newRItems
    }
    this._regexPresetData.presets.push(newRWorkspace)
    this._regexPresetData.activePresetId = newRWorkspace.id

    // 切换到新工作区
    this.regexes = newRItems
    this.selRegex = newRItems.length > 0 ? newRItems[0].id : ''
    this._selRegexIds = []

    this._parsedRegexData = null

    console.log('[PUA] _doImportRegex: saving, _saveRegexes exists=' + typeof this._saveRegexes + ' _saveRegexPresets exists=' + typeof this._saveRegexPresets)
    this._saveRegexes()
    this._saveRegexPresets()
    this._closeModal()
    this._toast('\u5DF2\u5BFC\u5165 ' + count + ' \u4E2A\u6B63\u5219\u6761\u76EE \u2192 [' + rImportName + ']')
    this._render()
  }

  /* ── 导出Roche正则 ── */
  P._exportRegexes = function() {
    if (this.regexes.length === 0) {
      this._toast('\u6CA1\u6709\u53EF\u5BFC\u51FA\u7684\u6B63\u5219')
      return
    }
    var self = this
    var modal = this._modalOverlay
    if (!modal) return

    var body = '<div style="margin-bottom:12px;font-size:11px;color:var(--pua-text-sub)">\u8BF7\u9009\u62E9\u5BFC\u51FA\u683C\u5F0F\uFF1A</div>'
    body += '<div style="display:flex;flex-direction:column;gap:8px">'
    body += '<label style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--pua-border);border-radius:8px;cursor:pointer;transition:var(--pua-transition)" id="export-regex-roche">'
    body += '<input type="radio" name="export-regex-fmt" value="roche" checked>'
    body += '<div><div style="font-size:11px;font-weight:600;color:var(--pua-accent-text)">Roche \u539F\u751F\u683C\u5F0F</div><div style="font-size:9px;color:var(--pua-text-dim)">\u53EF\u76F4\u63A5\u5BFC\u5165 Roche \u7684\u6B63\u5219\u7CFB\u7EDF</div></div>'
    body += '</label>'
    body += '<label style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--pua-border);border-radius:8px;cursor:pointer;transition:var(--pua-transition)" id="export-regex-plugin">'
    body += '<input type="radio" name="export-regex-fmt" value="plugin">'
    body += '<div><div style="font-size:11px;font-weight:600;color:var(--pua-accent-text)">\u63D2\u4EF6\u683C\u5F0F</div><div style="font-size:9px;color:var(--pua-text-dim)">\u5E73\u884C\u65F6\u7A7A\u63D2\u4EF6\u5185\u90E8\u683C\u5F0F\uFF0C\u5305\u542B\u5B8C\u6574\u914D\u7F6E</div></div>'
    body += '</label>'
    body += '</div>'

    var modalBody = modal.querySelector('.pua-modal-body')
    if (!modalBody) return
    modalBody.innerHTML = body

    var modalTitle = modal.querySelector('.pua-modal-title')
    if (modalTitle) modalTitle.textContent = '\u5BFC\u51FA\u6B63\u5219'

    var footer = modal.querySelector('.pua-modal-footer')
    if (footer) footer.remove()
    footer = document.createElement('div')
    footer.className = 'pua-modal-footer'
    var cancelBtn = document.createElement('button')
    cancelBtn.className = 'pua-btn'
    cancelBtn.textContent = '\u53D6\u6D88'
    cancelBtn.addEventListener('click', function() { self._closeModal() })
    var confirmBtn = document.createElement('button')
    confirmBtn.className = 'pua-btn pua-btn-gold'
    confirmBtn.textContent = '\u786E\u8BA4\u5BFC\u51FA'
    confirmBtn.addEventListener('click', function() {
      var radio = modal.querySelector('input[name="export-regex-fmt"]:checked')
      var fmt = radio ? radio.value : 'roche'
      var data, filename
      if (fmt === 'roche') {
        var exportEntries = []
        for (var i = 0; i < self.regexes.length; i++) {
          var r = self.regexes[i]
          exportEntries.push({
            name: r.name,
            regex: r.regex,
            html: r.html,
            id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var rv = Math.random() * 16 | 0
              var v = c === 'x' ? rv : (rv & 0x3 | 0x8)
              return v.toString(16)
            }),
            timestamp: Date.now()
          })
        }
        data = {
          version: 1,
          type: 'roche_regex',
          categories: [{ name: '\u5E73\u884C\u65F6\u7A7A\u5BFC\u51FA', scope: 'local', entries: exportEntries }]
        }
        filename = 'parallel-universe-regexes-' + Date.now() + '.json'
      } else {
        data = { version: 1, type: 'pua_plugin_regexes', regexes: self.regexes }
        filename = 'parallel-universe-regexes-plugin-' + Date.now() + '.json'
      }
      self._downloadFile(JSON.stringify(data, null, 2), filename, 'application/json')
      self._toast('\u6B63\u5219\u5DF2\u5BFC\u51FA: ' + filename)
      self._closeModal()
    })
    footer.appendChild(cancelBtn)
    footer.appendChild(confirmBtn)
    var modalInner = modal.querySelector('.pua-modal')
    if (modalInner) modalInner.appendChild(footer)

    modal.classList.add('show')
  }

  /* ════════════════════════════════════════════════════════════
     上下文组装页面
     ════════════════════════════════════════════════════════════ */

  /* ── 组装配置存储 ── */
  P._loadAsmConfig = function() {
    var self = this
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.get('pua_asm_config').then(function(data) {
      if (data && data.contextDepth !== undefined) self.asmConfig.contextDepth = data.contextDepth
    }).catch(function() {})
  }

  P._saveAsmConfig = function() {
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.set('pua_asm_config', this.asmConfig).catch(function(e) {
      console.error('[PUA] save asm config failed', e)
    })
  }

  /* ── 组装顺序 ── */
  P._defaultAsmOrder = function() {
    var order = []
    for (var i = 0; i < this.presets.length; i++) {
      if (this.presets[i].on) {
        order.push({ type: 'preset', id: this.presets[i].id })
      }
    }
    order.push({ type: 'char', id: 'char' })
    // 添加额外选中的角色
    if (this.asmData.chars && this.asmData.chars.length > 0) {
      for (var ci = 0; ci < this.asmData.chars.length; ci++) {
        // 跳过主角色（已在 char 块中）
        if (this.asmData.char && this.asmData.chars[ci].id === this.asmData.char.id) continue
        order.push({ type: 'char', id: this.asmData.chars[ci].id })
      }
    }
    order.push({ type: 'user', id: 'user' })
    order.push({ type: 'world-pre', id: 'world-pre' })
    order.push({ type: 'memory-core', id: 'memory-core' })
    order.push({ type: 'memory-fact', id: 'memory-fact' })
    order.push({ type: 'recall', id: 'recall' })
    order.push({ type: 'chat', id: 'chat' })
    order.push({ type: 'latestUserPrompt', id: 'latestUserPrompt' })
    order.push({ type: 'world-mid', id: 'world-mid' })
    order.push({ type: 'world-post', id: 'world-post' })
    return order
  }

  P._loadAsmOrder = function() {
    var self = this
    if (!this.roche || !this.roche.storage) {
      this._asmOrderLoaded = true
      return
    }
    this.roche.storage.get('pua_asm_order').then(function(data) {
      if (data && data.order && data.order.length) {
        self.asmOrder = data.order
        // \u8FC1\u79FB\uFF1A\u5982\u679C\u4FDD\u5B58\u7684\u987A\u5E8F\u4E2D\u6CA1\u6709 recall\uFF0C\u81EA\u52A8\u8865\u4E0A\uFF08\u5728 memory-fact \u4E4B\u540E\uFF09
        var hasRecall = false
        for (var i = 0; i < self.asmOrder.length; i++) {
          if (self.asmOrder[i].type === 'recall') { hasRecall = true; break }
        }
        if (!hasRecall) {
          for (var j = 0; j < self.asmOrder.length; j++) {
            if (self.asmOrder[j].type === 'memory-fact') {
              self.asmOrder.splice(j + 1, 0, { type: 'recall', id: 'recall' })
              break
            }
          }
          var hasRecall2 = false
          for (var k = 0; k < self.asmOrder.length; k++) {
            if (self.asmOrder[k].type === 'recall') { hasRecall2 = true; break }
          }
          if (!hasRecall2) self.asmOrder.push({ type: 'recall', id: 'recall' })
        }
        // \u8FC1\u79FB\uFF1A\u5982\u679C\u4FDD\u5B58\u7684\u987A\u5E8F\u4E2D\u6CA1\u6709 latestUserPrompt\uFF0C\u81EA\u52A8\u8865\u4E0A\uFF08\u5728 chat \u4E4B\u540E\uFF09
        var hasLUP = false
        for (var m = 0; m < self.asmOrder.length; m++) {
          if (self.asmOrder[m].type === 'latestUserPrompt') { hasLUP = true; break }
        }
        if (!hasLUP) {
          for (var n = 0; n < self.asmOrder.length; n++) {
            if (self.asmOrder[n].type === 'chat') {
              self.asmOrder.splice(n + 1, 0, { type: 'latestUserPrompt', id: 'latestUserPrompt' })
              break
            }
          }
          var hasLUP2 = false
          for (var p = 0; p < self.asmOrder.length; p++) {
            if (self.asmOrder[p].type === 'latestUserPrompt') { hasLUP2 = true; break }
          }
          if (!hasLUP2) self.asmOrder.push({ type: 'latestUserPrompt', id: 'latestUserPrompt' })
        }
        // \u6821\u9A8C\uFF1A\u68C0\u67E5 asmOrder \u4E2D\u7684\u9884\u8BBE ID \u662F\u5426\u5B58\u5728\u4E8E this.presets\uFF0C\u4E0D\u5339\u914D\u5219\u91CD\u5EBA
        self._validateAsmOrder()
      }
      self._asmOrderLoaded = true
    }).catch(function() {
      self._asmOrderLoaded = true
    })
  }

  P._validateAsmOrder = function() {
    var presetIds = {}
    for (var i = 0; i < this.presets.length; i++) {
      presetIds[this.presets[i].id] = true
    }
    var needRebuild = false
    for (var j = 0; j < this.asmOrder.length; j++) {
      if (this.asmOrder[j].type === 'preset' && !presetIds[this.asmOrder[j].id]) {
        needRebuild = true
        break
      }
    }
    // \u4E5F\u68C0\u67E5\u662F\u5426\u6709\u65B0\u9884\u8BBE\u4E0D\u5728 asmOrder \u4E2D
    var asmPresetIds = {}
    for (var m = 0; m < this.asmOrder.length; m++) {
      if (this.asmOrder[m].type === 'preset') asmPresetIds[this.asmOrder[m].id] = true
    }
    for (var n = 0; n < this.presets.length; n++) {
      if (this.presets[n].on && !asmPresetIds[this.presets[n].id]) {
        needRebuild = true
        break
      }
    }
    if (needRebuild) {
      console.log('[PUA] _validateAsmOrder: rebuilding asmOrder (preset IDs mismatch)')
      this.asmOrder = this._defaultAsmOrder()
      this._saveAsmOrder()
    }
  }

  P._saveAsmOrder = function() {
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.set('pua_asm_order', { order: this.asmOrder }).catch(function(e) {
      console.error('[PUA] save asm order failed', e)
    })
  }

  /* ── 顺序预设管理 ── */
  P._loadAsmOrderPresets = function() {
    var self = this
    if (!this.roche || !this.roche.storage) {
      this._asmOrderPresetsLoaded = true
      return
    }
    this.roche.storage.get('pua_asm_order_presets').then(function(data) {
      if (data && data.presets && data.presets.length) {
        self.asmOrderPresets = data.presets
      }
      self._asmOrderPresetsLoaded = true
    }).catch(function() {
      self._asmOrderPresetsLoaded = true
    })
  }

  P._saveAsmOrderPresets = function() {
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.set('pua_asm_order_presets', { presets: this.asmOrderPresets }).catch(function(e) {
      console.error('[PUA] save asm order presets failed', e)
    })
  }

  P._saveAsmOrderAsPreset = function(name) {
    // 保存预设时，将所有 char 条目合并为一个通用占位符 __char__
    // 这样单人/多人存档可以共享同一个预设，加载时自动展开
    var orderForPreset = []
    var charInserted = false
    for (var i = 0; i < this.asmOrder.length; i++) {
      if (this.asmOrder[i].type === 'char') {
        // 只在第一次遇到 char 时插入占位符
        if (!charInserted) {
          orderForPreset.push({ type: 'char', id: '__char__' })
          charInserted = true
        }
        // 跳过后续的 char 条目（加载时会根据实际 char 列表展开）
      } else {
        orderForPreset.push(this.asmOrder[i])
      }
    }
    var preset = {
      id: 'aop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name || '未命名预设',
      order: orderForPreset,
      isDefault: this.asmOrderPresets.length === 0,
      createdAt: new Date().toISOString()
    }
    this.asmOrderPresets.push(preset)
    this._saveAsmOrderPresets()
    return preset
  }

  P._loadAsmOrderFromPreset = function(presetId) {
    for (var i = 0; i < this.asmOrderPresets.length; i++) {
      if (this.asmOrderPresets[i].id === presetId) {
        var rawOrder = this.asmOrderPresets[i].order.slice()
        // 展开 __char__ 占位符为当前分支的实际 char 列表
        var expandedOrder = []
        for (var j = 0; j < rawOrder.length; j++) {
          if (rawOrder[j].type === 'char' && rawOrder[j].id === '__char__') {
            // 展开为主角色 + 所有额外角色
            expandedOrder.push({ type: 'char', id: 'char' })
            if (this.asmData.chars && this.asmData.chars.length > 0) {
              for (var ci = 0; ci < this.asmData.chars.length; ci++) {
                // 跳过主角色（已添加）
                if (this.asmData.char && this.asmData.chars[ci].id === this.asmData.char.id) continue
                expandedOrder.push({ type: 'char', id: this.asmData.chars[ci].id })
              }
            }
          } else if (rawOrder[j].type === 'char' && rawOrder[j].id !== 'char' && rawOrder[j].id !== '__char__') {
            // 兼容旧预设中的具体 char ID：如果当前分支有这个 char 则保留，否则跳过
            var charExists = false
            if (this.asmData.chars) {
              for (var cci = 0; cci < this.asmData.chars.length; cci++) {
                if (this.asmData.chars[cci].id === rawOrder[j].id) { charExists = true; break }
              }
            }
            if (this.asmData.char && rawOrder[j].id === this.asmData.char.id) charExists = true
            if (charExists) expandedOrder.push(rawOrder[j])
          } else {
            expandedOrder.push(rawOrder[j])
          }
        }
        this.asmOrder = expandedOrder
        this._saveAsmOrder()
        return true
      }
    }
    return false
  }

  P._renameAsmOrderPreset = function(presetId, newName) {
    for (var i = 0; i < this.asmOrderPresets.length; i++) {
      if (this.asmOrderPresets[i].id === presetId) {
        this.asmOrderPresets[i].name = newName
        this._saveAsmOrderPresets()
        return true
      }
    }
    return false
  }

  P._deleteAsmOrderPreset = function(presetId) {
    var wasDefault = false
    for (var i = 0; i < this.asmOrderPresets.length; i++) {
      if (this.asmOrderPresets[i].id === presetId) {
        wasDefault = this.asmOrderPresets[i].isDefault
        this.asmOrderPresets.splice(i, 1)
        break
      }
    }
    if (wasDefault && this.asmOrderPresets.length > 0) {
      this.asmOrderPresets[0].isDefault = true
    }
    this._saveAsmOrderPresets()
  }

  P._setDefaultAsmOrderPreset = function(presetId) {
    for (var i = 0; i < this.asmOrderPresets.length; i++) {
      this.asmOrderPresets[i].isDefault = (this.asmOrderPresets[i].id === presetId)
    }
    this._saveAsmOrderPresets()
  }

  P._getDefaultAsmOrderPresetId = function() {
    for (var i = 0; i < this.asmOrderPresets.length; i++) {
      if (this.asmOrderPresets[i].isDefault) return this.asmOrderPresets[i].id
    }
    return ''
  }

  /* ── 绑定导出 ── */
  P._showBundleExportModal = function() {
    var self = this
    var modal = this._modalOverlay
    if (!modal) return

    var body = '<div style="font-size:11px;color:var(--pua-text-sub);margin-bottom:12px">\u4EE5\u4E0B\u4E09\u7C7B\u9884\u8BBE\u6570\u636E\u5C06\u6253\u5305\u5BFC\u51FA\u4E3A\u4E00\u4E2A JSON \u6587\u4EF6</div>'
    body += '<div style="display:flex;flex-direction:column;gap:10px">'
    body += '<div style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--pua-border);border-radius:8px;background:var(--pua-card)">'
    body += '<input type="checkbox" id="bundle-export-presets" checked disabled>'
    body += '<div><div style="font-size:11px;font-weight:600;color:var(--pua-accent-text)">\u2714 \u9884\u8BBE\u6761\u76EE</div><div style="font-size:9px;color:var(--pua-text-dim)">' + this.presets.length + ' \u9879</div></div></div>'
    body += '<div style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--pua-border);border-radius:8px;background:var(--pua-card)">'
    body += '<input type="checkbox" id="bundle-export-regexes" checked disabled>'
    body += '<div><div style="font-size:11px;font-weight:600;color:var(--pua-accent-text)">\u2714 \u6B63\u5219\u89C4\u5219</div><div style="font-size:9px;color:var(--pua-text-dim)">' + this.regexes.length + ' \u9879</div></div></div>'
    body += '<div style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--pua-border);border-radius:8px;background:var(--pua-card)">'
    body += '<input type="checkbox" id="bundle-export-asmorderpresets" checked disabled>'
    body += '<div><div style="font-size:11px;font-weight:600;color:var(--pua-accent-text)">\u2714 \u987A\u5E8F\u9884\u8BBE</div><div style="font-size:9px;color:var(--pua-text-dim)">' + this.asmOrderPresets.length + ' \u9879\uFF08\u542B\u7EC4\u88C5\u987A\u5E8F\uFF09</div></div></div>'
    body += '</div>'

    var modalBody = modal.querySelector('.pua-modal-body')
    if (modalBody) modalBody.innerHTML = body
    var modalTitle = modal.querySelector('.pua-modal-title')
    if (modalTitle) modalTitle.textContent = '\u7ED1\u5B9A\u5BFC\u51FA'

    var footer = modal.querySelector('.pua-modal-footer')
    if (footer) footer.remove()
    footer = document.createElement('div')
    footer.className = 'pua-modal-footer'
    var confirmBtn = document.createElement('button')
    confirmBtn.className = 'pua-btn pua-btn-gold'
    confirmBtn.textContent = '\u5BFC\u51FA'
    confirmBtn.addEventListener('click', function() { self._doBundleExport() })
    var cancelBtn = document.createElement('button')
    cancelBtn.className = 'pua-btn'
    cancelBtn.textContent = '\u53D6\u6D88'
    cancelBtn.addEventListener('click', function() { self._closeModal() })
    footer.appendChild(cancelBtn)
    footer.appendChild(confirmBtn)
    var modalInner = modal.querySelector('.pua-modal')
    if (modalInner) modalInner.appendChild(footer)
    modal.classList.add('show')
  }

  P._doBundleExport = function() {
    var bundle = {
      version: 2,
      type: 'pua_asm_bundle',
      presets: this.presets.slice(),
      regexes: this.regexes.slice(),
      asmOrderPresets: this.asmOrderPresets.slice(),
      asmOrder: (this.asmOrder || []).slice(),
      exportDate: new Date().toISOString()
    }

    var now = new Date()
    var y = now.getFullYear()
    var m = ('0' + (now.getMonth() + 1)).slice(-2)
    var d = ('0' + now.getDate()).slice(-2)
    var filename = 'pua-bundle-' + y + m + d + '.json'

    this._downloadFile(JSON.stringify(bundle, null, 2), filename, 'application/json')

    this._closeModal()
    this._toast('\u7ED1\u5B9A\u5BFC\u51FA\u5B8C\u6210')
  }

  /* ── 绑定导入 ── */
  P._showBundleImportModal = function() {
    var self = this
    var modal = this._modalOverlay
    if (!modal) return

    var body = '<div style="font-size:11px;color:var(--pua-text-sub);margin-bottom:12px">\u9009\u62E9\u5BFC\u5165\u7684\u7ED1\u5B9A\u6587\u4EF6</div>'
    body += '<input type="file" id="bundle-import-file" accept=".json" style="width:100%;font-size:11px;color:var(--pua-text);margin-bottom:10px">'
    body += '<div id="bundle-import-preview" style="display:none"></div>'

    var modalBody = modal.querySelector('.pua-modal-body')
    if (modalBody) modalBody.innerHTML = body
    var modalTitle = modal.querySelector('.pua-modal-title')
    if (modalTitle) modalTitle.textContent = '\u7ED1\u5B9A\u5BFC\u5165'

    var footer = modal.querySelector('.pua-modal-footer')
    if (footer) footer.remove()
    footer = document.createElement('div')
    footer.className = 'pua-modal-footer'
    var confirmBtn = document.createElement('button')
    confirmBtn.className = 'pua-btn pua-btn-gold'
    confirmBtn.id = 'bundle-import-confirm'
    confirmBtn.textContent = '\u5BFC\u5165'
    confirmBtn.style.display = 'none'
    confirmBtn.addEventListener('click', function() { self._doBundleImport() })
    var cancelBtn = document.createElement('button')
    cancelBtn.className = 'pua-btn'
    cancelBtn.textContent = '\u53D6\u6D88'
    cancelBtn.addEventListener('click', function() { self._closeModal() })
    footer.appendChild(cancelBtn)
    footer.appendChild(confirmBtn)
    var modalInner = modal.querySelector('.pua-modal')
    if (modalInner) modalInner.appendChild(footer)

    var fileInput = modal.querySelector('#bundle-import-file')
    if (fileInput) {
      fileInput.addEventListener('change', function() {
        var file = this.files && this.files[0]
        if (!file) return
        var reader = new FileReader()
        reader.onload = function(e) {
          try {
            var data = JSON.parse(e.target.result)
            if (data.type !== 'pua_asm_bundle') {
              self._toast('\u975E\u6CD5\u7684\u7ED1\u5B9A\u6587\u4EF6\u683C\u5F0F')
              return
            }
            self._parsedBundleData = data
            var preview = modal.querySelector('#bundle-import-preview')
            if (preview) {
              var ph = '<div style="padding:10px;border:1px solid var(--pua-border);border-radius:8px;background:var(--pua-bg-card)">'
              ph += '<div style="font-size:11px;font-weight:600;color:var(--pua-accent-text);margin-bottom:8px">\u6587\u4EF6\u9884\u89C8</div>'
              ph += '<div style="font-size:10px;color:var(--pua-text-sub);margin-bottom:4px">\u9884\u8BBE: ' + (data.presets ? data.presets.length : 0) + ' \u9879</div>'
              ph += '<div style="font-size:10px;color:var(--pua-text-sub);margin-bottom:4px">\u6B63\u5219: ' + (data.regexes ? data.regexes.length : 0) + ' \u9879</div>'
              ph += '<div style="font-size:10px;color:var(--pua-text-sub);margin-bottom:4px">\u987A\u5E8F\u9884\u8BBE: ' + (data.asmOrderPresets ? data.asmOrderPresets.length : 0) + ' \u9879</div>'
              ph += '<div style="font-size:10px;color:var(--pua-text-sub);margin-bottom:10px">\u7EC4\u88C5\u987A\u5E8F: ' + (data.asmOrder && data.asmOrder.length > 0 ? data.asmOrder.length + ' \u9879' : '\u65E0') + '</div>'
              ph += '<div style="display:flex;flex-direction:column;gap:8px">'
              ph += '<div style="display:flex;align-items:center;gap:8px;font-size:10px;color:var(--pua-text-sub)"><input type="checkbox" id="bundle-import-presets" checked disabled> \u5BFC\u5165\u9884\u8BBE (' + (data.presets ? data.presets.length : 0) + ')</div>'
              ph += '<div style="display:flex;align-items:center;gap:8px;font-size:10px;color:var(--pua-text-sub)"><input type="checkbox" id="bundle-import-regexes" checked disabled> \u5BFC\u5165\u6B63\u5219 (' + (data.regexes ? data.regexes.length : 0) + ')</div>'
              ph += '<div style="display:flex;align-items:center;gap:8px;font-size:10px;color:var(--pua-text-sub)"><input type="checkbox" id="bundle-import-asmorderpresets" checked disabled> \u5BFC\u5165\u987A\u5E8F\u9884\u8BBE (' + (data.asmOrderPresets ? data.asmOrderPresets.length : 0) + ')</div>'
              ph += '</div></div>'
              preview.innerHTML = ph
              preview.style.display = 'block'
            }
            var confirmBtn2 = modal.querySelector('#bundle-import-confirm')
            if (confirmBtn2) confirmBtn2.style.display = ''
          } catch(err) {
            self._toast('\u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u786E\u8BA4\u6587\u4EF6\u4E3A\u6709\u6548\u7684 JSON')
          }
        }
        reader.readAsText(file, 'UTF-8')
      })
    }

    modal.classList.add('show')
  }

  P._doBundleImport = function() {
    var data = this._parsedBundleData
    if (!data) { this._toast('\u6CA1\u6709\u53EF\u5BFC\u5165\u7684\u6570\u636E'); return }

    var presetCount = 0, regexCount = 0, asmOrderPresetCount = 0
    var count = 0
    var idMap = {} // old id -> new id mapping for asmOrder references

    // Import presets
    if (data.presets && data.presets.length) {
      for (var pi = 0; pi < data.presets.length; pi++) {
        var src = data.presets[pi]
        var newId = 'p' + Date.now() + '_' + count
        if (src.id) idMap[src.id] = newId
        this.presets.push({
          id: newId,
          title: src.title || '\u672A\u547D\u540D',
          role: src.role || 'system',
          on: src.on !== undefined ? src.on : true,
          content: src.content || '',
          outRegex: src.outRegex || '',
          outRegexOn: src.outRegexOn || false,
          inRegex: src.inRegex || '',
          inRegexOn: src.inRegexOn || false,
          dMin: src.dMin || 0,
          dMax: src.dMax || Infinity
        })
        count++
        presetCount++
      }
      this._savePresets()
    }

    // Import regexes
    if (data.regexes && data.regexes.length) {
      for (var ri = 0; ri < data.regexes.length; ri++) {
        var src2 = data.regexes[ri]
        var newRId = 'r' + Date.now() + '_' + count
        if (src2.id) idMap[src2.id] = newRId
        this.regexes.push({
          id: newRId,
          name: src2.name || '\u672A\u547D\u540D',
          regex: src2.regex || '',
          html: src2.html || '',
          type: src2.type || 'render',
          on: src2.on !== undefined ? src2.on : true,
          dMin: src2.dMin || 0,
          dMax: src2.dMax || Infinity
        })
        count++
        regexCount++
      }
      this._saveRegexes()
    }

    // Import asmOrder with id mapping
    if (data.asmOrder && data.asmOrder.length) {
      var mappedOrder = []
      for (var oi = 0; oi < data.asmOrder.length; oi++) {
        var item = data.asmOrder[oi]
        var newItem = { type: item.type, id: item.id }
        if (item.type === 'preset' && idMap[item.id]) {
          newItem.id = idMap[item.id]
        }
        mappedOrder.push(newItem)
      }
      this.asmOrder = mappedOrder
      this._saveAsmOrder()
    }

    // Import asmOrderPresets with id mapping
    if (data.asmOrderPresets && data.asmOrderPresets.length) {
      for (var api = 0; api < data.asmOrderPresets.length; api++) {
        var srcPreset = data.asmOrderPresets[api]
        var mappedPresetOrder = []
        if (srcPreset.order) {
          for (var mi = 0; mi < srcPreset.order.length; mi++) {
            var mItem = srcPreset.order[mi]
            var newMItem = { type: mItem.type, id: mItem.id }
            if (mItem.type === 'preset' && idMap[mItem.id]) {
              newMItem.id = idMap[mItem.id]
            }
            mappedPresetOrder.push(newMItem)
          }
        }
        this.asmOrderPresets.push({
          id: 'aop_' + Date.now() + '_' + count,
          name: srcPreset.name || '\u5BFC\u5165\u9884\u8BBE',
          order: mappedPresetOrder,
          isDefault: false,
          createdAt: new Date().toISOString()
        })
        count++
        asmOrderPresetCount++
      }
      this._saveAsmOrderPresets()
    }

    this._parsedBundleData = null
    this._closeModal()

    var summary = ''
    if (presetCount > 0) summary += '\u9884\u8BBE ' + presetCount + ' \u9879'
    if (regexCount > 0) summary += (summary ? ', ' : '') + '\u6B63\u5219 ' + regexCount + ' \u9879'
    if (asmOrderPresetCount > 0) summary += (summary ? ', ' : '') + '\u987A\u5E8F\u9884\u8BBE ' + asmOrderPresetCount + ' \u9879'
    this._toast('\u7ED1\u5B9A\u5BFC\u5165\u5B8C\u6210: ' + (summary || '\u65E0\u5185\u5BB9'))
    this._render()
  }

  P._countWorldEntries = function(group) {
    var entries = this.asmData.worldEntries || []
    var count = 0
    for (var i = 0; i < entries.length; i++) {
      if (entries[i]._group === group) count++
    }
    return count
  }

  P._reorderAsm = function(fromType, fromId, toType, toId) {
    var order = this.asmOrder && this.asmOrder.length > 0 ? this.asmOrder : this._defaultAsmOrder()
    var fi = -1, ti = -1
    for (var i = 0; i < order.length; i++) {
      if (order[i].type === fromType && order[i].id === fromId) fi = i
      if (order[i].type === toType && order[i].id === toId) ti = i
    }
    if (fi < 0 || ti < 0) return
    var item = order.splice(fi, 1)[0]
    order.splice(ti, 0, item)
    this.asmOrder = order
    this._saveAsmOrder()

    // 保存滚动位置
    var self = this
    var visualEl = this._contentEl ? this._contentEl.querySelector('.asm-visual') : null
    var savedScroll = visualEl ? visualEl.scrollTop : 0

    this._render()

    // 下一帧恢复滚动位置
    setTimeout(function() {
      var newVisualEl = self._contentEl ? self._contentEl.querySelector('.asm-visual') : null
      if (newVisualEl && savedScroll > 0) {
        newVisualEl.scrollTop = savedScroll
      }
    }, 0)
  }

  /* ── 数据拉取 ── */
  P._fetchAsmData = function(silent) {
    var self = this

    // 找到选中的分支
    var branch = null
    for (var i = 0; i < this.branches.length; i++) {
      if (this.branches[i].id === this.asmBranchId) { branch = this.branches[i]; break }
    }
    if (!branch) {
      this._toast('\u8BF7\u5148\u9009\u62E9\u5206\u652F\u5B58\u6863')
      return
    }

    this.asmLoading = true
    this.asmData = { branch: branch, char: null, chars: [], userPersona: null, shortTerm: [], longTerm: null, worldbook: [], worldEntries: [] }
    if (!silent) this._render()

    var promises = []

    // 获取角色信息（主角色）
    if (branch.charId && this.roche.character && this.roche.character.get) {
      promises.push(
        this.roche.character.get(branch.charId).then(function(ch) {
          self.asmData.char = ch || null
        }).catch(function() {})
      )
    }

    // 获取选中的角色人设（多个，跳过主角色避免重复）
    if (branch.selectedCharIds && branch.selectedCharIds.length > 0 && this.roche.character && this.roche.character.get) {
      console.log('[PUA] _fetchAsmData: fetching ' + branch.selectedCharIds.length + ' selected chars, ids=' + JSON.stringify(branch.selectedCharIds))
      for (var sci = 0; sci < branch.selectedCharIds.length; sci++) {
        // 跳过主角色（已通过 asmData.char 获取）
        if (branch.selectedCharIds[sci] === branch.charId) continue
        ;(function(charId) {
          promises.push(
            self.roche.character.get(charId).then(function(ch) {
              if (ch) {
                console.log('[PUA] _fetchAsmData: got char id=' + charId + ' name=' + (ch.handle || ch.name) + ' hasPersona=' + !!(ch.persona || ch.bio))
                self.asmData.chars.push(ch)
              } else {
                console.log('[PUA] _fetchAsmData: char id=' + charId + ' returned null')
              }
            }).catch(function(err) {
              console.error('[PUA] _fetchAsmData: failed to get char id=' + charId + ' err=' + (err.message || err))
            })
          )
        })(branch.selectedCharIds[sci])
      }
    } else if (branch.sourceConvId && this.roche.conversation && this.roche.conversation.get) {
      // Fallback: 分支没有 selectedCharIds 但有 sourceConvId（可能是旧分支或群聊）
      // 尝试从会话获取成员列表
      console.log('[PUA] _fetchAsmData: no selectedCharIds, trying conversation.get for group members, convId=' + branch.sourceConvId)
      promises.push(
        this.roche.conversation.get(branch.sourceConvId).then(function(conv) {
          if (conv && conv.members && Array.isArray(conv.members) && conv.members.length > 0) {
            var memberIds = []
            for (var gmi = 0; gmi < conv.members.length; gmi++) {
              var gm = conv.members[gmi]
              var gmemberId = gm.id || gm.charId || gm.characterId || (typeof gm === 'string' ? gm : '')
              if (gmemberId && gmemberId !== branch.charId && memberIds.indexOf(gmemberId) === -1) memberIds.push(gmemberId)
            }
            console.log('[PUA] _fetchAsmData: found ' + memberIds.length + ' group members from conversation')
            // 更新分支的 selectedCharIds（持久化）
            branch.selectedCharIds = branch.charId ? [branch.charId].concat(memberIds) : memberIds
            self._saveBranches()
            // 获取每个成员的角色人设，收集为子 Promise 数组
            var charPromises = []
            for (var gci = 0; gci < memberIds.length; gci++) {
              ;(function(charId) {
                if (self.roche.character && self.roche.character.get) {
                  charPromises.push(
                    self.roche.character.get(charId).then(function(ch) {
                      if (ch) self.asmData.chars.push(ch)
                    }).catch(function() {})
                  )
                }
              })(memberIds[gci])
            }
            // 等待所有角色获取完成后再 resolve 外层 Promise
            return Promise.all(charPromises)
          }
        }).catch(function() {})
      )
    } else {
      console.log('[PUA] _fetchAsmData: no selectedCharIds and no sourceConvId, branchId=' + branch.id)
    }

    // 获取用户人设
    if (this.roche.persona && this.roche.persona.getActiveUserPersona) {
      promises.push(
        this.roche.persona.getActiveUserPersona().then(function(p) {
          self.asmData.userPersona = p || null
        }).catch(function() {})
      )
    }

    // 获取世界书（根据分支配置）
    if (this.roche.worldbook && this.roche.worldbook.list) {
      promises.push(
        this.roche.worldbook.list().then(function(cats) {
          self.asmData.worldbook = cats || []
          var entryPromises = []
          var wbConfig = branch.mountedWorldbooks || {}

          for (var ci = 0; ci < (cats || []).length; ci++) {
            (function(cat) {
              var shouldLoad = false

              // 全局世界书：自动加载
              if (cat.scope === 'global' && wbConfig.global !== false) {
                shouldLoad = true
              }

              // 本地世界书：检查是否在配置中
              if (cat.scope === 'local' && wbConfig.local && wbConfig.local[cat.id]) {
                shouldLoad = true
              }

              if (!shouldLoad) return

              if (self.roche.worldbook && self.roche.worldbook.getEntries) {
                entryPromises.push(
                  self.roche.worldbook.getEntries({ categoryId: cat.id }).then(function(entries) {
                    if (entries && entries.length > 0) {
                      // 如果配置是数组（精确到词条），只加载勾选的词条
                      var localConfig = wbConfig.local ? wbConfig.local[cat.id] : null
                      var isExactEntries = Array.isArray(localConfig)

                      for (var ei = 0; ei < entries.length; ei++) {
                        // 如果是精确词条选择，检查是否在列表中
                        if (isExactEntries) {
                          var found = false
                          for (var fi = 0; fi < localConfig.length; fi++) {
                            if (localConfig[fi] === entries[ei].id) { found = true; break }
                          }
                          if (!found) continue
                        }

                        var pos = entries[ei].position || entries[ei].insertionOrder || entries[ei].depth || 0
                        var group = 'world-pre'
                        if (pos >= 2 && pos < 5) group = 'world-mid'
                        else if (pos >= 5) group = 'world-post'
                        entries[ei]._group = group
                        self.asmData.worldEntries.push(entries[ei])
                      }
                    }
                  }).catch(function() {})
                )
              }
            })(cats[ci])
          }
          return Promise.all(entryPromises)
        }).catch(function() {})
      )
    }

    // 获取记忆数据
    // 1. 主会话的记忆
    console.log('[PUA] _fetchAsmData: fetching memory, branch.source=' + branch.source + ' sourceConvId=' + branch.sourceConvId + ' roche.memory=' + !!(this.roche && this.roche.memory))
    if (branch.source === 'online' && branch.sourceConvId) {
      var convId = branch.sourceConvId
      if (this.roche.memory && this.roche.memory.getShortTerm) {
        promises.push(
          this.roche.memory.getShortTerm({ conversationId: convId, limit: 100 }).then(function(msgs) {
            self.asmData.shortTerm = msgs || []
            console.log('[PUA] _fetchAsmData: getShortTerm returned, msgs=' + (msgs ? (Array.isArray(msgs) ? msgs.length : 'not-array') : 'null') + ' convId=' + convId)
          }).catch(function(e) {
            console.warn('[PUA] _fetchAsmData: getShortTerm FAILED, convId=' + convId + ' err=' + (e.message || e))
          })
        )
      } else {
        console.warn('[PUA] _fetchAsmData: no roche.memory.getShortTerm available')
      }
      if (this.roche.memory && this.roche.memory.getLongTerm) {
        promises.push(
          this.roche.memory.getLongTerm({ conversationId: convId, limit: 100 }).then(function(data) {
            self.asmData.longTerm = data || null
            if (data) {
              var factCount = (data.facts && data.facts.length) || 0
              var hasCore = !!(data.core)
              var vecCount = (data.vectors && data.vectors.length) || 0
              console.log('[PUA] _fetchAsmData: getLongTerm returned, facts=' + factCount + ' core=' + hasCore + ' vectors=' + vecCount + ' convId=' + convId)
            } else {
              console.warn('[PUA] _fetchAsmData: getLongTerm returned null, convId=' + convId)
            }
          }).catch(function(e) {
            console.warn('[PUA] _fetchAsmData: getLongTerm FAILED, convId=' + convId + ' err=' + (e.message || e))
          })
        )
      } else {
        console.warn('[PUA] _fetchAsmData: no roche.memory.getLongTerm available')
      }
    } else {
      // 离线分支：直接使用分支中的数据
      this.asmData.shortTerm = branch.messages || []
      this.asmData.longTerm = branch.longTermMemory || null
      console.log('[PUA] _fetchAsmData: offline branch, shortTerm=' + this.asmData.shortTerm.length + ' longTerm=' + (this.asmData.longTerm ? 'yes' : 'no') + ' memoryConvIds=' + JSON.stringify(branch.memoryConvIds || []))
      // 如果分支有绑定的记忆会话，从roche.memory获取
      if (!this.asmData.longTerm && branch.memoryConvIds && branch.memoryConvIds.length > 0 && this.roche && this.roche.memory && this.roche.memory.getLongTerm) {
        for (var omci = 0; omci < branch.memoryConvIds.length; omci++) {
          (function(memConvId2) {
            promises.push(
              self.roche.memory.getLongTerm({ conversationId: memConvId2, limit: 100 }).then(function(data) {
                if (data) {
                  self.asmData.longTerm = data
                  var factCount = (data.facts && data.facts.length) || 0
                  var hasCore = !!(data.core)
                  console.log('[PUA] _fetchAsmData: got longTerm for offline branch via memoryConvId, facts=' + factCount + ' core=' + hasCore)
                }
              }).catch(function(e) {
                console.warn('[PUA] _fetchAsmData: getLongTerm FAILED for memoryConvId=' + memConvId2 + ', err=' + (e.message || e))
              })
            )
          })(branch.memoryConvIds[omci])
        }
      }
    }

    // 2. 绑定的其他会话的记忆
    if (branch.memoryConvIds && branch.memoryConvIds.length > 0 && this.roche.memory && this.roche.memory.getLongTerm) {
      for (var mci = 0; mci < branch.memoryConvIds.length; mci++) {
        (function(memConvId) {
          // 跳过主会话（已获取）
          if (memConvId === branch.sourceConvId) return
          promises.push(
            self.roche.memory.getLongTerm({ conversationId: memConvId, limit: 100 }).then(function(data) {
              if (!data) return
              // 合并到长期记忆
              if (!self.asmData.longTerm) {
                self.asmData.longTerm = { core: null, facts: [], vectors: [] }
              }
              if (!self.asmData.longTerm.facts) self.asmData.longTerm.facts = []
              // 合并核心记忆
              if (data.core) {
                if (!self.asmData.longTerm.core) {
                  self.asmData.longTerm.core = { relationship: '', events: [], summary: '', text: '' }
                }
                // 合并 relationship
                var dataRel = data.core.relationship || ''
                if (dataRel) {
                  if (!self.asmData.longTerm.core.relationship) {
                    self.asmData.longTerm.core.relationship = dataRel
                  } else if (self.asmData.longTerm.core.relationship.indexOf(dataRel) === -1) {
                    self.asmData.longTerm.core.relationship += '\n' + dataRel
                  }
                }
                // 合并 events 数组
                if (data.core.events && Array.isArray(data.core.events)) {
                  if (!self.asmData.longTerm.core.events) self.asmData.longTerm.core.events = []
                  for (var devi = 0; devi < data.core.events.length; devi++) {
                    var dataEvt = data.core.events[devi]
                    var dataEvtText = dataEvt.text || dataEvt.oneSentence || ''
                    if (!dataEvtText) continue
                    var dataEvtExists = false
                    for (var deei = 0; deei < self.asmData.longTerm.core.events.length; deei++) {
                      if (self.asmData.longTerm.core.events[deei].text === dataEvtText) { dataEvtExists = true; break }
                    }
                    if (!dataEvtExists) {
                      self.asmData.longTerm.core.events.push({
                        id: dataEvt.id || ('evt_' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)),
                        text: dataEvtText,
                        timestamp: dataEvt.timestamp || new Date().toISOString()
                      })
                    }
                  }
                }
                // 兼容旧格式：也合并 summary/text
                var coreText = data.core.summary || data.core.text || ''
                if (coreText) {
                  var existingText = self.asmData.longTerm.core.summary || self.asmData.longTerm.core.text || ''
                  if (existingText.indexOf(coreText) === -1) {
                    if (self.asmData.longTerm.core.summary) {
                      self.asmData.longTerm.core.summary += '\n' + coreText
                    } else if (self.asmData.longTerm.core.text) {
                      self.asmData.longTerm.core.text += '\n' + coreText
                    }
                  }
                }
              }
              // 合并事实记忆（去重）
              if (data.facts && data.facts.length > 0) {
                var existingTexts = {}
                for (var efi = 0; efi < self.asmData.longTerm.facts.length; efi++) {
                  var efText = self.asmData.longTerm.facts[efi].text || self.asmData.longTerm.facts[efi].summary || ''
                  if (efText) existingTexts[efText] = true
                }
                for (var fi = 0; fi < data.facts.length; fi++) {
                  var fText = data.facts[fi].summaryText || data.facts[fi].action || data.facts[fi].text || ''
                  if (fText && !existingTexts[fText]) {
                    self.asmData.longTerm.facts.push(data.facts[fi])
                    existingTexts[fText] = true
                  }
                }
              }
            }).catch(function() {})
          )
        })(branch.memoryConvIds[mci])
      }
    }

    Promise.all(promises).then(function() {
      // 合并分支对应的 localStorage 记忆数据
      if (branch.id) {
        var localMemData = self._loadMemData(branch.id)
        if (localMemData) {
          if (!self.asmData.longTerm) {
            self.asmData.longTerm = { core: null, facts: [], vectors: [] }
          }
          // 合并核心记忆
          if (localMemData.core) {
            if (!self.asmData.longTerm.core) {
              self.asmData.longTerm.core = { relationship: '', events: [], summary: '', text: '' }
            }
            // 合并 relationship
            var localCoreRel = localMemData.core.relationship || ''
            if (localCoreRel) {
              if (!self.asmData.longTerm.core.relationship) {
                self.asmData.longTerm.core.relationship = localCoreRel
              } else if (self.asmData.longTerm.core.relationship.indexOf(localCoreRel) === -1) {
                self.asmData.longTerm.core.relationship += '\n' + localCoreRel
              }
            }
            // 合并 events 数组
            if (localMemData.core.events && Array.isArray(localMemData.core.events)) {
              if (!self.asmData.longTerm.core.events) self.asmData.longTerm.core.events = []
              for (var levi = 0; levi < localMemData.core.events.length; levi++) {
                var localEvt = localMemData.core.events[levi]
                var localEvtText = localEvt.text || localEvt.oneSentence || ''
                if (!localEvtText) continue
                var evtExists = false
                for (var leei = 0; leei < self.asmData.longTerm.core.events.length; leei++) {
                  if (self.asmData.longTerm.core.events[leei].text === localEvtText) { evtExists = true; break }
                }
                if (!evtExists) {
                  self.asmData.longTerm.core.events.push({
                    id: localEvt.id || ('evt_' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)),
                    text: localEvtText,
                    timestamp: localEvt.timestamp || new Date().toISOString()
                  })
                }
              }
            }
            // 兼容旧格式：同步 summary/text
            var mergedCoreText = ''
            if (self.asmData.longTerm.core.relationship) mergedCoreText += self.asmData.longTerm.core.relationship
            if (self.asmData.longTerm.core.events && self.asmData.longTerm.core.events.length > 0) {
              if (mergedCoreText) mergedCoreText += '\n'
              var evtArr = []
              for (var levi2 = 0; levi2 < self.asmData.longTerm.core.events.length; levi2++) {
                evtArr.push(self.asmData.longTerm.core.events[levi2].text || '')
              }
              mergedCoreText += evtArr.join('\n')
            }
            self.asmData.longTerm.core.summary = mergedCoreText
            self.asmData.longTerm.core.text = mergedCoreText
          }
          // 合并事实记忆
          if (localMemData.facts && localMemData.facts.length > 0) {
            if (!self.asmData.longTerm.facts) self.asmData.longTerm.facts = []
            for (var lfi = 0; lfi < localMemData.facts.length; lfi++) {
              var localFact = localMemData.facts[lfi]
              var factText = localFact.text || localFact.summary || ''
              if (!factText) continue
              var exists = false
              for (var lei = 0; lei < self.asmData.longTerm.facts.length; lei++) {
                var ef = self.asmData.longTerm.facts[lei]
                if ((ef.summaryText || ef.action || ef.text || '') === factText) { exists = true; break }
              }
              if (!exists) {
                self.asmData.longTerm.facts.push({
                  summaryText: localFact.summary || factText,
                  action: localFact.text || '',
                  text: localFact.text || ''
                })
              }
            }
          }
        }
      }
      // Expand __char__ placeholders in asmOrder before syncing
      var expandedAsmOrder = []
      for (var eai = 0; eai < self.asmOrder.length; eai++) {
        if (self.asmOrder[eai].type === 'char' && self.asmOrder[eai].id === '__char__') {
          // 展开为主角色 + 所有额外角色
          expandedAsmOrder.push({ type: 'char', id: 'char' })
          if (self.asmData.chars && self.asmData.chars.length > 0) {
            for (var eci = 0; eci < self.asmData.chars.length; eci++) {
              if (self.asmData.char && self.asmData.chars[eci].id === self.asmData.char.id) continue
              expandedAsmOrder.push({ type: 'char', id: self.asmData.chars[eci].id })
            }
          }
        } else {
          expandedAsmOrder.push(self.asmOrder[eai])
        }
      }
      self.asmOrder = expandedAsmOrder
      // Sync char entries in asmOrder with current asmData.chars
      // Build set of valid char IDs: 'char' (main) + all extra char IDs from asmData.chars
      var mainCharRealId = (self.asmData.char && self.asmData.char.id) ? self.asmData.char.id : null
      var validCharIds = { 'char': true }
      if (mainCharRealId) {
        validCharIds[mainCharRealId] = true // main char by actual ID too
      }
      if (self.asmData.chars) {
        for (var vci = 0; vci < self.asmData.chars.length; vci++) {
          var vc = self.asmData.chars[vci]
          if (vc && vc.id) validCharIds[vc.id] = true
        }
      }
      // Remove stale char entries not in current branch's char list
      // Also deduplicate: if mainCharRealId exists, remove entries with id=mainCharRealId
      // because the main char is already represented by id='char'
      var newOrder = []
      var hasMainCharGeneric = false // track if { type:'char', id:'char' } exists
      for (var oi2 = 0; oi2 < self.asmOrder.length; oi2++) {
        if (self.asmOrder[oi2].type === 'char') {
          var entryId = self.asmOrder[oi2].id
          if (entryId === 'char') {
            hasMainCharGeneric = true
          }
          // Skip if this entry's id is the same as mainCharRealId AND a 'char' generic entry exists
          // This prevents duplicate: { type:'char', id:'char' } and { type:'char', id:'char_123' } pointing to same char
          if (mainCharRealId && entryId === mainCharRealId && hasMainCharGeneric) {
            console.log('[PUA] _fetchAsmData: removed duplicate char entry (same as main char), id=' + entryId)
            continue
          }
          if (validCharIds[entryId]) {
            newOrder.push(self.asmOrder[oi2])
          } else {
            console.log('[PUA] _fetchAsmData: removed stale char from asmOrder, id=' + entryId)
          }
        } else {
          newOrder.push(self.asmOrder[oi2])
        }
      }
      // Second pass: if we found 'char' generic entry AND mainCharRealId entry, remove the realId one
      if (mainCharRealId && hasMainCharGeneric) {
        var deduped = []
        for (var di = 0; di < newOrder.length; di++) {
          if (newOrder[di].type === 'char' && newOrder[di].id === mainCharRealId) {
            console.log('[PUA] _fetchAsmData: removed duplicate char entry (realId same as main), id=' + mainCharRealId)
            continue
          }
          deduped.push(newOrder[di])
        }
        newOrder = deduped
      }
      // Add missing char entries (extra chars not yet in asmOrder)
      for (var aci2 = 0; aci2 < (self.asmData.chars || []).length; aci2++) {
        var charItem2 = self.asmData.chars[aci2]
        if (!charItem2 || !charItem2.id) continue
        if (self.asmData.char && charItem2.id === self.asmData.char.id) continue
        var alreadyExists = false
        for (var ni = 0; ni < newOrder.length; ni++) {
          if (newOrder[ni].type === 'char' && newOrder[ni].id === charItem2.id) { alreadyExists = true; break }
        }
        if (!alreadyExists) {
          var insertIdx2 = -1
          for (var mci2 = 0; mci2 < newOrder.length; mci2++) {
            if (newOrder[mci2].type === 'char' && newOrder[mci2].id === 'char') { insertIdx2 = mci2 + 1; break }
          }
          if (insertIdx2 < 0) insertIdx2 = newOrder.length
          newOrder.splice(insertIdx2, 0, { type: 'char', id: charItem2.id })
          console.log('[PUA] _fetchAsmData: added char to asmOrder, id=' + charItem2.id + ' name=' + (charItem2.handle || charItem2.name))
        }
      }
      self.asmOrder = newOrder
      self._saveAsmOrder()
      self.asmLoading = false
      if (!silent) self._render()
    }).catch(function(err) {
      self.asmLoading = false
      if (!silent) {
        self._render()
        self._toast('数据加载失败: ' + (err && err.message ? err.message : '未知错误'))
      }
    })
  }

  /* ── 辅助：创建按钮 ── */
  P._mkBtn = function(text, cls, onclick) {
    var btn = document.createElement('button')
    btn.className = cls || 'pua-btn'
    btn.textContent = text
    if (onclick) btn.addEventListener('click', onclick)
    return btn
  }

  /* ── 渲染上下文组装页面 ── */
  P._renderAssembly = function(titleEl, actionsEl, contentEl) {
    var self = this
    titleEl.textContent = '\u4E0A\u4E0B\u6587\u7EC4\u88C5'

    // Top bar buttons
    actionsEl.innerHTML = ''
    var btnRefresh = this._mkBtn('\u5237\u65B0\u6570\u636E', 'pua-btn', function() { self._fetchAsmData() })
    var btnPreview = this._mkBtn('\u9884\u89C8\u4E0A\u4E0B\u6587', 'pua-btn pua-btn-gold', function() { self._previewAssembly() })
    var btnSave = this._mkBtn('\u4FDD\u5B58', 'pua-btn', function() { self._saveAsmConfig(); self._toast('\u7EC4\u88C5\u914D\u7F6E\u5DF2\u4FDD\u5B58') })
    var btnBundleExport = this._mkBtn('\u7ED1\u5B9A\u5BFC\u51FA', 'pua-btn', function() { self._showBundleExportModal() })
    var btnBundleImport = this._mkBtn('\u7ED1\u5B9A\u5BFC\u5165', 'pua-btn', function() { self._showBundleImportModal() })
    actionsEl.appendChild(btnRefresh)
    actionsEl.appendChild(btnPreview)
    actionsEl.appendChild(btnSave)
    actionsEl.appendChild(btnBundleExport)
    actionsEl.appendChild(btnBundleImport)

    // Main content
    var h = '<div class="asm-layout">'

    // === Left: Visual flow ===
    h += '<div class="asm-visual">'

    // Branch selector
    h += '<div style="margin-bottom:12px;display:flex;align-items:center;gap:8px">'
    h += '<span style="font-size:11px;color:var(--pua-text-sub)">\u6570\u636E\u6765\u6E90\uFF1A</span>'
    h += '<select class="pua-field-input" id="asm-branch-select" style="flex:1">'
    h += '<option value="">-- \u9009\u62E9\u5206\u652F\u5B58\u6863 --</option>'
    for (var bi = 0; bi < this.branches.length; bi++) {
      var br = this.branches[bi]
      var selected = br.id === this.asmBranchId ? ' selected' : ''
      h += '<option value="' + br.id + '"' + selected + '>' + this._escHtml(br.charName || '?') + ' - ' + this._escHtml(br.name) + ' (' + (br.source === 'online' ? '\u7EBF\u4E0A' : '\u7EBF\u4E0B') + ')</option>'
    }
    h += '</select></div>'

    h += '<div class="asm-flow-title">\u25BC \u4E0A\u4E0B\u6587\u6D41\u5411\uFF08\u4ECE\u4E0A\u5230\u4E0B = \u6CE8\u5165\u987A\u5E8F\uFF09</div>'

    if (this.asmLoading) {
      h += '<div class="asm-loading">\u52A0\u8F7D\u4E2D...</div>'
    } else {
      h += this._renderAsmBlocks()
    }

    h += '</div>'

    // === Right: Config panel ===
    h += '<div class="asm-config">'

    // Config section: Order presets
    h += '<div class="asm-config-section">'
    h += '<div class="asm-config-title">\u987A\u5E8F\u9884\u8BBE</div>'
    h += '<div style="display:flex;gap:6px;margin-bottom:6px">'
    h += '<select class="pua-field-input" id="asm-order-preset-select" style="flex:1">'
    h += '<option value="">-- \u9009\u62E9\u9884\u8BBE --</option>'
    for (var opi = 0; opi < this.asmOrderPresets.length; opi++) {
      var op = this.asmOrderPresets[opi]
      var opSel = op.isDefault ? ' selected' : ''
      h += '<option value="' + op.id + '"' + opSel + '>' + this._escHtml(op.name) + (op.isDefault ? ' \u2605' : '') + '</option>'
    }
    h += '</select></div>'
    h += '<div style="display:flex;gap:4px;flex-wrap:wrap">'
    h += '<button class="pua-btn pua-btn-sm" id="asm-order-preset-save" style="font-size:9px">\u4FDD\u5B58\u5F53\u524D</button>'
    h += '<button class="pua-btn pua-btn-sm" id="asm-order-preset-load" style="font-size:9px">\u52A0\u8F7D\u9884\u8BBE</button>'
    h += '<button class="pua-btn pua-btn-sm" id="asm-order-preset-rename" style="font-size:9px">\u91CD\u547D\u540D</button>'
    h += '<button class="pua-btn pua-btn-sm" id="asm-order-preset-default" style="font-size:9px">\u8BBE\u4E3A\u9ED8\u8BA4</button>'
    h += '<button class="pua-btn pua-btn-sm" id="asm-order-preset-delete" style="font-size:9px">\u5220\u9664</button>'
    h += '</div></div>'

    // Config section: Depth
    h += '<div class="asm-config-section">'
    h += '<div class="asm-config-title">\u804A\u5929\u8BB0\u5F55\u622A\u53D6</div>'
    h += '<div class="asm-config-row"><span class="asm-config-label">\u4E0A\u4E0B\u6587\u6DF1\u5EA6</span>'
    h += '<input class="asm-config-input" id="asm-depth" type="number" value="' + this.asmConfig.contextDepth + '" min="1" max="200">'
    h += '<span style="font-size:9px;color:var(--pua-text-dim)">\u53D6\u6700\u8FD1N\u6761</span></div>'
    h += '</div>'

    // Config section: Legend
    h += '<div class="asm-config-section">'
    h += '<div class="asm-config-title">\u56FE\u4F8B</div>'
    h += '<div class="asm-legend">'
    var legends = [
      { color: '#5b8def', label: '\u9884\u8BBE' },
      { color: '#a76aef', label: '\u89D2\u8272\u5361' },
      { color: '#4ec9a0', label: '\u7528\u6237\u4EBA\u8BBE' },
      { color: '#e0a040', label: '\u4E16\u754C\u4E66' },
      { color: '#ef6a8a', label: '\u8BB0\u5FC6' },
      { color: '#c070e0', label: '\u53EC\u56DE\u8BB0\u5FC6' },
      { color: '#6a7a9a', label: '\u804A\u5929\u8BB0\u5F55' }
    ]
    for (var li = 0; li < legends.length; li++) {
      h += '<div class="asm-legend-item"><span class="asm-legend-dot" style="background:' + legends[li].color + '"></span>' + legends[li].label + '</div>'
    }
    h += '</div></div>'

    // Config section: Data status
    h += '<div class="asm-config-section">'
    h += '<div class="asm-config-title">\u6570\u636E\u72B6\u6001</div>'
    var charName = this.asmData.char ? (this.asmData.char.handle || this.asmData.char.name || '-') : '\u672A\u52A0\u8F7D'
    var msgCount = this.asmData.shortTerm ? this.asmData.shortTerm.length : 0
    var coreMem = this.asmData.longTerm && this.asmData.longTerm.core ? '\u2713' : '-'
    var factCount = this.asmData.longTerm && this.asmData.longTerm.facts ? this.asmData.longTerm.facts.length : 0
    var weCount = this.asmData.worldEntries ? this.asmData.worldEntries.length : 0
    h += '<div class="asm-config-row"><span class="asm-config-label">\u89D2\u8272</span><span style="font-size:11px;color:var(--pua-text)">' + self._escHtml(charName) + '</span></div>'
    var extraCharCount = this.asmData.chars ? this.asmData.chars.length : 0
    if (extraCharCount > 0) {
      h += '<div class="asm-config-row"><span class="asm-config-label">\u989D\u5916\u89D2\u8272</span><span style="font-size:11px;color:var(--pua-text)">' + extraCharCount + ' \u4E2A</span></div>'
    }
    h += '<div class="asm-config-row"><span class="asm-config-label">\u804A\u5929\u6D88\u606F</span><span style="font-size:11px;color:var(--pua-text)">' + msgCount + ' \u6761</span></div>'
    h += '<div class="asm-config-row"><span class="asm-config-label">\u6838\u5FC3\u8BB0\u5FC6</span><span style="font-size:11px;color:var(--pua-text)">' + coreMem + '</span></div>'
    h += '<div class="asm-config-row"><span class="asm-config-label">\u4E8B\u5B9E\u8BB0\u5FC6</span><span style="font-size:11px;color:var(--pua-text)">' + factCount + ' \u6761</span></div>'
    h += '<div class="asm-config-row"><span class="asm-config-label">\u4E16\u754C\u4E66\u8BCD\u6761</span><span style="font-size:11px;color:var(--pua-text)">' + weCount + ' \u4E2A</span></div>'
    h += '<div class="asm-config-row"><span class="asm-config-label">\u9884\u8BBE\u6761\u76EE</span><span style="font-size:11px;color:var(--pua-text)">' + this.presets.length + ' \u9879</span></div>'
    h += '<div class="asm-config-row"><span class="asm-config-label">\u6B63\u5219\u6761\u76EE</span><span style="font-size:11px;color:var(--pua-text)">' + this.regexes.length + ' \u9879</span></div>'
    if (this.asmData.branch && this.asmData.branch.mountedSources && this.asmData.branch.mountedSources.length > 0) {
      h += '<div class="asm-config-row"><span class="asm-config-label">\u4E92\u901A\u8BB0\u5FC6</span><span style="font-size:10px;color:var(--pua-text-dim)">' + this.asmData.branch.mountedSources.length + ' \u4E2A\u4F1A\u8BDD</span></div>'
    }
    h += '</div>'

    // Config section: \u9884\u8BBE\u5206\u7C7B\u9009\u62E9
    h += '<div class="asm-config-section">'
    h += '<div class="asm-config-title">\u9884\u8BBE\u5206\u7C7B</div>'
    var ppData = this._promptPresetData
    if (ppData && ppData.presets && ppData.presets.length > 0) {
      h += '<select class="pua-field-input" id="asm-preset-group-select" style="width:100%">'
      for (var pgi = 0; pgi < ppData.presets.length; pgi++) {
        var ppg = ppData.presets[pgi]
        var ppSel = ppg.id === ppData.activePresetId ? ' selected' : ''
        h += '<option value="' + ppg.id + '"' + ppSel + '>' + this._escHtml(ppg.name || '\u672A\u547D\u540D') + ' (' + (ppg.items ? ppg.items.length : 0) + ')</option>'
      }
      h += '</select>'
    } else {
      h += '<span style="font-size:10px;color:var(--pua-text-dim)">\u65E0\u9884\u8BBE\u5206\u7C7B</span>'
    }
    h += '</div>'

    // Config section: \u6B63\u5219\u5206\u7C7B\u9009\u62E9
    h += '<div class="asm-config-section">'
    h += '<div class="asm-config-title">\u6B63\u5219\u5206\u7C7B</div>'
    var rpData = this._regexPresetData
    if (rpData && rpData.presets && rpData.presets.length > 0) {
      h += '<select class="pua-field-input" id="asm-regex-group-select" style="width:100%">'
      for (var rgi = 0; rgi < rpData.presets.length; rgi++) {
        var rpg = rpData.presets[rgi]
        var rpSel = rpg.id === rpData.activePresetId ? ' selected' : ''
        h += '<option value="' + rpg.id + '"' + rpSel + '>' + this._escHtml(rpg.name || '\u672A\u547D\u540D') + ' (' + (rpg.regexes ? rpg.regexes.length : 0) + ')</option>'
      }
      h += '</select>'
    } else {
      h += '<span style="font-size:10px;color:var(--pua-text-dim)">\u65E0\u6B63\u5219\u5206\u7C7B</span>'
    }
    h += '</div>'

    // Config section: Batch toggle
    h += '<div class="asm-config-section">'
    h += '<div class="asm-config-title">\u6279\u91CF\u64CD\u4F5C</div>'
    h += '<div style="display:flex;gap:4px;flex-wrap:wrap">'
    h += '<button class="pua-btn pua-btn-sm" id="asm-enable-all-presets" style="font-size:9px">\u5168\u90E8\u542F\u7528\u9884\u8BBE</button>'
    h += '<button class="pua-btn pua-btn-sm" id="asm-disable-all-presets" style="font-size:9px">\u5168\u90E8\u7981\u7528\u9884\u8BBE</button>'
    h += '<button class="pua-btn pua-btn-sm" id="asm-enable-all-regexes" style="font-size:9px">\u5168\u90E8\u542F\u7528\u6B63\u5219</button>'
    h += '<button class="pua-btn pua-btn-sm" id="asm-disable-all-regexes" style="font-size:9px">\u5168\u90E8\u7981\u7528\u6B63\u5219</button>'
    h += '</div></div>'

    h += '</div>' // end asm-config
    h += '</div>' // end asm-layout

    contentEl.innerHTML = h

    // Bind branch selector
    var branchSelect = contentEl.querySelector('#asm-branch-select')
    if (branchSelect) {
      branchSelect.addEventListener('change', function() {
        self.asmBranchId = this.value
        if (self.asmBranchId) {
          self._fetchAsmData()
        } else {
          self.asmData = { branch: null, char: null, chars: [], userPersona: null, shortTerm: [], longTerm: null, worldbook: [], worldEntries: [] }
          self._render()
        }
      })
    }

    // Bind config input events
    var depthInput = contentEl.querySelector('#asm-depth')
    if (depthInput) depthInput.addEventListener('change', function() {
      var newDepth = parseInt(this.value) || 40
      self.asmConfig.contextDepth = newDepth
      self._convContextDepth = newDepth
      var s = self._loadSettings()
      s.contextDepth = newDepth
      self._saveSettings(s)
      self._saveAsmConfig()
    })

    // Bind order preset buttons
    var opSelect = contentEl.querySelector('#asm-order-preset-select')
    var opSaveBtn = contentEl.querySelector('#asm-order-preset-save')
    var opLoadBtn = contentEl.querySelector('#asm-order-preset-load')
    var opRenameBtn = contentEl.querySelector('#asm-order-preset-rename')
    var opDefaultBtn = contentEl.querySelector('#asm-order-preset-default')
    var opDeleteBtn = contentEl.querySelector('#asm-order-preset-delete')

    if (opSaveBtn) {
      opSaveBtn.addEventListener('click', function() {
        var name = ''
        var selId = opSelect ? opSelect.value : ''
        if (selId) {
          // Update existing preset - also convert char entries to placeholder
          for (var i = 0; i < self.asmOrderPresets.length; i++) {
            if (self.asmOrderPresets[i].id === selId) {
              var orderForUpdate = []
              var charInserted2 = false
              for (var j = 0; j < self.asmOrder.length; j++) {
                if (self.asmOrder[j].type === 'char') {
                  if (!charInserted2) {
                    orderForUpdate.push({ type: 'char', id: '__char__' })
                    charInserted2 = true
                  }
                } else {
                  orderForUpdate.push(self.asmOrder[j])
                }
              }
              self.asmOrderPresets[i].order = orderForUpdate
              self._saveAsmOrderPresets()
              self._toast('\u987A\u5E8F\u9884\u8BBE\u5DF2\u66F4\u65B0: ' + self.asmOrderPresets[i].name)
              return
            }
          }
        }
        // Create new preset
        self._openModal('\u4FDD\u5B58\u987A\u5E8F\u9884\u8BBE', '<div class="pua-field"><div class="pua-field-label">\u9884\u8BBE\u540D\u79F0</div><input class="pua-field-input" id="asm-order-preset-name" placeholder="\u8F93\u5165\u9884\u8BBE\u540D\u79F0" style="width:100%"></div>')
        var modal = self._modalOverlay
        var nameInput = modal ? modal.querySelector('#asm-order-preset-name') : null
        if (nameInput) nameInput.focus()
        var modalInner = modal ? modal.querySelector('.pua-modal') : null
        if (modalInner) {
          var oldFooter = modalInner.querySelector('.pua-modal-footer')
          if (oldFooter) oldFooter.remove()
          var footer = document.createElement('div')
          footer.className = 'pua-modal-footer'
          var confirmBtn = document.createElement('button')
          confirmBtn.className = 'pua-btn pua-btn-gold'
          confirmBtn.textContent = '\u4FDD\u5B58'
          confirmBtn.addEventListener('click', function() {
            var presetName = nameInput ? nameInput.value.trim() : ''
            if (!presetName) { self._toast('\u8BF7\u8F93\u5165\u9884\u8BBE\u540D\u79F0'); return }
            self._saveAsmOrderAsPreset(presetName)
            self._closeModal()
            self._toast('\u987A\u5E8F\u9884\u8BBE\u5DF2\u4FDD\u5B58: ' + presetName)
            self._render()
          })
          var cancelBtn = document.createElement('button')
          cancelBtn.className = 'pua-btn'
          cancelBtn.textContent = '\u53D6\u6D88'
          cancelBtn.addEventListener('click', function() { self._closeModal() })
          footer.appendChild(cancelBtn)
          footer.appendChild(confirmBtn)
          modalInner.appendChild(footer)
        }
      })
    }

    if (opLoadBtn) {
      opLoadBtn.addEventListener('click', function() {
        var selId = opSelect ? opSelect.value : ''
        if (!selId) { self._toast('\u8BF7\u5148\u9009\u62E9\u9884\u8BBE'); return }
        if (self._loadAsmOrderFromPreset(selId)) {
          self._toast('\u5DF2\u52A0\u8F7D\u987A\u5E8F\u9884\u8BBE')
          self._render()
        } else {
          self._toast('\u9884\u8BBE\u4E0D\u5B58\u5728')
        }
      })
    }

    if (opRenameBtn) {
      opRenameBtn.addEventListener('click', function() {
        var selId = opSelect ? opSelect.value : ''
        if (!selId) { self._toast('\u8BF7\u5148\u9009\u62E9\u9884\u8BBE'); return }
        var oldName = ''
        for (var i = 0; i < self.asmOrderPresets.length; i++) {
          if (self.asmOrderPresets[i].id === selId) { oldName = self.asmOrderPresets[i].name; break }
        }
        self._openModal('\u91CD\u547D\u540D\u9884\u8BBE', '<div class="pua-field"><div class="pua-field-label">\u65B0\u540D\u79F0</div><input class="pua-field-input" id="asm-order-preset-newname" value="' + self._escHtml(oldName) + '" style="width:100%"></div>')
        var modal = self._modalOverlay
        var nameInput = modal ? modal.querySelector('#asm-order-preset-newname') : null
        if (nameInput) nameInput.focus()
        var modalInner = modal ? modal.querySelector('.pua-modal') : null
        if (modalInner) {
          var oldFooter = modalInner.querySelector('.pua-modal-footer')
          if (oldFooter) oldFooter.remove()
          var footer = document.createElement('div')
          footer.className = 'pua-modal-footer'
          var confirmBtn = document.createElement('button')
          confirmBtn.className = 'pua-btn pua-btn-gold'
          confirmBtn.textContent = '\u786E\u8BA4'
          confirmBtn.addEventListener('click', function() {
            var newName = nameInput ? nameInput.value.trim() : ''
            if (!newName) { self._toast('\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A'); return }
            self._renameAsmOrderPreset(selId, newName)
            self._closeModal()
            self._toast('\u5DF2\u91CD\u547D\u540D')
            self._render()
          })
          var cancelBtn = document.createElement('button')
          cancelBtn.className = 'pua-btn'
          cancelBtn.textContent = '\u53D6\u6D88'
          cancelBtn.addEventListener('click', function() { self._closeModal() })
          footer.appendChild(cancelBtn)
          footer.appendChild(confirmBtn)
          modalInner.appendChild(footer)
        }
      })
    }

    if (opDefaultBtn) {
      opDefaultBtn.addEventListener('click', function() {
        var selId = opSelect ? opSelect.value : ''
        if (!selId) { self._toast('\u8BF7\u5148\u9009\u62E9\u9884\u8BBE'); return }
        self._setDefaultAsmOrderPreset(selId)
        self._toast('\u5DF2\u8BBE\u4E3A\u9ED8\u8BA4')
        self._render()
      })
    }

    if (opDeleteBtn) {
      opDeleteBtn.addEventListener('click', function() {
        var selId = opSelect ? opSelect.value : ''
        if (!selId) { self._toast('\u8BF7\u5148\u9009\u62E9\u9884\u8BBE'); return }
        self._deleteAsmOrderPreset(selId)
        self._toast('\u9884\u8BBE\u5DF2\u5220\u9664')
        self._render()
      })
    }

    // Bind preset group selector
    var asmPpSelect = contentEl.querySelector('#asm-preset-group-select')
    if (asmPpSelect) {
      asmPpSelect.addEventListener('change', function() {
        if (!self._promptPresetData) return
        // \u4FDD\u5B58\u5F53\u524D\u5DE5\u4F5C\u533A
        var oldId = self._promptPresetData.activePresetId
        var oldPs = self._promptPresetData.presets || []
        for (var ok = 0; ok < oldPs.length; ok++) {
          if (oldPs[ok].id === oldId) { oldPs[ok].items = self.presets.slice(); break }
        }
        self._promptPresetData.activePresetId = this.value
        var target = null
        var ps = self._promptPresetData.presets || []
        for (var k = 0; k < ps.length; k++) {
          if (ps[k].id === this.value) { target = ps[k]; break }
        }
        if (target && target.items) {
          self.presets = target.items
          self.selPreset = self.presets.length > 0 ? self.presets[0].id : ''
          self._savePresets()
        }
        self.asmOrder = self._defaultAsmOrder()
        self._saveAsmOrder()
        self._savePromptPresets()
        self._render()
      })
    }

    // Bind regex group selector
    var asmRpSelect = contentEl.querySelector('#asm-regex-group-select')
    if (asmRpSelect) {
      asmRpSelect.addEventListener('change', function() {
        if (!self._regexPresetData) return
        // \u4FDD\u5B58\u5F53\u524D\u5DE5\u4F5C\u533A
        var oldId = self._regexPresetData.activePresetId
        var oldPs = self._regexPresetData.presets || []
        for (var ok = 0; ok < oldPs.length; ok++) {
          if (oldPs[ok].id === oldId) { oldPs[ok].regexes = self.regexes.slice(); break }
        }
        self._regexPresetData.activePresetId = this.value
        var target = null
        var ps = self._regexPresetData.presets || []
        for (var k = 0; k < ps.length; k++) {
          if (ps[k].id === this.value) { target = ps[k]; break }
        }
        if (target && target.regexes) {
          self.regexes = target.regexes
          self.selRegex = self.regexes.length > 0 ? self.regexes[0].id : ''
          self._saveRegexes()
        }
        self._saveRegexPresets()
        self._render()
      })
    }

    // Bind batch toggle buttons
    var enableAllPresetsBtn = contentEl.querySelector('#asm-enable-all-presets')
    if (enableAllPresetsBtn) {
      enableAllPresetsBtn.addEventListener('click', function() {
        for (var i = 0; i < self.presets.length; i++) self.presets[i].on = true
        self._savePresets()
        self._toast('\u5DF2\u5168\u90E8\u542F\u7528\u9884\u8BBE')
        self._render()
      })
    }
    var disableAllPresetsBtn = contentEl.querySelector('#asm-disable-all-presets')
    if (disableAllPresetsBtn) {
      disableAllPresetsBtn.addEventListener('click', function() {
        for (var i = 0; i < self.presets.length; i++) self.presets[i].on = false
        self._savePresets()
        self._toast('\u5DF2\u5168\u90E8\u7981\u7528\u9884\u8BBE')
        self._render()
      })
    }
    var enableAllRegexesBtn = contentEl.querySelector('#asm-enable-all-regexes')
    if (enableAllRegexesBtn) {
      enableAllRegexesBtn.addEventListener('click', function() {
        for (var i = 0; i < self.regexes.length; i++) self.regexes[i].on = true
        self._saveRegexes()
        self._toast('\u5DF2\u5168\u90E8\u542F\u7528\u6B63\u5219')
        self._render()
      })
    }
    var disableAllRegexesBtn = contentEl.querySelector('#asm-disable-all-regexes')
    if (disableAllRegexesBtn) {
      disableAllRegexesBtn.addEventListener('click', function() {
        for (var i = 0; i < self.regexes.length; i++) self.regexes[i].on = false
        self._saveRegexes()
        self._toast('\u5DF2\u5168\u90E8\u7981\u7528\u6B63\u5219')
        self._render()
      })
    }

    // Bind individual toggle buttons in asm blocks
    var toggleBtns = contentEl.querySelectorAll('.asm-toggle-btn')
    for (var tbi = 0; tbi < toggleBtns.length; tbi++) {
      (function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation()
          var toggleType = btn.getAttribute('data-toggle-type')
          var toggleId = btn.getAttribute('data-toggle-id')
          if (toggleType === 'preset') {
            for (var i = 0; i < self.presets.length; i++) {
              if (self.presets[i].id === toggleId) {
                self.presets[i].on = !self.presets[i].on
                self._savePresets()
                self._toast(self.presets[i].on ? '\u5DF2\u542F\u7528' : '\u5DF2\u7981\u7528')
                self._render()
                break
              }
            }
          }
        })
      })(toggleBtns[tbi])
    }

    // Bind drag events for all blocks
    this._bindAsmDragEvents()
  }

  /* ── 渲染流向块列表 ── */
  P._renderAsmBlocks = function() {
    var h = ''
    var self = this
    var order = this.asmOrder && this.asmOrder.length > 0 ? this.asmOrder : this._defaultAsmOrder()

    for (var oi = 0; oi < order.length; oi++) {
      var item = order[oi]
      var typeClass = ''
      var title = ''
      var meta = ''
      var body = ''
      var roleLabel = ''

      switch (item.type) {
        case 'preset':
          typeClass = 'asm-type-preset'
          var preset = null
          for (var pi = 0; pi < this.presets.length; pi++) {
            if (this.presets[pi].id === item.id) { preset = this.presets[pi]; break }
          }
          if (!preset) continue
          var presetDisabled = !preset.on
          roleLabel = preset.role ? '[' + preset.role.toUpperCase() + '] ' : ''
          title = roleLabel + this._escHtml(preset.title)
          meta = presetDisabled ? '\u5DF2\u7981\u7528' : preset.role
          body = '\u53EF\u7F16\u8F91 \xB7 \u53EF\u62D6\u62FD' + (presetDisabled ? '' : '')
          if (presetDisabled) typeClass += ' asm-disabled'
          break
        case 'char':
          if (item.id === '__char__') continue // 跳过未展开的占位符
          typeClass = 'asm-type-char'
          var charObj = null
          if (item.id === 'char') {
            charObj = this.asmData.char
          } else {
            // 从 chars 数组中查找
            for (var csi = 0; csi < (this.asmData.chars || []).length; csi++) {
              if (this.asmData.chars[csi].id === item.id) { charObj = this.asmData.chars[csi]; break }
            }
          }
          var charDisplay = charObj ? (charObj.handle || charObj.name) : '\u672A\u52A0\u8F7D'
          var charTplPreview = (this._loadSettings().charPrompt || '').trim()
          title = '\u89D2\u8272\u5361 \xB7 ' + this._escHtml(charDisplay)
          meta = charTplPreview ? '\u2713 \u63D0\u793A\u8BCD' : '\u65E0\u63D0\u793A\u8BCD'
          body = '\u70B9\u51FB\u7F16\u8F91\u63D0\u793A\u8BCD \xB7 \u53EF\u62D6\u62FD'
          break
        case 'user':
          typeClass = 'asm-type-user'
          var userDisplay = this.asmData.userPersona ? (this.asmData.userPersona.name || 'User') : '\u672A\u52A0\u8F7D'
          var userTplPreview = (this._loadSettings().userPrompt || '').trim()
          title = 'User\u4EBA\u8BBE \xB7 ' + this._escHtml(userDisplay)
          meta = userTplPreview ? '\u2713 \u63D0\u793A\u8BCD' : '\u65E0\u63D0\u793A\u8BCD'
          body = '\u70B9\u51FB\u7F16\u8F91\u63D0\u793A\u8BCD \xB7 \u53EF\u62D6\u62FD'
          break
        case 'world-pre':
          typeClass = 'asm-type-world'
          title = '\u4E16\u754C\u4E66 \xB7 \u524D\u7F6E\u7EC4'
          var preCount = this._countWorldEntries('world-pre')
          meta = preCount + ' \u4E2A\u8BCD\u6761'
          body = '\u70B9\u51FB\u67E5\u770B \xB7 \u53EF\u62D6\u62FD'
          break
        case 'world-mid':
          typeClass = 'asm-type-world'
          title = '\u4E16\u754C\u4E66 \xB7 \u4E2D\u7F6E\u7EC4'
          var midCount = this._countWorldEntries('world-mid')
          meta = midCount + ' \u4E2A\u8BCD\u6761'
          body = '\u70B9\u51FB\u67E5\u770B \xB7 \u53EF\u62D6\u62FD'
          break
        case 'world-post':
          typeClass = 'asm-type-world'
          title = '\u4E16\u754C\u4E66 \xB7 \u540E\u7F6E\u7EC4'
          var postCount = this._countWorldEntries('world-post')
          meta = postCount + ' \u4E2A\u8BCD\u6761'
          body = '\u70B9\u51FB\u67E5\u770B \xB7 \u53EF\u62D6\u62FD'
          break
        case 'memory-core':
          typeClass = 'asm-type-memory'
          title = '\u6838\u5FC3\u8BB0\u5FC6'
          body = '\u70B9\u51FB\u67E5\u770B \xB7 \u53EF\u62D6\u62FD'
          break
        case 'memory-fact':
          typeClass = 'asm-type-memory'
          var factCount = (this.asmData.longTerm && this.asmData.longTerm.facts) ? this.asmData.longTerm.facts.length : 0
          title = '\u4E8B\u5B9E\u8BB0\u5FC6'
          meta = factCount + ' \u6761'
          body = '\u70B9\u51FB\u67E5\u770B \xB7 \u53EF\u62D6\u62FD'
          break
        case 'recall':
          typeClass = 'asm-type-recall'
          title = '\u53EC\u56DE\u8BB0\u5FC6'
          body = '\u70B9\u51FB\u67E5\u770B \xB7 \u53EF\u62D6\u62FD'
          break
        case 'chat':
          typeClass = 'asm-type-chat'
          var chatCount = this.asmData.shortTerm ? this.asmData.shortTerm.length : 0
          var chatTplPreview = (this._loadSettings().chatPrompt || '').trim()
          title = '\u804A\u5929\u8BB0\u5F55'
          meta = chatCount + ' \u6761' + (chatTplPreview ? ' \xB7 \u2713 \u63D0\u793A\u8BCD' : '')
          body = '\u53D7\u6DF1\u5EA6\u8FC7\u6EE4 \xB7 \u70B9\u51FB\u7F16\u8F91\u63D0\u793A\u8BCD \xB7 \u53EF\u62D6\u62FD'
          break
        case 'latestUserPrompt':
          typeClass = 'asm-type-chat'
          var lpSettings = this._loadSettings()
          var lpPreview = (lpSettings.latestUserPrompt || '').substring(0, 50)
          title = '\u6700\u65B0\u7528\u6237\u8F93\u5165\u63D0\u793A\u8BCD'
          meta = lpPreview ? '\u2713' : '\u672A\u8BBE\u7F6E'
          body = '\u70B9\u51FB\u7F16\u8F91 \xB7 \u53EF\u62D6\u62FD'
          break
      }

      if (!typeClass) continue

      h += '<div class="asm-block ' + typeClass + '" data-type="' + item.type + '" data-id="' + item.id + '">'
      h += '<div class="asm-conn"><div class="asm-dot"></div><div class="asm-line"></div></div>'
      h += '<div class="asm-card draggable" draggable="true">'
      h += '<div class="asm-card-head"><span class="asm-card-title">' + title + '</span>'
      if (meta) h += '<span class="asm-card-meta">' + meta + '</span>'
      // Add toggle for preset type
      if (item.type === 'preset') {
        var presetObj = null
        for (var tpi = 0; tpi < this.presets.length; tpi++) {
          if (this.presets[tpi].id === item.id) { presetObj = this.presets[tpi]; break }
        }
        if (presetObj) {
          h += '<span class="asm-toggle-btn' + (presetObj.on ? ' on' : '') + '" data-toggle-type="preset" data-toggle-id="' + item.id + '" title="' + (presetObj.on ? '\u70B9\u51FB\u7981\u7528' : '\u70B9\u51FB\u542F\u7528') + '">' + (presetObj.on ? '\u25CF' : '\u25CB') + '</span>'
        }
      }
      h += '</div>'
      h += '<div class="asm-card-body">' + body + '</div>'
      h += '</div></div>'
    }

    if (!h) {
      h = '<div class="asm-empty">\u8BF7\u5148\u9009\u62E9\u5206\u652F\u5B58\u6863\uFF0C\u7136\u540E\u70B9\u51FB\u201C\u5237\u65B0\u6570\u636E\u201D</div>'
    }

    return h
  }

  /* ── 绑定所有块拖拽排序+点击详情 ── */
  P._bindAsmDragEvents = function() {
    var self = this
    var blocks = this._contentEl ? this._contentEl.querySelectorAll('.asm-block') : []
    // \u62D6\u62FD\u81EA\u52A8\u6EDA\u52A8
    var dragScrollTimer = null
    var dragScrollContainer = null

    function startDragScroll() {
      stopDragScroll()
      dragScrollContainer = self._contentEl ? self._contentEl.querySelector('.asm-visual') : null
      if (!dragScrollContainer) return
      dragScrollTimer = setInterval(function() {
        if (!dragScrollContainer) return
        var rect = dragScrollContainer.getBoundingClientRect()
        // \u83B7\u53D6\u5F53\u524D\u9F20\u6807\u4F4D\u7F6E\uFF08\u901A\u8FC7\u62D6\u62FD\u4E8B\u4EF6\u65E0\u6CD5\u76F4\u63A5\u83B7\u53D6\uFF0C\u4F7F\u7528\u6700\u540E\u5DF2\u77E5\u4F4D\u7F6E\uFF09
        // \u4F7F\u7528 dragover \u4E8B\u4EF6\u7684 clientY
      }, 50)
    }
    function stopDragScroll() {
      if (dragScrollTimer) { clearInterval(dragScrollTimer); dragScrollTimer = null }
    }

    // \u8DDF\u8E2A\u62D6\u62FD\u65F6\u7684\u9F20\u6807 Y \u4F4D\u7F6E
    var lastDragClientY = 0

    for (var i = 0; i < blocks.length; i++) {
      (function(block) {
        var card = block.querySelector('.asm-card')
        if (!card) return
        var bType = block.getAttribute('data-type')
        var bId = block.getAttribute('data-id')

        // Drag events
        card.addEventListener('dragstart', function(e) {
          block.classList.add('dragging')
          e.dataTransfer.setData('text/plain', bType + '|' + bId)
          startDragScroll()
        })
        card.addEventListener('dragend', function() {
          block.classList.remove('dragging')
          stopDragScroll()
        })
        block.addEventListener('dragover', function(e) {
          e.preventDefault()
          block.classList.add('drag-over')
          lastDragClientY = e.clientY
          // \u81EA\u52A8\u6EDA\u52A8\uFF1A\u5F53\u9F20\u6807\u63A5\u8FD1\u5BB9\u5668\u8FB9\u7F18\u65F6\u6EDA\u52A8
          var container = self._contentEl ? self._contentEl.querySelector('.asm-visual') : null
          if (container) {
            var rect = container.getBoundingClientRect()
            var edgeZone = 60
            if (e.clientY < rect.top + edgeZone) {
              container.scrollTop -= 8
            } else if (e.clientY > rect.bottom - edgeZone) {
              container.scrollTop += 8
            }
          }
        })
        block.addEventListener('dragleave', function() {
          block.classList.remove('drag-over')
        })
        block.addEventListener('drop', function(e) {
          e.preventDefault()
          block.classList.remove('drag-over')
          stopDragScroll()
          var parts = e.dataTransfer.getData('text/plain').split('|')
          if (parts.length === 2) {
            self._reorderAsm(parts[0], parts[1], bType, bId)
          }
        })

        // Click events (distinguish drag vs click)
        var clickStartX = 0, clickStartY = 0, clickMoved = false
        card.addEventListener('mousedown', function(e) {
          clickStartX = e.clientX; clickStartY = e.clientY; clickMoved = false
        })
        card.addEventListener('mousemove', function(e) {
          if (Math.abs(e.clientX - clickStartX) > 5 || Math.abs(e.clientY - clickStartY) > 5) clickMoved = true
        })
        card.addEventListener('click', function() {
          if (!clickMoved) self._showAsmDetail(bType, bId)
        })

        // Touch events
        var touchStartX = 0, touchStartY = 0
        card.addEventListener('touchstart', function(e) {
          if (e.touches.length > 0) {
            touchStartX = e.touches[0].clientX
            touchStartY = e.touches[0].clientY
          }
        }, { passive: true })
        card.addEventListener('touchmove', function(e) {
          if (e.touches.length > 0) {
            var dx = Math.abs(e.touches[0].clientX - touchStartX)
            var dy = Math.abs(e.touches[0].clientY - touchStartY)
            if (dx > 5 || dy > 5) clickMoved = true
          }
        }, { passive: true })
        card.addEventListener('touchend', function(e) {
          if (!clickMoved && e.changedTouches.length > 0) {
            var dx = Math.abs(e.changedTouches[0].clientX - touchStartX)
            var dy = Math.abs(e.changedTouches[0].clientY - touchStartY)
            if (dx < 10 && dy < 10) {
              self._showAsmDetail(bType, bId)
            }
          }
        })
      })(blocks[i])
    }
  }

  /* ── 点击查看/编辑详情 ── */
  P._showAsmDetail = function(type, id) {
    var h = ''
    var self = this

    switch (type) {
      case 'preset':
        var preset = null
        for (var i = 0; i < this.presets.length; i++) {
          if (this.presets[i].id === id) { preset = this.presets[i]; break }
        }
        if (!preset) return
        h += '<div class="pua-field"><div class="pua-field-label">\u6807\u9898</div>'
        h += '<input class="pua-field-input asm-edit-title" value="' + this._escHtml(preset.title) + '" data-id="' + preset.id + '"></div>'
        h += '<div class="pua-field"><div class="pua-field-label">\u89D2\u8272</div>'
        h += '<select class="pua-field-input asm-edit-role" data-id="' + preset.id + '">'
        h += '<option value="system"' + (preset.role === 'system' ? ' selected' : '') + '>System</option>'
        h += '<option value="user"' + (preset.role === 'user' ? ' selected' : '') + '>User</option>'
        h += '<option value="assistant"' + (preset.role === 'assistant' ? ' selected' : '') + '>Assistant</option>'
        h += '</select></div>'
        h += '<div class="pua-field"><div class="pua-field-label">\u5185\u5BB9</div>'
        h += '<textarea class="pua-detail-textarea asm-edit-content" data-id="' + preset.id + '">' + this._escHtml(preset.content) + '</textarea></div>'
        h += '<div style="text-align:right;margin-top:8px">'
        h += '<button class="pua-btn pua-btn-gold asm-edit-save" data-id="' + preset.id + '">\u4FDD\u5B58</button></div>'
        break
      case 'char':
        var charObj3 = null
        if (id === 'char') {
          charObj3 = this.asmData.char
        } else {
          for (var dci = 0; dci < (this.asmData.chars || []).length; dci++) {
            if (this.asmData.chars[dci].id === id) { charObj3 = this.asmData.chars[dci]; break }
          }
        }
        var charName3 = charObj3 ? (charObj3.handle || charObj3.name || '') : ''
        var charText3 = charObj3 ? (charObj3.persona || charObj3.bio || '') : ''
        var charSettings = this._loadSettings()
        var charPromptVal = charSettings.charPrompt || ''
        h += '<div class="pua-field"><div class="pua-field-label">\u89D2\u8272\u8BBE\u5B9A' + (charName3 ? ' \xB7 ' + this._escHtml(charName3) : '') + '</div>'
        h += '<textarea class="pua-detail-textarea" readonly>' + this._escHtml(charText3) + '</textarea></div>'
        h += '<div class="pua-field" style="margin-top:12px"><div class="pua-field-label">\u63D0\u793A\u8BCD\u6A21\u677F <span style="font-size:9px;opacity:0.6">({content} = \u89D2\u8272\u4EBA\u8BBE\u5185\u5BB9)</span></div>'
        h += '<textarea class="pua-detail-textarea asm-edit-charprompt" style="min-height:120px">' + this._escHtml(charPromptVal) + '</textarea></div>'
        h += '<div style="font-size:10px;color:var(--pua-text-dim);margin-bottom:8px">\u6E05\u7A7A\u5219\u4F7F\u7528\u9ED8\u8BA4\u5305\u88C5\u683C\u5F0F\u3002\u4F7F\u7528 {content} \u4F5C\u4E3A\u89D2\u8272\u4EBA\u8BBE\u5185\u5BB9\u7684\u5360\u4F4D\u7B26\u3002</div>'
        h += '<div style="text-align:right;margin-top:8px">'
        h += '<button class="pua-btn pua-btn-gold asm-edit-cp-save">\u4FDD\u5B58</button></div>'
        break
      case 'user':
        var userName = this.asmData.userPersona ? (this.asmData.userPersona.name || 'User') : ''
        var userText = this.asmData.userPersona ? (this.asmData.userPersona.persona || this.asmData.userPersona.bio || '') : ''
        var userSettings = this._loadSettings()
        var userPromptVal = userSettings.userPrompt || ''
        h += '<div class="pua-field"><div class="pua-field-label">\u7528\u6237\u4EBA\u8BBE' + (userName ? ' \xB7 ' + this._escHtml(userName) : '') + '</div>'
        h += '<textarea class="pua-detail-textarea" readonly>' + this._escHtml(userText) + '</textarea></div>'
        h += '<div class="pua-field" style="margin-top:12px"><div class="pua-field-label">\u63D0\u793A\u8BCD\u6A21\u677F <span style="font-size:9px;opacity:0.6">({content} = \u7528\u6237\u4EBA\u8BBE\u5185\u5BB9)</span></div>'
        h += '<textarea class="pua-detail-textarea asm-edit-userprompt" style="min-height:120px">' + this._escHtml(userPromptVal) + '</textarea></div>'
        h += '<div style="font-size:10px;color:var(--pua-text-dim);margin-bottom:8px">\u6E05\u7A7A\u5219\u4F7F\u7528\u9ED8\u8BA4\u5305\u88C5\u683C\u5F0F\u3002\u4F7F\u7528 {content} \u4F5C\u4E3A\u7528\u6237\u4EBA\u8BBE\u5185\u5BB9\u7684\u5360\u4F4D\u7B26\u3002</div>'
        h += '<div style="text-align:right;margin-top:8px">'
        h += '<button class="pua-btn pua-btn-gold asm-edit-up-save">\u4FDD\u5B58</button></div>'
        break
      case 'world-pre':
      case 'world-mid':
      case 'world-post':
        var entries = this.asmData.worldEntries || []
        var groupEntries = []
        for (var wi = 0; wi < entries.length; wi++) {
          if (entries[wi]._group === type) groupEntries.push(entries[wi])
        }
        h += '<div class="pua-field"><div class="pua-field-label">\u4E16\u754C\u4E66\u8BCD\u6761 (' + groupEntries.length + ')</div>'
        for (var gei = 0; gei < groupEntries.length; gei++) {
          var entry = groupEntries[gei]
          var isConstant = entry.selective === false || (!entry.keys && !entry.key)
          var badgeStyle = isConstant
            ? 'background:rgba(78,201,160,0.15);color:#4ec9a0'
            : 'background:rgba(91,141,239,0.15);color:#5b8def'
          var badgeText = isConstant ? '常驻' : '关键词'
          var keyInfo = ''
          if (!isConstant) {
            var entryKeys = entry.keys || entry.key || ''
            var entrySecKeys = entry.secondary_keys || entry.secondaryKeys || ''
            if (entryKeys) keyInfo = this._escHtml(String(entryKeys))
            if (entrySecKeys) keyInfo += (keyInfo ? ' | ' : '') + this._escHtml(String(entrySecKeys))
          }
          h += '<div style="margin-bottom:8px;padding:6px 8px;background:var(--pua-bg-input);border-radius:4px">'
          h += '<div style="display:flex;align-items:center;gap:6px">'
          h += '<span style="font-size:11px;font-weight:600;color:var(--pua-text)">' + this._escHtml(entry.name || entry.key || '') + '</span>'
          h += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600;' + badgeStyle + '">' + badgeText + '</span>'
          h += '</div>'
          if (keyInfo) {
            h += '<div style="font-size:9px;color:var(--pua-preset);margin-top:2px">关键词: ' + keyInfo + '</div>'
          }
          h += '<div style="font-size:10px;color:var(--pua-text-sub);margin-top:2px">' + this._escHtml((entry.content || entry.text || '').substring(0, 500)) + '</div>'
          h += '</div>'
        }
        if (groupEntries.length === 0) h += '<div style="font-size:10px;color:var(--pua-text-dim)">\u65E0\u8BCD\u6761</div>'
        h += '</div>'
        break
      case 'memory-core':
        var coreObj = (this.asmData.longTerm && this.asmData.longTerm.core) ? this.asmData.longTerm.core : null
        h += '<div class="pua-field"><div class="pua-field-label">\u6838\u5FC3\u8BB0\u5FC6</div>'
        // 关系与剧情进展
        var coreRel = coreObj ? (coreObj.relationship || '') : ''
        h += '<div style="margin-bottom:8px"><div style="font-size:10px;color:var(--pua-accent);font-weight:600;margin-bottom:4px">\u5173\u7CFB\u4E0E\u5267\u60C5\u8FDB\u5C55</div>'
        h += '<textarea class="pua-detail-textarea" readonly style="min-height:80px">' + this._escHtml(coreRel) + '</textarea></div>'
        // 事件摘要
        var coreEvents = (coreObj && coreObj.events && Array.isArray(coreObj.events)) ? coreObj.events : []
        h += '<div style="margin-bottom:8px"><div style="font-size:10px;color:var(--pua-accent);font-weight:600;margin-bottom:4px">\u4E8B\u4EF6\u6458\u8981 (' + coreEvents.length + ' \u6761)</div>'
        for (var cevi = 0; cevi < coreEvents.length; cevi++) {
          h += '<div style="margin-bottom:4px;padding:4px 8px;background:var(--pua-bg-input);border-radius:4px;font-size:10px;color:var(--pua-text-sub)">'
          h += this._escHtml(coreEvents[cevi].text || '')
          h += '</div>'
        }
        if (coreEvents.length === 0) {
          // 兼容旧格式
          var oldCoreText = coreObj ? (coreObj.summary || coreObj.text || '') : ''
          if (oldCoreText) {
            h += '<textarea class="pua-detail-textarea" readonly style="min-height:80px">' + this._escHtml(oldCoreText) + '</textarea>'
          } else {
            h += '<div style="font-size:10px;color:var(--pua-text-dim)">\u65E0\u4E8B\u4EF6\u6458\u8981</div>'
          }
        }
        h += '</div>'
        h += '</div>'
        break
      case 'memory-fact':
        var facts = (this.asmData.longTerm && this.asmData.longTerm.facts) ? this.asmData.longTerm.facts : []
        h += '<div class="pua-field"><div class="pua-field-label">\u4E8B\u5B9E\u8BB0\u5FC6 (' + facts.length + ')</div>'
        for (var fdi = 0; fdi < facts.length; fdi++) {
          h += '<div style="margin-bottom:4px;padding:4px 8px;background:var(--pua-bg-input);border-radius:4px;font-size:10px;color:var(--pua-text-sub)">'
          h += this._escHtml(facts[fdi].text || facts[fdi].content || facts[fdi].summaryText || facts[fdi].action || '')
          h += '</div>'
        }
        h += '</div>'
        break
      case 'recall':
        var recallSettings = this._loadSettings()
        var recallMode = recallSettings.recallMode || 'vector'
        var recallMax = recallSettings.recallMaxCount || 8
        var modeLabel = recallMode === 'subapi' ? '副 API 召回' : '向量检索'
        h += '<div class="pua-field"><div class="pua-field-label">召回记忆</div>'
        h += '<div style="margin-bottom:8px;padding:6px 8px;background:var(--pua-bg-input);border-radius:4px">'
        h += '<div style="font-size:10px;color:var(--pua-text-sub)"><span style="font-weight:600;color:var(--pua-accent)">模式：</span>' + this._escHtml(modeLabel) + ' (' + recallMode + ')</div>'
        h += '<div style="font-size:10px;color:var(--pua-text-sub);margin-top:2px"><span style="font-weight:600;color:var(--pua-accent)">最大数量：</span>' + recallMax + '</div>'
        h += '</div>'
        // 预览召回结果
        var recallFacts = (this.asmData.longTerm && this.asmData.longTerm.facts) ? this.asmData.longTerm.facts : []
        if (recallFacts.length > 0) {
          var sampleQuery = ''
          var msgs = this.asmData.shortTerm || []
          if (msgs.length > 0) {
            var lastMsg = msgs[msgs.length - 1]
            sampleQuery = (lastMsg.text || lastMsg.content || '').substring(0, 200)
          }
          if (!sampleQuery) sampleQuery = '对话上下文'
          var recalled = this._recallMemoriesSync(sampleQuery, recallFacts, recallMax)
          h += '<div style="font-size:10px;color:var(--pua-text-dim);margin-bottom:4px">预览召回结果（基于最近对话）：</div>'
          for (var ri = 0; ri < recalled.length; ri++) {
            h += '<div style="margin-bottom:4px;padding:4px 8px;background:var(--pua-bg-input);border-radius:4px;font-size:10px;color:var(--pua-text-sub)">'
            h += '<span style="color:var(--pua-accent);font-weight:600">#' + (ri + 1) + '</span> '
            h += this._escHtml(recalled[ri].text || recalled[ri].content || recalled[ri].summaryText || recalled[ri].action || '')
            h += '</div>'
          }
          if (recalled.length === 0) h += '<div style="font-size:10px;color:var(--pua-text-dim)">无匹配的召回记忆</div>'
        } else {
          h += '<div style="font-size:10px;color:var(--pua-text-dim)">无事实记忆可供召回</div>'
        }
        h += '</div>'
        break
      case 'chat':
        var msgs = this.asmData.shortTerm || []
        var depth = this.asmConfig.contextDepth || 40
        var startIdx = Math.max(0, msgs.length - depth)
        var chatSettings = this._loadSettings()
        var chatPromptVal = chatSettings.chatPrompt || ''
        h += '<div class="pua-field"><div class="pua-field-label">\u804A\u5929\u8BB0\u5F55 (' + msgs.length + ' \u6761\uFF0C\u663E\u793A\u6700\u8FD1 ' + (msgs.length - startIdx) + ' \u6761)</div>'
        for (var cmi = startIdx; cmi < msgs.length; cmi++) {
          var msg = msgs[cmi]
          var senderName = msg.senderHandle || msg.senderName || msg.type || '?'
          var roleColor = msg.type === 'assistant' || msg.type === 'model' ? '#ef6a8a' : msg.type === 'system' ? '#5b8def' : '#4ec9a0'
          h += '<div style="margin-bottom:4px;padding:4px 8px;background:var(--pua-bg-input);border-radius:4px">'
          h += '<span style="font-size:9px;font-weight:600;color:' + roleColor + '">' + this._escHtml(senderName) + '</span> '
          h += '<span style="font-size:10px;color:var(--pua-text-sub)">' + this._escHtml((msg.text || msg.content || '').substring(0, 200)) + '</span>'
          h += '</div>'
        }
        h += '</div>'
        h += '<div class="pua-field" style="margin-top:12px"><div class="pua-field-label">\u63D0\u793A\u8BCD\u6A21\u677F <span style="font-size:9px;opacity:0.6">(\u4F5C\u4E3A\u804A\u5929\u8BB0\u5F55\u524D\u8A00\u63D2\u5165)</span></div>'
        h += '<textarea class="pua-detail-textarea asm-edit-chatprompt" style="min-height:120px">' + this._escHtml(chatPromptVal) + '</textarea></div>'
        h += '<div style="font-size:10px;color:var(--pua-text-dim);margin-bottom:8px">\u6E05\u7A7A\u5219\u4E0D\u63D2\u5165\u804A\u5929\u524D\u8A00\u3002\u8BE5\u6A21\u677F\u4F5C\u4E3A\u804A\u5929\u8BB0\u5F55\u524D\u7684\u7CFB\u7EDF\u63D0\u793A\u6D88\u606F\u63D2\u5165\uFF0C\u4E0D\u9700\u8981 {content} \u5360\u4F4D\u7B26\u3002</div>'
        h += '<div style="text-align:right;margin-top:8px">'
        h += '<button class="pua-btn pua-btn-gold asm-edit-chp-save">\u4FDD\u5B58</button></div>'
        break
      case 'latestUserPrompt':
        var lpSettings = this._loadSettings()
        var lpValue = lpSettings.latestUserPrompt || ''
        h += '<div class="pua-field"><div class="pua-field-label">\u6700\u65B0\u7528\u6237\u8F93\u5165\u63D0\u793A\u8BCD <span style="font-size:9px;opacity:0.6">({content} = \u7528\u6237\u8F93\u5165)</span></div>'
        h += '<textarea class="pua-detail-textarea asm-edit-latestprompt" style="min-height:120px">' + this._escHtml(lpValue) + '</textarea></div>'
        h += '<div style="font-size:10px;color:var(--pua-text-dim);margin-bottom:8px">\u6E05\u7A7A\u5219\u4E0D\u5305\u88C5\u6700\u65B0\u7528\u6237\u8F93\u5165\u3002\u4F7F\u7528 {content} \u4F5C\u4E3A\u7528\u6237\u8F93\u5165\u5185\u5BB9\u7684\u5360\u4F4D\u7B26\u3002</div>'
        h += '<div style="text-align:right;margin-top:8px">'
        h += '<button class="pua-btn pua-btn-gold asm-edit-lp-save">\u4FDD\u5B58</button></div>'
        break
    }

    this._openModal('\u8BE6\u60C5 - ' + type, h)

    // Bind preset edit save button
    if (type === 'preset') {
      var saveBtn = this._modalOverlay ? this._modalOverlay.querySelector('.asm-edit-save') : null
      if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          var pid = this.getAttribute('data-id')
          var modal = self._modalOverlay
          var titleInput = modal ? modal.querySelector('.asm-edit-title[data-id="' + pid + '"]') : null
          var roleSelect = modal ? modal.querySelector('.asm-edit-role[data-id="' + pid + '"]') : null
          var contentTextarea = modal ? modal.querySelector('.asm-edit-content[data-id="' + pid + '"]') : null
          for (var si = 0; si < self.presets.length; si++) {
            if (self.presets[si].id === pid) {
              if (titleInput) self.presets[si].title = titleInput.value
              if (roleSelect) self.presets[si].role = roleSelect.value
              if (contentTextarea) self.presets[si].content = contentTextarea.value
              break
            }
          }
          self._savePresets()
          self._closeModal()
          self._toast('\u9884\u8BBE\u5DF2\u4FDD\u5B58')
          self._render()
        })
      }
    }

    // Bind latestUserPrompt edit save button
    if (type === 'latestUserPrompt') {
      var lpSaveBtn = this._modalOverlay ? this._modalOverlay.querySelector('.asm-edit-lp-save') : null
      if (lpSaveBtn) {
        lpSaveBtn.addEventListener('click', function() {
          var modal = self._modalOverlay
          var lpTextarea = modal ? modal.querySelector('.asm-edit-latestprompt') : null
          if (lpTextarea) {
            var s = self._loadSettings()
            s.latestUserPrompt = lpTextarea.value
            self._saveSettings(s)
            self._closeModal()
            self._toast('\u6700\u65B0\u7528\u6237\u8F93\u5165\u63D0\u793A\u8BCD\u5DF2\u4FDD\u5B58')
            self._render()
          }
        })
      }
    }

    // Bind charPrompt edit save button
    if (type === 'char') {
      var cpSaveBtn = this._modalOverlay ? this._modalOverlay.querySelector('.asm-edit-cp-save') : null
      if (cpSaveBtn) {
        cpSaveBtn.addEventListener('click', function() {
          var modal = self._modalOverlay
          var cpTextarea = modal ? modal.querySelector('.asm-edit-charprompt') : null
          if (cpTextarea) {
            var s = self._loadSettings()
            s.charPrompt = cpTextarea.value
            self._saveSettings(s)
            self._closeModal()
            self._toast('\u89D2\u8272\u4EBA\u8BBE\u63D0\u793A\u8BCD\u5DF2\u4FDD\u5B58')
            self._render()
          }
        })
      }
    }

    // Bind userPrompt edit save button
    if (type === 'user') {
      var upSaveBtn = this._modalOverlay ? this._modalOverlay.querySelector('.asm-edit-up-save') : null
      if (upSaveBtn) {
        upSaveBtn.addEventListener('click', function() {
          var modal = self._modalOverlay
          var upTextarea = modal ? modal.querySelector('.asm-edit-userprompt') : null
          if (upTextarea) {
            var s = self._loadSettings()
            s.userPrompt = upTextarea.value
            self._saveSettings(s)
            self._closeModal()
            self._toast('\u7528\u6237\u4EBA\u8BBE\u63D0\u793A\u8BCD\u5DF2\u4FDD\u5B58')
            self._render()
          }
        })
      }
    }

    // Bind chatPrompt edit save button
    if (type === 'chat') {
      var chpSaveBtn = this._modalOverlay ? this._modalOverlay.querySelector('.asm-edit-chp-save') : null
      if (chpSaveBtn) {
        chpSaveBtn.addEventListener('click', function() {
          var modal = self._modalOverlay
          var chpTextarea = modal ? modal.querySelector('.asm-edit-chatprompt') : null
          if (chpTextarea) {
            var s = self._loadSettings()
            s.chatPrompt = chpTextarea.value
            self._saveSettings(s)
            self._closeModal()
            self._toast('\u804A\u5929\u8BB0\u5F55\u63D0\u793A\u8BCD\u5DF2\u4FDD\u5B58')
            self._render()
          }
        })
      }
    }
  }
  P._previewAssembly = function() {
    var messages = this._buildMessages()
    var h = '<div style="font-family:monospace;font-size:11px;line-height:1.6;white-space:pre-wrap;word-break:break-all;max-height:60vh;overflow-y:auto;">'

    for (var i = 0; i < messages.length; i++) {
      var m = messages[i]
      var roleColor = m.role === 'system' ? '#5b8def' : m.role === 'user' ? '#4ec9a0' : '#ef6a8a'
      h += '<div style="margin-bottom:8px;padding:6px 8px;background:var(--pua-bg-card);border-radius:4px;border-left:3px solid ' + roleColor + '">'
      h += '<span style="color:' + roleColor + ';font-weight:600">[' + m.role.toUpperCase() + ']</span> '
      var content = m.content || ''
      if (content.length > 300) content = content.substring(0, 300) + '...'
      h += this._escHtml(content)
      h += '</div>'
    }

    h += '</div>'
    h += '<div style="margin-top:8px;font-size:10px;color:var(--pua-text-dim)">\u5171 ' + messages.length + ' \u6761\u6D88\u606F</div>'

    this._openModal('\u4E0A\u4E0B\u6587\u9884\u89C8', h)
  }

  /* ── 打开模态框（通用） ── */
  P._openModal = function(title, bodyHtml) {
    var modal = this._modalOverlay
    if (!modal) return
    var modalTitle = modal.querySelector('.pua-modal-title')
    if (modalTitle) modalTitle.textContent = title
    var modalBody = modal.querySelector('.pua-modal-body')
    if (modalBody) modalBody.innerHTML = bodyHtml
    // Remove any existing footer
    var oldFooter = modal.querySelector('.pua-modal-footer')
    if (oldFooter) oldFooter.remove()
    modal.classList.add('show')
  }

  /* ── 构建最终的 messages 数组 ── */
  P._buildMessages = function(skipChat, convMsgs, upToMsgId) {
    var messages = []
    var self = this
    // Reset last user message tracking for latestUserPrompt
    this._lastUserMsgContent = null
    var order = this.asmOrder
    if (!order || order.length === 0) {
      if (this._asmOrderLoaded) {
        // Only use default and save if async loading is complete
        order = this._defaultAsmOrder()
        this.asmOrder = order
        this._saveAsmOrder()
      } else {
        // Still loading, use default temporarily without overwriting saved order
        order = this._defaultAsmOrder()
      }
    }
    // \u5146\u5E95\u6821\u9A8C\uFF1A\u53CC\u5411\u68C0\u67E5 asmOrder \u4E0E this.presets \u7684\u5339\u914D
    var presetIds = {}
    for (var vi = 0; vi < this.presets.length; vi++) { presetIds[this.presets[vi].id] = true }
    var asmPresetIds = {}
    var asmPresetCount = 0
    for (var vj = 0; vj < order.length; vj++) {
      if (order[vj].type === 'preset') { asmPresetIds[order[vj].id] = true; asmPresetCount++ }
    }
    var needRebuild = false
    // \u68C0\u67E51\uFF1AasmOrder \u4E2D\u6709\u9884\u8BBE ID \u4E0D\u5B58\u5728\u4E8E this.presets
    for (var vk = 0; vk < order.length; vk++) {
      if (order[vk].type === 'preset' && !presetIds[order[vk].id]) { needRebuild = true; break }
    }
    // \u68C0\u67E52\uFF1Athis.presets \u4E2D\u6709\u542F\u7528\u7684\u9884\u8BBE\u4E0D\u5728 asmOrder \u4E2D
    if (!needRebuild) {
      for (var vl = 0; vl < this.presets.length; vl++) {
        if (this.presets[vl].on && !asmPresetIds[this.presets[vl].id]) { needRebuild = true; break }
      }
    }
    if (needRebuild) {
      console.log('[PUA] _buildMessages: asmOrder preset mismatch (asmOrder has ' + asmPresetCount + ' presets, this.presets has ' + this.presets.length + ' enabled), rebuilding')
      order = this._defaultAsmOrder()
      this.asmOrder = order
      this._saveAsmOrder()
    }
    console.log('[PUA] _buildMessages: asmOrder length=' + order.length + ' presets length=' + this.presets.length)
    // \u8BCA\u65AD\uFF1A\u6253\u5370 asmOrder \u4E2D\u7684 preset \u6761\u76EE\u548C this.presets \u7684 ID
    for (var di = 0; di < order.length; di++) {
      if (order[di].type === 'preset') console.log('[PUA] _buildMessages asmOrder preset: id=' + order[di].id)
    }
    for (var dp = 0; dp < this.presets.length; dp++) {
      console.log('[PUA] _buildMessages this.presets[' + dp + ']: id=' + this.presets[dp].id + ' on=' + this.presets[dp].on + ' title=' + (this.presets[dp].title||''))
    }

    // Track chat assistant message indices for regex application
    var chatAssistantIndices = []

    for (var oi = 0; oi < order.length; oi++) {
      var item = order[oi]
      switch (item.type) {
        case 'preset':
          for (var pi = 0; pi < this.presets.length; pi++) {
            if (this.presets[pi].id === item.id && this.presets[pi].on) {
              messages.push({ role: this.presets[pi].role || 'system', content: this.presets[pi].content || '' })
              break
            }
          }
          break
        case 'char':
          if (item.id === '__char__') break // 跳过未展开的占位符
          var charObj2 = null
          if (item.id === 'char') {
            charObj2 = this.asmData.char
          } else {
            for (var bci = 0; bci < (this.asmData.chars || []).length; bci++) {
              if (this.asmData.chars[bci].id === item.id) { charObj2 = this.asmData.chars[bci]; break }
            }
          }
          if (charObj2) {
            var charText2 = charObj2.persona || charObj2.bio || ''
            if (charText2) {
              var charTpl = (this._loadSettings().charPrompt || '').trim()
              var charContent = charTpl ? charTpl.split('{content}').join(charText2) : '[\u89D2\u8272\u8BBE\u5B9A \xB7 ' + (charObj2.handle || charObj2.name) + ']\n' + charText2
              messages.push({ role: 'system', content: charContent })
            }
          }
          break
        case 'user':
          if (this.asmData.userPersona) {
            var userText = this.asmData.userPersona.persona || this.asmData.userPersona.bio || ''
            if (userText) {
              var userTpl = (this._loadSettings().userPrompt || '').trim()
              var userContent = userTpl ? userTpl.split('{content}').join(userText) : '[\u7528\u6237\u4EBA\u8BBE]\n' + userText
              messages.push({ role: 'system', content: userContent })
            }
          }
          break
        case 'world-pre':
        case 'world-mid':
        case 'world-post':
          var entries = this.asmData.worldEntries || []
          var groupEntries = []
          for (var wi = 0; wi < entries.length; wi++) {
            if (entries[wi]._group === item.type) groupEntries.push(entries[wi])
          }
          if (groupEntries.length > 0) {
            var entryTexts = []
            for (var ei = 0; ei < groupEntries.length; ei++) {
              var wbEntry = groupEntries[ei]
              var wbIsConstant = wbEntry.selective === false || (!wbEntry.keys && !wbEntry.key)
              // 常驻词条始终包含，关键词词条在预览中也包含（实际发送时需匹配）
              if (wbIsConstant) {
                entryTexts.push(wbEntry.content || wbEntry.text || '')
              } else {
                // 关键词词条：预览时全部包含，标记为关键词匹配
                entryTexts.push(wbEntry.content || wbEntry.text || '')
              }
            }
            var wbText = ''
            for (var eti = 0; eti < entryTexts.length; eti++) {
              if (entryTexts[eti]) {
                if (wbText) wbText += '\n'
                wbText += entryTexts[eti]
              }
            }
            if (wbText) messages.push({ role: 'system', content: '[\u4E16\u754C\u4E66]\n' + wbText })
          }
          break
        case 'memory-core':
          if (this.asmData.longTerm && this.asmData.longTerm.core) {
            var coreParts = []
            // 关系进展
            if (this.asmData.longTerm.core.relationship) {
              coreParts.push('【关系与剧情进展】\n' + this.asmData.longTerm.core.relationship)
            }
            // 事件摘要
            if (this.asmData.longTerm.core.events && this.asmData.longTerm.core.events.length > 0) {
              var evtTexts = []
              for (var evi = 0; evi < this.asmData.longTerm.core.events.length; evi++) {
                var evtText = this.asmData.longTerm.core.events[evi].text || ''
                if (evtText) evtTexts.push(evtText)
              }
              if (evtTexts.length > 0) {
                coreParts.push('【事件摘要】\n' + evtTexts.join('\n'))
              }
            }
            // 兼容旧格式：core.summary / core.text
            if (coreParts.length === 0) {
              var oldCoreText = this.asmData.longTerm.core.summary || this.asmData.longTerm.core.text || ''
              if (oldCoreText) coreParts.push(oldCoreText)
            }
            if (coreParts.length > 0) {
              messages.push({ role: 'system', content: '[核心记忆]\n' + coreParts.join('\n\n') })
            }
          }
          break
        case 'memory-fact':
          if (this.asmData.longTerm && this.asmData.longTerm.facts && this.asmData.longTerm.facts.length > 0) {
            var allFacts = this.asmData.longTerm.facts
            var factSettings = this._loadSettings()
            var factSendLimit = factSettings.factSendCount || 10
            // 只取最新 factSendLimit 条事实记忆
            var factStartIdx = Math.max(0, allFacts.length - factSendLimit)
            var factTexts = []
            for (var fi = factStartIdx; fi < allFacts.length; fi++) {
              var f = allFacts[fi]
              // 传入具体事实内容(text)，而非一句话摘要(oneSentence/summaryText)
              // 一句话摘要由核心记忆的事件摘要部分负责传入
              var factContent = f.text || f.content || ''
              if (factContent) factTexts.push(factContent)
            }
            var factStr = ''
            for (var fsi = 0; fsi < factTexts.length; fsi++) {
              if (factTexts[fsi]) {
                if (factStr) factStr += '\n'
                factStr += factTexts[fsi]
              }
            }
            if (factStr) messages.push({ role: 'system', content: '[事实记忆]\n' + factStr })
          }
          break
        case 'recall':
          // 召回记忆：仅在事实记忆总数超过 factSendCount 时才触发召回
          var recallFacts2 = (this.asmData.longTerm && this.asmData.longTerm.facts) ? this.asmData.longTerm.facts : []
          var recallSettings3 = this._loadSettings()
          var recallFactLimit = recallSettings3.factSendCount || 10
          var recallMax3 = recallSettings3.recallMaxCount || 8
          // 只有当事实记忆总数 > factSendCount 时才需要召回
          if (recallFacts2.length > recallFactLimit) {
            var recalledFacts = null
            // 优先使用异步召回结果（来自 _sendMessage）
            if (this._pendingRecalledFacts && this._pendingRecalledFacts.length > 0) {
              recalledFacts = this._pendingRecalledFacts
            } else {
              // Fallback to sync recall
              var recallQuery2 = ''
              var recallMsgs = this.asmData.shortTerm || []
              if (recallMsgs.length > 0) {
                var lastRecallMsg = recallMsgs[recallMsgs.length - 1]
                recallQuery2 = (lastRecallMsg.text || lastRecallMsg.content || '').substring(0, 200)
              }
              if (!recallQuery2) recallQuery2 = '对话上下文'
              recalledFacts = this._recallMemoriesSync(recallQuery2, recallFacts2, recallMax3)
            }
            // recalledFacts 可能是 [{fact, score}] 或 [fact]
            // 排除已通过 memory-fact 注入的事实记忆（最新的 factSendLimit 条）
            var factStartIdx2 = Math.max(0, recallFacts2.length - recallFactLimit)
            var injectedFactIds = {}
            for (var ifi = factStartIdx2; ifi < recallFacts2.length; ifi++) {
              if (recallFacts2[ifi].id) injectedFactIds[recallFacts2[ifi].id] = true
              // 也按内容去重
              var ifText = recallFacts2[ifi].text || recallFacts2[ifi].content || ''
              if (ifText) injectedFactIds[ifText] = true
            }
            var recallTexts = []
            if (recalledFacts) {
              for (var rci = 0; rci < recalledFacts.length; rci++) {
                var rf = recalledFacts[rci]
                var rfFact = rf.fact || rf
                var rfText = rfFact.text || rfFact.content || rfFact.summaryText || ''
                // 跳过已注入的事实记忆
                var rfId = rfFact.id || ''
                if (rfId && injectedFactIds[rfId]) continue
                if (rfText && injectedFactIds[rfText]) continue
                if (rfText) recallTexts.push(rfText)
              }
            }
            if (recallTexts.length > 0) {
              var recallStr = recallTexts.join('\n')
              if (recallStr) messages.push({ role: 'system', content: '[召回记忆]\n' + recallStr })
            }
          }
          break
        case 'chat':
          if (skipChat) break
          // Insert chat prompt template as a preamble before chat messages
          var chatTpl = (this._loadSettings().chatPrompt || '').trim()
          // If convMsgs provided (from _buildConvContext), use them with filtering
          if (convMsgs) {
            var depth = this.asmConfig.contextDepth || this._convContextDepth || 40
            var endIdx = convMsgs.length
            if (upToMsgId) {
              for (var uei = 0; uei < convMsgs.length; uei++) {
                if (convMsgs[uei].id === upToMsgId) { endIdx = uei + 1; break } // +1 to include the upToMsgId message itself
              }
            }
            var cStart = Math.max(0, endIdx - depth)
            console.log('[PUA] _buildMessages chat: depth=' + depth + ' convMsgs=' + convMsgs.length + ' endIdx=' + endIdx + ' cStart=' + cStart + ' range=' + (endIdx - cStart))
            // Insert chat prompt preamble
            if (chatTpl) {
              messages.push({ role: 'system', content: chatTpl })
            }
            // Calculate assistant message depth (0 = most recent assistant msg)
            var assistantDepthMap = {}
            var assistantCount = 0
            for (var adi = endIdx - 1; adi >= cStart; adi--) {
              if (convMsgs[adi].role === 'assistant' && !convMsgs[adi].dimmed) {
                assistantDepthMap[adi] = assistantCount
                assistantCount++
              }
            }
            for (var cmi = cStart; cmi < endIdx; cmi++) {
              var cm = convMsgs[cmi]
              if (cm.dimmed) continue
              var cContent = cm.content
              if (cm.alternatives && cm.alternatives.length > 0 && cm.activeAltIndex > 0) {
                cContent = cm.alternatives[cm.activeAltIndex - 1] || cContent
              }
              var msgDepth = cm.role === 'assistant' ? (assistantDepthMap[cmi] !== undefined ? assistantDepthMap[cmi] : 0) : -1
              cContent = this._applyConvFilterRegex(cContent, cm.role, msgDepth)
              if (cContent) {
                var cIdx = messages.length
                messages.push({ role: cm.role, content: cContent })
                if (cm.role === 'assistant') chatAssistantIndices.push(cIdx)
                // Track the last user message for latestUserPrompt
                if (cm.role === 'user') {
                  this._lastUserMsgContent = cContent
                }
              }
            }
          } else {
            // Original behavior: use asmData.shortTerm
            var msgs = this.asmData.shortTerm || []
            var depth2 = this.asmConfig.contextDepth || 40
            var start2 = Math.max(0, msgs.length - depth2)
            // Insert chat prompt preamble
            if (chatTpl) {
              messages.push({ role: 'system', content: chatTpl })
            }
            for (var mi = start2; mi < msgs.length; mi++) {
              var msg = msgs[mi]
              var role = 'user'
              if (msg.type === 'assistant' || msg.type === 'model') role = 'assistant'
              else if (msg.type === 'system') role = 'system'
              var text = msg.text || msg.content || ''
              if (text) {
                var idx = messages.length
                messages.push({ role: role, content: text })
                if (role === 'assistant') chatAssistantIndices.push(idx)
              }
            }
          }
          break
        case 'latestUserPrompt':
          // 用提示词模板包装最后的用户消息（替换而非追加，避免重复 user 消息）
          var lpTpl = (this._loadSettings().latestUserPrompt || '').trim()
          if (lpTpl && this._lastUserMsgContent) {
            var wrappedContent = lpTpl.split('{content}').join(this._lastUserMsgContent)
            // 查找 messages 中最后一条 user 消息并替换
            var lastUserIdx = -1
            for (var lui = messages.length - 1; lui >= 0; lui--) {
              if (messages[lui].role === 'user') { lastUserIdx = lui; break }
            }
            if (lastUserIdx >= 0) {
              messages[lastUserIdx].content = wrappedContent
              console.log('[PUA] _buildMessages latestUserPrompt: replaced last user msg at idx=' + lastUserIdx + ', len=' + wrappedContent.length)
            } else {
              // 如果没有找到 user 消息（如预览模式），则追加
              messages.push({ role: 'user', content: wrappedContent })
              console.log('[PUA] _buildMessages latestUserPrompt: no existing user msg, appended wrapped user msg')
            }
          }
          break
      }
    }

    // Apply filter/replace regexes: only on chat assistant messages
    // Skip if convMsgs was provided (filtering already done via _applyConvFilterRegex)
    if (!convMsgs) {
      var totalAssistantsFR = chatAssistantIndices.length
      for (var ri = 0; ri < this.regexes.length; ri++) {
        var rx = this.regexes[ri]
        if (!rx.on) continue
        if (rx.type !== 'filter' && rx.type !== 'replace') continue
        if (!rx.regex) continue
        var rxMinD = rx.dMin || 0
        var rxMaxD = (rx.dMax !== undefined && rx.dMax !== null && rx.dMax !== Infinity) ? rx.dMax : Infinity
        try {
          var re = new RegExp(rx.regex, 'g')
          for (var cai = 0; cai < chatAssistantIndices.length; cai++) {
            var msgIdx = chatAssistantIndices[cai]
            var frDepth = totalAssistantsFR - 1 - cai
            if (frDepth < rxMinD || frDepth > rxMaxD) continue
            messages[msgIdx].content = messages[msgIdx].content.replace(re, rx.html || '')
          }
        } catch(e) {}
      }

      // Apply preset outRegex/inRegex: only on chat assistant messages (with depth check)
      // chatAssistantIndices is ordered from oldest to newest, so depth = chatAssistantIndices.length - 1 - index
      var totalAssistants = chatAssistantIndices.length
      // First pass: apply all outRegex (blacklist) sequentially
      for (var pri = 0; pri < this.presets.length; pri++) {
        var pr = this.presets[pri]
        if (pr.outRegex && pr.outRegexOn) {
          var prMin = pr.dMin || 0
          var prMax = (pr.dMax !== undefined && pr.dMax !== null && pr.dMax !== Infinity) ? pr.dMax : Infinity
          try {
            var ore = new RegExp(pr.outRegex, 'g')
            for (var oai = 0; oai < chatAssistantIndices.length; oai++) {
              var oIdx = chatAssistantIndices[oai]
              var oDepth = totalAssistants - 1 - oai
              if (oDepth < prMin || oDepth > prMax) continue
              messages[oIdx].content = messages[oIdx].content.replace(ore, '')
            }
          } catch(e) {}
        }
      }
      // Second pass: apply all inRegex (whitelist) as UNION on each message
      var hasInRegex2 = false
      for (var ci2 = 0; ci2 < this.presets.length; ci2++) {
        if (this.presets[ci2].inRegex && this.presets[ci2].inRegexOn) { hasInRegex2 = true; break }
      }
      if (hasInRegex2) {
        for (var iai2 = 0; iai2 < chatAssistantIndices.length; iai2++) {
          var iIdx2 = chatAssistantIndices[iai2]
          var iDepth2 = totalAssistants - 1 - iai2
          var allMatches = []
          for (var pi3 = 0; pi3 < this.presets.length; pi3++) {
            var pr3 = this.presets[pi3]
            if (pr3.inRegex && pr3.inRegexOn) {
              var pr3Min = pr3.dMin || 0
              var pr3Max = (pr3.dMax !== undefined && pr3.dMax !== null && pr3.dMax !== Infinity) ? pr3.dMax : Infinity
              if (iDepth2 < pr3Min || iDepth2 > pr3Max) continue
              try {
                var ire = new RegExp(pr3.inRegex, 'g')
                var iMatches = []
                var im
                var lastIdx = 0
                while ((im = ire.exec(messages[iIdx2].content)) !== null) {
                  if (im[0].length === 0 && ire.lastIndex <= lastIdx) {
                    ire.lastIndex = lastIdx + 1
                  }
                  lastIdx = ire.lastIndex
                  iMatches.push(im[0])
                  if (iMatches.length > 10000) break
                }
                if (iMatches.length > 0) {
                  allMatches = allMatches.concat(iMatches)
                }
              } catch(e) {}
            }
          }
          if (allMatches.length > 0) {
            messages[iIdx2].content = allMatches.join('')
          }
        }
      }
    }

    // Store the assembled context for later viewing
    var contextParts = []
    for (var ci = 0; ci < messages.length; ci++) {
      contextParts.push('[' + messages[ci].role.toUpperCase() + ']\n' + (messages[ci].content || ''))
    }
    this._lastAsmContext = contextParts.join('\n\n---\n\n')

    return messages
  }

  /* ════════════════════════════════════════════════════════════
     上下文查看器
     ════════════════════════════════════════════════════════════ */

  P._viewContext = function(messageId) {
    var self = this

    // Always build fresh context using _buildConvContext (same as _sendMessage)
    // This ensures the preview matches what's actually sent to the model
    var messages = this._buildConvContext(messageId)
    var contextParts = []
    for (var i = 0; i < messages.length; i++) {
      contextParts.push('[' + messages[i].role.toUpperCase() + ']\n' + (messages[i].content || ''))
    }
    var contextStr = contextParts.join('\n\n---\n\n')
    this._lastAsmContext = contextStr

    var h = '<div style="font-family:monospace;font-size:11px;line-height:1.6;white-space:pre-wrap;word-break:break-all;max-height:60vh;overflow-y:auto;background:var(--pua-bg-input);border-radius:6px;padding:12px;margin-bottom:12px">'
    h += this._escHtml(contextStr)
    h += '</div>'
    h += '<div style="display:flex;gap:8px;justify-content:flex-end">'
    h += '<button class="pua-btn pua-btn-sm" id="ctx-copy-btn">复制</button>'
    h += '<button class="pua-btn pua-btn-sm pua-btn-gold" id="ctx-download-btn">下载</button>'
    h += '</div>'

    this._openModal('上下文查看' + (messageId ? ' - 消息 #' + messageId : ''), h)

    // 绑定复制按钮
    var modal = this._modalOverlay
    if (modal) {
      var copyBtn = modal.querySelector('#ctx-copy-btn')
      if (copyBtn) {
        copyBtn.addEventListener('click', function() {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(contextStr).then(function() {
              self._toast('已复制到剪贴板')
            }).catch(function() {
              self._toast('复制失败')
            })
          } else {
            // 回退方案
            var ta = document.createElement('textarea')
            ta.value = contextStr
            ta.style.position = 'fixed'
            ta.style.opacity = '0'
            document.body.appendChild(ta)
            ta.select()
            try { document.execCommand('copy'); self._toast('已复制到剪贴板') } catch(e) { self._toast('复制失败') }
            document.body.removeChild(ta)
          }
        })
      }
      var downloadBtn = modal.querySelector('#ctx-download-btn')
      if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
          var ctxFilename = 'context_' + new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19) + '.txt'
          self._downloadFile(contextStr, ctxFilename, 'text/plain;charset=utf-8')
          self._toast('已下载')
        })
      }
    }
  }

  /* ════════════════════════════════════════════════════════════
     工具方法
     ════════════════════════════════════════════════════════════ */

  P._downloadFile = function(data, filename, mimeType) {
    var self = this
    var timestamp = new Date().toISOString()
    console.log('[PUA] _downloadFile: START ts=' + timestamp + ' filename=' + filename + ' mimeType=' + mimeType + ' dataType=' + typeof data + ' dataSize=' + (data instanceof Blob ? data.size : (typeof data === 'string' ? data.length : '?')))
    var blob = (data instanceof Blob) ? data : new Blob([data], { type: mimeType || 'application/octet-stream' })
    console.log('[PUA] _downloadFile: blob created, size=' + blob.size)

    // Environment detection
    console.log('[PUA] _downloadFile: ENV showSaveFilePicker=' + !!window.showSaveFilePicker + ' navigator.share=' + !!navigator.share + ' navigator.canShare=' + !!navigator.canShare + ' userAgent=' + navigator.userAgent.substring(0, 120))

    // Priority 1: nativeBridge (Roche APK native file export)
    if (window.nativeBridge && typeof window.nativeBridge === 'object') {
      console.log('[PUA] _downloadFile: attempting nativeBridge, keys=[' + Object.keys(window.nativeBridge).join(',') + ']')
      // Try common native bridge methods for file export
      var nb = window.nativeBridge
      if (typeof nb.saveFile === 'function') {
        console.log('[PUA] _downloadFile: calling nativeBridge.saveFile')
        try {
          var nbResult = nb.saveFile(filename || 'download', blob, mimeType || 'application/octet-stream')
          console.log('[PUA] _downloadFile: nativeBridge.saveFile result=' + JSON.stringify(nbResult))
          self._toast('已通过 nativeBridge 保存: ' + filename)
          return
        } catch(nbErr) {
          console.log('[PUA] _downloadFile: nativeBridge.saveFile error=' + nbErr.message)
        }
      }
      if (typeof nb.exportFile === 'function') {
        console.log('[PUA] _downloadFile: calling nativeBridge.exportFile')
        try {
          var nbResult2 = nb.exportFile(filename || 'download', blob, mimeType || 'application/octet-stream')
          console.log('[PUA] _downloadFile: nativeBridge.exportFile result=' + JSON.stringify(nbResult2))
          self._toast('已通过 nativeBridge 导出: ' + filename)
          return
        } catch(nbErr2) {
          console.log('[PUA] _downloadFile: nativeBridge.exportFile error=' + nbErr2.message)
        }
      }
      if (typeof nb.downloadFile === 'function') {
        console.log('[PUA] _downloadFile: calling nativeBridge.downloadFile')
        try {
          var nbResult3 = nb.downloadFile(filename || 'download', blob, mimeType || 'application/octet-stream')
          console.log('[PUA] _downloadFile: nativeBridge.downloadFile result=' + JSON.stringify(nbResult3))
          self._toast('已通过 nativeBridge 下载: ' + filename)
          return
        } catch(nbErr3) {
          console.log('[PUA] _downloadFile: nativeBridge.downloadFile error=' + nbErr3.message)
        }
      }
      if (typeof nb.writeFile === 'function') {
        console.log('[PUA] _downloadFile: calling nativeBridge.writeFile')
        try {
          var nbResult4 = nb.writeFile(filename || 'download', data, mimeType || 'application/octet-stream')
          console.log('[PUA] _downloadFile: nativeBridge.writeFile result=' + JSON.stringify(nbResult4))
          self._toast('已通过 nativeBridge 写入: ' + filename)
          return
        } catch(nbErr4) {
          console.log('[PUA] _downloadFile: nativeBridge.writeFile error=' + nbErr4.message)
        }
      }
      // Try sending base64 via postMessage or similar
      if (typeof nb.postMessage === 'function') {
        console.log('[PUA] _downloadFile: attempting nativeBridge.postMessage for file export')
        try {
          var reader = new FileReader()
          reader.onload = function() {
            var base64 = reader.result.split(',')[1]
            var msg = JSON.stringify({ type: 'saveFile', filename: filename || 'download', data: base64, mimeType: mimeType || 'application/octet-stream' })
            nb.postMessage(msg)
            console.log('[PUA] _downloadFile: nativeBridge.postMessage sent')
            self._toast('已通过 nativeBridge 发送: ' + filename)
          }
          reader.readAsDataURL(blob)
          return
        } catch(nbErr5) {
          console.log('[PUA] _downloadFile: nativeBridge.postMessage error=' + nbErr5.message)
        }
      }
      console.log('[PUA] _downloadFile: nativeBridge exists but no known file export method found')
    }

    // Priority 2: File System Access API (showSaveFilePicker) - works in modern browsers and some Android WebViews
    if (window.showSaveFilePicker) {
      console.log('[PUA] _downloadFile: attempting showSaveFilePicker')
      window.showSaveFilePicker({
        suggestedName: filename || 'download',
        types: [{
          description: mimeType === 'application/json' ? 'JSON File' : 'Text File',
          accept: (mimeType === 'application/json' ? { 'application/json': ['.json'] } : { 'text/plain': ['.txt', '.json'] })
        }]
      }).then(function(handle) {
        return handle.createWritable().then(function(writable) {
          return writable.write(blob).then(function() {
            return writable.close()
          })
        })
      }).then(function() {
        console.log('[PUA] _downloadFile: showSaveFilePicker SUCCESS')
        self._toast('已保存到文件: ' + filename)
      }).catch(function(err) {
        console.log('[PUA] _downloadFile: showSaveFilePicker FAILED err=' + err.message + ' name=' + err.name)
        // Fall through to next method regardless (AbortError might be WebView blocking the dialog)
        self._downloadShareOrLink(blob, filename)
      })
      return
    }

    // Fall through to share/link methods
    self._downloadShareOrLink(blob, filename)
  }

  P._downloadShareOrLink = function(blob, filename) {
    var self = this
    // Priority 2: Web Share API (works on some mobile/APK)
    var hasShare = !!(navigator.share && navigator.canShare)
    var canShareFiles = false
    console.log('[PUA] _downloadShareOrLink: navigator.share=' + !!navigator.share + ' navigator.canShare=' + !!navigator.canShare)
    if (navigator.share && navigator.canShare) {
      var file = new File([blob], filename || 'download', { type: blob.type || 'application/octet-stream' })
      var shareData = { files: [file] }
      canShareFiles = navigator.canShare(shareData)
      console.log('[PUA] _downloadShareOrLink: canShareFiles=' + canShareFiles)
      if (canShareFiles) {
        console.log('[PUA] _downloadShareOrLink: attempting navigator.share')
        navigator.share(shareData).then(function() {
          console.log('[PUA] _downloadShareOrLink: navigator.share SUCCESS')
        }).catch(function(err) {
          console.log('[PUA] _downloadShareOrLink: navigator.share FAILED err=' + err.message + ' name=' + err.name)
          if (err.name !== 'AbortError') {
            self._downloadViaLink(blob, filename)
          }
        })
        return
      }
    }
    // Priority 3: download link
    console.log('[PUA] _downloadShareOrLink: using download link fallback')
    this._downloadViaLink(blob, filename)
  }

  P._downloadViaLink = function(blob, filename) {
    var self = this
    console.log('[PUA] _downloadViaLink: START filename=' + filename + ' blobSize=' + blob.size)
    var url = URL.createObjectURL(blob)
    console.log('[PUA] _downloadViaLink: blobURL created=' + url.substring(0, 50))

    // Method 1: Create <a> element with download attribute (works in standard browsers)
    var a = document.createElement('a')
    a.href = url
    a.download = filename || 'download'
    a.style.display = 'none'
    document.body.appendChild(a)
    console.log('[PUA] _downloadViaLink: a element appended to DOM, triggering click')
    a.click()
    document.body.removeChild(a)
    console.log('[PUA] _downloadViaLink: click triggered, a element removed')

    // Method 2: WebView fallback - show modal with copy button after delay
    // If a.click() didn't trigger download within 2 seconds, show manual fallback
    setTimeout(function() {
      console.log('[PUA] _downloadViaLink: showing WebView fallback modal')
      self._showExportFallbackModal(blob, filename)
    }, 2000)

    setTimeout(function() {
      URL.revokeObjectURL(url)
      console.log('[PUA] _downloadViaLink: blobURL revoked')
    }, 30000)
  }

  P._showExportFallbackModal = function(blob, filename) {
    var self = this
    var contentEl = this._contentEl || document.querySelector('#pua-content')
    if (!contentEl) return

    // Read blob as text for display/copy
    var reader = new FileReader()
    reader.onload = function() {
      var textContent = reader.result
      var sizeKB = Math.round(textContent.length / 1024)

      var overlay = document.createElement('div')
      overlay.id = 'pua-export-fallback-overlay'
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99998;display:flex;align-items:center;justify-content:center'

      var modal = document.createElement('div')
      modal.style.cssText = 'background:var(--pua-bg);border-radius:12px;padding:20px;max-width:90vw;max-height:85vh;width:500px;display:flex;flex-direction:column;gap:12px;border:1px solid var(--pua-border)'

      modal.innerHTML = '<div style="font-size:14px;font-weight:bold;color:var(--pua-text)">' + this._escHtml(filename) + '</div>' +
        '<div style="font-size:11px;color:var(--pua-text-dim)">\u6587\u4EF6\u5927\u5C0F: ' + sizeKB + ' KB | \u5728 WebView/APK \u73AF\u5883\u4E2D\u65E0\u6CD5\u76F4\u63A5\u4E0B\u8F7D\uFF0C\u8BF7\u590D\u5236\u5185\u5BB9\u624B\u52A8\u4FDD\u5B58</div>' +
        '<textarea id="pua-export-fallback-text" readonly style="width:100%;height:300px;background:var(--pua-bg-input);border:1px solid var(--pua-border);border-radius:6px;color:var(--pua-text);font-size:11px;font-family:monospace;padding:10px;resize:none;outline:none;box-sizing:border-box"></textarea>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end">' +
        '<button id="pua-export-fallback-copy" class="pua-btn pua-btn-sm pua-btn-gold">\u590D\u5236\u5168\u90E8\u5185\u5BB9</button>' +
        '<button id="pua-export-fallback-close" class="pua-btn pua-btn-sm">\u5173\u95ED</button>' +
        '</div>'

      overlay.appendChild(modal)
      contentEl.appendChild(overlay)

      var textArea = overlay.querySelector('#pua-export-fallback-text')
      if (textArea) textArea.value = textContent

      var copyBtn = overlay.querySelector('#pua-export-fallback-copy')
      if (copyBtn) {
        copyBtn.addEventListener('click', function() {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textContent).then(function() {
              self._toast('\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F (' + sizeKB + ' KB)')
            }).catch(function() {
              // Fallback: select all and execCommand copy
              textArea.select()
              document.execCommand('copy')
              self._toast('\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F')
            })
          } else {
            textArea.select()
            document.execCommand('copy')
            self._toast('\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F')
          }
        })
      }

      var closeBtn = overlay.querySelector('#pua-export-fallback-close')
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay)
        })
      }

      // Close on clicking outside
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay)
      })
    }.bind(this)
    reader.readAsText(blob)
  }

  P._detectExportCapabilities = function() {
    var caps = []
    caps.push('showSaveFilePicker: ' + !!window.showSaveFilePicker)
    caps.push('navigator.share: ' + !!navigator.share)
    caps.push('navigator.canShare: ' + !!navigator.canShare)
    caps.push('navigator.clipboard: ' + !!(navigator.clipboard && navigator.clipboard.writeText))
    caps.push('document.execCommand copy: ' + !!document.execCommand)
    caps.push('userAgent: ' + navigator.userAgent.substring(0, 200))
    // Check for native bridges
    var nativeKeys = ['Android', 'RocheNative', 'RocheBridge', 'WebView', 'nativeBridge', 'JSBridge', 'webkit']
    for (var i = 0; i < nativeKeys.length; i++) {
      if (window[nativeKeys[i]]) {
        var val = window[nativeKeys[i]]
        var type = typeof val
        var keys = ''
        if (type === 'object' && val) {
          try { keys = Object.keys(val).join(',') } catch(e) { keys = '(cannot enumerate)' }
        }
        caps.push('window.' + nativeKeys[i] + ': type=' + type + (keys ? ' keys=[' + keys + ']' : ' keys=[]'))
        // Deep enumerate nativeBridge
        if (nativeKeys[i] === 'nativeBridge' && type === 'object' && val) {
          // Method 1: Object.keys (enumerable only)
          try {
            var nbKeys = Object.keys(val)
            caps.push('  Object.keys(nativeBridge): [' + (nbKeys.length ? nbKeys.join(',') : 'empty') + ']')
          } catch(e1) { caps.push('  Object.keys error: ' + e1.message) }
          // Method 2: Object.getOwnPropertyNames (includes non-enumerable)
          try {
            var ownNames = Object.getOwnPropertyNames(val)
            caps.push('  getOwnPropertyNames(nativeBridge): [' + (ownNames.length ? ownNames.join(',') : 'empty') + ']')
          } catch(e2) { caps.push('  getOwnPropertyNames error: ' + e2.message) }
          // Method 3: Prototype chain
          try {
            var proto = Object.getPrototypeOf(val)
            caps.push('  prototype === Object.prototype: ' + (proto === Object.prototype))
            if (proto && proto !== Object.prototype) {
              var protoNames = Object.getOwnPropertyNames(proto)
              caps.push('  prototype ownNames: [' + protoNames.join(',') + ']')
            }
            var proto2 = proto ? Object.getPrototypeOf(proto) : null
            if (proto2 && proto2 !== Object.prototype) {
              caps.push('  proto2 ownNames: [' + Object.getOwnPropertyNames(proto2).join(',') + ']')
            }
          } catch(e3) { caps.push('  prototype error: ' + e3.message) }
          // Method 4: Direct typeof check for common bridge methods (Android addJavascriptInterface methods are non-enumerable)
          var bridgeMethods = ['saveFile', 'exportFile', 'downloadFile', 'writeFile', 'postMessage', 'send',
            'save', 'export', 'download', 'write', 'open', 'share', 'createFile', 'writeToFile',
            'saveToDownloads', 'saveToDocuments', 'saveToStorage', 'storeFile', 'putFile',
            'saveData', 'exportData', 'downloadData', 'writeData', 'storeData',
            'saveJSON', 'exportJSON', 'saveText', 'exportText',
            'pickFolder', 'getDirectory', 'getDownloadsDir', 'getDocumentsDir',
            'requestPermission', 'checkPermission', 'hasPermission',
            'showSaveDialog', 'showFileChooser', 'openFileChooser',
            'onSave', 'onExport', 'onDownload',
            'call', 'invoke', 'execute', 'run', 'apply',
            'toString', 'valueOf', 'constructor', 'hasOwnProperty']
          var foundMethods = []
          for (var mi = 0; mi < bridgeMethods.length; mi++) {
            try {
              var mType = typeof val[bridgeMethods[mi]]
              if (mType === 'function') {
                foundMethods.push(bridgeMethods[mi] + '()')
              }
            } catch(mErr) {}
          }
          caps.push('  Direct typeof probe found: [' + (foundMethods.length ? foundMethods.join(', ') : 'none') + ']')
          // Method 5: for-in loop (catches some non-enumerable in certain WebView)
          var forInKeys = []
          try {
            for (var fk in val) { forInKeys.push(fk) }
          } catch(e4) {}
          caps.push('  for-in keys: [' + (forInKeys.length ? forInKeys.join(',') : 'empty') + ']')
          // Method 6: JSON.stringify
          try {
            var jsonStr = JSON.stringify(val)
            caps.push('  JSON.stringify: ' + (jsonStr ? jsonStr.substring(0, 200) : 'null'))
          } catch(e5) { caps.push('  JSON.stringify error: ' + e5.message) }
          // Method 7: toString / valueOf
          try { caps.push('  toString: ' + val.toString().substring(0, 200)) } catch(e6) { caps.push('  toString error: ' + e6.message) }
          // Method 8: Check if it's a Proxy
          try {
            var isProxy = val.__proto__ === null && Object.keys(val).length === 0
            caps.push('  might be Proxy: ' + isProxy)
          } catch(e7) {}
        }
      }
    }
    // Check roche object for any file-related methods
    if (this.roche) {
      var rocheKeys = Object.keys(this.roche)
      caps.push('roche keys: [' + rocheKeys.join(', ') + ']')
      for (var r = 0; r < rocheKeys.length; r++) {
        var sub = this.roche[rocheKeys[r]]
        if (sub && typeof sub === 'object') {
          var subKeys = Object.keys(sub)
          caps.push('roche.' + rocheKeys[r] + ' keys: [' + subKeys.join(', ') + ']')
        }
      }
    }
    var report = caps.join('\n')
    console.log('[PUA] Export capabilities:\n' + report)
    this._toast('导出能力已检测，请查看控制台日志')
    return report
  }

  P._escHtml = function(s) {
    if (!s) return ''
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  P._closeModal = function() {
    if (this._modalOverlay) this._modalOverlay.classList.remove('show')
  }

  /* ── 移动端侧边栏切换 ── */
  P._toggleSidebar = function() {
    this._sidebarOpen = !this._sidebarOpen
    if (this._sidebarEl) {
      if (this._sidebarOpen) {
        this._sidebarEl.classList.add('open')
        if (this._sidebarMask) this._sidebarMask.classList.add('open')
      } else {
        this._sidebarEl.classList.remove('open')
        if (this._sidebarMask) this._sidebarMask.classList.remove('open')
      }
    }
  }

  P._toast = function(msg) {
    var self = this
    var toast = this._toastEl
    if (!toast) return
    toast.textContent = msg
    toast.classList.add('show')
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(function() {
      toast.classList.remove('show')
    }, 2500)
  }

  /* ════════════════════════════════════════════════════════════
     预设与美化助手
     ════════════════════════════════════════════════════════════ */

  P._loadAssistantData = function() {
    var self = this
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.get('pua_assistant').then(function(data) {
      if (data) {
        self._assistantData = data
        // Migrate old format: if has history at top level but no branches
        if (self._assistantData.history && !self._assistantData.branches) {
          var defaultBranch = {
            id: 'branch_' + Date.now(),
            name: '\u5BF9\u8BDD 1',
            history: self._assistantData.history || [],
            undoStack: self._assistantData.undoStack || [],
            createdAt: new Date().toISOString()
          }
          self._assistantData.branches = [defaultBranch]
          self._assistantData.activeBranchId = defaultBranch.id
          delete self._assistantData.history
          delete self._assistantData.undoStack
          self._saveAssistantData()
        }
      } else {
        var bid = 'branch_' + Date.now()
        self._assistantData = { apiChoice: 'sub', branches: [{ id: bid, name: '\u5BF9\u8BDD 1', history: [], undoStack: [], createdAt: new Date().toISOString() }], activeBranchId: bid, systemPrompt: '', promptPresets: [] }
      }
    }).catch(function() {
      var bid2 = 'branch_' + Date.now()
      self._assistantData = { apiChoice: 'sub', branches: [{ id: bid2, name: '\u5BF9\u8BDD 1', history: [], undoStack: [], createdAt: new Date().toISOString() }], activeBranchId: bid2, systemPrompt: '', promptPresets: [] }
    })
  }

  P._saveAssistantData = function() {
    if (!this.roche || !this.roche.storage) return
    if (!this._assistantData) {
      var bid = 'branch_' + Date.now()
      this._assistantData = { apiChoice: 'sub', branches: [{ id: bid, name: '\u5BF9\u8BDD 1', history: [], undoStack: [], createdAt: new Date().toISOString() }], activeBranchId: bid, systemPrompt: '', promptPresets: [] }
    }
    this.roche.storage.set('pua_assistant', this._assistantData).catch(function(e) {
      console.error('[PUA] save assistant data failed', e)
    })
  }

  P._getActiveBranch = function() {
    if (!this._assistantData || !this._assistantData.branches) return null
    var activeId = this._assistantData.activeBranchId
    for (var i = 0; i < this._assistantData.branches.length; i++) {
      if (this._assistantData.branches[i].id === activeId) return this._assistantData.branches[i]
    }
    // Fallback: return first branch
    if (this._assistantData.branches.length > 0) {
      this._assistantData.activeBranchId = this._assistantData.branches[0].id
      return this._assistantData.branches[0]
    }
    return null
  }

  P._getAssistantSystemPrompt = function() {
    if (this._assistantData && this._assistantData.systemPrompt) {
      return this._assistantData.systemPrompt
    }
    return this._getDefaultSystemPrompt()
  }

  P._getDefaultSystemPrompt = function() {
    return '你是"平行时空档案馆"的预设与美化助手。你可以帮助用户：\n1. 创建新的预设条目（system prompt）\n2. 创建新的正则规则（render/filter/replace）\n3. 编辑现有的预设和正则\n4. 提供美化建议\n5. 编写CSS美化代码\n6. 导入Roche预设时自动识别outputRegex/inputRegex并正确映射\n\n════════════════════════════════\n【预设条目完整字段】\n════════════════════════════════\n每个预设条目包含以下字段：\n- title: 条目名称，用于识别和显示\n- content: 预设正文，即system prompt内容，会被注入到发给模型的上下文中\n- role: 角色类型，可选 system/user/assistant，绝大多数情况用system\n- on: 是否启用，true/false\n- outRegex: 排除过滤正则（排除式，见下方详解）\n- outRegexOn: 排除过滤是否启用\n- inRegex: 保留过滤正则（包含式，见下方详解）\n- inRegexOn: 保留过滤是否启用\n- dMin: 最小深度（见下方详解）\n- dMax: 最大深度（见下方详解）\n- group: 分组名，用于在列表中视觉分组\n\n════════════════════════════════\n【正则规则完整字段】\n════════════════════════════════\n每个正则规则包含以下字段：\n- name: 规则名称，用于识别和显示\n- regex: 正则表达式，用于匹配消息内容\n- html: HTML模板（仅render类型使用），用$1$2等引用捕获组，将匹配内容转换为美化后的HTML\n- type: 正则类型，必须是 render/filter/replace 之一（见下方详解）\n- on: 是否启用，true/false\n- dMin: 最小深度（见下方详解）\n- dMax: 最大深度（见下方详解）\n- group: 分组名\n\n════════════════════════════════\n【正则三种类型详解】\n════════════════════════════════\n\n★ 重要：所有正则（filter/replace/outRegex/inRegex）只作用于AI助手（assistant）的消息，不影响用户消息和系统消息。\n\n▶ render（纯前端渲染）\n作用阶段：前端显示时\n影响范围：只影响用户看到的视觉效果，完全不影响发给模型的内容\n工作原理：用regex匹配消息中的文本，用html模板替换匹配内容进行视觉转换\n使用场景：把<siweilian>渲染成可折叠的思维链卡片、把<zhengwen>加上特殊样式、把特定标签转换为美观的HTML元素\n注意：html模板中用$1$2等引用正则捕获组，如：regex为"<siweilian>([\\s\\S]*?)</siweilian>"，html为"<details><summary>思维链</summary>$1</details>"\n\n▶ filter（后端过滤）\n作用阶段：组装发给模型的上下文时\n影响范围：影响发给模型的上下文内容，不影响前端显示\n工作原理：根据语义不同，分两种：\n\n  ① 排除过滤（对应预设的outRegex/outRegexOn）\n  语义：排除式过滤，匹配到的内容被踢出上下文，永远不发给模型\n  使用场景：隐藏思维链<siweilian>、隐藏小剧场<xiaojuchang>等AI内部标签，让模型永远看不到这些内容\n  配合深度：可配合dMin/dMax控制从第几条消息开始过滤，但通常排除过滤不需要深度限制，因为这些内容应该永远不进入上下文\n\n  ② 保留过滤（对应预设的inRegex/inRegexOn）\n  语义：包含式过滤，只有匹配到的内容才进入上下文\n  使用场景：只保留<zhengwen>正文和<zhaiyao>摘要进入上下文，其余内容全部排除\n  配合深度：强烈建议配合dMin/dMax，因为不同标签的保留条数不同（见深度详解）\n\n  ★ 排除过滤 vs 保留过滤的关键区别：\n  排除过滤："这些东西不要发给模型"（黑名单模式）——可以同时有多个排除过滤，匹配到的都不进上下文\n  保留过滤："只有这些东西才发给模型"（白名单模式）——可以同时有多个保留过滤，匹配到的都可以进上下文\n  两者可以同时存在：先用排除过滤踢掉不需要的，再用保留过滤保留需要的\n  ★ 多个保留过滤是并集关系：如果预设A的inRegex匹配了<zhengwen>，预设B的inRegex匹配了<zhaiyao>，则两者匹配的内容都会保留\n\n▶ replace（后端替换）\n作用阶段：组装发给模型的上下文时\n影响范围：影响发给模型的上下文内容，不影响前端显示\n工作原理：将匹配到的内容替换为指定文本（最常见是替换为空串，即删除匹配内容）\n使用场景：将<neiliansiweilian>及其内容替换为空（正文中嵌入的思维链不需要发给模型，但正文本身要保留）、将特定标记替换为更简洁的文本\n配合深度：可根据需要配合深度，控制从哪条消息开始替换\n\n════════════════════════════════\n【深度（dMin/dMax）详解】\n════════════════════════════════\n深度是针对AI助手（assistant）消息的位置索引，从0开始计数：\n- 深度0 = 最近一条assistant消息（对话末尾）\n- 深度1 = 倒数第二条assistant消息\n- 深度N = 倒数第N+1条assistant消息\n- 最大深度 = 总assistant消息数 - 1（对话开头）\n\n★ 注意：深度只计算assistant消息，跳过user和system消息。例如对话中有10条消息，其中4条是assistant的，那么深度范围是0-3。\n\ndMin（最小深度）：规则/预设从这个深度开始生效，比这更近的消息不受影响\ndMax（最大深度）：规则/预设到这个深度为止，比这更早的消息不受影响\n\n★ 深度的实际含义：\n"从对话末尾算起，第dMin条到第dMax条assistant消息之间，这个规则才生效"\n超出范围的assistant消息不受这个规则的影响。\n\n★ 典型深度设置场景：\n\n1. 正文保留最新N条：\n   保留过滤匹配<zhengwen>，dMin=0，dMax=4\n   效果：只有最近5条assistant消息中的<zhengwen>会进入上下文，更早的正文被排除\n   目的：节省token，避免发送太多历史正文\n\n2. 摘要保留最新30条：\n   保留过滤匹配<zhaiyao>，dMin=0，dMax=29\n   效果：只有最近30条assistant消息中的<zhaiyao>会进入上下文\n   目的：保留足够的摘要信息供模型参考\n\n3. 思维链永久隐藏：\n   排除过滤匹配<siweilian>，dMin=0，dMax=Infinity\n   效果：所有assistant消息中的<siweilian>都不会进入上下文\n   目的：思维链是AI内部过程，不应该占用上下文空间\n\n4. 内链思维替换为空：\n   replace匹配<neiliansiweilian>替换为空，dMin=0，dMax=Infinity\n   效果：正文中的内链思维链被剥离，但正文本身保留\n   目的：正文需要发给模型，但其中嵌入的思维链不需要\n\n5. 前3轮不发预设：\n   预设条目的dMin=3，dMax=Infinity\n   效果：最近3条assistant消息不注入这个system prompt，从第4条开始注入\n   目的：对话初期可能不需要某些预设指令\n\n★ 深度设置要点：\n- dMin=0, dMax=Infinity 表示对所有assistant消息生效（默认值）\n- 排除过滤（排除式）通常不需要限制深度，因为被排除的内容应该永远不进上下文\n- 保留过滤（包含式）强烈建议配合深度，因为不同标签的保留数量不同\n- replace可根据需要配合深度，控制从哪条消息开始替换\n- 深度值必须是非负整数或Infinity，0表示从最近一条开始生效\n\n════════════════════════════════\n【完整使用场景示例】\n════════════════════════════════\n假设一条assistant消息的结构如下：\n<siweilian>思维内容...</siweilian>\n<zhengwen>正文开始<neiliansiweilian>内链思维</neiliansiweilian>正文继续</zhengwen>\n<zhaiyao>摘要内容...</zhaiyao>\n<xiaojuchang>小剧场内容...</xiaojuchang>\n\n▶ 启用排除过滤时（不启用保留过滤）：\n1. outRegex匹配<siweilian>，排除思维链→模型看不到思维链\n2. outRegex匹配<xiaojuchang>，排除小剧场→模型看不到小剧场\n3. replace匹配<neiliansiweilian>替换为空→正文中的内链思维链被剥离\n4. render匹配所有标签做视觉美化→用户看到漂亮的卡片\n结果：模型收到的是去掉思维链和小剧场、剥离内链思维后的内容\n\n▶ 启用保留过滤时（不启用排除过滤）：\n1. inRegex匹配<zhengwen>，只保留正文→其余内容全部排除\n2. inRegex匹配<zhaiyao>，只保留摘要→摘要也进入上下文\n3. replace匹配<neiliansiweilian>替换为空→正文中的内链思维链被剥离\n4. render匹配所有标签做视觉美化\n结果：模型只收到正文和摘要（内链思维已被剥离）\n\n▶ 同时启用两种过滤：\n先执行排除过滤（踢掉思维链和小剧场），再执行保留过滤（只保留正文和摘要）\n结果：模型收到的与只启用保留过滤时相同，但逻辑更清晰\n\n════════════════════════════════\n【Roche预设格式】\n════════════════════════════════\nJSON结构: {version:1, type:"roche_presets", categories:[{name, presets:[{title, content, outputRegex, isOutputRegexEnabled, inputRegex, isInputRegexEnabled}]}]}\n导入规则: outputRegex+isOutputRegexEnabled=true → filter[排除过滤]， inputRegex+isInputRegexEnabled=true → filter[保留过滤]\n一条预设可同时有outputRegex和inputRegex，导入时拆成两条独立规则\n\n════════════════════════════════\n【操作指令格式】\n════════════════════════════════\n当你需要添加或修改预设/正则时，请用以下JSON格式输出：\n【ADD_PRESET】{"title":"...","content":"...","role":"system","outRegex":"","outRegexOn":false,"inRegex":"","inRegexOn":false,"dMin":0,"dMax":Infinity}【/ADD_PRESET】\n【ADD_REGEX】{"name":"...","regex":"...","html":"...","type":"render","dMin":0,"dMax":Infinity}【/ADD_REGEX】\n【EDIT_PRESET】{"id":"...","title":"...","content":"...","outRegex":"...","outRegexOn":...,"inRegex":"...","inRegexOn":...,"dMin":...,"dMax":...}【/EDIT_PRESET】\n【EDIT_REGEX】{"id":"...","name":"...","regex":"...","html":"...","type":"...","on":...,"dMin":...,"dMax":...}【/EDIT_REGEX】\n\n重要：你可以在一次回应中输出多个action tag，实现批量操作。例如用户附加了3个正则要修改，你可以输出3个EDIT_REGEX tag。每次操作都需要user手动确认才生效。用自然语言解释你在做什么。\n绝不删除任何条目，只添加或修改。\n你可以发送代码块让用户预览效果。'
  }
  P._renderAssistant = function(titleEl, actionsEl, contentEl) {
    var self = this
    titleEl.textContent = '\u9884\u8BBE\u4E0E\u7F8E\u5316\u52A9\u624B'
    actionsEl.innerHTML = ''

    if (!this._assistantData) {
      var bid = 'branch_' + Date.now()
      this._assistantData = { apiChoice: 'sub', branches: [{ id: bid, name: '\u5BF9\u8BDD 1', history: [], undoStack: [], createdAt: new Date().toISOString() }], activeBranchId: bid, systemPrompt: '', promptPresets: [] }
    }
    if (!this._assistantData.branches) {
      // Migrate
      var migBranch = { id: 'branch_' + Date.now(), name: '\u5BF9\u8BDD 1', history: this._assistantData.history || [], undoStack: this._assistantData.undoStack || [], createdAt: new Date().toISOString() }
      this._assistantData.branches = [migBranch]
      this._assistantData.activeBranchId = migBranch.id
      delete this._assistantData.history
      delete this._assistantData.undoStack
    }
    if (!this._assistantData.promptPresets) this._assistantData.promptPresets = []
    if (!this._assistantAttached) this._assistantAttached = { presets: [], regexes: [] }
    var data = this._assistantData
    var attached = this._assistantAttached
    var branch = this._getActiveBranch()
    if (!branch) return

    var h = '<div class="pua-assistant-layout">'

    // Header with API selector and prompt button
    h += '<div class="pua-assistant-header">'
    h += '<span style="font-size:10px;color:var(--pua-text-sub)">API:</span>'
    h += '<select class="pua-assistant-api-select" id="ast-api-select">'
    h += '<option value="main"' + (data.apiChoice === 'main' ? ' selected' : '') + '>\u4E3B API</option>'
    h += '<option value="sub"' + (data.apiChoice === 'sub' ? ' selected' : '') + '>\u526F API</option>'
    h += '<option value="vec"' + (data.apiChoice === 'vec' ? ' selected' : '') + '>\u5411\u91CF API</option>'
    h += '</select>'
    h += '<button class="pua-assistant-attach-btn" id="ast-prompt-btn" style="margin-left:4px"> \u63D0\u793A\u8BCD</button>'
    h += '<button class="pua-btn pua-btn-sm" id="ast-clear-history" style="margin-left:auto">\u6E05\u7A7A\u5BF9\u8BDD</button>'
    h += '</div>'

    // Branch selector bar
    h += '<div class="pua-branch-bar">'
    h += '<select class="pua-branch-select" id="ast-branch-select">'
    for (var bi = 0; bi < data.branches.length; bi++) {
      h += '<option value="' + self._escHtml(data.branches[bi].id) + '"' + (data.branches[bi].id === data.activeBranchId ? ' selected' : '') + '>' + self._escHtml(data.branches[bi].name) + '</option>'
    }
    h += '</select>'
    h += '<button class="pua-branch-btn" id="ast-branch-add">\u2795 \u65B0\u5BF9\u8BDD</button>'
    h += '<button class="pua-branch-btn" id="ast-branch-rename"></button>'
    h += '<button class="pua-branch-btn pua-branch-btn-danger" id="ast-branch-delete"></button>'
    h += '<button class="pua-branch-btn" id="ast-branch-export"> \u5BFC\u51FA</button>'
    h += '<button class="pua-branch-btn" id="ast-branch-import"> \u5BFC\u5165</button>'
    h += '<span style="font-size:8px;color:var(--pua-text-dim);margin-left:auto">' + data.branches.length + '/10</span>'
    h += '</div>'

    // Chat area
    h += '<div class="pua-assistant-chat" id="ast-chat">'

    if (!branch.history || branch.history.length === 0) {
      h += '<div class="pua-assistant-empty">'
      h += '<div class="pua-assistant-empty-icon"></div>'
      h += '<div class="pua-assistant-empty-text">\u5411\u52A9\u624B\u8BE2\u95EE\uFF0C\u5982\u201C\u5E2E\u6211\u6DFB\u52A0\u4E00\u4E2A\u89D2\u8272\u626E\u6F14\u9884\u8BBE\u201D</div>'
      h += '</div>'
    } else {
      for (var mi = 0; mi < branch.history.length; mi++) {
        var msg = branch.history[mi]
        if (msg.role === 'user') {
          h += '<div class="pua-assistant-msg pua-assistant-msg-user' + (msg.dimmed ? ' pua-msg-dimmed' : '') + '" data-msg-id="' + self._escHtml(msg.id) + '">'
          h += '<div class="pua-assistant-msg-role"> \u4F60</div>'
          h += '<div class="pua-assistant-msg-content">' + self._escHtml(msg.content) + '</div>'
          h += '<button class="pua-assistant-edit-btn" data-edit-msg-id="' + self._escHtml(msg.id) + '"></button>'
          // Show attached badges
          if (msg.attached && (msg.attached.presets.length > 0 || msg.attached.regexes.length > 0)) {
            h += '<div class="pua-assistant-attached-badges">'
            for (var api = 0; api < msg.attached.presets.length; api++) {
              h += '<span class="pua-assistant-badge"> ' + self._escHtml(msg.attached.presets[api].title) + '</span>'
            }
            for (var ari = 0; ari < msg.attached.regexes.length; ari++) {
              h += '<span class="pua-assistant-badge"> ' + self._escHtml(msg.attached.regexes[ari].name) + '</span>'
            }
            h += '</div>'
          }
          h += '</div>'
        } else if (msg.role === 'assistant') {
          h += '<div class="pua-assistant-msg pua-assistant-msg-assistant">'
          h += '<div class="pua-assistant-msg-role"> \u52A9\u624B</div>'
          h += self._renderAssistantContent(msg)
          h += '</div>'
        }
      }
    }

    h += '</div>'

    // Input area
    h += '<div class="pua-assistant-input-area">'
    h += '<div class="pua-assistant-attach-row">'
    // Attach presets dropdown
    h += '<div class="pua-assistant-attach-dropdown" id="ast-attach-preset-dropdown">'
    h += '<button class="pua-assistant-attach-btn' + (attached.presets.length > 0 ? ' active' : '') + '" id="ast-attach-preset-btn"> \u9009\u62E9\u9884\u8BBE' + (attached.presets.length > 0 ? ' (' + attached.presets.length + ')' : '') + '</button>'
    h += '<div class="pua-assistant-attach-list" id="ast-attach-preset-list">'
    for (var pi = 0; pi < this.presets.length; pi++) {
      var isSelPreset = false
      for (var sp = 0; sp < attached.presets.length; sp++) { if (attached.presets[sp].id === this.presets[pi].id) { isSelPreset = true; break } }
      h += '<div class="pua-assistant-attach-item' + (isSelPreset ? ' selected' : '') + '" data-type="preset" data-id="' + this._escHtml(this.presets[pi].id) + '">' + (isSelPreset ? '\u2713 ' : '') + self._escHtml(this.presets[pi].title) + '</div>'
    }
    h += '</div></div>'
    // Attach regexes dropdown
    h += '<div class="pua-assistant-attach-dropdown" id="ast-attach-regex-dropdown">'
    h += '<button class="pua-assistant-attach-btn' + (attached.regexes.length > 0 ? ' active' : '') + '" id="ast-attach-regex-btn"> \u9009\u62E9\u6B63\u5219' + (attached.regexes.length > 0 ? ' (' + attached.regexes.length + ')' : '') + '</button>'
    h += '<div class="pua-assistant-attach-list" id="ast-attach-regex-list">'
    for (var ri = 0; ri < this.regexes.length; ri++) {
      var isSelRegex = false
      for (var sr = 0; sr < attached.regexes.length; sr++) { if (attached.regexes[sr].id === this.regexes[ri].id) { isSelRegex = true; break } }
      h += '<div class="pua-assistant-attach-item' + (isSelRegex ? ' selected' : '') + '" data-type="regex" data-id="' + this._escHtml(this.regexes[ri].id) + '">' + (isSelRegex ? '\u2713 ' : '') + self._escHtml(this.regexes[ri].name) + '</div>'
    }
    h += '</div></div>'
    // Attached items badges
    if (attached.presets.length > 0 || attached.regexes.length > 0) {
      h += '<div class="pua-assistant-attached-badges">'
      for (var abp = 0; abp < attached.presets.length; abp++) {
        h += '<span class="pua-assistant-badge" data-badge-type="preset" data-badge-id="' + self._escHtml(attached.presets[abp].id) + '"> ' + self._escHtml(attached.presets[abp].title) + '<span class="badge-remove">\u00D7</span></span>'
      }
      for (var abr = 0; abr < attached.regexes.length; abr++) {
        h += '<span class="pua-assistant-badge" data-badge-type="regex" data-badge-id="' + self._escHtml(attached.regexes[abr].id) + '"> ' + self._escHtml(attached.regexes[abr].name) + '<span class="badge-remove">\u00D7</span></span>'
      }
      h += '</div>'
    }
    h += '</div>'
    h += '<div class="pua-assistant-input-row">'
    h += '<textarea class="pua-assistant-input" id="ast-input" placeholder="\u8F93\u5165\u6D88\u606F..." rows="2"></textarea>'
    h += '<button class="pua-assistant-send" id="ast-send">\u53D1\u9001</button>'
    h += '</div>'
    h += '</div>'

    h += '</div>'

    contentEl.innerHTML = h

    // Scroll to bottom
    var chatEl = contentEl.querySelector('#ast-chat')
    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight

    // Bind API selector
    var apiSelect = contentEl.querySelector('#ast-api-select')
    if (apiSelect) {
      apiSelect.addEventListener('change', function() {
        self._assistantData.apiChoice = this.value
        self._saveAssistantData()
      })
    }

    // Bind prompt button
    var promptBtn = contentEl.querySelector('#ast-prompt-btn')
    if (promptBtn) {
      promptBtn.addEventListener('click', function() {
        self._showPromptModal()
      })
    }

    // Bind clear history
    var clearBtn = contentEl.querySelector('#ast-clear-history')
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        var br = self._getActiveBranch()
        if (br) { br.history = []; br.undoStack = [] }
        self._saveAssistantData()
        self._render()
      })
    }

    // Bind attach preset dropdown (toggle selection)
    var attachPresetBtn = contentEl.querySelector('#ast-attach-preset-btn')
    var attachPresetList = contentEl.querySelector('#ast-attach-preset-list')
    if (attachPresetBtn && attachPresetList) {
      attachPresetBtn.addEventListener('click', function(e) {
        e.stopPropagation()
        attachPresetList.classList.toggle('open')
        var otherList = contentEl.querySelector('#ast-attach-regex-list')
        if (otherList) otherList.classList.remove('open')
      })
      var presetItems = attachPresetList.querySelectorAll('.pua-assistant-attach-item')
      for (var ppi = 0; ppi < presetItems.length; ppi++) {
        (function(item) {
          item.addEventListener('click', function() {
            var id = this.getAttribute('data-id')
            // Toggle selection
            var found = -1
            for (var fi = 0; fi < self._assistantAttached.presets.length; fi++) {
              if (self._assistantAttached.presets[fi].id === id) { found = fi; break }
            }
            if (found >= 0) {
              self._assistantAttached.presets.splice(found, 1)
            } else {
              var preset = null
              for (var fi2 = 0; fi2 < self.presets.length; fi2++) {
                if (self.presets[fi2].id === id) { preset = self.presets[fi2]; break }
              }
              if (preset) self._assistantAttached.presets.push({ id: preset.id, title: preset.title, content: preset.content })
            }
            self._render()
          })
        })(presetItems[ppi])
      }
    }

    // Bind attach regex dropdown (toggle selection)
    var attachRegexBtn = contentEl.querySelector('#ast-attach-regex-btn')
    var attachRegexList = contentEl.querySelector('#ast-attach-regex-list')
    if (attachRegexBtn && attachRegexList) {
      attachRegexBtn.addEventListener('click', function(e) {
        e.stopPropagation()
        attachRegexList.classList.toggle('open')
        var otherList = contentEl.querySelector('#ast-attach-preset-list')
        if (otherList) otherList.classList.remove('open')
      })
      var regexItems = attachRegexList.querySelectorAll('.pua-assistant-attach-item')
      for (var rri = 0; rri < regexItems.length; rri++) {
        (function(item) {
          item.addEventListener('click', function() {
            var id = this.getAttribute('data-id')
            var found = -1
            for (var fi3 = 0; fi3 < self._assistantAttached.regexes.length; fi3++) {
              if (self._assistantAttached.regexes[fi3].id === id) { found = fi3; break }
            }
            if (found >= 0) {
              self._assistantAttached.regexes.splice(found, 1)
            } else {
              var regex = null
              for (var fi4 = 0; fi4 < self.regexes.length; fi4++) {
                if (self.regexes[fi4].id === id) { regex = self.regexes[fi4]; break }
              }
              if (regex) self._assistantAttached.regexes.push({ id: regex.id, name: regex.name, regex: regex.regex, html: regex.html })
            }
            self._render()
          })
        })(regexItems[rri])
      }
    }

    // Bind badge remove buttons
    var badgeRemoveBtns = contentEl.querySelectorAll('.pua-assistant-badge .badge-remove')
    for (var bri = 0; bri < badgeRemoveBtns.length; bri++) {
      (function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation()
          var badge = this.parentElement
          var type = badge.getAttribute('data-badge-type')
          var id = badge.getAttribute('data-badge-id')
          if (type === 'preset') {
            for (var bi = 0; bi < self._assistantAttached.presets.length; bi++) {
              if (self._assistantAttached.presets[bi].id === id) { self._assistantAttached.presets.splice(bi, 1); break }
            }
          } else if (type === 'regex') {
            for (var bi2 = 0; bi2 < self._assistantAttached.regexes.length; bi2++) {
              if (self._assistantAttached.regexes[bi2].id === id) { self._assistantAttached.regexes.splice(bi2, 1); break }
            }
          }
          self._render()
        })
      })(badgeRemoveBtns[bri])
    }

    // Close dropdowns on outside click
    contentEl.addEventListener('click', function(e) {
      if (!e.target.closest || !e.target.closest('.pua-assistant-attach-dropdown')) {
        var pl = contentEl.querySelector('#ast-attach-preset-list')
        var rl = contentEl.querySelector('#ast-attach-regex-list')
        if (pl) pl.classList.remove('open')
        if (rl) rl.classList.remove('open')
      }
    })

    // Bind input expand on focus
    var inputEl = contentEl.querySelector('#ast-input')
    if (inputEl) {
      inputEl.addEventListener('focus', function() {
        this.classList.add('expanded')
      })
      inputEl.addEventListener('blur', function() {
        if (!this.value.trim()) {
          this.classList.remove('expanded')
        }
      })
    }

    // Bind send
    var sendBtn = contentEl.querySelector('#ast-send')
    if (sendBtn && inputEl) {
      sendBtn.addEventListener('click', function() { self._sendAssistantMessage(contentEl) })
      inputEl.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          self._sendAssistantMessage(contentEl)
        }
      })
    }

    // Bind branch selector
    var branchSelect = contentEl.querySelector('#ast-branch-select')
    if (branchSelect) {
      branchSelect.addEventListener('change', function() {
        self._assistantData.activeBranchId = this.value
        self._saveAssistantData()
        self._render()
      })
    }

    // Bind branch add
    var branchAddBtn = contentEl.querySelector('#ast-branch-add')
    if (branchAddBtn) {
      branchAddBtn.addEventListener('click', function() {
        if (self._assistantData.branches.length >= 10) {
          self._toast('\u5BF9\u8BDD\u5206\u652F\u5DF2\u8FBE\u4E0A\u9650(10\u4E2A)\uFF0C\u8BF7\u5BFC\u51FA\u5E76\u5220\u9664\u65E7\u5206\u652F\u540E\u518D\u521B\u5EFA')
          return
        }
        var newId = 'branch_' + Date.now()
        var num = self._assistantData.branches.length + 1
        self._assistantData.branches.push({ id: newId, name: '\u5BF9\u8BDD ' + num, history: [], undoStack: [], createdAt: new Date().toISOString() })
        self._assistantData.activeBranchId = newId
        self._saveAssistantData()
        self._render()
      })
    }

    // Bind branch rename
    var branchRenameBtn = contentEl.querySelector('#ast-branch-rename')
    if (branchRenameBtn) {
      branchRenameBtn.addEventListener('click', function() {
        var br = self._getActiveBranch()
        if (!br) return
        var newName = prompt('\u91CD\u547D\u540D\u5BF9\u8BDD\u5206\u652F', br.name)
        if (newName) {
          br.name = newName
          self._saveAssistantData()
          self._render()
        }
      })
    }

    // Bind branch delete
    var branchDeleteBtn = contentEl.querySelector('#ast-branch-delete')
    if (branchDeleteBtn) {
      branchDeleteBtn.addEventListener('click', function() {
        if (self._assistantData.branches.length <= 1) {
          self._toast('\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u5BF9\u8BDD\u5206\u652F')
          return
        }
        var br = self._getActiveBranch()
        if (!br) return
        if (!confirm('\u786E\u5B9A\u5220\u9664\u5206\u652F\u201C' + br.name + '\u201D\uFF1F')) return
        var newBranches = []
        for (var di = 0; di < self._assistantData.branches.length; di++) {
          if (self._assistantData.branches[di].id !== br.id) newBranches.push(self._assistantData.branches[di])
        }
        self._assistantData.branches = newBranches
        self._assistantData.activeBranchId = newBranches[0].id
        self._saveAssistantData()
        self._render()
      })
    }

    // Bind branch export
    var branchExportBtn = contentEl.querySelector('#ast-branch-export')
    if (branchExportBtn) {
      branchExportBtn.addEventListener('click', function() {
        var br = self._getActiveBranch()
        if (!br) return
        var json = JSON.stringify(br, null, 2)
        self._downloadFile(json, 'pua-assistant-branch-' + br.name + '.json', 'application/json')
        self._toast('\u5DF2\u5BFC\u51FA\u5206\u652F: ' + br.name)
      })
    }

    // Bind branch import
    var branchImportBtn = contentEl.querySelector('#ast-branch-import')
    if (branchImportBtn) {
      branchImportBtn.addEventListener('click', function() {
        if (self._assistantData.branches.length >= 10) {
          self._toast('\u5BF9\u8BDD\u5206\u652F\u5DF2\u8FBE\u4E0A\u9650(10\u4E2A)\uFF0C\u65E0\u6CD5\u5BFC\u5165')
          return
        }
        var fileInput = document.createElement('input')
        fileInput.type = 'file'
        fileInput.accept = '.json'
        fileInput.addEventListener('change', function(e3) {
          var file = e3.target.files[0]
          if (!file) return
          var reader = new FileReader()
          reader.onload = function(ev) {
            try {
              var imported = JSON.parse(ev.target.result)
              if (!imported.history) throw new Error('\u65E0\u6548\u683C\u5F0F')
              imported.id = 'branch_' + Date.now()
              if (!imported.name) imported.name = '\u5BFC\u5165\u7684\u5BF9\u8BDD'
              imported.createdAt = imported.createdAt || new Date().toISOString()
              imported.undoStack = imported.undoStack || []
              self._assistantData.branches.push(imported)
              self._assistantData.activeBranchId = imported.id
              self._saveAssistantData()
              self._render()
              self._toast('\u5DF2\u5BFC\u5165\u5206\u652F: ' + imported.name)
            } catch(err) {
              self._toast('\u5BFC\u5165\u5931\u8D25: ' + (err.message || err))
            }
          }
          reader.readAsText(file)
        })
        fileInput.click()
      })
    }

    // Bind confirm/dismiss buttons on action cards
    var confirmBtns = contentEl.querySelectorAll('.pua-assistant-confirm-btn')
    for (var cfi = 0; cfi < confirmBtns.length; cfi++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          var actionId = this.getAttribute('data-action-id')
          if (actionId) self._confirmAssistantAction(actionId)
        })
      })(confirmBtns[cfi])
    }
    var dismissBtns = contentEl.querySelectorAll('.pua-assistant-dismiss-btn')
    for (var dbi = 0; dbi < dismissBtns.length; dbi++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          var actionId = this.getAttribute('data-action-id')
          if (actionId) self._dismissAssistantAction(actionId)
        })
      })(dismissBtns[dbi])
    }

    // Bind batch operation buttons
    var batchConfirmBtn = contentEl.querySelector('#ast-batch-confirm')
    if (batchConfirmBtn) {
      batchConfirmBtn.addEventListener('click', function() { self._batchConfirmActions() })
    }
    var batchDismissBtn = contentEl.querySelector('#ast-batch-dismiss')
    if (batchDismissBtn) {
      batchDismissBtn.addEventListener('click', function() { self._batchDismissActions() })
    }

    // Bind edit buttons on user messages
    var editBtns = contentEl.querySelectorAll('.pua-assistant-edit-btn')
    for (var ebi = 0; ebi < editBtns.length; ebi++) {
      (function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation()
          var msgId = this.getAttribute('data-edit-msg-id')
          var branch = self._getActiveBranch()
          if (!branch) return
          for (var mi2 = 0; mi2 < branch.history.length; mi2++) {
            if (branch.history[mi2].id === msgId) {
              var input = contentEl.querySelector('#ast-input')
              if (input) {
                input.value = branch.history[mi2].content
                input.classList.add('expanded')
                input.focus()
              }
              branch.history[mi2].dimmed = true
              self._saveAssistantData()
              // Dim the message in DOM
              var msgEl = this.closest('.pua-assistant-msg-user')
              if (msgEl) msgEl.classList.add('pua-msg-dimmed')
              break
            }
          }
        })
      })(editBtns[ebi])
    }

    // Bind code block copy buttons
    var copyBtns = contentEl.querySelectorAll('.pua-code-block-copy')
    for (var cbi = 0; cbi < copyBtns.length; cbi++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          var codeEl = this.closest('.pua-code-block').querySelector('pre')
          if (codeEl) {
            navigator.clipboard.writeText(codeEl.textContent).then(function() {
              self._toast('\u5DF2\u590D\u5236')
            }).catch(function() {})
          }
        })
      })(copyBtns[cbi])
    }

    // Bind code block preview buttons
    var previewBtns = contentEl.querySelectorAll('.pua-code-block-preview')
    for (var pvi = 0; pvi < previewBtns.length; pvi++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          var codeBlock = this.closest('.pua-code-block')
          var codeEl = codeBlock.querySelector('pre')
          var lang = (codeBlock.querySelector('.pua-code-block-lang') || {}).textContent || ''
          if (!codeEl) return
          var existingFrame = codeBlock.querySelector('.pua-preview-frame')
          if (existingFrame) { existingFrame.remove(); return }
          var code = codeEl.textContent
          if (lang.toLowerCase() === 'html' || lang.toLowerCase() === 'css') {
            var iframe = document.createElement('iframe')
            iframe.className = 'pua-preview-frame'
            iframe.style.height = '200px'
            codeBlock.appendChild(iframe)
            var doc = iframe.contentDocument || iframe.contentWindow.document
            doc.open()
            if (lang.toLowerCase() === 'css') {
              doc.write('<html><head><style>' + code + '</style></head><body><div class="preview-test">\u9884\u8BBE\u6D4B\u8BD5\u5185\u5BB9</div></body></html>')
            } else {
              doc.write(code)
            }
            doc.close()
          }
        })
      })(previewBtns[pvi])
    }

    // Bind auto-rendered regex previews (assistant action cards)
    var regexPreviewDivs = contentEl.querySelectorAll('.pua-regex-preview-auto')
    for (var rpbi = 0; rpbi < regexPreviewDivs.length; rpbi++) {
      (function(previewDiv) {
        var regexStr = previewDiv.getAttribute('data-regex') || ''
        var htmlTpl = previewDiv.getAttribute('data-html') || ''
        var outputDiv = previewDiv.querySelector('.pua-regex-preview-output')
        var elemSelectToggle = previewDiv.querySelector('.pua-elem-select-toggle')
        var elemInfoDiv = previewDiv.querySelector('.pua-elem-info')
        var elemSelectActive = false
        var selectedEl = null
        var originalStyles = null

        // Render preview with placeholder content
        function renderPlaceholderPreview() {
          var preview = htmlTpl
          preview = preview.replace(/\$&/g, '<span style="color:#ffa500;font-style:italic">$&amp;</span>')
          preview = preview.replace(/\$0/g, '<span style="color:#ffa500;font-style:italic">$0</span>')
          for (var gi = 1; gi <= 9; gi++) {
            preview = preview.replace(new RegExp('\\$' + gi, 'g'), '<span style="color:#ffa500;font-style:italic">$' + gi + '</span>')
          }
          outputDiv.innerHTML = preview
        }
        renderPlaceholderPreview()

        // Element selection mode
        elemSelectToggle.addEventListener('click', function() {
          elemSelectActive = !elemSelectActive
          if (elemSelectActive) {
            previewDiv.classList.add('pua-elem-select-active')
            this.textContent = '\u53D6\u6D88\u9009\u4E2D'
            this.style.borderColor = '#4a9eff'
            this.style.color = '#4a9eff'
            outputDiv.addEventListener('click', onElemClick)
          } else {
            previewDiv.classList.remove('pua-elem-select-active')
            this.textContent = '\u9009\u4E2D\u5143\u7D20'
            this.style.borderColor = ''
            this.style.color = ''
            outputDiv.removeEventListener('click', onElemClick)
            elemInfoDiv.style.display = 'none'
          }
        })

        function onElemClick(e2) {
          if (!elemSelectActive) return
          e2.stopPropagation()
          e2.preventDefault()
          var el = e2.target
          if (el === outputDiv) return
          selectedEl = el
          var computed = window.getComputedStyle(el)
          // Store original styles for reset
          originalStyles = {
            width: el.style.width, height: el.style.height, fontSize: el.style.fontSize,
            color: el.style.color, backgroundColor: el.style.backgroundColor,
            padding: el.style.padding, margin: el.style.margin, borderRadius: el.style.borderRadius,
            textContent: el.textContent
          }
          // Build property editor
          var editorHtml = '<div class="pua-elem-editor">'
          editorHtml += '<div class="pua-elem-editor-title">\u5143\u7D20\u7F16\u8F91\u5668</div>'
          editorHtml += '<div class="pua-elem-editor-tag">\u6807\u7B7E: &lt;' + el.tagName.toLowerCase() + '&gt;  \u7C7B\u540D: ' + (el.className || '\u65E0') + '</div>'
          editorHtml += '<div class="pua-elem-editor-grid">'
          editorHtml += _propField('\u5BBD\u5EA6', 'width', _pxVal(computed.width), 'px', 0, 500, 1)
          editorHtml += _propField('\u9AD8\u5EA6', 'height', _pxVal(computed.height), 'px', 0, 500, 1)
          editorHtml += _propField('\u5B57\u53F7', 'fontSize', _pxVal(computed.fontSize), 'px', 8, 72, 1)
          editorHtml += _propFieldColor('\u989C\u8272', 'color', computed.color)
          editorHtml += _propFieldColor('\u80CC\u666F', 'backgroundColor', computed.backgroundColor)
          editorHtml += _propField('\u5185\u8FB9\u8DDD', 'padding', _pxVal(computed.padding), 'px', 0, 50, 1)
          editorHtml += _propField('\u5916\u8FB9\u8DDD', 'margin', _pxVal(computed.margin), 'px', 0, 50, 1)
          editorHtml += _propField('\u5706\u89D2', 'borderRadius', _pxVal(computed.borderRadius), 'px', 0, 50, 1)
          editorHtml += '</div>'
          editorHtml += '<div class="pua-elem-editor-row"><label>\u6587\u672C\u5185\u5BB9</label><input class="pua-elem-editor-input" data-prop="textContent" value="' + self._escHtml(el.textContent) + '"></div>'
          editorHtml += '<div class="pua-elem-editor-actions">'
          editorHtml += '<button class="pua-code-block-btn pua-elem-apply-btn">\u5E94\u7528\u4FEE\u6539</button>'
          editorHtml += '<button class="pua-code-block-btn pua-elem-send-btn">\u53D1\u9001\u7ED9\u52A9\u624B</button>'
          editorHtml += '<button class="pua-code-block-btn pua-elem-reset-btn">\u91CD\u7F6E</button>'
          editorHtml += '</div></div>'
          elemInfoDiv.innerHTML = editorHtml
          elemInfoDiv.style.display = 'block'

          // Bind color picker sync + instant preview
          var colorInputs = elemInfoDiv.querySelectorAll('.pua-elem-color-group')
          for (var ci = 0; ci < colorInputs.length; ci++) {
            (function(group) {
              var textIn = group.querySelector('.pua-elem-editor-input')
              var colorIn = group.querySelector('.pua-elem-color-picker')
              if (textIn && colorIn) {
                colorIn.addEventListener('input', function() { textIn.value = this.value; _applyToEl() })
                textIn.addEventListener('input', function() { try { colorIn.value = this.value } catch(e) {}; _applyToEl() })
              }
            })(colorInputs[ci])
          }

          // Bind range slider sync + instant preview
          var rangeInputs = elemInfoDiv.querySelectorAll('.pua-elem-editor-range')
          for (var ri = 0; ri < rangeInputs.length; ri++) {
            (function(range) {
              var prop = range.getAttribute('data-prop')
              var textIn = elemInfoDiv.querySelector('.pua-elem-editor-input[data-prop="' + prop + '"]')
              if (textIn) {
                range.addEventListener('input', function() { textIn.value = this.value; _applyToEl() })
                textIn.addEventListener('input', function() { var v = parseFloat(this.value); if (!isNaN(v)) range.value = v; _applyToEl() })
              }
            })(rangeInputs[ri])
          }

          // Bind textContent input instant preview
          var textContentIn = elemInfoDiv.querySelector('.pua-elem-editor-input[data-prop="textContent"]')
          if (textContentIn) {
            textContentIn.addEventListener('input', function() { _applyToEl() })
          }

          // Instant preview: apply current editor values to the element
          function _applyToEl() {
            if (!selectedEl) return
            var inputs = elemInfoDiv.querySelectorAll('.pua-elem-editor-input')
            for (var ii = 0; ii < inputs.length; ii++) {
              var prop = inputs[ii].getAttribute('data-prop')
              var val = inputs[ii].value
              if (prop === 'textContent') {
                selectedEl.textContent = val
              } else if (val) {
                selectedEl.style[prop] = val
              }
            }
          }

          // Apply button - show toast for assistant page
          var applyBtn = elemInfoDiv.querySelector('.pua-elem-apply-btn')
          if (applyBtn) {
            applyBtn.addEventListener('click', function() {
              if (!selectedEl) return
              // Values are already applied via instant preview
              self._toast('\u4FEE\u6539\u5DF2\u5E94\u7528\u5230\u9884\u89C8')
            })
          }

          // Send to assistant button
          var sendBtn = elemInfoDiv.querySelector('.pua-elem-send-btn')
          if (sendBtn) {
            sendBtn.addEventListener('click', function() {
              var inputs = elemInfoDiv.querySelectorAll('.pua-elem-editor-input')
              var props = {}
              for (var ii = 0; ii < inputs.length; ii++) {
                props[inputs[ii].getAttribute('data-prop')] = inputs[ii].value
              }
              var msgText = '\u8BF7\u4FEE\u6B63\u4EE5\u4E0B\u5143\u7D20\uFF1A\u6807\u7B7E=' + selectedEl.tagName.toLowerCase() + ', \u7C7B\u540D=' + (selectedEl.className || '\u65E0') + ', \u5BBD=' + (props.width || '') + ', \u9AD8=' + (props.height || '') + ', \u5B57\u53F7=' + (props.fontSize || '') + ', \u989C\u8272=' + (props.color || '') + ', \u80CC\u666F=' + (props.backgroundColor || '')
              var input = contentEl.querySelector('#ast-input')
              if (input) input.value = msgText
              self._toast('\u5DF2\u586B\u5165\u8F93\u5165\u6846')
            })
          }

          // Reset button
          var resetBtn = elemInfoDiv.querySelector('.pua-elem-reset-btn')
          if (resetBtn) {
            resetBtn.addEventListener('click', function() {
              if (!selectedEl || !originalStyles) return
              var props = ['width','height','fontSize','color','backgroundColor','padding','margin','borderRadius']
              for (var pi = 0; pi < props.length; pi++) {
                selectedEl.style[props[pi]] = originalStyles[props[pi]] || ''
              }
              if (originalStyles.textContent !== undefined) selectedEl.textContent = originalStyles.textContent
              self._toast('\u5DF2\u91CD\u7F6E')
            })
          }
        }

        function _pxVal(val) {
          if (!val || val === 'auto' || val === 'none') return ''
          var m = val.match(/^([\d.]+)px/)
          return m ? m[1] : val
        }

        function _propField(label, prop, val, unit, min, max, step) {
          var sliderHtml = ''
          if (min !== undefined && max !== undefined) {
            var numVal = parseFloat(val) || 0
            sliderHtml = '<input type="range" class="pua-elem-editor-range" data-prop="' + prop + '" min="' + min + '" max="' + max + '" step="' + (step || 1) + '" value="' + numVal + '">'
          }
          return '<div class="pua-elem-editor-row"><label>' + label + '</label>' + sliderHtml + '<input class="pua-elem-editor-input" data-prop="' + prop + '" value="' + self._escHtml(val) + '"><span class="pua-elem-editor-unit">' + unit + '</span></div>'
        }

        function _propFieldColor(label, prop, val) {
          var hexVal = val
          try {
            var tmp = document.createElement('div'); tmp.style.color = val; document.body.appendChild(tmp)
            hexVal = getComputedStyle(tmp).color; document.body.removeChild(tmp)
          } catch(e) {}
          var colorHex = '#000000'
          var m = hexVal.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
          if (m) {
            colorHex = '#' + ((1 << 24) + (parseInt(m[1]) << 16) + (parseInt(m[2]) << 8) + parseInt(m[3])).toString(16).slice(1)
          }
          return '<div class="pua-elem-editor-row pua-elem-color-group"><label>' + label + '</label><input class="pua-elem-editor-input" data-prop="' + prop + '" value="' + self._escHtml(val) + '"><input type="color" class="pua-elem-color-picker" value="' + colorHex + '"></div>'
        }
      })(regexPreviewDivs[rpbi])
    }
  }

  P._renderAssistantContent = function(msg) {
    var self = this
    var content = msg.content || ''
    var actions = msg.actions || []

    // Remove action tags from display content
    var displayContent = content
    displayContent = displayContent.replace(/\u3010ADD_PRESET\u3011[\s\S]*?\u3010\/ADD_PRESET\u3011/g, '')
    displayContent = displayContent.replace(/\u3010ADD_REGEX\u3011[\s\S]*?\u3010\/ADD_REGEX\u3011/g, '')
    displayContent = displayContent.replace(/\u3010EDIT_PRESET\u3011[\s\S]*?\u3010\/EDIT_PRESET\u3011/g, '')
    displayContent = displayContent.replace(/\u3010EDIT_REGEX\u3011[\s\S]*?\u3010\/EDIT_REGEX\u3011/g, '')
    displayContent = displayContent.trim()

    // Render markdown-like content
    var h = '<div>' + self._renderMarkdown(displayContent) + '</div>'

    // Render action cards
    var pendingCount = 0
    for (var ai2 = 0; ai2 < actions.length; ai2++) {
      if (actions[ai2].status === 'pending') pendingCount++
    }
    for (var ai = 0; ai < actions.length; ai++) {
      var action = actions[ai]
      var actionStatus = action.status || 'confirmed'
      var label = ''
      var confirmLabel = ''
      if (action.type === 'addPreset') { label = ' \u6DFB\u52A0\u9884\u8BBE: ' + self._escHtml(action.data.title || ''); confirmLabel = ' \u6DFB\u52A0' }
      else if (action.type === 'addRegex') { label = ' \u6DFB\u52A0\u6B63\u5219: ' + self._escHtml(action.data.name || ''); confirmLabel = ' \u6DFB\u52A0' }
      else if (action.type === 'editPreset') { label = ' \u4FEE\u6539\u9884\u8BBE: ' + self._escHtml(action.data.title || ''); confirmLabel = ' \u5E94\u7528' }
      else if (action.type === 'editRegex') { label = ' \u4FEE\u6539\u6B63\u5219: ' + self._escHtml(action.data.name || ''); confirmLabel = ' \u5E94\u7528' }

      h += '<div class="pua-assistant-action-card' + (actionStatus === 'ignored' ? ' pua-action-ignored' : '') + (actionStatus === 'confirmed' ? ' pua-action-confirmed' : '') + '" data-action-card-id="' + self._escHtml(action.id) + '">'
      h += '<span class="pua-assistant-action-label">' + label + '</span>'

      // Show before/after diff for edit actions
      if (action.type === 'editPreset' && action.before && action.pending) {
        h += '<div class="pua-action-diff">'
        h += '<div class="pua-diff-before"><b>\u4FEE\u6539\u524D:</b><pre>' + self._escHtml((action.before.title || '') + '\n' + (action.before.content || '').substring(0, 200) + (action.before.content && action.before.content.length > 200 ? '...' : '')) + '</pre></div>'
        h += '<div class="pua-diff-after"><b>\u2192 \u4FEE\u6539\u540E:</b><pre>' + self._escHtml((action.pending.title || '') + '\n' + (action.pending.content || '').substring(0, 200) + (action.pending.content && action.pending.content.length > 200 ? '...' : '')) + '</pre></div>'
        h += '</div>'
      }
      if (action.type === 'editRegex' && action.before && action.pending) {
        h += '<div class="pua-action-diff">'
        h += '<div class="pua-diff-before"><b>\u4FEE\u6539\u524D:</b> name=' + self._escHtml(action.before.name || '') + ' type=' + self._escHtml(action.before.type || '') + ' regex=' + self._escHtml((action.before.regex || '').substring(0, 100)) + '</div>'
        h += '<div class="pua-diff-after"><b>\u2192 \u4FEE\u6539\u540E:</b> name=' + self._escHtml(action.pending.name || '') + ' type=' + self._escHtml(action.pending.type || action.data.type || '') + ' regex=' + self._escHtml((action.pending.regex || action.data.regex || '').substring(0, 100)) + (action.pending.html ? ' html=' + self._escHtml(action.pending.html.substring(0, 80)) : '') + '</div>'
        h += '</div>'
      }

      // Add regex preview for addRegex and editRegex actions
      if ((action.type === 'addRegex' || action.type === 'editRegex') && action.data.regex && action.data.html) {
        h += '<div class="pua-regex-preview pua-regex-preview-auto" data-regex="' + self._escHtml(action.data.regex) + '" data-html="' + self._escHtml(action.data.html) + '">'
        h += '<div class="pua-regex-preview-output"></div>'
        h += '<div style="display:flex;gap:4px;margin-top:4px"><button class="pua-code-block-btn pua-elem-select-toggle"> \u9009\u4E2D\u5143\u7D20</button></div>'
        h += '<div class="pua-elem-info" style="display:none"></div>'
        h += '</div>'
      }
      // Show new content preview for addPreset
      if (action.type === 'addPreset' && action.pending) {
        h += '<div class="pua-action-preview"><b>\u5185\u5BB9\u9884\u89C8:</b><pre>' + self._escHtml((action.pending.content || '').substring(0, 300)) + (action.pending.content && action.pending.content.length > 300 ? '...' : '') + '</pre></div>'
      }
      if (actionStatus === 'pending') {
        h += '<div class="pua-action-btns">'
        h += '<button class="pua-assistant-confirm-btn" data-action-id="' + self._escHtml(action.id) + '">' + confirmLabel + '</button>'
        h += '<button class="pua-assistant-dismiss-btn" data-action-id="' + self._escHtml(action.id) + '">\u274C \u5FFD\u7565</button>'
        h += '</div>'
      } else if (actionStatus === 'confirmed') {
        h += '<span class="pua-action-status"> \u5DF2\u4FDD\u5B58</span>'
      } else if (actionStatus === 'ignored') {
        h += '<span class="pua-action-status">\u274C \u5DF2\u5FFD\u7565</span>'
      }
      h += '</div>'
    }

    // Batch operation bar when there are multiple pending actions
    if (pendingCount > 1) {
      h += '<div class="pua-batch-actions-bar">'
      h += '<span class="pua-batch-info">\u5171 ' + pendingCount + ' \u4E2A\u5F85\u5904\u7406\u64CD\u4F5C</span>'
      h += '<button class="pua-btn pua-btn-sm pua-btn-gold" id="ast-batch-confirm"> \u5168\u90E8\u4FDD\u5B58</button>'
      h += '<button class="pua-btn pua-btn-sm" id="ast-batch-dismiss">\u274C \u5168\u90E8\u5FFD\u7565</button>'
      h += '</div>'
    }

    return h
  }

  P._renderMarkdown = function(text) {
    if (!text) return ''
    var self = this
    var result = ''
    var i = 0
    var len = text.length

    while (i < len) {
      // Code blocks: ```lang\ncode\n```
      var codeBlockStart = text.indexOf('```', i)
      if (codeBlockStart === i) {
        var afterLang = text.indexOf('\n', codeBlockStart + 3)
        if (afterLang === -1) { result += self._escHtml(text.substring(i)); break }
        var lang = text.substring(codeBlockStart + 3, afterLang).trim()
        var codeBlockEnd = text.indexOf('```', afterLang + 1)
        if (codeBlockEnd === -1) { result += self._escHtml(text.substring(i)); break }
        var code = text.substring(afterLang + 1, codeBlockEnd)
        var isPreviewable = lang.toLowerCase() === 'html' || lang.toLowerCase() === 'css'
        result += '<div class="pua-code-block">'
        result += '<div class="pua-code-block-header">'
        result += '<span class="pua-code-block-lang">' + self._escHtml(lang || 'code') + '</span>'
        result += '<div class="pua-code-block-actions">'
        result += '<button class="pua-code-block-btn pua-code-block-copy">\u590D\u5236</button>'
        if (isPreviewable) {
          result += '<button class="pua-code-block-btn pua-code-block-preview">\u9884\u89C8</button>'
        }
        result += '</div></div>'
        result += '<pre>' + self._escHtml(code) + '</pre>'
        result += '</div>'
        i = codeBlockEnd + 3
        continue
      }

      // If there's a code block later, process text before it
      if (codeBlockStart > i) {
        result += self._renderInlineMarkdown(text.substring(i, codeBlockStart))
        i = codeBlockStart
        continue
      }

      // No more code blocks, render rest as inline
      result += self._renderInlineMarkdown(text.substring(i))
      break
    }

    return result
  }

  P._renderInlineMarkdown = function(text) {
    if (!text) return ''
    var self = this
    var result = ''
    var i = 0
    var len = text.length

    while (i < len) {
      // Inline code: `code`
      if (text.charAt(i) === '`') {
        var endTick = text.indexOf('`', i + 1)
        if (endTick !== -1) {
          result += '<span class="pua-inline-code">' + self._escHtml(text.substring(i + 1, endTick)) + '</span>'
          i = endTick + 1
          continue
        }
      }

      // Bold: **text**
      if (text.charAt(i) === '*' && i + 1 < len && text.charAt(i + 1) === '*') {
        var endBold = text.indexOf('**', i + 2)
        if (endBold !== -1) {
          result += '<span class="pua-bold-text">' + self._escHtml(text.substring(i + 2, endBold)) + '</span>'
          i = endBold + 2
          continue
        }
      }

      // Newline to <br>
      if (text.charAt(i) === '\n') {
        result += '<br>'
        i++
        continue
      }

      // Regular character - escape HTML
      result += self._escHtml(text.charAt(i))
      i++
    }

    return result
  }

  P._sendAssistantMessage = function(contentEl) {
    var self = this
    if (this._assistantSending) return

    var input = contentEl.querySelector('#ast-input')
    if (!input) return
    var text = input.value.trim()
    if (!text) return

    if (!this._assistantData) {
      var bid = 'branch_' + Date.now()
      this._assistantData = { apiChoice: 'sub', branches: [{ id: bid, name: '\u5BF9\u8BDD 1', history: [], undoStack: [], createdAt: new Date().toISOString() }], activeBranchId: bid, systemPrompt: '', promptPresets: [] }
    }
    var branch = this._getActiveBranch()
    if (!branch) return

    // Build full content with attached items
    var attached = this._assistantAttached || { presets: [], regexes: [] }
    var fullContent = text
    var hasAttached = attached.presets.length > 0 || attached.regexes.length > 0
    if (hasAttached) {
      if (attached.presets.length > 0) {
        fullContent += '\n\n---\u9644\u52A0\u7684\u9884\u8BBE\u6761\u76EE---'
        for (var ap = 0; ap < attached.presets.length; ap++) {
          fullContent += '\n[' + attached.presets[ap].title + ']\n' + (attached.presets[ap].content || '')
        }
      }
      if (attached.regexes.length > 0) {
        fullContent += '\n\n---\u9644\u52A0\u7684\u6B63\u5219\u89C4\u5219---'
        for (var ar = 0; ar < attached.regexes.length; ar++) {
          fullContent += '\n[' + attached.regexes[ar].name + ']\nregex: ' + (attached.regexes[ar].regex || '') + '\nhtml: ' + (attached.regexes[ar].html || '')
        }
      }
    }

    // Snapshot attached items for this message
    var attachedSnapshot = { presets: attached.presets.map(function(p) { return { id: p.id, title: p.title } }), regexes: attached.regexes.map(function(r) { return { id: r.id, name: r.name } }) }

    // Add user message immediately
    var userMsg = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
      attached: attachedSnapshot,
      actions: [],
      timestamp: new Date().toISOString()
    }
    branch.history.push(userMsg)
    input.value = ''
    input.classList.remove('expanded')

    // Clear attached items after sending
    this._assistantAttached = { presets: [], regexes: [] }
    this._saveAssistantData()

    // Immediately render to show user message
    this._renderAssistantImmediate(contentEl, userMsg)

    // Get API config
    var preset = this._getActivePreset()
    if (!preset) { this._toast('请先配置 API'); return }

    var useRocheAi = (this._assistantData.apiChoice === 'main') && this.roche && this.roche.ai && this.roche.ai.chat
    var endpoint, apiKey, model
    if (this._assistantData.apiChoice === 'main') {
      endpoint = preset.mainEndpoint
      apiKey = preset.mainApiKey
      model = preset.mainModel
    } else if (this._assistantData.apiChoice === 'vec') {
      endpoint = preset.vecEndpoint
      apiKey = preset.vecApiKey
      model = preset.vecModel
    } else {
      endpoint = preset.subEndpoint
      apiKey = preset.subApiKey
      model = preset.subModel
    }

    if (!useRocheAi && (!endpoint || !apiKey || !model)) {
      var apiLabel = this._assistantData.apiChoice === 'main' ? '主' : (this._assistantData.apiChoice === 'vec' ? '向量' : '副')
      this._toast('请先配置' + apiLabel + ' API')
      return
    }

    // Show typing indicator
    this._assistantSending = true
    var chatEl = contentEl.querySelector('#ast-chat')
    if (chatEl) {
      var typingEl = document.createElement('div')
      typingEl.className = 'pua-assistant-typing'
      typingEl.id = 'ast-typing'
      typingEl.textContent = '\u52A9\u624B\u6B63\u5728\u601D\u8003...'
      chatEl.appendChild(typingEl)
      chatEl.scrollTop = chatEl.scrollHeight
    }

    // Build messages array
    var messages = [{ role: 'system', content: this._getAssistantSystemPrompt() }]
    var history = branch.history
    var startIdx = Math.max(0, history.length - 20) // Last 20 messages
    for (var hi = startIdx; hi < history.length; hi++) {
      // Use full content (with attached items) for the most recent user message
      if (hi === history.length - 1 && hasAttached) {
        messages.push({ role: history[hi].role, content: fullContent })
      } else {
        messages.push({ role: history[hi].role, content: history[hi].content })
      }
    }

    var url = useRocheAi ? '' : (endpoint.replace(/\/+$/, '') + '/chat/completions')
    var apiPromise
    if (useRocheAi) {
      apiPromise = self.roche.ai.chat({
        messages: messages,
        temperature: 0.7
      }).then(function(result) {
        return { choices: [{ message: { content: (result && result.text) || '' } }] }
      })
    } else {
      apiPromise = fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      }).then(function(r) { return r.json() })
    }

    apiPromise.then(function(data) {
      // Remove typing indicator
      var typingEl2 = contentEl.querySelector('#ast-typing')
      if (typingEl2) typingEl2.remove()

      if (!data.choices || !data.choices[0]) {
        self._assistantSending = false
        self._toast('API \u8FD4\u56DE\u5F02\u5E38')
        return
      }

      var content = (data.choices[0].message || {}).content || ''

      // Parse action tags - support multiple actions of each type (batch operations)
      var actions = []
      var actionCounter = 0
      function nextActionId() { return 'action_' + Date.now() + '_' + (actionCounter++) }

      // Helper: find all matches for a tag pattern
      function findAllTags(tagOpen, tagClose) {
        var results = []
        var re = new RegExp(tagOpen + '([\\s\\S]*?)' + tagClose, 'g')
        var m
        while ((m = re.exec(content)) !== null) {
          results.push(m[1])
        }
        return results
      }

      // Parse all ADD_PRESET tags
      var addPresetMatches = findAllTags('\\u3010ADD_PRESET\\u3011', '\\u3010/ADD_PRESET\\u3011')
      for (var apmi = 0; apmi < addPresetMatches.length; apmi++) {
        try {
          var pd = JSON.parse(addPresetMatches[apmi].trim())
          var pendingPreset = {
            id: 'p' + Date.now() + '_' + apmi,
            title: pd.title || '\u672A\u547D\u540D',
            role: pd.role || 'system',
            on: true,
            content: pd.content || '',
            outRegex: pd.outRegex || '',
            outRegexOn: pd.outRegexOn || false,
            inRegex: pd.inRegex || '',
            inRegexOn: pd.inRegexOn || false,
            dMin: 0,
            dMax: Infinity
          }
          actions.push({ type: 'addPreset', data: { id: pendingPreset.id, title: pendingPreset.title }, id: nextActionId(), pending: pendingPreset, status: 'pending' })
        } catch(e) {}
      }

      // Parse all ADD_REGEX tags
      var addRegexMatches = findAllTags('\\u3010ADD_REGEX\\u3011', '\\u3010/ADD_REGEX\\u3011')
      for (var armi = 0; armi < addRegexMatches.length; armi++) {
        try {
          var rd = JSON.parse(addRegexMatches[armi].trim())
          var pendingRegex = {
            id: 'r' + Date.now() + '_' + armi,
            name: rd.name || '\u672A\u547D\u540D',
            regex: rd.regex || '',
            html: rd.html || '',
            type: rd.type || 'render',
            on: true,
            dMin: 0,
            dMax: Infinity
          }
          actions.push({ type: 'addRegex', data: { id: pendingRegex.id, name: pendingRegex.name, regex: pendingRegex.regex, html: pendingRegex.html }, id: nextActionId(), pending: pendingRegex, status: 'pending' })
        } catch(e2) {}
      }

      // Parse all EDIT_PRESET tags
      var editPresetMatches = findAllTags('\\u3010EDIT_PRESET\\u3011', '\\u3010/EDIT_PRESET\\u3011')
      for (var epmi = 0; epmi < editPresetMatches.length; epmi++) {
        try {
          var epd = JSON.parse(editPresetMatches[epmi].trim())
          var beforeEdit = null
          for (var epi = 0; epi < self.presets.length; epi++) {
            if (self.presets[epi].id === epd.id) {
              beforeEdit = { title: self.presets[epi].title, content: self.presets[epi].content }
              break
            }
          }
          actions.push({ type: 'editPreset', data: { id: epd.id, title: epd.title || '' }, id: nextActionId(), pending: epd, before: beforeEdit, status: 'pending' })
        } catch(e3) {}
      }

      // Parse all EDIT_REGEX tags
      var editRegexMatches = findAllTags('\\u3010EDIT_REGEX\\u3011', '\\u3010/EDIT_REGEX\\u3011')
      for (var ermi = 0; ermi < editRegexMatches.length; ermi++) {
        try {
          var erd = JSON.parse(editRegexMatches[ermi].trim())
          var beforeEdit2 = null
          for (var eri = 0; eri < self.regexes.length; eri++) {
            if (self.regexes[eri].id === erd.id) {
              beforeEdit2 = { name: self.regexes[eri].name, regex: self.regexes[eri].regex, html: self.regexes[eri].html, type: self.regexes[eri].type, on: self.regexes[eri].on }
              break
            }
          }
          actions.push({ type: 'editRegex', data: { id: erd.id, name: erd.name || '', regex: erd.regex || '', html: erd.html || '' }, id: nextActionId(), pending: erd, before: beforeEdit2, status: 'pending' })
        } catch(e4) {}
      }

      // Add assistant message
      var assistantMsg = {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: content,
        actions: actions,
        timestamp: new Date().toISOString()
      }
      var activeBranch = self._getActiveBranch()
      if (activeBranch) activeBranch.history.push(assistantMsg)
      self._saveAssistantData()

      self._assistantSending = false
      self._render()
    }).catch(function(err) {
      var typingEl3 = contentEl.querySelector('#ast-typing')
      if (typingEl3) typingEl3.remove()
      self._assistantSending = false
      self._toast('API \u8C03\u7528\u5931\u8D25: ' + (err.message || err))
    })
  }

  // Immediately render user message without full re-render
  P._renderAssistantImmediate = function(contentEl, userMsg) {
    var self = this
    var chatEl = contentEl.querySelector('#ast-chat')
    if (!chatEl) return

    // Remove empty state if present
    var emptyEl = chatEl.querySelector('.pua-assistant-empty')
    if (emptyEl) emptyEl.remove()

    var msgDiv = document.createElement('div')
    msgDiv.className = 'pua-assistant-msg pua-assistant-msg-user'
    var h = '<div class="pua-assistant-msg-role"> \u4F60</div>'
    h += '<div class="pua-assistant-msg-content">' + self._escHtml(userMsg.content) + '</div>'
    h += '<button class="pua-assistant-edit-btn" data-edit-msg-id="' + self._escHtml(userMsg.id) + '"></button>'
    if (userMsg.attached && (userMsg.attached.presets.length > 0 || userMsg.attached.regexes.length > 0)) {
      h += '<div class="pua-assistant-attached-badges">'
      for (var api = 0; api < userMsg.attached.presets.length; api++) {
        h += '<span class="pua-assistant-badge"> ' + self._escHtml(userMsg.attached.presets[api].title) + '</span>'
      }
      for (var ari = 0; ari < userMsg.attached.regexes.length; ari++) {
        h += '<span class="pua-assistant-badge"> ' + self._escHtml(userMsg.attached.regexes[ari].name) + '</span>'
      }
      h += '</div>'
    }
    msgDiv.innerHTML = h
    chatEl.appendChild(msgDiv)
    chatEl.scrollTop = chatEl.scrollHeight
  }

  P._confirmAssistantAction = function(actionId) {
    var branch = this._getActiveBranch()
    if (!branch) return
    // Find the action in history
    for (var hi = 0; hi < branch.history.length; hi++) {
      var msg = branch.history[hi]
      if (msg.actions) {
        for (var ai = 0; ai < msg.actions.length; ai++) {
          var action = msg.actions[ai]
          if (action.id === actionId && action.status === 'pending') {
            if (action.type === 'addPreset' && action.pending) {
              this.presets.push(action.pending)
              this._savePresets()
            } else if (action.type === 'addRegex' && action.pending) {
              this.regexes.push(action.pending)
              this._saveRegexes()
            } else if (action.type === 'editPreset' && action.pending) {
              for (var epi = 0; epi < this.presets.length; epi++) {
                if (this.presets[epi].id === action.pending.id) {
                  if (action.pending.title) this.presets[epi].title = action.pending.title
                  if (action.pending.content) this.presets[epi].content = action.pending.content
                  this._savePresets()
                  break
                }
              }
            } else if (action.type === 'editRegex' && action.pending) {
              for (var eri = 0; eri < this.regexes.length; eri++) {
                if (this.regexes[eri].id === action.pending.id) {
                  if (action.pending.name) this.regexes[eri].name = action.pending.name
                  if (action.pending.regex) this.regexes[eri].regex = action.pending.regex
                  if (action.pending.html) this.regexes[eri].html = action.pending.html
                  this._saveRegexes()
                  break
                }
              }
            }
            action.status = 'confirmed'
            this._saveAssistantData()
            this._toast('\u5DF2\u6DFB\u52A0')
            this._render()
            return
          }
        }
      }
    }
  }

  P._dismissAssistantAction = function(actionId) {
    var branch = this._getActiveBranch()
    if (!branch) return
    for (var hi = 0; hi < branch.history.length; hi++) {
      var msg = branch.history[hi]
      if (msg.actions) {
        for (var ai = 0; ai < msg.actions.length; ai++) {
          var action = msg.actions[ai]
          if (action.id === actionId && action.status === 'pending') {
            action.status = 'ignored'
            this._saveAssistantData()
            this._toast('\u5DF2\u5FFD\u7565')
            this._render()
            return
          }
        }
      }
    }
  }

  P._batchConfirmActions = function() {
    var branch = this._getActiveBranch()
    if (!branch) return
    var count = 0
    for (var hi = 0; hi < branch.history.length; hi++) {
      var msg = branch.history[hi]
      if (!msg.actions) continue
      for (var ai = 0; ai < msg.actions.length; ai++) {
        var action = msg.actions[ai]
        if (action.status !== 'pending') continue
        if (action.type === 'addPreset' && action.pending) {
          this.presets.push(action.pending)
          this._savePresets()
        } else if (action.type === 'addRegex' && action.pending) {
          this.regexes.push(action.pending)
          this._saveRegexes()
        } else if (action.type === 'editPreset' && action.pending) {
          for (var epi = 0; epi < this.presets.length; epi++) {
            if (this.presets[epi].id === action.pending.id) {
              if (action.pending.title !== undefined) this.presets[epi].title = action.pending.title
              if (action.pending.content !== undefined) this.presets[epi].content = action.pending.content
              if (action.pending.outRegex !== undefined) this.presets[epi].outRegex = action.pending.outRegex
              if (action.pending.outRegexOn !== undefined) this.presets[epi].outRegexOn = action.pending.outRegexOn
              if (action.pending.inRegex !== undefined) this.presets[epi].inRegex = action.pending.inRegex
              if (action.pending.inRegexOn !== undefined) this.presets[epi].inRegexOn = action.pending.inRegexOn
              if (action.pending.role !== undefined) this.presets[epi].role = action.pending.role
              this._savePresets()
              break
            }
          }
        } else if (action.type === 'editRegex' && action.pending) {
          for (var eri = 0; eri < this.regexes.length; eri++) {
            if (this.regexes[eri].id === action.pending.id) {
              if (action.pending.name !== undefined) this.regexes[eri].name = action.pending.name
              if (action.pending.regex !== undefined) this.regexes[eri].regex = action.pending.regex
              if (action.pending.html !== undefined) this.regexes[eri].html = action.pending.html
              if (action.pending.type !== undefined) this.regexes[eri].type = action.pending.type
              if (action.pending.on !== undefined) this.regexes[eri].on = action.pending.on
              this._saveRegexes()
              break
            }
          }
        }
        action.status = 'confirmed'
        count++
      }
    }
    this._saveAssistantData()
    this._toast('\u5DF2\u4FDD\u5B58 ' + count + ' \u4E2A\u64CD\u4F5C')
    this._render()
  }

  P._batchDismissActions = function() {
    var branch = this._getActiveBranch()
    if (!branch) return
    var count = 0
    for (var hi = 0; hi < branch.history.length; hi++) {
      var msg = branch.history[hi]
      if (!msg.actions) continue
      for (var ai = 0; ai < msg.actions.length; ai++) {
        if (msg.actions[ai].status === 'pending') {
          msg.actions[ai].status = 'ignored'
          count++
        }
      }
    }
    this._saveAssistantData()
    this._toast('\u5DF2\u5FFD\u7565 ' + count + ' \u4E2A\u64CD\u4F5C')
    this._render()
  }

  P._showPromptModal = function() {
    var self = this
    if (!this._assistantData) {
      var bid = 'branch_' + Date.now()
      this._assistantData = { apiChoice: 'sub', branches: [{ id: bid, name: '\u5BF9\u8BDD 1', history: [], undoStack: [], createdAt: new Date().toISOString() }], activeBranchId: bid, systemPrompt: '', promptPresets: [] }
    }
    if (!this._assistantData.promptPresets) this._assistantData.promptPresets = []

    // Ensure default preset exists
    var defaultPresetIdx = -1
    for (var dpi = 0; dpi < this._assistantData.promptPresets.length; dpi++) {
      if (this._assistantData.promptPresets[dpi].name === '\u9ED8\u8BA4\u52A9\u624B') { defaultPresetIdx = dpi; break }
    }
    if (defaultPresetIdx < 0) {
      this._assistantData.promptPresets.unshift({ name: '\u9ED8\u8BA4\u52A9\u624B', content: this._getDefaultSystemPrompt() })
      defaultPresetIdx = 0
    }

    var currentPrompt = this._assistantData.systemPrompt || this._getDefaultSystemPrompt()

    // Determine active preset index
    var activePresetIdx = 0
    if (this._assistantData.systemPrompt) {
      for (var api = 0; api < this._assistantData.promptPresets.length; api++) {
        if (this._assistantData.promptPresets[api].content === this._assistantData.systemPrompt) { activePresetIdx = api; break }
      }
    }

    // Remove existing modal if any
    var existingOverlay = document.querySelector('.pua-prompt-modal-overlay')
    if (existingOverlay) existingOverlay.remove()

    var overlay = document.createElement('div')
    overlay.className = 'pua-prompt-modal-overlay'

    var h = '<div class="pua-prompt-modal">'
    h += '<div class="pua-prompt-modal-header">'
    h += '<span class="pua-prompt-modal-title"> \u7CFB\u7EDF\u63D0\u793A\u8BCD</span>'
    h += '<button class="pua-prompt-modal-close">\u00D7</button>'
    h += '</div>'
    h += '<div class="pua-prompt-modal-body">'
    // Preset selector row
    h += '<div class="pua-prompt-modal-presets" style="margin-bottom:10px">'
    h += '<select class="pua-prompt-modal-preset-select" id="ast-preset-select">'
    for (var pi = 0; pi < this._assistantData.promptPresets.length; pi++) {
      h += '<option value="' + pi + '"' + (pi === activePresetIdx ? ' selected' : '') + '>' + this._escHtml(this._assistantData.promptPresets[pi].name) + '</option>'
    }
    h += '</select>'
    h += '<button class="pua-prompt-modal-preset-btn pua-prompt-modal-save-btn" id="ast-preset-add" title="\u4FDD\u5B58\u4E3A\u65B0\u9884\u8BBE">\u2795</button>'
    h += '<button class="pua-prompt-modal-preset-btn pua-prompt-modal-del-btn" id="ast-preset-del" title="\u5220\u9664\u5F53\u524D\u9884\u8BBE"></button>'
    h += '<input class="pua-prompt-modal-name-input" id="ast-preset-name-input" placeholder="\u9884\u8BBE\u540D\u79F0">'
    h += '</div>'
    h += '<textarea class="pua-prompt-modal-textarea" id="ast-prompt-textarea">' + this._escHtml(currentPrompt) + '</textarea>'
    h += '</div>'
    h += '<div class="pua-prompt-modal-footer">'
    h += '<button class="pua-btn pua-btn-sm" id="ast-prompt-reset">\u91CD\u7F6E\u9ED8\u8BA4</button>'
    h += '<button class="pua-btn pua-btn-sm" id="ast-preset-save-as">\u4FDD\u5B58\u4E3A\u9884\u8BBE</button>'
    h += '<button class="pua-btn pua-btn-sm pua-btn-gold" id="ast-prompt-save">\u4FDD\u5B58</button>'
    h += '</div>'
    h += '</div>'

    overlay.innerHTML = h
    document.body.appendChild(overlay)

    var textarea = overlay.querySelector('#ast-prompt-textarea')
    var closeBtn = overlay.querySelector('.pua-prompt-modal-close')
    var saveBtn = overlay.querySelector('#ast-prompt-save')
    var resetBtn = overlay.querySelector('#ast-prompt-reset')
    var saveAsBtn = overlay.querySelector('#ast-preset-save-as')
    var presetSelect = overlay.querySelector('#ast-preset-select')
    var addBtn = overlay.querySelector('#ast-preset-add')
    var delBtn = overlay.querySelector('#ast-preset-del')
    var nameInput = overlay.querySelector('#ast-preset-name-input')

    // Close
    closeBtn.addEventListener('click', function() { overlay.remove() })
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove() })

    // Preset select - load preset content into textarea
    presetSelect.addEventListener('change', function() {
      var idx = parseInt(this.value)
      if (self._assistantData.promptPresets[idx]) {
        textarea.value = self._assistantData.promptPresets[idx].content
      }
    })

    // Add new preset (inline name input)
    addBtn.addEventListener('click', function() {
      if (!nameInput.classList.contains('visible')) {
        nameInput.classList.add('visible')
        nameInput.focus()
        return
      }
      var name = nameInput.value.trim()
      if (!name) { nameInput.focus(); return }
      self._assistantData.promptPresets.push({ name: name, content: textarea.value })
      self._saveAssistantData()
      nameInput.classList.remove('visible')
      nameInput.value = ''
      self._toast('\u5DF2\u4FDD\u5B58\u9884\u8BBE: ' + name)
      overlay.remove()
      self._showPromptModal()
    })

    nameInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { addBtn.click() }
      if (e.key === 'Escape') { nameInput.classList.remove('visible'); nameInput.value = '' }
    })

    // Delete selected preset
    delBtn.addEventListener('click', function() {
      var idx = parseInt(presetSelect.value)
      if (self._assistantData.promptPresets.length <= 1) {
        self._toast('\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u9884\u8BBE')
        return
      }
      var removedName = self._assistantData.promptPresets[idx].name
      self._assistantData.promptPresets.splice(idx, 1)
      self._saveAssistantData()
      self._toast('\u5DF2\u5220\u9664\u9884\u8BBE: ' + removedName)
      overlay.remove()
      self._showPromptModal()
    })

    // Save - save current textarea content as the active preset
    saveBtn.addEventListener('click', function() {
      var idx = parseInt(presetSelect.value)
      self._assistantData.systemPrompt = textarea.value
      if (self._assistantData.promptPresets[idx]) {
        self._assistantData.promptPresets[idx].content = textarea.value
      }
      self._saveAssistantData()
      self._toast('\u63D0\u793A\u8BCD\u5DF2\u4FDD\u5B58')
      overlay.remove()
    })

    // Reset to default
    resetBtn.addEventListener('click', function() {
      textarea.value = self._getDefaultSystemPrompt()
      self._assistantData.systemPrompt = ''
      // Update default preset content
      if (self._assistantData.promptPresets[0] && self._assistantData.promptPresets[0].name === '\u9ED8\u8BA4\u52A9\u624B') {
        self._assistantData.promptPresets[0].content = self._getDefaultSystemPrompt()
      }
      self._saveAssistantData()
      self._toast('\u5DF2\u91CD\u7F6E\u4E3A\u9ED8\u8BA4\u63D0\u793A\u8BCD')
    })

    // Save as preset (inline name input)
    saveAsBtn.addEventListener('click', function() {
      if (!nameInput.classList.contains('visible')) {
        nameInput.classList.add('visible')
        nameInput.focus()
        return
      }
      var name = nameInput.value.trim()
      if (!name) { nameInput.focus(); return }
      self._assistantData.promptPresets.push({ name: name, content: textarea.value })
      self._saveAssistantData()
      nameInput.classList.remove('visible')
      nameInput.value = ''
      self._toast('\u5DF2\u4FDD\u5B58\u4E3A\u9884\u8BBE: ' + name)
      overlay.remove()
      self._showPromptModal()
    })
  }

  /* ════════════════════════════════════════════════════════════
     日志面板方法
     ════════════════════════════════════════════════════════════ */

  P._toggleLogPanel = function() {
    if (!this._logPanel) return
    var isOpen = this._logPanel.classList.contains('open')
    if (isOpen) {
      this._logPanel.classList.remove('open')
    } else {
      this._logPanel.classList.add('open')
      this._refreshLogList()
    }
  }

  P._refreshLogList = function() {
    if (!this._logList) return
    this._logList.innerHTML = ''
    for (var i = 0; i < this._logBuffer.length; i++) {
      this._appendLogEntry(this._logBuffer[i])
    }
    this._logList.scrollTop = this._logList.scrollHeight
  }

  P._appendLogEntry = function(entry) {
    if (!this._logList) return
    var div = document.createElement('div')
    div.className = 'pua-log-entry ' + entry.level
    div.textContent = '[' + entry.time + '] ' + entry.text
    this._logList.appendChild(div)
    this._logList.scrollTop = this._logList.scrollHeight
  }

  P._copyLogs = function() {
    var text = ''
    for (var i = 0; i < this._logBuffer.length; i++) {
      var e = this._logBuffer[i]
      text += '[' + e.time + '] [' + e.level + '] ' + e.text + '\n'
    }
    var self = this
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        self._toast('\u65E5\u5FD7\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F')
      }).catch(function() {
        self._fallbackCopyLogs(text)
      })
    } else {
      self._fallbackCopyLogs(text)
    }
  }

  P._fallbackCopyLogs = function(text) {
    try {
      var ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;left:-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      this._toast('\u65E5\u5FD7\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F')
    } catch(e) {
      this._toast('\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u4F7F\u7528\u5BFC\u51FA\u6309\u94AE')
    }
  }

  P._exportLogs = function() {
    var text = ''
    for (var i = 0; i < this._logBuffer.length; i++) {
      var e = this._logBuffer[i]
      text += '[' + e.time + '] [' + e.level + '] ' + e.text + '\n'
    }
    this._downloadFile(text, 'pua-logs-' + Date.now() + '.txt', 'text/plain')
    this._toast('\u65E5\u5FD7\u5DF2\u5BFC\u51FA')
  }

  P._clearLogs = function() {
    this._logBuffer = []
    if (this._logList) this._logList.innerHTML = ''
    if (this._logCount) this._logCount.style.display = 'none'
    this._toast('\u65E5\u5FD7\u5DF2\u6E05\u9664')
  }

  /* ════════════════════════════════════════════════════════════
     对话页面 — 完整聊天系统
     ════════════════════════════════════════════════════════════ */

  P._renderChat = function(titleEl, actionsEl, contentEl) {
    // Redirect to the new conversation renderer
    this._renderConversation(titleEl, actionsEl, contentEl)
  }

  P._renderConversation = function(titleEl, actionsEl, contentEl) {
    var self = this

    // Save scroll position from existing chat element before rebuild
    var oldChatEl = contentEl.querySelector('#conv-chat')
    var savedScrollTop = oldChatEl ? oldChatEl.scrollTop : 0
    var savedScrollHeight = oldChatEl ? oldChatEl.scrollHeight : 0
    var savedClientHeight = oldChatEl ? oldChatEl.clientHeight : 0
    var wasAtBottom = oldChatEl ? (savedScrollTop + savedClientHeight >= savedScrollHeight - 50) : true

    // Reduce padding for conversation page to maximize message width
    contentEl.style.padding = '0'
    titleEl.textContent = '\u5BF9\u8BDD'
    actionsEl.innerHTML = ''

    var settings = this._loadSettings()
    this._convRenderLimit = settings.renderLimit || 10
    this._convContextDepth = settings.contextDepth || 30
    this._convAutoScroll = settings.autoScroll || false

    // Find current branch
    var branch = null
    var branchName = ''
    if (this._convBranchId) {
      for (var bi = 0; bi < this.branches.length; bi++) {
        if (this.branches[bi].id === this._convBranchId) { branch = this.branches[bi]; break }
      }
    }
    if (!branch && this.branches.length > 0) {
      branch = this.branches[0]
      this._convBranchId = branch.id
    }
    if (branch) branchName = branch.name || ''

    // Sync asmBranchId and load asmData silently for context viewing
    if (branch && (!this.asmData.branch || this.asmData.branch.id !== branch.id)) {
      this.asmBranchId = branch.id
      this._fetchAsmData(true) // silent mode - no re-render
    }

    // Load messages from storage
    this._loadConvMessages(branch)

    var h = '<div class="pua-conv-layout" style="position:relative">'

    // Top bar
    h += '<div class="pua-conv-topbar">'
    h += '<select class="pua-branch-select" id="conv-branch-select" style="max-width:140px">'
    for (var bsi = 0; bsi < this.branches.length; bsi++) {
      h += '<option value="' + this._escHtml(this.branches[bsi].id) + '"' + (this.branches[bsi].id === this._convBranchId ? ' selected' : '') + '>' + this._escHtml(this.branches[bsi].name) + '</option>'
    }
    h += '</select>'
    h += '<span class="pua-conv-msg-count" id="conv-msg-count">' + this._convMessages.length + ' \u6761</span>'
    h += '<button class="pua-conv-topbar-btn" id="conv-settings-btn" title="\u8BBE\u7F6E">\u2699</button>'
    h += '<button class="pua-conv-topbar-btn" id="conv-context-btn" title="\u67E5\u770B\u4E0A\u4E0B\u6587"></button>'
    h += '<button class="pua-conv-topbar-btn" id="conv-fork-btn" title="\u4ECE\u5F53\u524D\u8FDB\u5EA6\u65B0\u5EFA\u5206\u652F">\u2997</button>'
    h += '</div>'

    // Settings panel (hidden)
    h += '<div class="pua-conv-settings-panel' + (this._convShowSettings ? ' show' : '') + '" id="conv-settings-panel">'
    h += '<div class="pua-conv-settings-title">\u5BF9\u8BDD\u8BBE\u7F6E</div>'
    h += '<div class="pua-conv-settings-row"><span class="pua-conv-settings-label">\u6E32\u67D3\u9650\u5236</span><input class="pua-conv-settings-input" id="conv-set-renderlimit" type="number" value="' + this._convRenderLimit + '" min="1" max="100"></div>'
    h += '<div class="pua-conv-settings-row"><span class="pua-conv-settings-label">\u4E0A\u4E0B\u6587\u6DF1\u5EA6</span><input class="pua-conv-settings-input" id="conv-set-contextdepth" type="number" value="' + this._convContextDepth + '" min="1" max="200"></div>'
    h += '<div class="pua-conv-settings-row"><span class="pua-conv-settings-label">\u81EA\u52A8\u6EDA\u52A8</span><button class="pua-toggle-item' + (this._convAutoScroll ? ' on' : '') + '" id="conv-set-autoscroll"></button></div>'
    h += '<div class="pua-conv-settings-row" style="flex-direction:column;align-items:stretch"><span class="pua-conv-settings-label" style="margin-bottom:4px">\u6700\u65B0\u8F93\u5165\u63D0\u793A\u8BCD <span style="font-size:9px;opacity:0.6">({content}=\u7528\u6237\u8F93\u5165)</span></span><textarea class="pua-conv-settings-textarea" id="conv-set-latestprompt" style="width:100%;min-height:60px;font-size:11px;resize:vertical;background:var(--pua-bg-input);color:var(--pua-text);border:1px solid var(--pua-border);border-radius:4px;padding:6px">' + this._escHtml(settings.latestUserPrompt || '') + '</textarea></div>'
    h += '<div style="margin-top:8px;display:flex;gap:6px"><button class="pua-btn pua-btn-sm pua-btn-gold" id="conv-set-save">\u4FDD\u5B58</button></div>'
    h += '</div>'

    // Chat area
    h += '<div class="pua-conv-chat" id="conv-chat">'

    // Render messages
    var msgs = this._convMessages
    var renderLimit = this._convRenderLimit
    var collapsedCount = 0
    var startIdx = 0
    if (msgs.length > renderLimit) {
      collapsedCount = msgs.length - renderLimit
      startIdx = collapsedCount
    }

    if (msgs.length === 0) {
      h += '<div class="pua-empty"><div class="pua-empty-icon"></div><div class="pua-empty-text">\u9009\u62E9\u5206\u652F\u5F00\u59CB\u5BF9\u8BDD</div></div>'
    } else {
      if (collapsedCount > 0) {
        h += '<div class="pua-conv-collapsed" id="conv-load-more">\u66F4\u65E9\u7684\u6D88\u606F (' + collapsedCount + '\u6761) \u2014 \u52A0\u8F7D\u66F4\u591A</div>'
      }
      for (var mi = startIdx; mi < msgs.length; mi++) {
        h += this._renderConvMessage(msgs[mi])
      }
    }

    h += '</div>'

    // Input area
    h += '<div class="pua-conv-input-area">'
    h += '<div class="pua-conv-input-row">'
    h += '<button class="pua-conv-regen-btn" id="conv-regen" title="\u91CD\u65B0\u751F\u6210\u6700\u540E\u4E00\u6761\u56DE\u590D">\u21BB</button>'
    h += '<textarea class="pua-conv-input" id="conv-input" placeholder="\u8F93\u5165\u6D88\u606F..." rows="2"></textarea>'
    h += '<button class="pua-conv-send" id="conv-send">\u27A4</button>'
    h += '</div>'
    h += '<div class="pua-conv-input-btns">'
    h += '<button class="pua-conv-input-btn" id="conv-jump-btn"> \u8DF3\u8F6C\u697C\u5C42</button>'
    h += '<button class="pua-conv-input-btn" id="conv-export-btn"> \u5BFC\u51FA</button>'
    h += '<button class="pua-conv-input-btn" id="conv-import-btn"> \u5BFC\u5165</button>'
    h += '</div>'
    h += '<div class="pua-conv-jump-row' + (this._convShowJump ? ' show' : '') + '" id="conv-jump-row">'
    h += '<span style="font-size:10px;color:var(--pua-text-sub)">\u697C\u5C42\u53F7:</span>'
    h += '<input class="pua-conv-jump-input" id="conv-jump-input" type="number" min="1">'
    h += '<button class="pua-btn pua-btn-sm" id="conv-jump-go">\u8DF3\u8F6C</button>'
    h += '</div>'
    h += '</div>'

    // Jump to bottom button
    h += '<button class="pua-conv-bottom-btn" id="conv-bottom-btn" style="display:none">\u2B07</button>'

    h += '</div>'

    contentEl.innerHTML = h

    // Apply saved font size to conversation messages
    var settings = this._loadSettings()
    var savedFontSize = settings.convFontSize || 0
    if (savedFontSize > 0) {
      var msgContents = contentEl.querySelectorAll('.pua-conv-msg-content')
      for (var fi = 0; fi < msgContents.length; fi++) {
        msgContents[fi].style.fontSize = savedFontSize + 'px'
      }
    }

    // If streaming is in progress, restore the streaming message display
    if (this._convSending && this._convStreamingMsg) {
      // Update rendered content from memory (may have changed while on another page)
      if (this._convStreamingMsg.content && !this._convStreamingMsg.rendered) {
        this._convStreamingMsg.rendered = this._applyConvRegexRender(this._convStreamingMsg.content)
      }
      var streamHtml = this._convStreamingMsg.rendered || this._escHtml(this._convStreamingMsg.content || '')
      this._updateStreamingMessage(contentEl, streamHtml, true)
      // Remove the extra typing indicator since streaming message already shows content
      var typingEl = contentEl.querySelector('#conv-chat .pua-conv-typing')
      if (typingEl && this._convStreamingMsg.content) typingEl.remove()
    }

    // Bind events
    var chatEl = contentEl.querySelector('#conv-chat')
    var inputEl = contentEl.querySelector('#conv-input')
    var sendBtn = contentEl.querySelector('#conv-send')
    var bottomBtn = contentEl.querySelector('#conv-bottom-btn')

    // Branch selector
    var branchSelect = contentEl.querySelector('#conv-branch-select')
    if (branchSelect) {
      branchSelect.addEventListener('change', function() {
        self._convBranchId = this.value
        self._convMessages = []
        self._lastAsmContext = '' // Clear cached context when switching branch
        var selBranch = null
        for (var sbi = 0; sbi < self.branches.length; sbi++) {
          if (self.branches[sbi].id === self._convBranchId) { selBranch = self.branches[sbi]; break }
        }
        self._loadConvMessages(selBranch)
        self._renderPage()
      })
    }

    // Input expand on focus
    if (inputEl) {
      inputEl.addEventListener('focus', function() { this.classList.add('expanded') })
      inputEl.addEventListener('blur', function() { if (!this.value) this.classList.remove('expanded') })
      inputEl.addEventListener('keydown', function(e) {
        // Enter just adds newline, Shift+Enter also adds newline
        // Only the send button sends the message
      })
    }

    // Send button: if input has text, send new message; if empty and last msg is user, regenerate
    if (sendBtn) {
      sendBtn.addEventListener('click', function() {
        if (inputEl && inputEl.value.trim()) {
          self._sendMessage(contentEl)
        } else {
          // No text in input: if last message is user (no assistant reply), regenerate
          var msgs = self._convMessages
          if (msgs.length > 0) {
            var lastMsg = msgs[msgs.length - 1]
            if (lastMsg.role === 'user' && !self._convSending) {
              self._regenerateFromLastUser(contentEl)
            }
          }
        }
      })
    }

    // Regenerate button: always regenerate from last user message
    var regenBtn = contentEl.querySelector('#conv-regen')
    if (regenBtn) {
      regenBtn.addEventListener('click', function() {
        if (self._convSending) return
        self._regenerateFromLastUser(contentEl)
      })
    }

    // Settings panel toggle
    var settingsBtn = contentEl.querySelector('#conv-settings-btn')
    var settingsPanel = contentEl.querySelector('#conv-settings-panel')
    if (settingsBtn && settingsPanel) {
      settingsBtn.addEventListener('click', function(e) {
        e.stopPropagation()
        self._convShowSettings = !self._convShowSettings
        settingsPanel.classList.toggle('show', self._convShowSettings)
      })
    }

    // Save settings
    var saveSettingsBtn = contentEl.querySelector('#conv-set-save')
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', function() {
        var rl = parseInt(contentEl.querySelector('#conv-set-renderlimit').value) || 10
        var cd = parseInt(contentEl.querySelector('#conv-set-contextdepth').value) || 30
        var as = contentEl.querySelector('#conv-set-autoscroll').classList.contains('on')
        var lp = (contentEl.querySelector('#conv-set-latestprompt') || {}).value || ''
        self._convRenderLimit = rl
        self._convContextDepth = cd
        self._convAutoScroll = as
        // Sync depth to asmConfig so context preview uses the same value
        self.asmConfig.contextDepth = cd
        self._saveAsmConfig()
        var s = self._loadSettings()
        s.renderLimit = rl
        s.contextDepth = cd
        s.autoScroll = as
        s.latestUserPrompt = lp
        self._saveSettings(s)
        self._convShowSettings = false
        self._toast('\u8BBE\u7F6E\u5DF2\u4FDD\u5B58')
        self._renderPage()
      })
    }

    // Auto scroll toggle
    var autoScrollToggle = contentEl.querySelector('#conv-set-autoscroll')
    if (autoScrollToggle) {
      autoScrollToggle.addEventListener('click', function() { this.classList.toggle('on') })
    }

    // Context viewer
    var contextBtn = contentEl.querySelector('#conv-context-btn')
    if (contextBtn) {
      contextBtn.addEventListener('click', function() { self._viewContext() })
    }

    // Fork branch
    var forkBtn = contentEl.querySelector('#conv-fork-btn')
    if (forkBtn) {
      forkBtn.addEventListener('click', function() { self._showForkBranchModal() })
    }

    // Load more
    var loadMoreBtn = contentEl.querySelector('#conv-load-more')
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function() {
        var increment = 20
        var newLimit = self._convRenderLimit + increment
        if (newLimit > self._convMessages.length) newLimit = self._convMessages.length
        self._convRenderLimit = newLimit
        self._renderConvMessages(contentEl, true)
        var chatEl = contentEl.querySelector('#conv-chat')
        var newLoadMoreBtn = chatEl ? chatEl.querySelector('#conv-load-more') : null
        if (newLoadMoreBtn && chatEl) {
          chatEl.scrollTop = newLoadMoreBtn.offsetTop - chatEl.offsetTop
        }
      })
    }

    // Jump to floor
    var jumpBtn = contentEl.querySelector('#conv-jump-btn')
    var jumpRow = contentEl.querySelector('#conv-jump-row')
    if (jumpBtn && jumpRow) {
      jumpBtn.addEventListener('click', function() {
        self._convShowJump = !self._convShowJump
        jumpRow.classList.toggle('show', self._convShowJump)
      })
    }
    var jumpGo = contentEl.querySelector('#conv-jump-go')
    if (jumpGo) {
      jumpGo.addEventListener('click', function() {
        var floor = parseInt(contentEl.querySelector('#conv-jump-input').value) || 0
        if (floor > 0) self._scrollToFloor(contentEl, floor)
      })
    }

    // Scroll detection for bottom button
    if (chatEl && bottomBtn) {
      chatEl.addEventListener('scroll', function() {
        var atBottom = chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight < 50
        bottomBtn.style.display = atBottom ? 'none' : 'flex'
      })
      bottomBtn.addEventListener('click', function() {
        chatEl.scrollTop = chatEl.scrollHeight
      })
    }

    // Export
    var exportBtn = contentEl.querySelector('#conv-export-btn')
    if (exportBtn) {
      exportBtn.addEventListener('click', function() { self._exportChat() })
    }

    // Import
    var importBtn = contentEl.querySelector('#conv-import-btn')
    if (importBtn) {
      importBtn.addEventListener('click', function() { self._importChat() })
    }

    // Bind message action buttons
    this._bindConvMessageActions(contentEl)

    // Restore scroll position: if was at bottom or autoScroll, scroll to bottom; otherwise keep position
    if (chatEl) {
      if (wasAtBottom || this._convAutoScroll) {
        chatEl.scrollTop = chatEl.scrollHeight
      } else {
        // Adjust for height changes to maintain visual position
        var newScrollHeight = chatEl.scrollHeight
        chatEl.scrollTop = savedScrollTop + (newScrollHeight - savedScrollHeight)
      }
    }

    // Close settings panel on outside click
    if (settingsPanel) {
      setTimeout(function() {
        contentEl.addEventListener('click', function(e) {
          if (self._convShowSettings && !settingsPanel.contains(e.target) && e.target.id !== 'conv-settings-btn') {
            self._convShowSettings = false
            settingsPanel.classList.remove('show')
          }
        })
      }, 100)
    }
  }

  P._renderConvMessage = function(msg) {
    var h = ''
    var cls = 'pua-conv-msg pua-conv-msg-' + msg.role
    if (msg.dimmed) cls += ' pua-conv-msg-dimmed'
    h += '<div class="' + cls + '" data-msg-id="' + this._escHtml(msg.id) + '" data-floor="' + (msg.floorNumber || 0) + '">'

    // Header
    h += '<div class="pua-conv-msg-header">'
    h += '<span class="pua-conv-msg-floor" data-copy-floor="#' + (msg.floorNumber || 0) + '">#' + (msg.floorNumber || 0) + '</span>'
    if (msg.timestamp) {
      var d = new Date(msg.timestamp)
      h += '<span class="pua-conv-msg-time">' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) + '</span>'
    }
    if (msg.source) {
      h += '<span class="pua-tag" style="font-size:8px">' + (msg.source === 'online' ? '\u7EBF\u4E0A' : msg.source === 'offline' ? '\u7EBF\u4E0B' : '\u5B9E\u65F6') + '</span>'
    }
    h += '</div>'

    // Content
    var content = msg.content || ''
    var isEditing = this._editingMsgId === msg.id
    // Get active version for both user and assistant messages
    var altIdx = msg.activeAltIndex || 0
    if (msg.alternatives && msg.alternatives.length > 0 && altIdx > 0 && msg.alternatives[altIdx - 1]) {
      content = msg.alternatives[altIdx - 1]
    }
    if (msg.role === 'assistant') {
      if (isEditing) {
        // Edit mode: editable textarea with action buttons
        h += '<div class="pua-conv-msg-content pua-conv-edit-mode">'
        h += '<textarea class="pua-conv-edit-textarea" id="edit-ta-' + this._escHtml(msg.id) + '">' + this._escHtml(content) + '</textarea>'
        h += '<div style="display:flex;gap:6px;margin-top:6px">'
        h += '<button class="pua-btn pua-btn-sm pua-btn-gold" data-action="saveEdit" data-msg-id="' + this._escHtml(msg.id) + '">保存</button>'
        h += '<button class="pua-btn pua-btn-sm" data-action="cancelEdit" data-msg-id="' + this._escHtml(msg.id) + '">取消</button>'
        h += '<button class="pua-btn pua-btn-sm" data-action="copyEdit" data-msg-id="' + this._escHtml(msg.id) + '">复制</button>'
        h += '</div></div>'
      } else if (msg.rendered) {
        h += '<div class="pua-conv-msg-content">' + msg.rendered + '</div>'
      } else {
        h += '<div class="pua-conv-msg-content">' + this._escHtml(content) + '</div>'
      }
    } else {
      if (isEditing) {
        h += '<div class="pua-conv-msg-content pua-conv-edit-mode">'
        h += '<textarea class="pua-conv-edit-textarea" id="edit-ta-' + this._escHtml(msg.id) + '">' + this._escHtml(content) + '</textarea>'
        h += '<div style="display:flex;gap:6px;margin-top:6px">'
        h += '<button class="pua-btn pua-btn-sm pua-btn-gold" data-action="saveEdit" data-msg-id="' + this._escHtml(msg.id) + '">保存</button>'
        h += '<button class="pua-btn pua-btn-sm" data-action="cancelEdit" data-msg-id="' + this._escHtml(msg.id) + '">取消</button>'
        h += '<button class="pua-btn pua-btn-sm" data-action="copyEdit" data-msg-id="' + this._escHtml(msg.id) + '">复制</button>'
        h += '</div></div>'
      } else {
        h += '<div class="pua-conv-msg-content">' + this._escHtml(content) + '</div>'
      }
    }

    // Status indicator for assistant messages
    if (msg.role === 'assistant') {
      if (this._convSending && this._convStreamingMsg && this._convStreamingMsg.id === msg.id) {
        h += '<div class="pua-conv-status pua-conv-status-streaming"><span class="pua-conv-status-dot"></span>生成中...</div>'
      } else if (msg.content && msg.content.indexOf('[错误]') === 0) {
        h += '<div class="pua-conv-status pua-conv-status-error">生成失败</div>'
      } else if (msg.content && msg.content.indexOf('[中断]') === 0) {
        h += '<div class="pua-conv-status pua-conv-status-interrupted">已中断</div>'
      }
    }

    // Alternative version tabs (for both assistant and user messages)
    if (msg.alternatives && msg.alternatives.length > 0) {
      h += '<div class="pua-conv-alt-tabs">'
      h += '<span class="pua-conv-alt-tab' + ((msg.activeAltIndex || 0) === 0 ? ' active' : '') + '" data-alt-idx="0" data-msg-id="' + this._escHtml(msg.id) + '">v1</span>'
      for (var ai = 0; ai < msg.alternatives.length; ai++) {
        h += '<span class="pua-conv-alt-tab' + ((msg.activeAltIndex || 0) === (ai + 1) ? ' active' : '') + '" data-alt-idx="' + (ai + 1) + '" data-msg-id="' + this._escHtml(msg.id) + '">v' + (ai + 2) + '</span>'
      }
      h += '</div>'
    }

    // Actions
    h += '<div class="pua-conv-msg-actions">'
    if (msg.role === 'assistant') {
      h += '<button class="pua-conv-msg-action" data-action="regenerate" data-msg-id="' + this._escHtml(msg.id) + '" title="重新生成">重新生成</button>'
    }
    if (msg.role === 'user') {
      h += '<button class="pua-conv-msg-action" data-action="edit" data-msg-id="' + this._escHtml(msg.id) + '" title="编辑">编辑</button>'
    }
    h += '<button class="pua-conv-msg-action' + (msg.favorited ? ' active' : '') + '" data-action="favorite" data-msg-id="' + this._escHtml(msg.id) + '" title="收藏">' + (msg.favorited ? '已收藏' : '收藏') + '</button>'
    h += '<button class="pua-conv-msg-action" data-action="viewctx" data-msg-id="' + this._escHtml(msg.id) + '" title="查看上下文">上下文</button>'
    h += '<button class="pua-conv-msg-action' + (isEditing ? ' active' : '') + '" data-action="toggleEdit" data-msg-id="' + this._escHtml(msg.id) + '" title="编辑模式">' + (isEditing ? '预览' : '源码') + '</button>'
    h += '<button class="pua-conv-msg-action" data-action="delete" data-msg-id="' + this._escHtml(msg.id) + '" title="删除">删除</button>'
    h += '</div>'

    h += '</div>'
    return h
  }

  P._bindConvMessageActions = function(contentEl) {
    var self = this

    // Floor number click to copy
    var floorEls = contentEl.querySelectorAll('.pua-conv-msg-floor')
    for (var fi = 0; fi < floorEls.length; fi++) {
      (function(el) {
        el.addEventListener('click', function() {
          var text = el.getAttribute('data-copy-floor') || ''
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function() { self._toast('\u5DF2\u590D\u5236 ' + text) })
          }
        })
      })(floorEls[fi])
    }

    // Action buttons
    var actionBtns = contentEl.querySelectorAll('.pua-conv-msg-action')
    for (var ai = 0; ai < actionBtns.length; ai++) {
      (function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation()
          var action = btn.getAttribute('data-action')
          var msgId = btn.getAttribute('data-msg-id')
          if (action === 'regenerate') self._regenerateMessage(msgId)
          else if (action === 'edit') self._editMessage(msgId)
          else if (action === 'favorite') self._toggleFavorite(msgId)
          else if (action === 'viewctx') self._viewContext(msgId)
          else if (action === 'delete') self._deleteMessage(msgId)
          else if (action === 'toggleEdit') self._toggleEditMode(msgId)
          else if (action === 'saveEdit' || action === 'cancelEdit' || action === 'copyEdit') self._handleEditAction(action, msgId)
        })
      })(actionBtns[ai])
    }

    // Alt version tabs
    var altTabs = contentEl.querySelectorAll('.pua-conv-alt-tab')
    for (var ti = 0; ti < altTabs.length; ti++) {
      (function(tab) {
        tab.addEventListener('click', function(e) {
          e.stopPropagation()
          var altIdx = parseInt(tab.getAttribute('data-alt-idx')) || 0
          var msgId = tab.getAttribute('data-msg-id')
          self._switchAltVersion(msgId, altIdx)
        })
      })(altTabs[ti])
    }

    // Edit mode action buttons (save/cancel/copy) - use data-action attribute
    var editBtns = contentEl.querySelectorAll('[data-action="saveEdit"], [data-action="cancelEdit"], [data-action="copyEdit"]')
    for (var ei = 0; ei < editBtns.length; ei++) {
      (function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation()
          var action = btn.getAttribute('data-action')
          var msgId = btn.getAttribute('data-msg-id')
          self._handleEditAction(action, msgId)
        })
      })(editBtns[ei])
    }

    // Long press to toggle edit mode
    var msgEls = contentEl.querySelectorAll('.pua-conv-msg')
    for (var mi = 0; mi < msgEls.length; mi++) {
      (function(msgEl) {
        var longPressTimer = null
        var editTriggered = false
        var touchStartX = 0
        var touchStartY = 0
        msgEl.addEventListener('touchstart', function(e) {
          editTriggered = false
          if (e.touches.length > 0) {
            touchStartX = e.touches[0].clientX
            touchStartY = e.touches[0].clientY
          }
          longPressTimer = setTimeout(function() {
            if (editTriggered) return // Already triggered by contextmenu
            // Check if msgEl is still in the DOM (not replaced by re-render)
            if (!msgEl.parentNode) return
            editTriggered = true
            var msgId = msgEl.getAttribute('data-msg-id')
            console.log('[PUA] longpress fired for msgId=' + msgId)
            if (msgId) self._toggleEditMode(msgId)
          }, 600)
        }, { passive: true })
        msgEl.addEventListener('touchend', function(e) {
          clearTimeout(longPressTimer)
          if (editTriggered) e.preventDefault()
        })
        msgEl.addEventListener('touchmove', function(e) {
          // Only clear timer if finger moved significantly (prevents accidental cancel on micro-movements)
          if (e.touches.length > 0) {
            var dx = Math.abs(e.touches[0].clientX - touchStartX)
            var dy = Math.abs(e.touches[0].clientY - touchStartY)
            if (dx > 10 || dy > 10) {
              clearTimeout(longPressTimer)
            }
          } else {
            clearTimeout(longPressTimer)
          }
        })
        msgEl.addEventListener('contextmenu', function(e) {
          e.preventDefault()
          if (editTriggered) return // Already triggered by longpress
          // Check if msgEl is still in the DOM
          if (!msgEl.parentNode) return
          editTriggered = true
          clearTimeout(longPressTimer)
          var msgId = msgEl.getAttribute('data-msg-id')
          console.log('[PUA] contextmenu fired for msgId=' + msgId)
          if (msgId) self._toggleEditMode(msgId)
        })
      })(msgEls[mi])
    }
  }

  /* ── Message data management ── */

  P._createMessage = function(role, content, source) {
    return {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      role: role,
      content: content,
      timestamp: new Date().toISOString(),
      source: source || 'live',
      rendered: null,
      alternatives: [],
      activeAltIndex: 0,
      favorited: false,
      floorNumber: 0,
      dimmed: false
    }
  }

  P._loadConvMessages = function(branch) {
    console.log('[PUA] _loadConvMessages called, branch=' + (branch ? branch.id : 'null'))
    if (!this._convBranchId) { this._convMessages = []; return }
    var key = 'pua_conv_' + this._convBranchId
    try {
      var raw = localStorage.getItem(key)
      if (raw) {
        this._convMessages = JSON.parse(raw)
        // Re-assign floor numbers and re-render assistant messages
        for (var i = 0; i < this._convMessages.length; i++) {
          this._convMessages[i].floorNumber = i + 1
          if (this._convMessages[i].role === 'assistant') {
            this._convMessages[i].rendered = this._applyConvRegexRender(this._convMessages[i].content)
          }
        }
        return
      }
    } catch(e) {}

    // Fallback: load from branch.messages (offline imports / online conversations)
    if (branch && branch.messages && branch.messages.length > 0) {
      var msgs = []
      for (var mi = 0; mi < branch.messages.length; mi++) {
        var m = branch.messages[mi]
        var role = 'user'
        if (m.type === 'assistant' || m.type === 'model') role = 'assistant'
        else if (m.type === 'system') role = 'system'
        var msg = this._createMessage(role, m.text || m.content || '', branch.source === 'offline' ? 'offline' : 'online')
        msg.floorNumber = mi + 1
        if (m.timestamp) msg.timestamp = m.timestamp
        // Apply render regex for assistant messages
        if (role === 'assistant') {
          msg.rendered = this._applyConvRegexRender(msg.content)
        }
        msgs.push(msg)
      }
      this._convMessages = msgs
      this._saveConvMessages()
      return
    }

    this._convMessages = []
  }

  P._saveConvMessages = function() {
    console.log('[PUA] _saveConvMessages called, branchId=' + this._convBranchId)
    if (!this._convBranchId) return
    var key = 'pua_conv_' + this._convBranchId
    try {
      localStorage.setItem(key, JSON.stringify(this._convMessages))
    } catch(e) {}
  }

  P._loadOnlineMessages = function(convId) {
    var self = this
    if (!this.roche || !this.roche.conversation || !this.roche.conversation.get) {
      this._toast('\u65E0\u6CD5\u8BBF\u95EE\u4F1A\u8BDD\u63A5\u53E3')
      return
    }
    this.roche.conversation.get(convId).then(function(conv) {
      if (!conv || !conv.messages) { self._toast('\u65E0\u6D88\u606F'); return }
      var msgs = []
      for (var i = 0; i < conv.messages.length; i++) {
        var m = conv.messages[i]
        var role = m.type === 'assistant' || m.type === 'model' ? 'assistant' : (m.type === 'system' ? 'system' : 'user')
        var msg = self._createMessage(role, m.text || m.content || '', 'online')
        msg.floorNumber = i + 1
        if (m.timestamp) msg.timestamp = m.timestamp
        msgs.push(msg)
      }
      self._convMessages = msgs
      self._saveConvMessages()
      self._renderPage()
      self._toast('\u5DF2\u52A0\u8F7D ' + msgs.length + ' \u6761\u5728\u7EBF\u6D88\u606F')
    }).catch(function(e) {
      self._toast('\u52A0\u8F7D\u5931\u8D25: ' + (e.message || e))
    })
  }

  P._parseOfflineMessages = function(text) {
    var lines = text.split('\n')
    var msgs = []
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim()
      if (!line) continue
      var match = line.match(/^(.+?)[:\uff1a]\s*(.+)$/)
      if (match) {
        var name = match[1].trim()
        var content = match[2].trim()
        var role = (name.toLowerCase() === 'user' || name === '\u7528\u6237' || name === '\u4F60') ? 'user' : 'assistant'
        var msg = this._createMessage(role, content, 'offline')
        msg.floorNumber = msgs.length + 1
        msgs.push(msg)
      }
    }
    return msgs
  }

  /* ── Send message flow ── */

  P._sendMessage = function(contentEl) {
    var self = this
    console.log('[PUA] _sendMessage called, sending=' + this._convSending)
    if (this._convSending) return

    var inputEl = contentEl.querySelector('#conv-input')
    if (!inputEl) return
    var text = inputEl.value.trim()
    if (!text) return

    // Create user message
    var userMsg = this._createMessage('user', text, 'live')
    userMsg.floorNumber = this._convMessages.length + 1
    this._convMessages.push(userMsg)
    inputEl.value = ''
    inputEl.classList.remove('expanded')
    this._saveConvMessages()

    // Create placeholder assistant message (but don't add to _convMessages yet,
    // so _buildConvContext won't include the empty assistant message)
    var astMsg = this._createMessage('assistant', '', 'live')
    this._convSending = true
    this._convStreamingMsg = astMsg

    // Async: recall memories first, then build context
    var recallQuery = text.substring(0, 200)
    var memData = this._convBranchId ? this._loadMemData(this._convBranchId) : null
    var recallPromise = Promise.resolve(null)

    if (memData && memData.facts && memData.facts.length > 0) {
      var settings = this._loadSettings()
      var recallMax = settings.recallMaxCount || 8
      var factSendLimit = settings.factSendCount || 10
      // 只有当事实记忆总数超过 factSendCount 时才需要召回
      if (memData.facts.length > factSendLimit) {
        recallPromise = this._recallMemoriesAsync(recallQuery, memData.facts, recallMax).then(function(results) {
          console.log('[PUA] _sendMessage: async recall returned ' + results.length + ' results')
          return results
        }).catch(function(e) {
          console.log('[PUA] _sendMessage: async recall failed, err=' + (e.message || e))
          return null
        })
      }
    }

    recallPromise.then(function(recalledFacts) {
      // Store recalled facts for _buildMessages to use
      self._pendingRecalledFacts = recalledFacts

      // Build context (only includes messages up to the user message we just added)
      var messages = self._buildConvContext(userMsg.id)
      console.log('[PUA] _sendMessage: final messages count=' + messages.length)
      for (var di = 0; di < messages.length; di++) {
        console.log('[PUA] _sendMessage msg[' + di + '] role=' + messages[di].role + ' content=' + (messages[di].content||'').substring(0, 80))
      }

      // Clear pending recalled facts
      self._pendingRecalledFacts = null

      // Now add the assistant message to _convMessages BEFORE rendering,
      // so it renders below the user message in correct order
      astMsg.floorNumber = self._convMessages.length + 1
      self._convMessages.push(astMsg)

      // Re-render to show user message + assistant placeholder
      self._renderConvMessages(contentEl, true)

      // Scroll to the user message position so user can see their message and the reply below
      var chatEl = contentEl.querySelector('#conv-chat')
      if (chatEl) {
        var userMsgEl = chatEl.querySelector('[data-msg-id="' + userMsg.id + '"]')
        if (userMsgEl) {
          // Use setTimeout to ensure DOM is fully rendered before scrolling
          var targetScrollTop = userMsgEl.offsetTop - chatEl.offsetTop - 10
          if (targetScrollTop < 0) targetScrollTop = 0
          chatEl.scrollTop = targetScrollTop
        }
      }

      // Stream chat
      self._streamChat(messages).then(function(fullContent) {
        console.log('[PUA] _sendMessage: streamChat resolved, contentLen=' + (fullContent || '').length)
        if (!fullContent) {
          console.error('[PUA] _sendMessage: empty content returned!')
        }
        astMsg.content = fullContent
        // Apply render regexes
        astMsg.rendered = self._applyConvRegexRender(fullContent)
        self._convSending = false
        self._convStreamingMsg = null
        self._saveConvMessages()

      // Re-render conversation messages, preserving scroll position using message anchor
      var contentEl = self._contentEl
      if (contentEl) {
        var chatEl = contentEl.querySelector('#conv-chat')
        // Save scroll position relative to the user message element before re-render
        var anchorMsgEl = chatEl ? chatEl.querySelector('[data-msg-id="' + userMsg.id + '"]') : null
        var anchorOffsetTop = anchorMsgEl ? anchorMsgEl.offsetTop : 0
        var scrollOffset = chatEl ? (chatEl.scrollTop - anchorOffsetTop) : 0
        self._renderConvMessages(contentEl, true)
        // Restore scroll position relative to the user message element after re-render
        if (chatEl) {
          var newAnchorMsgEl = chatEl.querySelector('[data-msg-id="' + userMsg.id + '"]')
          if (newAnchorMsgEl) {
            chatEl.scrollTop = newAnchorMsgEl.offsetTop + scrollOffset
          }
        }
      }
      // Memory summarization trigger
      self._msgSinceLastSummary = (self._msgSinceLastSummary || 0) + 1
      var settings = self._loadSettings()
      var summarizeInterval = settings.summarizeInterval || 30
      console.log('[PUA] msgSinceLastSummary=' + self._msgSinceLastSummary + ' interval=' + summarizeInterval)
      if (self._msgSinceLastSummary >= summarizeInterval) {
        self._msgSinceLastSummary = 0
        self._triggerConvSummary()
      }
    }).catch(function(err) {
      astMsg.content = '[\u9519\u8BEF] ' + (err.message || err)
      astMsg.rendered = self._escHtml(astMsg.content)
      self._convSending = false
      self._convStreamingMsg = null
      self._saveConvMessages()
      var contentEl = self._contentEl
      if (contentEl) {
        var chatEl = contentEl.querySelector('#conv-chat')
        // Save scroll position relative to the user message element before re-render
        var anchorMsgEl = chatEl ? chatEl.querySelector('[data-msg-id="' + userMsg.id + '"]') : null
        var anchorOffsetTop = anchorMsgEl ? anchorMsgEl.offsetTop : 0
        var scrollOffset = chatEl ? (chatEl.scrollTop - anchorOffsetTop) : 0
        self._renderConvMessages(contentEl, true)
        if (chatEl) {
          var newAnchorMsgEl = chatEl.querySelector('[data-msg-id="' + userMsg.id + '"]')
          if (newAnchorMsgEl) {
            chatEl.scrollTop = newAnchorMsgEl.offsetTop + scrollOffset
          }
        }
      }
      self._toast('API \u8C03\u7528\u5931\u8D25: ' + (err.message || err))
    })
    }) // end recallPromise.then
  }

  P._buildConvContext = function(upToMsgId) {
    console.log('[PUA] _buildConvContext called, upToMsgId=' + upToMsgId)
    // Use _buildMessages with convMsgs to respect asmOrder for ALL items including chat
    // This ensures chat messages are inserted at the position specified by asmOrder,
    // not always at the end
    var messages = this._buildMessages(false, this._convMessages, upToMsgId)
    console.log('[PUA] _buildConvContext: total messages=' + messages.length)
    return messages
  }

  P._applyConvFilterRegex = function(text, role, msgDepth) {
    console.log('[PUA] _applyConvFilterRegex called, role=' + role + ' textLen=' + (text ? text.length : 0) + ' msgDepth=' + msgDepth)
    if (!text) return text
    // Apply filter and replace type regexes (with depth check)
    for (var ri = 0; ri < this.regexes.length; ri++) {
      var rx = this.regexes[ri]
      if (!rx.on) continue
      if (rx.type === 'filter' || rx.type === 'replace') {
        // Check depth: only apply if msgDepth is within [dMin, dMax]
        if (role === 'assistant' && msgDepth >= 0) {
          var rxMin = rx.dMin || 0
          var rxMax = (rx.dMax !== undefined && rx.dMax !== null && rx.dMax !== Infinity) ? rx.dMax : Infinity
          if (msgDepth < rxMin || msgDepth > rxMax) continue
        }
        try {
          var re = new RegExp(rx.regex, 'g')
          var b1 = text.length
          text = text.replace(re, rx.html || '')
          if (text.length !== b1) {
            console.log('[PUA] _applyConvFilterRegex: rx[' + ri + '] ' + rx.type + ' len ' + b1 + '->' + text.length + ' n=' + (rx.name||'?') + ' depth=' + msgDepth)
          }
        } catch(e) {}
      }
    }
    // Apply preset outRegex/inRegex for assistant messages (with depth check)
    if (role === 'assistant') {
      // First pass: apply all outRegex (blacklist) sequentially
      for (var pi = 0; pi < this.presets.length; pi++) {
        var pr = this.presets[pi]
        if (pr.outRegex && pr.outRegexOn) {
          // Check depth
          if (msgDepth >= 0) {
            var prMin = pr.dMin || 0
            var prMax = (pr.dMax !== undefined && pr.dMax !== null && pr.dMax !== Infinity) ? pr.dMax : Infinity
            if (msgDepth < prMin || msgDepth > prMax) continue
          }
          try {
            var b2 = text.length
            text = text.replace(new RegExp(pr.outRegex, 'g'), '')
            if (text.length !== b2) console.log('[PUA] _applyConvFilterRegex: pr[' + pi + '] outRx len ' + b2 + '->' + text.length + ' t=' + (pr.title||'?') + ' depth=' + msgDepth)
          } catch(e) {}
        }
      }
      // Second pass: apply all inRegex (whitelist) as UNION - collect matches from ORIGINAL text
      // Multiple inRegex rules should work together: keep content matching ANY of them
      var hasInRegex = false
      for (var ci = 0; ci < this.presets.length; ci++) {
        if (this.presets[ci].inRegex && this.presets[ci].inRegexOn) {
          // Check depth for this preset
          if (msgDepth >= 0) {
            var ciMin = this.presets[ci].dMin || 0
            var ciMax = (this.presets[ci].dMax !== undefined && this.presets[ci].dMax !== null && this.presets[ci].dMax !== Infinity) ? this.presets[ci].dMax : Infinity
            if (msgDepth >= ciMin && msgDepth <= ciMax) { hasInRegex = true; break }
          } else {
            hasInRegex = true; break
          }
        }
      }
      if (hasInRegex) {
        // Apply outRegex first to get the filtered text, then apply inRegex on that
        var outFilteredText = text
        var allInMatches = []
        for (var pi2 = 0; pi2 < this.presets.length; pi2++) {
          var pr2 = this.presets[pi2]
          if (pr2.inRegex && pr2.inRegexOn) {
            // Check depth for this preset's inRegex
            if (msgDepth >= 0) {
              var pr2Min = pr2.dMin || 0
              var pr2Max = (pr2.dMax !== undefined && pr2.dMax !== null && pr2.dMax !== Infinity) ? pr2.dMax : Infinity
              if (msgDepth < pr2Min || msgDepth > pr2Max) continue
            }
            try {
              var iRe = new RegExp(pr2.inRegex, 'g')
              var iM = []
              var im2
              var lastIdx2 = 0
              while ((im2 = iRe.exec(outFilteredText)) !== null) {
                if (im2[0].length === 0 && iRe.lastIndex <= lastIdx2) {
                  iRe.lastIndex = lastIdx2 + 1
                }
                lastIdx2 = iRe.lastIndex
                iM.push(im2[0])
                if (iM.length > 10000) break
              }
              if (iM.length > 0) {
                console.log('[PUA] _applyConvFilterRegex: pr[' + pi2 + '] inRx matched ' + iM.length + ' t=' + (pr2.title||'?') + ' depth=' + msgDepth)
                allInMatches = allInMatches.concat(iM)
              }
            } catch(e) {}
          }
        }
        // If any inRegex matched, keep only the union of all matches
        if (allInMatches.length > 0) {
          var b4 = text.length
          text = allInMatches.join('')
          if (text.length !== b4) console.log('[PUA] _applyConvFilterRegex: inRegex union len ' + b4 + '->' + text.length + ' total=' + allInMatches.length + ' depth=' + msgDepth)
        }
        // If no inRegex matched at all, keep the outRegex-filtered text as-is
      }
    }
    return text
  }

  P._applyConvRegexRender = function(text) {
    console.log('[PUA] _applyConvRegexRender called')
    if (!text) return this._escHtml(text)
    // Apply render-type regexes on raw text FIRST
    var result = text
    var replacements = []
    for (var ri = 0; ri < this.regexes.length; ri++) {
      var rx = this.regexes[ri]
      if (!rx.on || rx.type !== 'render' || !rx.regex) continue
      try {
        var re = new RegExp(rx.regex, 'g')
        var self = this
        result = result.replace(re, function() {
          var match = arguments[0]
          // Resolve $1, $2, ... $N and $& in html template to actual capture groups
          var htmlTpl = rx.html || ''
          // Replace $& with full match first
          var resolved = htmlTpl.split('$&').join(match)
          // Replace $1-$9 with capture groups
          for (var ci = 1; ci < arguments.length - 2 && ci <= 9; ci++) {
            resolved = resolved.split('$' + ci).join(arguments[ci] !== undefined ? arguments[ci] : '')
          }
          var idx = replacements.length
          replacements.push(resolved)
          return '\x01R' + idx + 'R\x01'
        })
      } catch(e) {}
    }
    // Escape HTML in the remaining text
    result = this._escHtml(result)
    // Restore replacement HTML
    for (var k = 0; k < replacements.length; k++) {
      result = result.replace('\x01R' + k + 'R\x01', replacements[k])
    }
    // Hide <> tags but preserve their content (e.g. <nexus>1</nexus> → 1)
    // Use a non-backtracking pattern: match &lt; then non-& chars then &gt;
    // Avoid [^&]*? which causes catastrophic backtracking on long &lt; sequences
    result = result.replace(/&lt;[^&]*&gt;/g, function(tag) {
      // If it's a closing tag like &lt;/foo&gt;, remove it entirely
      if (tag.indexOf('&lt;/') === 0) return ''
      // If it's an opening/self-closing tag, remove it entirely too
      return ''
    })
    return result
  }

  P._streamChat = function(messages) {
    var self = this
    console.log('[PUA] _streamChat called, messages count=' + messages.length)
    for (var di = 0; di < messages.length; di++) {
      console.log('[PUA] _streamChat msg[' + di + '] role=' + messages[di].role + ' len=' + (messages[di].content || '').length + ' preview=' + (messages[di].content || '').substring(0, 60))
    }

    // Priority 1: Use roche.ai.chat (Roche's built-in AI API)
    if (this.roche && this.roche.ai && this.roche.ai.chat) {
      console.log('[PUA] _streamChat: using roche.ai.chat')
      return this._streamChatViaRoche(messages)
    }

    // Priority 2: Fallback to user-configured endpoint
    var preset = this._getActivePreset()
    if (!preset) return Promise.reject(new Error('\u8BF7\u5148\u914D\u7F6E API'))
    var endpoint = (preset.mainEndpoint || '').replace(/\/+$/, '')
    var apiKey = preset.mainApiKey || ''
    var model = preset.mainModel || ''
    if (!endpoint || !apiKey || !model) return Promise.reject(new Error('roche.ai.chat \u4E0D\u53EF\u7528\uFF0C\u8BF7\u5148\u914D\u7F6E\u4E3B API'))

    console.log('[PUA] _streamChat: using fetch fallback, endpoint=' + endpoint + ' model=' + model)
    return this._streamChatViaFetch(messages, endpoint, apiKey, model)
  }

  P._streamChatViaRoche = function(messages) {
    var self = this

    return this.roche.ai.chat({
      messages: messages,
      stream: true
    }).then(function(result) {
      console.log('[PUA] _streamChatViaRoche result type=' + typeof result)
      console.log('[PUA] _streamChatViaRoche result keys=' + (result ? Object.keys(result).join(',') : 'null'))
      console.log('[PUA] _streamChatViaRoche hasGetReader=' + !!(result && typeof result.getReader === 'function') + ' hasBody=' + !!(result && result.body && typeof result.body.getReader === 'function') + ' hasText=' + !!(result && result.text) + ' textType=' + (result && result.text ? typeof result.text : 'n/a'))

      // Priority 1: Check if result.body is a ReadableStream
      if (result && result.body && typeof result.body.getReader === 'function') {
        console.log('[PUA] _streamChatViaRoche: using result.body ReadableStream')
        return self._processStream(result.body)
      }
      // Priority 2: Check if result itself is a ReadableStream
      if (result && typeof result.getReader === 'function') {
        console.log('[PUA] _streamChatViaRoche: using ReadableStream')
        return self._processStream(result)
      }
      // Priority 3: Check if result.text is a ReadableStream
      if (result && result.text && typeof result.text.getReader === 'function') {
        console.log('[PUA] _streamChatViaRoche: using result.text ReadableStream')
        return self._processStream(result.text)
      }
      // Priority 4: Non-streaming result with string text
      var text = ''
      if (result && typeof result.text === 'string') {
        text = result.text
      } else if (typeof result === 'string') {
        text = result
      }
      console.log('[PUA] _streamChatViaRoche: non-streaming result, text length=' + text.length)
      if (text && self._convStreamingMsg) {
        self._convStreamingMsg.content = text
        self._convStreamingMsg.rendered = self._applyConvRegexRender(text)
        self._updateStreamingMessage(self._contentEl, self._convStreamingMsg.rendered, false)
      }
      return text
    }).catch(function(e) {
      console.error('[PUA] _streamChatViaRoche stream failed: ' + (e.message || e) + ', stack=' + (e.stack || '').substring(0, 200))
      // If roche.ai.chat streaming fails, try non-streaming
      return self.roche.ai.chat({
        messages: messages
      }).then(function(result) {
        // Handle both string and non-string result.text
        var text = ''
        if (result && typeof result.text === 'string') {
          text = result.text
        } else if (result && result.text && typeof result.text.getReader === 'function') {
          // result.text is a ReadableStream in non-stream mode too
          return self._processStream(result.text)
        } else if (typeof result === 'string') {
          text = result
        }
        console.log('[PUA] _streamChatViaRoche non-stream fallback result, text length=' + text.length)
        if (text && self._convStreamingMsg) {
          self._convStreamingMsg.content = text
          self._convStreamingMsg.rendered = self._applyConvRegexRender(text)
          self._updateStreamingMessage(self._contentEl, self._convStreamingMsg.rendered, false)
        }
        return text
      }).catch(function(e2) {
        console.error('[PUA] _streamChatViaRoche non-stream also failed: ' + (e2.message || e2))
        // Final fallback: try user-configured endpoint
        var preset = self._getActivePreset()
        if (preset && preset.mainEndpoint && preset.mainApiKey && preset.mainModel) {
          console.log('[PUA] _streamChatViaRoche: trying user-configured endpoint')
          return self._streamChatViaFetch(messages, preset.mainEndpoint.replace(/\/+$/, ''), preset.mainApiKey, preset.mainModel)
        }
        return Promise.reject(new Error('AI \u8C03\u7528\u5931\u8D25: ' + (e2.message || e2)))
      })
    })
  }

  P._processStream = function(readableStream) {
    var self = this
    console.log('[PUA] _processStream called')
    var reader = readableStream.getReader()
    var decoder = new TextDecoder()
    var buffer = ''
    var fullContent = ''
    var lastRenderTime = 0
    var renderInterval = 100 // Render at most every 100ms for performance
    var chunkCount = 0
    var deltaCount = 0

    function processChunk() {
      return reader.read().then(function(result) {
        if (result.done) {
          console.log('[PUA] _processStream done: chunks=' + chunkCount + ' deltas=' + deltaCount + ' totalLen=' + fullContent.length)
          // Final render with regex applied
          if (self._convStreamingMsg) {
            self._convStreamingMsg.content = fullContent
            self._convStreamingMsg.rendered = self._applyConvRegexRender(fullContent)
          }
          self._updateStreamingMessage(self._contentEl, self._convStreamingMsg ? self._convStreamingMsg.rendered : self._escHtml(fullContent), false)
          return fullContent
        }
        chunkCount++
        var rawChunk = decoder.decode(result.value, { stream: true })
        buffer += rawChunk
        var lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (var li = 0; li < lines.length; li++) {
          var line = lines[li].trim()
          if (!line || !line.startsWith('data: ')) continue
          if (line === 'data: [DONE]') continue
          try {
            var json = JSON.parse(line.substring(6))
            var delta = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content || ''
            if (delta) {
              deltaCount++
              fullContent += delta
              if (self._convStreamingMsg) self._convStreamingMsg.content = fullContent
              // Throttled render: apply regex and update DOM at intervals
              var now = Date.now()
              if (now - lastRenderTime >= renderInterval) {
                lastRenderTime = now
                var rendered = self._applyConvRegexRender(fullContent)
                if (self._convStreamingMsg) self._convStreamingMsg.rendered = rendered
                self._updateStreamingMessage(self._contentEl, rendered, true)
              } else {
                // Between throttled renders, just show escaped text for responsiveness
                self._updateStreamingMessage(self._contentEl, self._escHtml(fullContent), true)
              }
            }
          } catch(e) {
            // Log parse errors for debugging
            console.warn('[PUA] _processStream parse error: ' + e.message + ' line=' + line.substring(0, 80))
          }
        }
        return processChunk()
      }).catch(function(e) {
        console.error('[PUA] _processStream reader error: ' + (e.message || e) + ' chunksSoFar=' + chunkCount + ' contentLen=' + fullContent.length)
        // Return whatever we have so far instead of throwing
        if (fullContent.length > 0) return fullContent
        throw e
      })
    }

    return processChunk()
  }

  P._streamChatViaFetch = function(messages, endpoint, apiKey, model) {
    var self = this
    var url = endpoint + '/v1/chat/completions'
    console.log('[PUA] _streamChatViaFetch: url=' + url + ' model=' + model + ' msgs=' + messages.length)

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true
      })
    }).then(function(response) {
      console.log('[PUA] _streamChatViaFetch: response status=' + response.status + ' ok=' + response.ok)
      if (!response.ok) {
        return response.text().then(function(errText) {
          console.error('[PUA] _streamChatViaFetch: error response body=' + errText.substring(0, 200))
          throw new Error('HTTP ' + response.status + ': ' + errText.substring(0, 100))
        })
      }
      return self._processStream(response.body)
    }).catch(function(e) {
      console.error('[PUA] _streamChatViaFetch failed: ' + (e.message || e))
      throw e
    })
  }

  P._updateStreamingMessage = function(contentEl, html, isStreaming) {
    if (!contentEl) return
    var chatEl = contentEl.querySelector('#conv-chat')
    if (!chatEl) return
    // Find the last assistant message element
    var msgEls = chatEl.querySelectorAll('.pua-conv-msg-assistant')
    if (msgEls.length === 0) return
    var lastMsgEl = msgEls[msgEls.length - 1]
    var contentDiv = lastMsgEl.querySelector('.pua-conv-msg-content')
    if (contentDiv) {
      contentDiv.innerHTML = html
      if (isStreaming) {
        contentDiv.innerHTML += '<span class="pua-conv-typing" style="display:inline"></span>'
      }
      // Apply font size during streaming
      var fsSettings = this._loadSettings()
      var savedFontSize = fsSettings.convFontSize || 0
      if (savedFontSize > 0) contentDiv.style.fontSize = savedFontSize + 'px'
    }
    // No auto-scroll during streaming - user controls scroll position
  }

  P._renderConvMessages = function(contentEl, keepPosition) {
    console.log('[PUA] _renderConvMessages called, keepPosition=' + keepPosition)
    var chatEl = contentEl.querySelector('#conv-chat')
    if (!chatEl) return

    // Save current scroll position
    var savedScrollTop = chatEl.scrollTop
    var savedScrollHeight = chatEl.scrollHeight

    var h = ''
    var msgs = this._convMessages
    var renderLimit = this._convRenderLimit
    var collapsedCount = 0
    var startIdx = 0
    if (msgs.length > renderLimit) {
      collapsedCount = msgs.length - renderLimit
      startIdx = collapsedCount
    }

    if (collapsedCount > 0) {
      h += '<div class="pua-conv-collapsed" id="conv-load-more">\u66F4\u65E9\u7684\u6D88\u606F (' + collapsedCount + '\u6761) \u2014 \u52A0\u8F7D\u66F4\u591A</div>'
    }

    for (var mi = startIdx; mi < msgs.length; mi++) {
      h += this._renderConvMessage(msgs[mi])
    }

    // Add typing indicator if sending
    if (this._convSending) {
      h += '<div class="pua-conv-typing">\u6B63\u5728\u601D\u8003...</div>'
    }

    chatEl.innerHTML = h

    // Re-bind message actions
    this._bindConvMessageActions(contentEl)

    // Auto-focus textarea if in edit mode
    if (this._editingMsgId) {
      var editTa = chatEl.querySelector('#edit-ta-' + this._editingMsgId)
      if (editTa) {
        var len = editTa.value.length
        editTa.focus()
        editTa.setSelectionRange(len, len)
      }
    }

    // Re-bind load more
    var loadMoreBtn = chatEl.querySelector('#conv-load-more')
    var self = this
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function() {
        // Incremental load: add 20 more messages (or show all if less than 20 remaining)
        var increment = 20
        var newLimit = self._convRenderLimit + increment
        if (newLimit > self._convMessages.length) newLimit = self._convMessages.length
        self._convRenderLimit = newLimit
        // Save the load-more button's position for scroll restoration
        var loadMoreOffset = chatEl.scrollTop
        self._renderConvMessages(contentEl, true)
        // Scroll to show the newly loaded messages at the top
        var newLoadMoreBtn = chatEl.querySelector('#conv-load-more')
        if (newLoadMoreBtn) {
          chatEl.scrollTop = newLoadMoreBtn.offsetTop - chatEl.offsetTop
        }
      })
    }

    // Update message count
    var countEl = contentEl.querySelector('#conv-msg-count')
    if (countEl) countEl.textContent = msgs.length + ' \u6761'

    // Restore scroll position - always use relative position adjustment
    // This preserves the user's current view regardless of content changes
    var newScrollHeight = chatEl.scrollHeight
    chatEl.scrollTop = savedScrollTop + (newScrollHeight - savedScrollHeight)

    // Apply saved font size to conversation messages
    var fsSettings2 = this._loadSettings()
    var savedFontSize2 = fsSettings2.convFontSize || 0
    if (savedFontSize2 > 0) {
      var msgContents = chatEl.querySelectorAll('.pua-conv-msg-content')
      for (var fi = 0; fi < msgContents.length; fi++) {
        msgContents[fi].style.fontSize = savedFontSize2 + 'px'
      }
    }
  }

  /* ── Regenerate from last user message ── */

  P._regenerateFromLastUser = function(contentEl) {
    var self = this
    var msgs = this._convMessages
    if (msgs.length === 0) return

    // Find the last user message
    var lastUserIdx = -1
    for (var i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user' && !msgs[i].dimmed) { lastUserIdx = i; break }
    }
    if (lastUserIdx < 0) { this._toast('\u6CA1\u6709\u53EF\u91CD\u65B0\u751F\u6210\u7684\u6D88\u606F'); return }

    var astMsg = null

    // Check if there's an assistant message right after the last user message
    if (lastUserIdx + 1 < msgs.length && msgs[lastUserIdx + 1].role === 'assistant') {
      astMsg = msgs[lastUserIdx + 1]
      // Save current content as alternative version
      if (!astMsg.alternatives) astMsg.alternatives = []
      if (astMsg.content) astMsg.alternatives.push(astMsg.content)
    } else {
      // No assistant message yet, create one
      astMsg = this._createMessage('assistant', '', 'live')
      astMsg.floorNumber = msgs.length + 1
      msgs.splice(lastUserIdx + 1, 0, astMsg)
      // Re-assign floor numbers
      for (var fi = 0; fi < msgs.length; fi++) { msgs[fi].floorNumber = fi + 1 }
    }

    this._convSending = true
    this._convStreamingMsg = astMsg
    astMsg.content = ''
    astMsg.rendered = null

    // Build context up to the last user message
    var upToMsgId = msgs[lastUserIdx].id
    var messages = this._buildConvContext(upToMsgId)
    console.log('[PUA] _regenerateFromLastUser: upToMsgId=' + upToMsgId + ' contextLen=' + messages.length)

    // Re-render to show typing indicator (keep scroll position)
    this._renderConvMessages(contentEl, true)

    this._streamChat(messages).then(function(fullContent) {
      console.log('[PUA] _regenerateFromLastUser: streamChat resolved, contentLen=' + (fullContent || '').length)
      if (!fullContent) {
        console.error('[PUA] _regenerateFromLastUser: empty content returned!')
      }
      astMsg.content = fullContent
      astMsg.activeAltIndex = 0
      astMsg.rendered = self._applyConvRegexRender(fullContent)
      self._convSending = false
      self._convStreamingMsg = null
      self._saveConvMessages()
      var contentEl = self._contentEl
      if (contentEl) self._renderConvMessages(contentEl, true)
    }).catch(function(err) {
      // Restore from alternatives on error
      if (astMsg.alternatives && astMsg.alternatives.length > 0) {
        astMsg.content = astMsg.alternatives.pop()
        astMsg.activeAltIndex = 0
      } else {
        astMsg.content = '[\u9519\u8BEF] ' + (err.message || err)
      }
      astMsg.rendered = self._applyConvRegexRender(astMsg.content)
      self._convSending = false
      self._convStreamingMsg = null
      self._saveConvMessages()
      var contentEl = self._contentEl
      if (contentEl) self._renderConvMessages(contentEl, true)
      self._toast('\u91CD\u65B0\u751F\u6210\u5931\u8D25: ' + (err.message || err))
    })
  }

  /* ── Regenerate message (per-message action) ── */

  P._regenerateMessage = function(msgId) {
    var self = this
    console.log('[PUA] _regenerateMessage called, msgId=' + msgId)
    // Find the message
    var msg = null
    var msgIdx = -1
    for (var i = 0; i < this._convMessages.length; i++) {
      if (this._convMessages[i].id === msgId) { msg = this._convMessages[i]; msgIdx = i; break }
    }
    if (!msg || msg.role !== 'assistant') return

    // Add current content to alternatives before regenerating
    if (!msg.alternatives) msg.alternatives = []
    if (msg.content) msg.alternatives.push(msg.content)

    // Create new response
    this._convSending = true
    this._convStreamingMsg = msg
    msg.content = ''
    msg.rendered = null

    // Build context up to the user message BEFORE this assistant message
    // Find the user message just before this assistant message
    var upToMsgId = null
    for (var pi = msgIdx - 1; pi >= 0; pi--) {
      if (this._convMessages[pi].role === 'user' && !this._convMessages[pi].dimmed) {
        upToMsgId = this._convMessages[pi].id
        break
      }
    }
    var messages = this._buildConvContext(upToMsgId)
    console.log('[PUA] _regenerateMessage: upToMsgId=' + upToMsgId + ' contextLen=' + messages.length)

    this._streamChat(messages).then(function(fullContent) {
      console.log('[PUA] _regenerateMessage: streamChat resolved, contentLen=' + (fullContent || '').length)
      if (!fullContent) {
        console.error('[PUA] _regenerateMessage: empty content returned!')
      }
      msg.content = fullContent
      msg.activeAltIndex = 0
      msg.rendered = self._applyConvRegexRender(fullContent)
      self._convSending = false
      self._convStreamingMsg = null
      self._saveConvMessages()
      var contentEl = self._contentEl
      if (contentEl) self._renderConvMessages(contentEl, true)
    }).catch(function(err) {
      // Restore from alternatives on error
      if (msg.alternatives.length > 0) {
        msg.content = msg.alternatives.pop()
        msg.activeAltIndex = 0
      } else {
        msg.content = '[\u9519\u8BEF] ' + (err.message || err)
      }
      msg.rendered = self._applyConvRegexRender(msg.content)
      self._convSending = false
      self._convStreamingMsg = null
      self._saveConvMessages()
      var contentEl = self._contentEl
      if (contentEl) self._renderConvMessages(contentEl, true)
      self._toast('\u91CD\u65B0\u751F\u6210\u5931\u8D25: ' + (err.message || err))
    })
  }

  /* ── Edit & Resend ── */

  P._editMessage = function(msgId) {
    this._editingMsgId = msgId
    var contentEl = this._contentEl
    if (contentEl) this._renderConvMessages(contentEl, true)
  }

  P._deleteMessage = function(msgId) {
    var self = this
    console.log('[PUA] _deleteMessage called, msgId=' + msgId)
    // Find the message
    var msgIdx = -1
    for (var i = 0; i < this._convMessages.length; i++) {
      if (this._convMessages[i].id === msgId) { msgIdx = i; break }
    }
    if (msgIdx === -1) return

    var msg = this._convMessages[msgIdx]

    // Confirm deletion
    if (this.roche && this.roche.ui && this.roche.ui.confirm) {
      this.roche.ui.confirm({
        title: '删除消息',
        message: '确定要删除 #' + (msg.floorNumber || '') + ' 消息吗？'
      }).then(function(ok) {
        if (!ok) return
        self._doDeleteMessage(msgIdx)
      })
    } else {
      // Fallback: just delete directly
      this._doDeleteMessage(msgIdx)
    }
  }

  P._doDeleteMessage = function(msgIdx) {
    // Find an anchor message near the deleted one for scroll restoration
    var anchorMsgId = null
    // Try the message at the same index (which is now the next message), or the previous one
    if (msgIdx < this._convMessages.length) {
      anchorMsgId = this._convMessages[msgIdx].id
    } else if (msgIdx > 0 && msgIdx - 1 < this._convMessages.length) {
      anchorMsgId = this._convMessages[msgIdx - 1].id
    }

    // Save scroll position relative to the anchor message before re-render
    var contentEl = this._contentEl
    var chatEl = contentEl ? contentEl.querySelector('#conv-chat') : null
    var scrollOffset = 0
    if (chatEl && anchorMsgId) {
      var anchorEl = chatEl.querySelector('[data-msg-id="' + anchorMsgId + '"]')
      if (anchorEl) {
        scrollOffset = chatEl.scrollTop - anchorEl.offsetTop
      }
    }

    // Remove from messages array
    this._convMessages.splice(msgIdx, 1)

    // Re-assign floor numbers
    for (var i = 0; i < this._convMessages.length; i++) {
      this._convMessages[i].floorNumber = i + 1
    }

    this._saveConvMessages()
    this._renderPage()
    this._toast('消息已删除')

    // Restore scroll position relative to the anchor message after re-render
    if (anchorMsgId) {
      var newContentEl = this._contentEl
      var newChatEl = newContentEl ? newContentEl.querySelector('#conv-chat') : null
      if (newChatEl) {
        var newAnchorEl = newChatEl.querySelector('[data-msg-id="' + anchorMsgId + '"]')
        if (newAnchorEl) {
          newChatEl.scrollTop = newAnchorEl.offsetTop + scrollOffset
        }
      }
    }
  }

  P._toggleEditMode = function(msgId) {
    console.log('[PUA] _toggleEditMode called, msgId=' + msgId + ', current editing=' + this._editingMsgId)
    if (this._editingMsgId === msgId) {
      this._editingMsgId = null
    } else {
      this._editingMsgId = msgId
    }
    console.log('[PUA] _toggleEditMode result, editingMsgId=' + this._editingMsgId)
    // Re-render messages, preserving scroll position relative to the message
    var contentEl = this._contentEl
    if (contentEl) {
      var chatEl = contentEl.querySelector('#conv-chat')
      var msgEl = chatEl ? chatEl.querySelector('[data-msg-id="' + msgId + '"]') : null
      var msgOffsetTop = msgEl ? msgEl.offsetTop : 0
      var scrollOffset = chatEl ? (chatEl.scrollTop - msgOffsetTop) : 0
      this._renderConvMessages(contentEl, true)
      if (chatEl) {
        var newMsgEl = chatEl.querySelector('[data-msg-id="' + msgId + '"]')
        if (newMsgEl) chatEl.scrollTop = newMsgEl.offsetTop + scrollOffset
      }
    }
  }

  P._handleEditAction = function(action, msgId) {
    var contentEl = this._contentEl
    if (!contentEl) return
    var self = this
    // Save scroll position relative to this message element before any action
    var chatEl = contentEl.querySelector('#conv-chat')
    var msgEl = chatEl ? chatEl.querySelector('[data-msg-id="' + msgId + '"]') : null
    var msgOffsetTop = msgEl ? msgEl.offsetTop : 0
    var scrollOffset = chatEl ? (chatEl.scrollTop - msgOffsetTop) : 0

    if (action === 'saveEdit') {
      var ta = contentEl.querySelector('#edit-ta-' + msgId)
      if (!ta) return
      var newContent = ta.value
      for (var i = 0; i < this._convMessages.length; i++) {
        if (this._convMessages[i].id === msgId) {
          var msg = this._convMessages[i]
          // Save old content as a version (alternative)
          if (msg.content && msg.content !== newContent) {
            if (!msg.alternatives) msg.alternatives = []
            msg.alternatives.push(msg.content)
          }
          msg.content = newContent
          if (msg.role === 'assistant') {
            msg.rendered = this._applyConvRegexRender(newContent)
          }
          // Update activeAltIndex to point to current (latest) version
          msg.activeAltIndex = 0
          break
        }
      }
      this._saveConvMessages()
      this._editingMsgId = null
      this._renderConvMessages(contentEl, true)
      // Restore scroll position relative to the message element
      if (chatEl) {
        var newMsgEl = chatEl.querySelector('[data-msg-id="' + msgId + '"]')
        if (newMsgEl) chatEl.scrollTop = newMsgEl.offsetTop + scrollOffset
      }
      this._toast('\u5DF2\u4FDD\u5B58')
    } else if (action === 'cancelEdit') {
      this._editingMsgId = null
      this._renderConvMessages(contentEl, true)
      // Restore scroll position relative to the message element
      if (chatEl) {
        var newMsgEl2 = chatEl.querySelector('[data-msg-id="' + msgId + '"]')
        if (newMsgEl2) chatEl.scrollTop = newMsgEl2.offsetTop + scrollOffset
      }
    } else if (action === 'copyEdit') {
      var ta2 = contentEl.querySelector('#edit-ta-' + msgId)
      if (!ta2) return
      if (navigator.clipboard) {
        navigator.clipboard.writeText(ta2.value).then(function() { self._toast('\u5DF2\u590D\u5236') })
      } else {
        ta2.select()
        try { document.execCommand('copy'); self._toast('\u5DF2\u590D\u5236') } catch(e2) { self._toast('\u590D\u5236\u5931\u8D25') }
      }
    }
  }

  /* ── Switch alternative version ── */

  P._switchAltVersion = function(msgId, altIdx) {
    console.log('[PUA] _switchAltVersion called, msgId=' + msgId + ' altIdx=' + altIdx)
    // Save the scroll position relative to this message element before switching
    var contentEl = this._contentEl
    var chatEl = contentEl ? contentEl.querySelector('#conv-chat') : null
    var msgEl = chatEl ? chatEl.querySelector('[data-msg-id="' + msgId + '"]') : null
    var msgOffsetTop = msgEl ? msgEl.offsetTop : 0
    var scrollOffset = chatEl ? (chatEl.scrollTop - msgOffsetTop) : 0

    for (var i = 0; i < this._convMessages.length; i++) {
      if (this._convMessages[i].id === msgId) {
        var msg = this._convMessages[i]
        msg.activeAltIndex = altIdx
        // Re-render the displayed content
        var content = msg.content
        if (altIdx > 0 && msg.alternatives && msg.alternatives[altIdx - 1]) {
          content = msg.alternatives[altIdx - 1]
        }
        if (msg.role === 'assistant') {
          msg.rendered = this._applyConvRegexRender(content)
        }
        break
      }
    }
    this._saveConvMessages()
    if (contentEl) {
      this._renderConvMessages(contentEl, true)
      // Restore scroll position relative to the message element
      if (chatEl) {
        var newMsgEl = chatEl.querySelector('[data-msg-id="' + msgId + '"]')
        if (newMsgEl) {
          chatEl.scrollTop = newMsgEl.offsetTop + scrollOffset
        }
      }
    }
  }

  /* ── Toggle favorite ── */

  P._toggleFavorite = function(msgId) {
    console.log('[PUA] _toggleFavorite called, msgId=' + msgId)
    var msg = null
    for (var i = 0; i < this._convMessages.length; i++) {
      if (this._convMessages[i].id === msgId) { msg = this._convMessages[i]; break }
    }
    if (!msg) return

    msg.favorited = !msg.favorited

    // Update favorites storage
    var favs = this._loadFavorites()
    if (msg.favorited) {
      // Add to favorites
      var branchName = ''
      for (var bi = 0; bi < this.branches.length; bi++) {
        if (this.branches[bi].id === this._convBranchId) { branchName = this.branches[bi].name; break }
      }
      favs.push({
        id: 'fav_' + Date.now(),
        messageId: msg.id,
        branchId: this._convBranchId,
        branchName: branchName,
        content: (msg.content || '').substring(0, 100),
        fullContent: msg.content || '',
        role: msg.role,
        timestamp: msg.timestamp,
        floorNumber: msg.floorNumber,
        note: '',
        conversationExists: true
      })
    } else {
      // Remove from favorites
      var newFavs = []
      for (var fi = 0; fi < favs.length; fi++) {
        if (favs[fi].messageId !== msgId) newFavs.push(favs[fi])
      }
      favs = newFavs
    }

    this._saveFavorites(favs)
    this._saveConvMessages()

    // Local DOM update: toggle favorite button without full re-render to preserve scroll
    var contentEl = this._contentEl
    if (contentEl) {
      var favBtn = contentEl.querySelector('[data-action="favorite"][data-msg-id="' + msgId + '"]')
      if (favBtn) {
        if (msg.favorited) {
          favBtn.classList.add('active')
          favBtn.textContent = '已收藏'
        } else {
          favBtn.classList.remove('active')
          favBtn.textContent = '收藏'
        }
      }
    }
  }

  /* ── Scroll to floor ── */

  P._scrollToFloor = function(contentEl, floor) {
    var chatEl = contentEl.querySelector('#conv-chat')
    if (!chatEl) return
    var msgEl = chatEl.querySelector('[data-floor="' + floor + '"]')
    if (msgEl) {
      msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      msgEl.style.outline = '2px solid var(--pua-accent)'
      setTimeout(function() { msgEl.style.outline = '' }, 2000)
    } else {
      // Message might be collapsed, expand all
      this._convRenderLimit = this._convMessages.length
      this._renderPage()
      var self = this
      setTimeout(function() {
        var chatEl2 = self._contentEl.querySelector('#conv-chat')
        if (chatEl2) {
          var msgEl2 = chatEl2.querySelector('[data-floor="' + floor + '"]')
          if (msgEl2) {
            msgEl2.scrollIntoView({ behavior: 'smooth', block: 'center' })
            msgEl2.style.outline = '2px solid var(--pua-accent)'
            setTimeout(function() { msgEl2.style.outline = '' }, 2000)
          }
        }
      }, 100)
    }
  }

  /* ── Memory summarization trigger ── */

  P._triggerConvSummary = function(overrideBranchId, options) {
    var self = this
    var preset = this._getActivePreset()
    var branchId = overrideBranchId || this._convBranchId
    var isManual = options && options.manual
    var startFloor = options && options.startFloor
    var endFloor = options && options.endFloor
    var summaryType = isManual ? '\u624B\u52A8' : '\u81EA\u52A8'

    if (!branchId) {
      console.log('[PUA] _triggerConvSummary: skipped, no branchId')
      self._toast('\u65E0\u6CD5\u603B\u7ED3\uFF1A\u672A\u9009\u62E9\u5206\u652F')
      return
    }

    if (!preset || !preset.subEndpoint || !preset.subApiKey || !preset.subModel) {
      self._toast('\u8BF7\u5148\u914D\u7F6E\u526F API')
      return
    }

    // Load messages for the target branch
    // Always try localStorage first, then branch.messages, then _convMessages
    var convMessages = null
    var branchKey = 'pua_conv_' + branchId
    try {
      var rawMsgs = localStorage.getItem(branchKey)
      if (rawMsgs) {
        convMessages = JSON.parse(rawMsgs)
        console.log('[PUA] _triggerConvSummary: loaded ' + convMessages.length + ' messages from localStorage for branch ' + branchId)
      }
    } catch(e) {}

    if (!convMessages || convMessages.length === 0) {
      // Try branch.messages
      var branch = null
      for (var tbi = 0; tbi < this.branches.length; tbi++) {
        if (this.branches[tbi].id === branchId) { branch = this.branches[tbi]; break }
      }
      if (branch && branch.messages && branch.messages.length > 0) {
        convMessages = []
        for (var mi = 0; mi < branch.messages.length; mi++) {
          var m = branch.messages[mi]
          var role = 'user'
          if (m.type === 'assistant' || m.type === 'model') role = 'assistant'
          else if (m.type === 'system') role = 'system'
          convMessages.push({ role: role, content: m.text || m.content || '' })
        }
        console.log('[PUA] _triggerConvSummary: loaded ' + convMessages.length + ' messages from branch data')
      }
    }

    if (!convMessages || convMessages.length === 0) {
      // Fallback to _convMessages
      convMessages = this._convMessages
      console.log('[PUA] _triggerConvSummary: using _convMessages, length=' + (convMessages ? convMessages.length : 0))
    }

    if (!convMessages || convMessages.length === 0) {
      self._toast('\u6CA1\u6709\u5BF9\u8BDD\u5185\u5BB9\u53EF\u603B\u7ED3')
      return
    }

    // 确定楼层范围
    var settings = this._loadSettings()
    var summarizeInterval = settings.summarizeInterval || 30
    var msgs = convMessages

    if (isManual && startFloor != null && endFloor != null) {
      // 手动总结：使用用户指定的楼层范围
      var sf = Math.max(1, parseInt(startFloor) || 1)
      var ef = Math.min(msgs.length, parseInt(endFloor) || msgs.length)
      msgs = msgs.slice(sf - 1, ef)
    } else {
      // 自动总结：取最近N层消息
      msgs = msgs.slice(-summarizeInterval)
    }

    // 构建上下文：char人设 + user人设 + 过滤后的聊天记录
    var charText = ''
    if (this.asmData && this.asmData.char) {
      var ch = this.asmData.char
      charText = (ch.persona || ch.bio || ch.description || '')
    }
    var userText = ''
    if (this.asmData && this.asmData.userPersona) {
      var up = this.asmData.userPersona
      userText = (up.persona || up.bio || up.description || '')
    }

    // 过滤聊天记录
    var filterMode = settings.summaryFilterMode || 'none'
    var filteredMsgs = []
    for (var fi = 0; fi < msgs.length; fi++) {
      var msgContent = msgs[fi].content || ''
      if (filterMode === 'preset') {
        // 使用预设正则过滤
        msgContent = self._applyConvFilterRegex(msgContent, msgs[fi].role, 0)
      } else if (filterMode === 'custom') {
        var customRegex = settings.summaryCustomRegex || ''
        if (customRegex) {
          try {
            var rx = new RegExp(customRegex, 'g')
            msgContent = msgContent.replace(rx, '')
          } catch(re) {}
        }
      }
      filteredMsgs.push({ role: msgs[fi].role, content: msgContent })
    }

    // 构建聊天文本
    var convText = ''
    if (charText) {
      convText += 'char\u4EBA\u8BBE\uFF1A' + charText + '\n\n'
    }
    if (userText) {
      convText += 'user\u4EBA\u8BBE\uFF1A' + userText + '\n\n'
    }
    for (var ci = 0; ci < filteredMsgs.length; ci++) {
      convText += filteredMsgs[ci].role + ': ' + filteredMsgs[ci].content.substring(0, 500) + '\n'
    }

    if (!convText.trim()) {
      self._toast('\u6CA1\u6709\u5BF9\u8BDD\u5185\u5BB9\u53EF\u603B\u7ED3')
      return
    }

    self._toast('\u6B63\u5728\u89E6\u53D1' + summaryType + '\u603B\u7ED3...')

    // 构建提示词
    var oneSentencePrompt = settings.oneSentencePrompt || '\u8BF7\u4ECE\u4EE5\u4E0B\u5BF9\u8BDD\u4E2D\u63D0\u53D6\u5173\u952E\u4E8B\u5B9E\uFF0C\u7528\u4E00\u53E5\u8BDD\u6982\u62EC\u6700\u91CD\u8981\u7684\u4E8B\u4EF6\u6216\u4FE1\u606F\u3002'
    var keywordsPrompt = settings.keywordsPrompt || '\u8BF7\u4ECE\u4EE5\u4E0B\u5BF9\u8BDD\u4E2D\u63D0\u53D63-5\u4E2A\u5173\u952E\u8BCD\uFF0C\u7528\u9017\u53F7\u5206\u9694\u3002'
    var summaryContentPrompt = settings.summaryContentPrompt || '\u8BF7\u4ECE\u4EE5\u4E0B\u5BF9\u8BDD\u4E2D\u63D0\u53D6\u5173\u952E\u4E8B\u5B9E\u4FE1\u606F\uFF0C\u8BE6\u7EC6\u603B\u7ED3\u53D1\u751F\u4E86\u4EC0\u4E48\u3002'

    var prompt = oneSentencePrompt + '\n' + keywordsPrompt + '\n' + summaryContentPrompt + '\n\n' +
      '\u8BF7\u6309\u4EE5\u4E0BJSON\u683C\u5F0F\u8F93\u51FA\uFF1A\n' +
      '{"oneSentence": "\u4E00\u53E5\u8BDD\u6458\u8981", "keywords": "\u5173\u952E\u8BCD1,\u5173\u952E\u8BCD2", "summary": "\u8BE6\u7EC6\u603B\u7ED3\u5185\u5BB9"}\n\n' +
      '\u5BF9\u8BDD\u5185\u5BB9\uFF1A\n' + convText

    var url = preset.subEndpoint.replace(/\/+$/, '') + '/chat/completions'
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + preset.subApiKey },
      body: JSON.stringify({
        model: preset.subModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000
      })
    }).then(function(r) {
      return r.json()
    }).then(function(data) {
      if (data.error) {
        self._toast(summaryType + '\u603B\u7ED3\u5931\u8D25: ' + (data.error.message || 'API \u9519\u8BEF'))
        return
      }
      if (!data.choices || !data.choices[0]) {
        self._toast(summaryType + '\u603B\u7ED3\u5931\u8D25\uFF1AAPI \u65E0\u6709\u6548\u54CD\u5E94')
        return
      }
      var content = (data.choices[0].message || {}).content || ''
      if (!content) {
        self._toast(summaryType + '\u603B\u7ED3\u5185\u5BB9\u4E3A\u7A7A')
        return
      }

      // 解析JSON结果
      var oneSentence = ''
      var keywords = ''
      var summary = content

      var jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          var parsed = JSON.parse(jsonMatch[0])
          oneSentence = parsed.oneSentence || ''
          keywords = parsed.keywords || ''
          summary = parsed.summary || content
        } catch(parseErr) {
          // JSON解析失败，使用原始内容
        }
      }

      var source = isManual ? 'manual-summary' : 'auto-summary'
      self._saveSummaryToMemory(branchId, summary, source, oneSentence, keywords)

      // 重置计数器
      self._msgSinceLastSummary = 0

      self._toast(summaryType + '\u603B\u7ED3\u5B8C\u6210')
    }).catch(function(err) {
      self._toast(summaryType + '\u603B\u7ED3\u5931\u8D25: ' + (err.message || '\u7F51\u7EDC\u9519\u8BEF'))
    })
  }

  P._saveSummaryToMemory = function(branchId, summary, source, oneSentence, keywords) {
    var self = this
    var memData = this._loadMemData(branchId)
    if (memData) {
      if (!memData.facts) memData.facts = []
      var factId = 'f' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)
      var factObj = {
        id: factId,
        text: summary,
        summaryText: summary,
        oneSentence: oneSentence || summary.substring(0, 50),
        keywords: keywords || '',
        summary: oneSentence || summary.substring(0, 50),
        timestamp: new Date().toISOString(),
        source: source || 'auto-summary',
        needsSummary: false
      }
      memData.facts.push(factObj)

      // oneSentence 同时写入核心记忆的 events 数组
      if (factObj.oneSentence && memData.core && Array.isArray(memData.core.events)) {
        memData.core.events.push({
          id: 'evt_' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          text: factObj.oneSentence,
          timestamp: new Date().toISOString()
        })
      }

      this._saveMemData(memData, branchId)
      console.log('[PUA] _saveSummaryToMemory: saved, id=' + factId + ' branchId=' + branchId)

      // 自动生成向量记忆
      self._autoGenerateEmbedding(factObj, memData, branchId)
    } else {
      console.log('[PUA] _saveSummaryToMemory: no memData for branchId=' + branchId)
      this._toast('\u4FDD\u5B58\u5931\u8D25\uFF1A\u672A\u627E\u5230\u8BB0\u5FC6\u6570\u636E')
    }
  }

  // 自动为单条事实记忆生成向量（静默，不阻塞UI）
  P._autoGenerateEmbedding = function(factObj, memData, branchId) {
    var self = this
    var preset = this._getActivePreset()
    if (!preset || !preset.vecEndpoint || !preset.vecApiKey || !preset.vecModel) {
      console.log('[PUA] _autoGenerateEmbedding: skipped, no vector API config')
      return
    }
    var text = factObj.oneSentence || factObj.text || ''
    if (!text) return

    self._getEmbedding(text).then(function(emb) {
      factObj.embedding = emb
      self._saveMemData(memData, branchId)
      console.log('[PUA] _autoGenerateEmbedding: embedding generated for fact ' + factObj.id + ', dim=' + (emb ? emb.length : 0))
    }).catch(function(e) {
      console.log('[PUA] _autoGenerateEmbedding: failed for fact ' + factObj.id + ', err=' + (e.message || e))
    })
  }

  // 批量为指定索引的事实记忆生成向量（静默，不阻塞UI）
  P._autoGenerateEmbeddingsForFacts = function(memData, branchId, factIndices) {
    var self = this
    var preset = this._getActivePreset()
    if (!preset || !preset.vecEndpoint || !preset.vecApiKey || !preset.vecModel) {
      console.log('[PUA] _autoGenerateEmbeddingsForFacts: skipped, no vector API config')
      return
    }
    var toEmbed = []
    for (var i = 0; i < factIndices.length; i++) {
      var fi = factIndices[i]
      var fact = memData.facts[fi]
      if (fact && !fact.embedding && (fact.oneSentence || fact.text)) {
        toEmbed.push(fi)
      }
    }
    if (toEmbed.length === 0) return

    console.log('[PUA] _autoGenerateEmbeddingsForFacts: generating embeddings for ' + toEmbed.length + ' facts')
    var idx = 0
    function embedNext() {
      if (idx >= toEmbed.length) {
        self._saveMemData(memData, branchId)
        console.log('[PUA] _autoGenerateEmbeddingsForFacts: all done')
        return
      }
      var fi2 = toEmbed[idx]
      var text2 = memData.facts[fi2].oneSentence || memData.facts[fi2].text || ''
      self._getEmbedding(text2).then(function(emb) {
        memData.facts[fi2].embedding = emb
        idx++
        embedNext()
      }).catch(function(e) {
        console.log('[PUA] _autoGenerateEmbeddingsForFacts: failed for index ' + fi2 + ', err=' + (e.message || e))
        idx++
        embedNext()
      })
    }
    embedNext()
  }

  // 异步召回记忆（用于发送消息时，支持向量/副API召回）
  // 返回 Promise<{fact, score}[]>
  P._recallMemoriesAsync = function(query, facts, topK) {
    var self = this
    var settings = this._loadSettings()
    var mode = settings.recallMode || 'vector'
    var preset = this._getActivePreset()

    if (mode === 'subapi' && preset && preset.subEndpoint && preset.subApiKey && preset.subModel) {
      return self._subApiRecall(query, facts, topK)
    }

    // 向量模式：检查是否有向量API配置和已生成的向量
    if (preset && preset.vecEndpoint && preset.vecApiKey && preset.vecModel) {
      var hasEmbeddings = false
      for (var i = 0; i < facts.length; i++) {
        if (facts[i].embedding && facts[i].embedding.length > 0) {
          hasEmbeddings = true
          break
        }
      }
      if (hasEmbeddings) {
        return self._hybridRecall(query, facts, topK)
      }
    }

    // Fallback to sync recall
    var syncResults = self._recallMemoriesSync(query, facts, topK)
    return Promise.resolve(syncResults.map(function(f) { return { fact: f, score: 1 } }))
  }

  P._triggerRelationshipSummary = function(branchId) {
    var self = this
    var preset = this._getActivePreset()
    if (!preset || !preset.subEndpoint || !preset.subApiKey || !preset.subModel) {
      self._toast('\u8BF7\u5148\u914D\u7F6E\u526F API')
      return
    }

    var memData = this._loadMemData(branchId)
    if (!memData || !memData.facts || memData.facts.length === 0) {
      self._toast('\u65E0\u4E8B\u5B9E\u8BB0\u5FC6\u53EF\u603B\u7ED3\u5173\u7CFB\u8FDB\u5C55')
      return
    }

    var settings = this._loadSettings()

    // 收集当前所有事实记忆的 oneSentence 或 summaryText
    var factsSummary = ''
    for (var i = 0; i < memData.facts.length; i++) {
      var f = memData.facts[i]
      factsSummary += (i + 1) + '. ' + (f.oneSentence || f.summaryText || f.text || '') + '\n'
    }

    // 加上char人设和user人设
    var charText = ''
    if (this.asmData && this.asmData.char) {
      var ch = this.asmData.char
      charText = (ch.persona || ch.bio || ch.description || '')
    }
    var userText = ''
    if (this.asmData && this.asmData.userPersona) {
      var up = this.asmData.userPersona
      userText = (up.persona || up.bio || up.description || '')
    }

    var contextText = ''
    if (charText) {
      contextText += 'char\u4EBA\u8BBE\uFF1A' + charText + '\n\n'
    }
    if (userText) {
      contextText += 'user\u4EBA\u8BBE\uFF1A' + userText + '\n\n'
    }
    contextText += '\u4E8B\u5B9E\u8BB0\u5FC6\u5217\u8868\uFF1A\n' + factsSummary

    var relationshipPrompt = settings.relationshipPrompt || '\u8BF7\u6839\u636E\u4EE5\u4E0B\u4E8B\u5B9E\u8BB0\u5FC6\uFF0C\u603B\u7ED3char\u4E0Euser\u4E4B\u95F4\u7684\u5173\u7CFB\u8FDB\u5C55\u548C\u5267\u60C5\u8FDB\u5C55\u3002\u8FD9\u662F\u6A21\u578B\u5FC5\u987B\u957F\u4E45\u8BB0\u4F4F\u7684\u5185\u5BB9\u3002'

    var prompt = relationshipPrompt + '\n\n' +
      '\u8BF7\u6309\u4EE5\u4E0BJSON\u683C\u5F0F\u8F93\u51FA\uFF1A\n' +
      '{"relationship": "\u5173\u7CFB\u8FDB\u5C55\u603B\u7ED3\u5185\u5BB9"}\n\n' +
      contextText

    self._toast('\u6B63\u5728\u89E6\u53D1\u5173\u7CFB\u8FDB\u5C55\u603B\u7ED3...')

    var url = preset.subEndpoint.replace(/\/+$/, '') + '/chat/completions'
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + preset.subApiKey },
      body: JSON.stringify({
        model: preset.subModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000
      })
    }).then(function(r) {
      return r.json()
    }).then(function(data) {
      if (data.error) {
        self._toast('\u5173\u7CFB\u8FDB\u5C55\u603B\u7ED3\u5931\u8D25: ' + (data.error.message || 'API \u9519\u8BEF'))
        return
      }
      if (!data.choices || !data.choices[0]) {
        self._toast('\u5173\u7CFB\u8FDB\u5C55\u603B\u7ED3\u5931\u8D25\uFF1AAPI \u65E0\u6709\u6548\u54CD\u5E94')
        return
      }
      var content = (data.choices[0].message || {}).content || ''
      if (!content) {
        self._toast('\u5173\u7CFB\u8FDB\u5C55\u603B\u7ED3\u5185\u5BB9\u4E3A\u7A7A')
        return
      }

      // 解析JSON结果
      var relationship = content
      var jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          var parsed = JSON.parse(jsonMatch[0])
          relationship = parsed.relationship || content
        } catch(parseErr) {
          // JSON解析失败，使用原始内容
        }
      }

      // 写入核心记忆的 relationship 字段（覆盖更新）
      if (!memData.core) memData.core = { relationship: '', events: [] }
      memData.core.relationship = relationship
      self._saveMemData(memData, branchId)
      self._toast('\u5173\u7CFB\u8FDB\u5C55\u603B\u7ED3\u5B8C\u6210')
      self._render()
    }).catch(function(err) {
      self._toast('\u5173\u7CFB\u8FDB\u5C55\u603B\u7ED3\u5931\u8D25: ' + (err.message || '\u7F51\u7EDC\u9519\u8BEF'))
    })
  }

  /* ════════════════════════════════════════════════════════════
     悬浮球
     ════════════════════════════════════════════════════════════ */

  P._renderFloatingBall = function() {
    var self = this
    var fab = document.createElement('div')
    fab.className = 'pua-fab'

    var btn = document.createElement('button')
    btn.className = 'pua-fab-btn'
    btn.textContent = '\u26A1'
    fab.appendChild(btn)

    // ── Free drag with boundary clamping ──
    var isDragging = false
    var dragStartX = 0, dragStartY = 0
    var fabStartX = 0, fabStartY = 0
    var hasMoved = false

    // Restore saved position (clamped to screen)
    var savedPos = this._fabPos || null
    if (savedPos) {
      var clampX = Math.max(0, Math.min(window.innerWidth - 44, savedPos.x))
      var clampY = Math.max(0, Math.min(window.innerHeight - 44, savedPos.y))
      fab.style.left = clampX + 'px'
      fab.style.top = clampY + 'px'
      fab.style.right = 'auto'
      fab.style.bottom = 'auto'
    }

    function clampPos(x, y) {
      return {
        x: Math.max(0, Math.min(window.innerWidth - 44, x)),
        y: Math.max(0, Math.min(window.innerHeight - 44, y))
      }
    }

    btn.addEventListener('mousedown', function(e) {
      isDragging = true
      hasMoved = false
      dragStartX = e.clientX
      dragStartY = e.clientY
      var rect = fab.getBoundingClientRect()
      fabStartX = rect.left
      fabStartY = rect.top
      e.preventDefault()
    })
    btn.addEventListener('touchstart', function(e) {
      if (e.touches.length !== 1) return
      isDragging = true
      hasMoved = false
      dragStartX = e.touches[0].clientX
      dragStartY = e.touches[0].clientY
      var rect = fab.getBoundingClientRect()
      fabStartX = rect.left
      fabStartY = rect.top
    }, { passive: true })

    function onMove(cx, cy) {
      var dx = cx - dragStartX
      var dy = cy - dragStartY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true
      var cp = clampPos(fabStartX + dx, fabStartY + dy)
      fab.style.left = cp.x + 'px'
      fab.style.top = cp.y + 'px'
      fab.style.right = 'auto'
      fab.style.bottom = 'auto'
    }
    function onEnd() {
      if (!isDragging) return
      isDragging = false
      var rect = fab.getBoundingClientRect()
      var cp = clampPos(rect.left, rect.top)
      self._fabPos = { x: cp.x, y: cp.y }
      try { localStorage.setItem('pua_fab_pos', JSON.stringify(self._fabPos)) } catch(e) {}
    }

    document.addEventListener('mousemove', function(e) { if (isDragging) onMove(e.clientX, e.clientY) })
    document.addEventListener('mouseup', onEnd)
    document.addEventListener('touchmove', function(e) { if (isDragging && e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY) }, { passive: true })
    document.addEventListener('touchend', onEnd)

    // Click to toggle menu (only if not dragging)
    btn.addEventListener('click', function(e) {
      if (hasMoved) { e.stopPropagation(); return }
      e.stopPropagation()
      self._fabExpanded = !self._fabExpanded
      menu.classList.toggle('show', self._fabExpanded)
    })

    // ── Menu ──
    var menu = document.createElement('div')
    menu.className = 'pua-fab-menu' + (this._fabExpanded ? ' show' : '')
    menu.style.width = '260px'
    menu.style.maxHeight = '70vh'
    menu.style.overflowY = 'auto'

    // === Tab buttons: 预设 / 正则 / 记忆 ===
    var tabRow = document.createElement('div')
    tabRow.style.cssText = 'display:flex;gap:4px;margin-bottom:8px'
    var tabs = [
      { id: 'presets', label: '\u9884\u8BBE' },
      { id: 'regex', label: '\u6B63\u5219' },
      { id: 'memory', label: '\u53EC\u56DE\u8BB0\u5FC6' }
    ]
    var activeTab = 'presets'
    var tabBtns = {}

    for (var ti = 0; ti < tabs.length; ti++) {
      (function(tab) {
        var tb = document.createElement('button')
        tb.className = 'pua-btn pua-btn-sm' + (tab.id === activeTab ? ' pua-btn-gold' : '')
        tb.textContent = tab.label
        tb.style.flex = '1'
        tb.addEventListener('click', function() {
          activeTab = tab.id
          for (var k in tabBtns) {
            tabBtns[k].className = 'pua-btn pua-btn-sm' + (k === activeTab ? ' pua-btn-gold' : '')
          }
          renderTabContent()
        })
        tabBtns[tab.id] = tb
        tabRow.appendChild(tb)
      })(tabs[ti])
    }
    menu.appendChild(tabRow)

    // Tab content container
    var tabContent = document.createElement('div')
    menu.appendChild(tabContent)

    function renderTabContent() {
      tabContent.innerHTML = ''
      if (activeTab === 'presets') renderPresetsTab()
      else if (activeTab === 'regex') renderRegexTab()
      else if (activeTab === 'memory') renderMemoryTab()
    }

    // === Presets Tab ===
    function renderPresetsTab() {
      var presets = self.presets || []
      if (presets.length === 0) {
        tabContent.innerHTML = '<div style="font-size:10px;color:var(--pua-text-dim);padding:8px">\u65E0\u9884\u8BBE</div>'
        return
      }
      for (var i = 0; i < presets.length; i++) {
        (function(idx) {
          var p = presets[idx]
          var row = document.createElement('div')
          row.className = 'pua-fab-toggle-row'
          row.style.cssText = 'padding:5px 4px;border-bottom:1px solid var(--pua-border)'
          var label = document.createElement('span')
          label.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px'
          label.textContent = p.title || p.name || ('\u9884\u8BBE' + (idx + 1))
          label.title = label.textContent
          var toggleBtn = document.createElement('button')
          toggleBtn.className = 'pua-toggle-item' + (p.on ? ' on' : '')
          toggleBtn.addEventListener('click', function() {
            p.on = !p.on
            toggleBtn.classList.toggle('on', p.on)
            self._savePresets()
            // Rebuild asmOrder if needed
            self._rebuildAsmOrder()
          })
          row.appendChild(label)
          row.appendChild(toggleBtn)
          tabContent.appendChild(row)
        })(i)
      }
    }

    // === Regex Tab ===
    function renderRegexTab() {
      var regexes = self.regexes || []
      if (regexes.length === 0) {
        tabContent.innerHTML = '<div style="font-size:10px;color:var(--pua-text-dim);padding:8px">\u65E0\u6B63\u5219</div>'
        return
      }
      for (var i = 0; i < regexes.length; i++) {
        (function(idx) {
          var rx = regexes[idx]
          var row = document.createElement('div')
          row.className = 'pua-fab-toggle-row'
          row.style.cssText = 'padding:5px 4px;border-bottom:1px solid var(--pua-border)'
          var label = document.createElement('span')
          label.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px'
          label.textContent = rx.name || ('\u6B63\u5219' + (idx + 1))
          label.title = label.textContent
          var typeTag = document.createElement('span')
          typeTag.style.cssText = 'font-size:8px;padding:1px 4px;border-radius:3px;margin-left:4px;background:var(--pua-bg-input);color:var(--pua-text-dim)'
          typeTag.textContent = rx.type || '?'
          var toggleBtn = document.createElement('button')
          toggleBtn.className = 'pua-toggle-item' + (rx.on ? ' on' : '')
          toggleBtn.addEventListener('click', function() {
            rx.on = !rx.on
            toggleBtn.classList.toggle('on', rx.on)
            self._saveRegexes()
          })
          row.appendChild(label)
          row.appendChild(typeTag)
          row.appendChild(toggleBtn)
          tabContent.appendChild(row)
        })(i)
      }
    }

    // === Memory Tab ===
    function renderMemoryTab() {
      var settings = self._loadSettings()
      var memData = self._loadMemData(self.asmBranchId)

      // Recall count slider
      var recallSection = document.createElement('div')
      recallSection.style.cssText = 'margin-bottom:8px'
      var recallTitle = document.createElement('div')
      recallTitle.style.cssText = 'font-size:9px;color:var(--pua-text-dim);margin-bottom:4px;font-weight:600'
      recallTitle.textContent = '\u53EC\u56DE\u8BB0\u5FC6\u6570\u91CF'
      recallSection.appendChild(recallTitle)
      var recallRow = document.createElement('div')
      recallRow.className = 'pua-fab-slider-row'
      var recallVal = settings.recallMaxCount || 8
      recallRow.innerHTML = '<input type="range" class="pua-fab-slider" min="1" max="20" value="' + recallVal + '" style="flex:1"><span style="min-width:20px;text-align:center">' + recallVal + '</span>'
      recallSection.appendChild(recallRow)
      tabContent.appendChild(recallSection)

      var sliderEl = recallRow.querySelector('.pua-fab-slider')
      var sliderValEl = recallRow.querySelector('span')
      if (sliderEl) {
        sliderEl.addEventListener('input', function() {
          sliderValEl.textContent = this.value
          settings.recallMaxCount = parseInt(this.value)
          self._saveSettings(settings)
        })
      }

      // Memory stats
      var factCount = (memData && memData.facts) ? memData.facts.length : 0
      var coreCount = (memData && memData.coreMemory) ? memData.coreMemory.length : 0
      var statsDiv = document.createElement('div')
      statsDiv.style.cssText = 'font-size:9px;color:var(--pua-text-dim);padding:4px 8px;margin-bottom:6px;background:var(--pua-bg-input);border-radius:4px'
      statsDiv.textContent = '\u4E8B\u5B9E\u8BB0\u5FC6: ' + factCount + ' \u6761 | \u6838\u5FC3\u8BB0\u5FC6: ' + coreCount + ' \u5B57'
      tabContent.appendChild(statsDiv)

      // Manual summarize buttons
      var sumTitle = document.createElement('div')
      sumTitle.style.cssText = 'font-size:9px;color:var(--pua-text-dim);margin-bottom:4px;font-weight:600'
      sumTitle.textContent = '\u624B\u52A8\u603B\u7ED3'
      tabContent.appendChild(sumTitle)

      var btnRow = document.createElement('div')
      btnRow.style.cssText = 'display:flex;gap:4px'

      var sumFactBtn = document.createElement('button')
      sumFactBtn.className = 'pua-btn pua-btn-sm'
      sumFactBtn.textContent = '\u603B\u7ED3\u4E8B\u5B9E'
      sumFactBtn.style.flex = '1'
      sumFactBtn.addEventListener('click', function() {
        self._fabExpanded = false
        menu.classList.remove('show')
        var md = self._loadMemData(self.asmBranchId)
        self._summarizeFacts(md, self.asmBranchId, 10, false)
      })
      btnRow.appendChild(sumFactBtn)

      var sumCoreBtn = document.createElement('button')
      sumCoreBtn.className = 'pua-btn pua-btn-sm'
      sumCoreBtn.textContent = '\u603B\u7ED3\u6838\u5FC3'
      sumCoreBtn.style.flex = '1'
      sumCoreBtn.addEventListener('click', function() {
        self._fabExpanded = false
        menu.classList.remove('show')
        self._doSummarizeCore()
      })
      btnRow.appendChild(sumCoreBtn)

      tabContent.appendChild(btnRow)

      // Font size adjustment
      var fontTitle = document.createElement('div')
      fontTitle.style.cssText = 'font-size:9px;color:var(--pua-text-dim);margin:8px 0 4px;font-weight:600'
      fontTitle.textContent = '\u5BF9\u8BDD\u5B57\u4F53\u5927\u5C0F'
      tabContent.appendChild(fontTitle)

      var fontRow = document.createElement('div')
      fontRow.className = 'pua-fab-slider-row'
      var fontSettings = self._loadSettings()
      var savedFontSize = fontSettings.convFontSize || 14
      fontRow.innerHTML = '<input type="range" class="pua-fab-slider" min="10" max="24" value="' + savedFontSize + '" style="flex:1"><span style="min-width:28px;text-align:center">' + savedFontSize + 'px</span>'
      tabContent.appendChild(fontRow)

      var fontSlider = fontRow.querySelector('.pua-fab-slider')
      var fontValEl = fontRow.querySelector('span')
      if (fontSlider) {
        fontSlider.addEventListener('input', function() {
          var size = parseInt(this.value)
          fontValEl.textContent = size + 'px'
          var s = self._loadSettings()
          s.convFontSize = size
          self._saveSettings(s)
          // Apply immediately to conversation messages
          var contentEl = self._contentEl
          if (contentEl) {
            var msgContents = contentEl.querySelectorAll('.pua-conv-msg-content')
            for (var mi = 0; mi < msgContents.length; mi++) {
              msgContents[mi].style.fontSize = size + 'px'
            }
          }
        })
      }
    }

    // Initial render
    renderTabContent()

    fab.appendChild(menu)

    // Close on outside click
    setTimeout(function() {
      document.addEventListener('click', function(e) {
        if (self._fabExpanded && !fab.contains(e.target)) {
          self._fabExpanded = false
          menu.classList.remove('show')
        }
      })
    }, 500)

    return fab
  }

  /* ════════════════════════════════════════════════════════════
     收藏页面
     ════════════════════════════════════════════════════════════ */

  P._loadFavorites = function() {
    try {
      var raw = localStorage.getItem('pua_favorites')
      if (raw) return JSON.parse(raw)
    } catch(e) {}
    return []
  }

  P._saveFavorites = function(favs) {
    try {
      localStorage.setItem('pua_favorites', JSON.stringify(favs))
    } catch(e) {}
  }

  P._renderFavorites = function(titleEl, actionsEl, contentEl) {
    var self = this
    titleEl.textContent = '\u6536\u85CF'
    actionsEl.innerHTML = ''

    var favs = this._loadFavorites()

    // Check which branches still exist
    var branchIds = {}
    for (var bi = 0; bi < this.branches.length; bi++) {
      branchIds[this.branches[bi].id] = true
    }

    if (favs.length === 0) {
      contentEl.innerHTML = '<div class="pua-empty"><div class="pua-empty-icon"></div><div class="pua-empty-text">\u8FD8\u6CA1\u6709\u6536\u85CF\u7684\u6D88\u606F</div></div>'
      return
    }

    var h = ''
    for (var fi = 0; fi < favs.length; fi++) {
      var fav = favs[fi]
      var exists = !!branchIds[fav.branchId]
      fav.conversationExists = exists

      h += '<div class="pua-fav-item" data-fav-id="' + this._escHtml(fav.id) + '">'
      h += '<div class="pua-fav-item-header">'
      h += '<span class="pua-fav-branch">' + this._escHtml(fav.branchName || '\u672A\u77E5\u5206\u652F') + '</span>'
      h += '<span class="pua-fav-floor">#' + (fav.floorNumber || 0) + '</span>'
      h += '<span class="pua-fav-role pua-fav-role-' + (fav.role || 'user') + '">' + (fav.role === 'assistant' ? '\u52A9\u624B' : '\u7528\u6237') + '</span>'
      if (!exists) {
        h += '<span class="pua-fav-warning"> \u5DF2\u5220\u9664</span>'
      }
      h += '</div>'
      h += '<div class="pua-fav-content">' + this._escHtml(fav.content || '') + '</div>'
      if (fav.note) {
        h += '<div class="pua-fav-note"> ' + this._escHtml(fav.note) + '</div>'
      }
      h += '<div class="pua-fav-actions">'
      if (exists) {
        h += '<button class="pua-btn pua-btn-sm" data-fav-action="jump" data-fav-id="' + this._escHtml(fav.id) + '">\u8DF3\u8F6C</button>'
      }
      h += '<button class="pua-btn pua-btn-sm" data-fav-action="note" data-fav-id="' + this._escHtml(fav.id) + '">\u7F16\u8F91\u5907\u6CE8</button>'
      h += '<button class="pua-btn pua-btn-sm pua-btn-danger" data-fav-action="delete" data-fav-id="' + this._escHtml(fav.id) + '">\u5220\u9664</button>'
      h += '</div>'
      h += '</div>'
    }

    contentEl.innerHTML = h

    // Bind actions
    var actionBtns = contentEl.querySelectorAll('[data-fav-action]')
    for (var abi = 0; abi < actionBtns.length; abi++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          var action = btn.getAttribute('data-fav-action')
          var favId = btn.getAttribute('data-fav-id')
          if (action === 'jump') self._jumpToFav(favId)
          else if (action === 'note') self._editFavNote(favId)
          else if (action === 'delete') self._deleteFav(favId)
        })
      })(actionBtns[abi])
    }
  }

  P._jumpToFav = function(favId) {
    var favs = this._loadFavorites()
    var fav = null
    for (var i = 0; i < favs.length; i++) {
      if (favs[i].id === favId) { fav = favs[i]; break }
    }
    if (!fav || !fav.conversationExists) { this._toast('\u65E0\u6CD5\u8DF3\u8F6C\uFF0C\u5206\u652F\u5DF2\u5220\u9664'); return }

    this._convBranchId = fav.branchId
    this._convShowJump = true
    this.currentPage = 'chat'
    var favBranch = null
    for (var fbi = 0; fbi < this.branches.length; fbi++) {
      if (this.branches[fbi].id === fav.branchId) { favBranch = this.branches[fbi]; break }
    }
    this._loadConvMessages(favBranch)
    this._render()

    // Scroll to floor after render
    var self = this
    setTimeout(function() {
      if (self._contentEl) {
        self._scrollToFloor(self._contentEl, fav.floorNumber || 1)
      }
    }, 200)
  }

  P._editFavNote = function(favId) {
    var favs = this._loadFavorites()
    var fav = null
    for (var i = 0; i < favs.length; i++) {
      if (favs[i].id === favId) { fav = favs[i]; break }
    }
    if (!fav) return

    var newNote = prompt('\u7F16\u8F91\u5907\u6CE8:', fav.note || '')
    if (newNote === null) return
    fav.note = newNote
    this._saveFavorites(favs)
    this._renderPage()
  }

  P._deleteFav = function(favId) {
    var favs = this._loadFavorites()
    var newFavs = []
    for (var i = 0; i < favs.length; i++) {
      if (favs[i].id !== favId) newFavs.push(favs[i])
    }
    this._saveFavorites(newFavs)
    this._renderPage()
  }

  /* ════════════════════════════════════════════════════════════
     聊天导出/导入
     ════════════════════════════════════════════════════════════ */

  P._exportChat = function() {
    var self = this
    var msgs = this._convMessages
    if (msgs.length === 0) { this._toast('\u65E0\u6D88\u606F\u53EF\u5BFC\u51FA'); return }

    var h = '<div style="margin-bottom:12px">'
    h += '<div class="pua-field"><div class="pua-field-label">\u5BFC\u51FA\u683C\u5F0F</div></div>'
    h += '<div style="display:flex;flex-direction:column;gap:6px">'
    h += '<label class="pua-check-item checked" data-format="display"><div class="pua-check-box"></div><span class="pua-check-label">\u5C55\u793A\u7248 JSON\uFF08\u4EC5\u5F53\u524D\u7248\u672C\uFF09</span></label>'
    h += '<label class="pua-check-item" data-format="full"><div class="pua-check-box"></div><span class="pua-check-label">\u5B8C\u6574\u7248 JSON\uFF08\u542B\u6240\u6709\u66FF\u4EE3\u7248\u672C\uFF09</span></label>'
    h += '<label class="pua-check-item" data-format="txt"><div class="pua-check-box"></div><span class="pua-check-label">\u7EAF\u6587\u672C TXT</span></label>'
    h += '<label class="pua-check-item" data-format="roche"><div class="pua-check-box"></div><span class="pua-check-label">Roche \u683C\u5F0F</span></label>'
    h += '</div></div>'

    this._openModal('\u5BFC\u51FA\u5BF9\u8BDD', h)

    // Add footer buttons
    var modal = this._modalOverlay
    var modalInner = modal.querySelector('.pua-modal')
    if (modalInner) {
      var oldFooter = modalInner.querySelector('.pua-modal-footer')
      if (oldFooter) oldFooter.remove()
      var footer = document.createElement('div')
      footer.className = 'pua-modal-footer'
      var exportBtn = document.createElement('button')
      exportBtn.className = 'pua-btn pua-btn-gold'
      exportBtn.textContent = '\u5BFC\u51FA'
      exportBtn.addEventListener('click', function() {
        var selected = modal.querySelector('.pua-check-item.checked')
        var format = selected ? selected.getAttribute('data-format') : 'display'
        self._doExportChat(format)
        self._closeModal()
      })
      footer.appendChild(exportBtn)
      modalInner.appendChild(footer)
    }

    // Format selection toggle
    var items = modal.querySelectorAll('.pua-check-item')
    for (var ii = 0; ii < items.length; ii++) {
      (function(item) {
        item.addEventListener('click', function() {
          for (var jj = 0; jj < items.length; jj++) items[jj].classList.remove('checked')
          item.classList.add('checked')
        })
      })(items[ii])
    }
  }

  P._doExportChat = function(format) {
    var msgs = this._convMessages
    var data

    if (format === 'display') {
      var displayMsgs = []
      for (var i = 0; i < msgs.length; i++) {
        var m = msgs[i]
        var content = m.content
        if (m.role === 'assistant' && m.alternatives && m.alternatives.length > 0 && m.activeAltIndex > 0) {
          content = m.alternatives[m.activeAltIndex - 1] || content
        }
        displayMsgs.push({ role: m.role, content: content, timestamp: m.timestamp, floorNumber: m.floorNumber })
      }
      data = JSON.stringify({ version: 1, format: 'display', branchId: this._convBranchId, messages: displayMsgs }, null, 2)
    } else if (format === 'full') {
      data = JSON.stringify({ version: 1, format: 'full', branchId: this._convBranchId, messages: msgs }, null, 2)
    } else if (format === 'txt') {
      var lines = []
      for (var ti = 0; ti < msgs.length; ti++) {
        var tm = msgs[ti]
        var name = tm.role === 'user' ? 'User' : (tm.role === 'assistant' ? 'Assistant' : 'System')
        var tContent = tm.content
        if (tm.role === 'assistant' && tm.alternatives && tm.alternatives.length > 0 && tm.activeAltIndex > 0) {
          tContent = tm.alternatives[tm.activeAltIndex - 1] || tContent
        }
        lines.push(name + ': ' + tContent)
      }
      data = lines.join('\n')
    } else if (format === 'roche') {
      var rocheMsgs = []
      for (var ri = 0; ri < msgs.length; ri++) {
        var rm = msgs[ri]
        var rContent = rm.content
        if (rm.role === 'assistant' && rm.alternatives && rm.alternatives.length > 0 && rm.activeAltIndex > 0) {
          rContent = rm.alternatives[rm.activeAltIndex - 1] || rContent
        }
        rocheMsgs.push({ type: rm.role === 'user' ? 'user' : (rm.role === 'assistant' ? 'model' : 'system'), text: rContent })
      }
      data = JSON.stringify({ messages: rocheMsgs }, null, 2)
    }

    // Download
    var ext = format === 'txt' ? '.txt' : '.json'
    var chatFilename = 'chat_' + (this._convBranchId || 'export') + '_' + new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19) + ext
    this._downloadFile(data, chatFilename, 'text/plain;charset=utf-8')
    this._toast('\u5BFC\u51FA\u6210\u529F')
  }

  P._importChat = function() {
    var self = this
    console.log('[PUA] _importChat called')
    var h = '<div class="pua-field">'
    h += '<div class="pua-field-label">\u9009\u62E9\u6587\u4EF6</div>'
    h += '<input type="file" id="conv-import-file" accept=".json,.txt" style="width:100%;font-size:11px;color:var(--pua-text)">'
    h += '<div class="pua-field-hint">\u652F\u6301 .json \u548C .txt \u683C\u5F0F\uFF0C\u81EA\u52A8\u68C0\u6D4B</div>'
    h += '</div>'
    h += '<div class="pua-field">'
    h += '<div class="pua-field-label">\u5BFC\u5165\u65B9\u5F0F</div>'
    h += '<select class="pua-field-input pua-field-select" id="conv-import-mode">'
    h += '<option value="append">\u8FFD\u52A0\u5230\u5F53\u524D\u5BF9\u8BDD</option>'
    h += '<option value="replace">\u66FF\u6362\u5F53\u524D\u5BF9\u8BDD</option>'
    h += '</select>'
    h += '</div>'
    h += '<div id="conv-import-preview" style="margin-top:8px;font-size:10px;color:var(--pua-text-dim)"></div>'

    this._openModal('\u5BFC\u5165\u5BF9\u8BDD', h)

    var modal = this._modalOverlay
    var modalInner = modal.querySelector('.pua-modal')
    if (modalInner) {
      var oldFooter = modalInner.querySelector('.pua-modal-footer')
      if (oldFooter) oldFooter.remove()
      var footer = document.createElement('div')
      footer.className = 'pua-modal-footer'
      var importBtn = document.createElement('button')
      importBtn.className = 'pua-btn pua-btn-gold'
      importBtn.textContent = '\u5BFC\u5165'
      importBtn.addEventListener('click', function() {
        var fileInput = modal.querySelector('#conv-import-file')
        var mode = (modal.querySelector('#conv-import-mode') || {}).value || 'append'
        if (fileInput && fileInput.files.length > 0) {
          self._doImportChat(fileInput.files[0], mode)
        } else {
          self._toast('\u8BF7\u9009\u62E9\u6587\u4EF6')
        }
      })
      footer.appendChild(importBtn)
      modalInner.appendChild(footer)
    }

    // Preview on file select
    var fileInput = modal.querySelector('#conv-import-file')
    if (fileInput) {
      fileInput.addEventListener('change', function() {
        var preview = modal.querySelector('#conv-import-preview')
        if (!preview || !this.files.length) return
        var file = this.files[0]
        var reader = new FileReader()
        reader.onload = function() {
          var text = reader.result
          var count = 0
          if (file.name.endsWith('.json')) {
            try {
              var json = JSON.parse(text)
              count = (json.messages || []).length
            } catch(e) { count = -1 }
          } else {
            var lines = text.split('\n')
            for (var li = 0; li < lines.length; li++) {
              if (lines[li].match(/^.+?[:\uff1a]\s*.+$/)) count++
            }
          }
          if (count >= 0) {
            preview.textContent = '\u9884\u89C8: ' + count + ' \u6761\u6D88\u606F'
          } else {
            preview.textContent = '\u65E0\u6CD5\u89E3\u6790\u8BE5\u6587\u4EF6'
          }
        }
        reader.readAsText(file)
      })
    }
  }

  P._doImportChat = function(file, mode) {
    var self = this
    var reader = new FileReader()
    reader.onload = function() {
      var text = reader.result
      var importedMsgs = []

      if (file.name.endsWith('.json')) {
        try {
          var json = JSON.parse(text)
          var rawMsgs = json.messages || []
          for (var i = 0; i < rawMsgs.length; i++) {
            var rm = rawMsgs[i]
            var role = rm.role || rm.type || 'user'
            if (role === 'model') role = 'assistant'
            var content = rm.content || rm.text || ''
            var msg = self._createMessage(role, content, 'offline')
            importedMsgs.push(msg)
          }
        } catch(e) {
          self._toast('JSON \u89E3\u6790\u5931\u8D25')
          return
        }
      } else {
        importedMsgs = self._parseOfflineMessages(text)
      }

      if (importedMsgs.length === 0) {
        self._toast('\u672A\u627E\u5230\u53EF\u5BFC\u5165\u7684\u6D88\u606F')
        return
      }

      if (mode === 'replace') {
        self._convMessages = importedMsgs
      } else {
        // Append
        for (var ai = 0; ai < importedMsgs.length; ai++) {
          self._convMessages.push(importedMsgs[ai])
        }
      }

      // Re-assign floor numbers
      for (var fi = 0; fi < self._convMessages.length; fi++) {
        self._convMessages[fi].floorNumber = fi + 1
      }

      self._saveConvMessages()
      self._closeModal()
      self._renderPage()
      self._toast('\u5DF2\u5BFC\u5165 ' + importedMsgs.length + ' \u6761\u6D88\u606F')
    }
    reader.readAsText(file)
  }

  /* ════════════════════════════════════════════════════════════
     美化/主题系统
     ════════════════════════════════════════════════════════════ */

  P._loadThemes = function() {
    var data = this._themeDataCache
    if (data) return data
    try {
      var raw = localStorage.getItem('pua_themes')
      if (raw) {
        data = JSON.parse(raw)
      }
    } catch(e) {}
    if (!data || !data.themes) {
      data = { themes: [], activeThemeId: '' }
    }
    this._themeDataCache = data
    return data
  }

  P._saveThemes = function(data) {
    this._themeDataCache = data
    try { localStorage.setItem('pua_themes', JSON.stringify(data)) } catch(e) {}
  }

  P._applyThemeCSS = function() {
    var existing = document.getElementById('pua-custom-theme')
    var themeData = this._loadThemes()
    var activeId = themeData.activeThemeId
    var css = ''
    if (activeId) {
      for (var i = 0; i < themeData.themes.length; i++) {
        if (themeData.themes[i].id === activeId) {
          css = themeData.themes[i].css || ''
          break
        }
      }
    }
    if (existing) {
      existing.textContent = css
    } else if (css) {
      var styleTag = document.createElement('style')
      styleTag.id = 'pua-custom-theme'
      styleTag.textContent = css
      document.head.appendChild(styleTag)
    }
  }

  P._renderTheme = function(titleEl, actionsEl, contentEl) {
    var self = this
    titleEl.textContent = '\u7F8E\u5316'
    actionsEl.innerHTML = ''

    var themeData = this._loadThemes()
    var themes = themeData.themes || []
    var activeId = themeData.activeThemeId || ''

    var h = ''

    // 主题选择器
    h += '<div class="pua-settings-group">'
    h += '<div class="pua-settings-title"> \u4E3B\u9898\u9009\u62E9</div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u5F53\u524D\u4E3B\u9898</span>'
    h += '<select class="pua-settings-select" id="theme-select">'
    h += '<option value="">-- \u65E0\u81EA\u5B9A\u4E49\u4E3B\u9898 --</option>'
    for (var ti = 0; ti < themes.length; ti++) {
      h += '<option value="' + themes[ti].id + '"' + (themes[ti].id === activeId ? ' selected' : '') + '>' + self._escHtml(themes[ti].name) + '</option>'
    }
    h += '</select></div>'
    h += '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">'
    h += '<button class="pua-btn pua-btn-sm" id="theme-new">+ \u65B0\u5EFA\u4E3B\u9898</button>'
    h += '<button class="pua-btn pua-btn-sm" id="theme-rename">\u91CD\u547D\u540D</button>'
    h += '<button class="pua-btn pua-btn-sm pua-btn-danger" id="theme-delete">\u5220\u9664</button>'
    h += '<button class="pua-btn pua-btn-sm" id="theme-apply">\u5E94\u7528</button>'
    h += '<button class="pua-btn pua-btn-sm" id="theme-reset">\u6062\u590D\u9ED8\u8BA4</button>'
    h += '</div>'
    h += '</div>'

    // CSS 编辑器
    h += '<div class="pua-settings-group">'
    h += '<div class="pua-settings-title">CSS \u7F16\u8F91\u5668</div>'
    var currentCss = ''
    if (activeId) {
      for (var ci = 0; ci < themes.length; ci++) {
        if (themes[ci].id === activeId) { currentCss = themes[ci].css || ''; break }
      }
    }
    h += '<textarea id="theme-css-editor" style="width:100%;min-height:400px;background:var(--pua-bg-input);border:1px solid var(--pua-border);border-radius:8px;padding:14px 16px;color:var(--pua-text);font-size:12px;font-family:Consolas,Monaco,monospace;line-height:1.7;outline:none;resize:vertical;tab-size:2">' + self._escHtml(currentCss) + '</textarea>'
    h += '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">'
    h += '<button class="pua-btn pua-btn-sm pua-btn-gold" id="theme-save">\u4FDD\u5B58</button>'
    h += '<button class="pua-btn pua-btn-sm" id="theme-preview">\u9884\u89C8</button>'
    h += '<button class="pua-btn pua-btn-sm" id="theme-export">\u5BFC\u51FA</button>'
    h += '<button class="pua-btn pua-btn-sm" id="theme-import">\u5BFC\u5165</button>'
    h += '</div>'
    h += '<input type="file" id="theme-import-file" accept=".json" style="display:none">'
    h += '</div>'

    contentEl.innerHTML = h

    // 主题选择器事件
    var themeSelect = contentEl.querySelector('#theme-select')
    if (themeSelect) {
      themeSelect.addEventListener('change', function() {
        var selId = this.value
        var editorEl = contentEl.querySelector('#theme-css-editor')
        if (!selId || !editorEl) { if (editorEl) editorEl.value = ''; return }
        var td = self._loadThemes()
        for (var i = 0; i < td.themes.length; i++) {
          if (td.themes[i].id === selId) { editorEl.value = td.themes[i].css || ''; break }
        }
      })
    }

    // 新建主题
    var newBtn = contentEl.querySelector('#theme-new')
    if (newBtn) {
      newBtn.addEventListener('click', function() {
        var name = prompt('\u8F93\u5165\u4E3B\u9898\u540D\u79F0:', '\u65B0\u4E3B\u9898')
        if (!name) return
        var td = self._loadThemes()
        var newId = 'theme_' + Date.now()
        td.themes.push({ id: newId, name: name, css: '' })
        td.activeThemeId = newId
        self._saveThemes(td)
        self._applyThemeCSS()
        self._render()
      })
    }

    // 重命名
    var renameBtn = contentEl.querySelector('#theme-rename')
    if (renameBtn) {
      renameBtn.addEventListener('click', function() {
        var selId = themeSelect ? themeSelect.value : ''
        if (!selId) { self._toast('\u8BF7\u5148\u9009\u62E9\u4E3B\u9898'); return }
        var td = self._loadThemes()
        for (var i = 0; i < td.themes.length; i++) {
          if (td.themes[i].id === selId) {
            var newName = prompt('\u65B0\u540D\u79F0:', td.themes[i].name)
            if (newName) { td.themes[i].name = newName; self._saveThemes(td); self._render() }
            break
          }
        }
      })
    }

    // 删除
    var deleteBtn = contentEl.querySelector('#theme-delete')
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        var selId = themeSelect ? themeSelect.value : ''
        if (!selId) { self._toast('\u8BF7\u5148\u9009\u62E9\u4E3B\u9898'); return }
        if (!confirm('\u786E\u5B9A\u5220\u9664\u8BE5\u4E3B\u9898\uFF1F')) return
        var td = self._loadThemes()
        var newThemes = []
        for (var i = 0; i < td.themes.length; i++) {
          if (td.themes[i].id !== selId) newThemes.push(td.themes[i])
        }
        td.themes = newThemes
        if (td.activeThemeId === selId) td.activeThemeId = ''
        self._saveThemes(td)
        self._applyThemeCSS()
        self._render()
      })
    }

    // 应用主题
    var applyBtn = contentEl.querySelector('#theme-apply')
    if (applyBtn) {
      applyBtn.addEventListener('click', function() {
        var selId = themeSelect ? themeSelect.value : ''
        if (!selId) { self._toast('\u8BF7\u5148\u9009\u62E9\u4E3B\u9898'); return }
        var td = self._loadThemes()
        td.activeThemeId = selId
        // 保存编辑器内容到主题
        var editorEl = contentEl.querySelector('#theme-css-editor')
        for (var i = 0; i < td.themes.length; i++) {
          if (td.themes[i].id === selId) {
            td.themes[i].css = editorEl ? editorEl.value : td.themes[i].css
            break
          }
        }
        self._saveThemes(td)
        self._applyThemeCSS()
        self._toast('\u4E3B\u9898\u5DF2\u5E94\u7528')
      })
    }

    // 恢复默认
    var resetBtn = contentEl.querySelector('#theme-reset')
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        var td = self._loadThemes()
        td.activeThemeId = ''
        self._saveThemes(td)
        self._applyThemeCSS()
        self._toast('\u5DF2\u6062\u590D\u9ED8\u8BA4\u4E3B\u9898')
        self._render()
      })
    }

    // 保存
    var saveBtn = contentEl.querySelector('#theme-save')
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        var selId = themeSelect ? themeSelect.value : ''
        if (!selId) { self._toast('\u8BF7\u5148\u9009\u62E9\u6216\u65B0\u5EFA\u4E3B\u9898'); return }
        var editorEl = contentEl.querySelector('#theme-css-editor')
        var td = self._loadThemes()
        for (var i = 0; i < td.themes.length; i++) {
          if (td.themes[i].id === selId) {
            td.themes[i].css = editorEl ? editorEl.value : ''
            break
          }
        }
        self._saveThemes(td)
        self._toast('CSS \u5DF2\u4FDD\u5B58')
      })
    }

    // 预览
    var previewBtn = contentEl.querySelector('#theme-preview')
    if (previewBtn) {
      previewBtn.addEventListener('click', function() {
        var editorEl = contentEl.querySelector('#theme-css-editor')
        if (!editorEl) return
        var existing = document.getElementById('pua-custom-theme')
        if (existing) {
          existing.textContent = editorEl.value
        } else {
          var styleTag = document.createElement('style')
          styleTag.id = 'pua-custom-theme'
          styleTag.textContent = editorEl.value
          document.head.appendChild(styleTag)
        }
        self._toast('\u9884\u89C8\u5DF2\u5E94\u7528\uFF0C\u5237\u65B0\u9875\u9762\u53EF\u6062\u590D')
      })
    }

    // 导出
    var exportBtn = contentEl.querySelector('#theme-export')
    if (exportBtn) {
      exportBtn.addEventListener('click', function() {
        var selId = themeSelect ? themeSelect.value : ''
        if (!selId) { self._toast('\u8BF7\u5148\u9009\u62E9\u4E3B\u9898'); return }
        var td = self._loadThemes()
        var themeObj = null
        for (var i = 0; i < td.themes.length; i++) {
          if (td.themes[i].id === selId) { themeObj = td.themes[i]; break }
        }
        if (!themeObj) return
        var json = JSON.stringify(themeObj, null, 2)
        self._downloadFile(json, (themeObj.name || 'theme') + '.json', 'application/json')
        self._toast('\u4E3B\u9898\u5DF2\u5BFC\u51FA')
      })
    }

    // 导入
    var importBtn = contentEl.querySelector('#theme-import')
    var importFile = contentEl.querySelector('#theme-import-file')
    if (importBtn && importFile) {
      importBtn.addEventListener('click', function() {
        importFile.click()
      })
      importFile.addEventListener('change', function() {
        var file = this.files && this.files[0]
        if (!file) return
        var reader = new FileReader()
        reader.onload = function(e) {
          try {
            var obj = JSON.parse(e.target.result)
            if (!obj.id || !obj.name) { self._toast('\u65E0\u6548\u7684\u4E3B\u9898\u6587\u4EF6'); return }
            var td = self._loadThemes()
            // 避免ID冲突
            var existIds = {}
            for (var i = 0; i < td.themes.length; i++) { existIds[td.themes[i].id] = true }
            if (existIds[obj.id]) { obj.id = 'theme_' + Date.now() }
            td.themes.push({ id: obj.id, name: obj.name, css: obj.css || '' })
            self._saveThemes(td)
            self._toast('\u4E3B\u9898\u5DF2\u5BFC\u5165: ' + obj.name)
            self._render()
          } catch(err) {
            self._toast('\u5BFC\u5165\u5931\u8D25: ' + (err.message || err))
          }
        }
        reader.readAsText(file)
      })
    }
  }

  /* ════════════════════════════════════════════════════════════
     设置页面
     ════════════════════════════════════════════════════════════ */

  P._renderSettings = function(titleEl, actionsEl, contentEl) {
    var self = this
    titleEl.textContent = '\u8BBE\u7F6E'
    actionsEl.innerHTML = ''

    var savedScrollTop = contentEl.scrollTop
    var settings = this._loadSettings()
    var presets = settings.presets || []
    var activeId = settings.activePresetId || ''
    var activePreset = null
    for (var pi = 0; pi < presets.length; pi++) {
      if (presets[pi].id === activeId) { activePreset = presets[pi]; break }
    }
    if (!activePreset && presets.length > 0) {
      activePreset = presets[0]
      activeId = presets[0].id
    }

    var h = ''

    // API 预设选择
    h += '<div class="pua-settings-group">'
    h += '<div class="pua-settings-title">API \u9884\u8BBE</div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u5F53\u524D\u9884\u8BBE</span>'
    h += '<select class="pua-settings-select" id="set-preset-select">'
    for (var si = 0; si < presets.length; si++) {
      h += '<option value="' + presets[si].id + '"' + (presets[si].id === activeId ? ' selected' : '') + '>' + self._escHtml(presets[si].name) + '</option>'
    }
    h += '</select></div>'
    h += '<div style="display:flex;gap:6px;margin-top:4px">'
    h += '<button class="pua-btn pua-btn-sm" id="set-preset-add">+ \u65B0\u5EFA\u9884\u8BBE</button>'
    h += '<button class="pua-btn pua-btn-sm" id="set-preset-rename">\u91CD\u547D\u540D</button>'
    h += '<button class="pua-btn pua-btn-sm pua-btn-danger" id="set-preset-delete">\u5220\u9664</button>'
    h += '</div>'
    h += '</div>'

    // 主 API 配置
    h += '<div class="pua-settings-group">'
    h += '<div class="pua-settings-title">✦ 主 API 配置</div>'
    h += '<div style="font-size:9px;color:var(--pua-accent);margin-bottom:6px;padding:4px 8px;background:var(--pua-accent-glow);border-radius:4px">默认使用 Roche 内置 AI (roche.ai.chat)，留空则自动使用 Roche 当前 AI 配置。如需覆盖可填写以下配置。</div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">接口地址</span>'
    h += '<input class="pua-settings-input" id="set-main-endpoint" placeholder="留空使用 Roche 内置 AI" value="' + self._escHtml(activePreset ? activePreset.mainEndpoint : '') + '"></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">API Key</span>'
    h += '<input class="pua-settings-input" id="set-main-key" type="password" placeholder="留空使用 Roche 内置 AI" value="' + self._escHtml(activePreset ? activePreset.mainApiKey : '') + '"></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">模型</span>'
    h += '<select class="pua-settings-select" id="set-main-model-select"><option value="">请先刷新</option></select>'
    h += '<input class="pua-settings-input" id="set-main-model" placeholder="或手动输入模型名" value="' + self._escHtml(activePreset ? activePreset.mainModel : '') + '" style="margin-top:4px">'
    h += '</div>'
    h += '<div style="display:flex;gap:6px;margin-top:4px">'
    h += '<button class="pua-btn pua-btn-sm" id="set-main-refresh">刷新模型</button>'
    h += '<button class="pua-btn pua-btn-sm" id="set-main-test">测试调用</button>'
    h += '</div>'
    h += '<div id="set-main-status" style="font-size:9px;color:var(--pua-text-dim);margin-top:4px"></div>'
    h += '</div>'

    // 副 API 配置
    h += '<div class="pua-settings-group">'
    h += '<div class="pua-settings-title">\u526F API \u914D\u7F6E</div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u63A5\u53E3\u5730\u5740</span>'
    h += '<input class="pua-settings-input" id="set-sub-endpoint" placeholder="https://api.example.com/v1" value="' + self._escHtml(activePreset ? activePreset.subEndpoint : '') + '"></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">API Key</span>'
    h += '<input class="pua-settings-input" id="set-sub-key" type="password" placeholder="sk-..." value="' + self._escHtml(activePreset ? activePreset.subApiKey : '') + '"></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u6A21\u578B</span>'
    h += '<select class="pua-settings-select" id="set-sub-model-select"><option value="">\u8BF7\u5148\u5237\u65B0</option></select>'
    h += '<input class="pua-settings-input" id="set-sub-model" placeholder="\u6216\u624B\u52A8\u8F93\u5165\u6A21\u578B\u540D" value="' + self._escHtml(activePreset ? activePreset.subModel : '') + '" style="margin-top:4px">'
    h += '</div>'
    h += '<div style="display:flex;gap:6px;margin-top:4px">'
    h += '<button class="pua-btn pua-btn-sm" id="set-sub-refresh">\u5237\u65B0\u6A21\u578B</button>'
    h += '<button class="pua-btn pua-btn-sm" id="set-sub-test">\u6D4B\u8BD5\u8C03\u7528</button>'
    h += '</div>'
    h += '<div id="set-sub-status" style="font-size:9px;color:var(--pua-text-dim);margin-top:4px"></div>'
    h += '</div>'

    // 向量 API 配置
    h += '<div class="pua-settings-group">'
    h += '<div class="pua-settings-title">\u5411\u91CF API \u914D\u7F6E</div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u63A5\u53E3\u5730\u5740</span>'
    h += '<input class="pua-settings-input" id="set-vec-endpoint" placeholder="https://api.example.com/v1" value="' + self._escHtml(activePreset ? activePreset.vecEndpoint : '') + '"></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">API Key</span>'
    h += '<input class="pua-settings-input" id="set-vec-key" type="password" placeholder="sk-..." value="' + self._escHtml(activePreset ? activePreset.vecApiKey : '') + '"></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u6A21\u578B</span>'
    h += '<select class="pua-settings-select" id="set-vec-model-select"><option value="">\u8BF7\u5148\u5237\u65B0</option></select>'
    h += '<input class="pua-settings-input" id="set-vec-model" placeholder="\u6216\u624B\u52A8\u8F93\u5165\u6A21\u578B\u540D" value="' + self._escHtml(activePreset ? activePreset.vecModel : '') + '" style="margin-top:4px">'
    h += '</div>'
    h += '<div style="display:flex;gap:6px;margin-top:4px">'
    h += '<button class="pua-btn pua-btn-sm" id="set-vec-refresh">\u5237\u65B0\u6A21\u578B</button>'
    h += '<button class="pua-btn pua-btn-sm" id="set-vec-test">\u6D4B\u8BD5\u8C03\u7528</button>'
    h += '</div>'
    h += '<div id="set-vec-status" style="font-size:9px;color:var(--pua-text-dim);margin-top:4px"></div>'
    h += '</div>'

    // 记忆参数（全局）
    h += '<div class="pua-settings-group">'
    h += '<div class="pua-settings-title">\u8BB0\u5FC6\u53C2\u6570</div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u6BCF\u8F6E\u53D1\u9001\u4E8B\u5B9E\u8BB0\u5FC6</span>'
    h += '<input class="pua-settings-input" id="set-mem-fact-send" type="number" min="1" max="100" value="' + (settings.factSendCount || 10) + '" style="width:80px;flex:none">'
    h += '<span style="font-size:10px;color:var(--pua-text-dim)">\u6761</span></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u53EC\u56DE\u8BB0\u5FC6\u4E0A\u9650</span>'
    h += '<input class="pua-settings-input" id="set-mem-recall-max" type="number" min="1" max="20" value="' + (settings.recallMaxCount || 8) + '" style="width:80px;flex:none">'
    h += '<span style="font-size:10px;color:var(--pua-text-dim)">\u6761</span></div>'
    h += '<div class="pua-settings-toggle-row"><span class="pua-settings-toggle-label">\u53EC\u56DE\u65B9\u5F0F</span>'
    h += '<select class="pua-settings-select" id="set-mem-recall-mode">'
    h += '<option value="vector"' + (settings.recallMode === 'vector' ? ' selected' : '') + '>\u5411\u91CF\u68C0\u7D22\uFF08\u4FBF\u5B9C\uFF09</option>'
    h += '<option value="subapi"' + (settings.recallMode === 'subapi' ? ' selected' : '') + '>\u526F API \u53EC\u56DE\uFF08\u7CBE\u51C6\u4F46\u66F4\u8D35\uFF09</option>'
    h += '</select></div>'
    h += '</div>'

    // 记忆总结设置
    h += '<div class="pua-settings-group">'
    h += '<div class="pua-settings-title">\u8BB0\u5FC6\u603B\u7ED3\u8BBE\u7F6E</div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u81EA\u52A8\u603B\u7ED3\u95F4\u9694\u697C\u5C42</span>'
    h += '<input class="pua-settings-input" id="set-mem-summarize-interval" type="number" min="1" max="200" value="' + (settings.summarizeInterval || 30) + '" style="width:80px;flex:none">'
    h += '<span style="font-size:10px;color:var(--pua-text-dim)">\u5C42</span></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u4E00\u53E5\u8BDD\u6458\u8981\u63D0\u793A\u8BCD</span>'
    h += '<input class="pua-settings-input" id="set-one-sentence-prompt" placeholder="\u4E00\u53E5\u8BDD\u6458\u8981\u63D0\u793A\u8BCD" value="' + self._escHtml(settings.oneSentencePrompt || '') + '"></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u5173\u952E\u8BCD\u63D0\u793A\u8BCD</span>'
    h += '<input class="pua-settings-input" id="set-keywords-prompt" placeholder="\u5173\u952E\u8BCD\u63D0\u793A\u8BCD" value="' + self._escHtml(settings.keywordsPrompt || '') + '"></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u603B\u7ED3\u5185\u5BB9\u63D0\u793A\u8BCD</span>'
    h += '<input class="pua-settings-input" id="set-summary-content-prompt" placeholder="\u603B\u7ED3\u5185\u5BB9\u63D0\u793A\u8BCD" value="' + self._escHtml(settings.summaryContentPrompt || '') + '"></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u6279\u6B21\u4E00\u53E5\u8BDD\u6458\u8981\u63D0\u793A\u8BCD</span>'
    h += '<input class="pua-settings-input" id="set-batch-one-sentence-prompt" placeholder="\u6279\u6B21\u4E00\u53E5\u8BDD\u6458\u8981\u63D0\u793A\u8BCD" value="' + self._escHtml(settings.batchOneSentencePrompt || '') + '"></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u6279\u6B21\u5173\u952E\u8BCD\u63D0\u793A\u8BCD</span>'
    h += '<input class="pua-settings-input" id="set-batch-keywords-prompt" placeholder="\u6279\u6B21\u5173\u952E\u8BCD\u63D0\u793A\u8BCD" value="' + self._escHtml(settings.batchKeywordsPrompt || '') + '"></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u5173\u7CFB\u8FDB\u5C55\u63D0\u793A\u8BCD</span>'
    h += '<input class="pua-settings-input" id="set-relationship-prompt" placeholder="\u5173\u7CFB\u8FDB\u5C55\u63D0\u793A\u8BCD" value="' + self._escHtml(settings.relationshipPrompt || '') + '"></div>'
    h += '<div class="pua-settings-toggle-row"><span class="pua-settings-toggle-label">\u804A\u5929\u8BB0\u5F55\u8FC7\u6EE4\u65B9\u5F0F</span>'
    h += '<select class="pua-settings-select" id="set-summary-filter-mode">'
    h += '<option value="none"' + (settings.summaryFilterMode === 'none' ? ' selected' : '') + '>\u4E0D\u8FC7\u6EE4</option>'
    h += '<option value="preset"' + (settings.summaryFilterMode === 'preset' ? ' selected' : '') + '>\u9884\u8BBE\u6B63\u5219\u8FC7\u6EE4</option>'
    h += '<option value="custom"' + (settings.summaryFilterMode === 'custom' ? ' selected' : '') + '>\u81EA\u5B9A\u4E49\u6B63\u5219\u8FC7\u6EE4</option>'
    h += '</select></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u81EA\u5B9A\u4E49\u6B63\u5219\u6355\u6349\u5F0F</span>'
    h += '<input class="pua-settings-input" id="set-summary-custom-regex" placeholder="\u81EA\u5B9A\u4E49\u6B63\u5219\u8868\u8FBE\u5F0F" value="' + self._escHtml(settings.summaryCustomRegex || '') + '"></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u6838\u5FC3\u8BB0\u5FC6\u5173\u7CFB\u8FDB\u5C55\u5B57\u6570\u9650\u5236</span>'
    h += '<input class="pua-settings-input" id="set-mem-core-limit" type="number" min="100" max="10000" value="' + (settings.coreCharLimit || 2000) + '" style="width:80px;flex:none">'
    h += '<span style="font-size:10px;color:var(--pua-text-dim)">\u5B57</span></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u4E8B\u4EF6\u6458\u8981\u5B57\u6570\u9650\u5236</span>'
    h += '<input class="pua-settings-input" id="set-mem-events-limit" type="number" min="100" max="10000" value="' + (settings.eventsCharLimit || 1000) + '" style="width:80px;flex:none">'
    h += '<span style="font-size:10px;color:var(--pua-text-dim)">\u5B57</span></div>'
    h += '</div>'

    // 悬浮球设置
    h += '<div class="pua-settings-group">'
    h += '<div class="pua-settings-title">\u60AC\u6D6E\u7403</div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u60AC\u6D6E\u7403\u4F4D\u7F6E</span>'
    h += '<button class="pua-btn pua-btn-sm" id="set-fab-reset">\u91CD\u7F6E\u4F4D\u7F6E</button></div>'
    h += '</div>'

    // 界面适配（安全区域）
    h += '<div class="pua-settings-group">'
    h += '<div class="pua-settings-title">\u754C\u9762\u9002\u914D</div>'
    h += '<div style="font-size:9px;color:var(--pua-text-dim);margin-bottom:8px">\u8C03\u6574\u9876\u680F/\u5E95\u680F\u7684\u5B89\u5168\u533A\u57DF\u504F\u79FB\uFF0C\u9002\u914D\u5F02\u5F62\u5C4F\u624B\u673A\u3002\u7559\u7A7A=\u81EA\u52A8\u8DDF\u968F\u7CFB\u7EDF\u5B89\u5168\u533A\u57DF\u3002</div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u9876\u680F\u504F\u79BB</span>'
    h += '<input class="pua-settings-input" id="set-safe-top" type="number" min="-1" max="100" placeholder="\u7559\u7A7A=\u81EA\u52A8" value="' + (settings.safeTop != null ? settings.safeTop : '') + '" style="width:80px;flex:none">'
    h += '<span style="font-size:10px;color:var(--pua-text-dim)">px</span></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u5E95\u680F\u504F\u79BB</span>'
    h += '<input class="pua-settings-input" id="set-safe-bottom" type="number" min="-1" max="100" placeholder="\u7559\u7A7A=\u81EA\u52A8" value="' + (settings.safeBottom != null ? settings.safeBottom : '') + '" style="width:80px;flex:none">'
    h += '<span style="font-size:10px;color:var(--pua-text-dim)">px</span></div>'
    h += '<div class="pua-settings-hint">\u63D0\u793A\uFF1A\u9876\u680F\u504F\u79FB\u5E94\u7528\u4E8E\u4E3B\u9875\u9876\u680F\u4E0E\u5BF9\u8BDD\u9876\u680F\uFF1B\u5E95\u680F\u504F\u79FB\u5E94\u7528\u4E8E\u8F93\u5165\u6846\u5E95\u90E8\u3002\u4F7F\u7528 -1 \u53EF\u5F3A\u5236\u6E05\u96F6\u3002</div>'
    h += '</div>'

    // 导出诊断
    h += '<div class="pua-settings-group">'
    h += '<div class="pua-settings-title">\u5BFC\u51FA\u8BCA\u65AD</div>'
    h += '<div style="font-size:9px;color:var(--pua-text-dim);margin-bottom:8px">\u68C0\u6D4B\u5F53\u524D\u73AF\u5883\u652F\u6301\u7684\u5BFC\u51FA\u65B9\u5F0F\uFF0C\u5E2E\u52A9\u8BCA\u65AD APK/Web \u5BFC\u51FA\u95EE\u9898</div>'
    h += '<div style="display:flex;gap:6px">'
    h += '<button class="pua-btn pua-btn-sm" id="set-detect-export">\u68C0\u6D4B\u5BFC\u51FA\u80FD\u529B</button>'
    h += '</div>'
    h += '<div id="set-export-report" style="font-size:9px;color:var(--pua-text-dim);margin-top:8px;white-space:pre-wrap;word-break:break-all;max-height:200px;overflow-y:auto;display:none;background:var(--pua-bg-input);border:1px solid var(--pua-border);border-radius:6px;padding:8px"></div>'
    h += '</div>'

    // \u4FDD\u5B58\u6309\u94AE
    h += '<div style="text-align:right;margin-top:6px">'
    h += '<button class="pua-btn pua-btn-gold" id="set-save-btn">\u4FDD\u5B58\u8BBE\u7F6E</button>'
    h += '</div>'

    contentEl.innerHTML = h
    contentEl.scrollTop = savedScrollTop

    // ===== 事件绑定 =====

    // 预设切换
    var presetSelect = contentEl.querySelector('#set-preset-select')
    if (presetSelect) {
      presetSelect.addEventListener('change', function() {
        settings.activePresetId = this.value
        self._saveSettings(settings)
        self._render()
      })
    }

    // 新建预设
    var presetAddBtn = contentEl.querySelector('#set-preset-add')
    if (presetAddBtn) {
      presetAddBtn.addEventListener('click', function() {
        var name = prompt('\u8BF7\u8F93\u5165\u9884\u8BBE\u540D\u79F0', '\u65B0\u9884\u8BBE')
        if (!name) return
        var newPreset = {
          id: 'preset-' + Date.now(),
          name: name,
          mainEndpoint: '', mainApiKey: '', mainModel: '',
          subEndpoint: '', subApiKey: '', subModel: '',
          vecEndpoint: '', vecApiKey: '', vecModel: ''
        }
        settings.presets.push(newPreset)
        settings.activePresetId = newPreset.id
        self._saveSettings(settings)
        self._render()
      })
    }

    // 重命名预设
    var presetRenameBtn = contentEl.querySelector('#set-preset-rename')
    if (presetRenameBtn) {
      presetRenameBtn.addEventListener('click', function() {
        var cur = settings.activePresetId
        var p = null
        for (var ri = 0; ri < settings.presets.length; ri++) {
          if (settings.presets[ri].id === cur) { p = settings.presets[ri]; break }
        }
        if (!p) return
        var name = prompt('\u91CD\u547D\u540D\u9884\u8BBE', p.name)
        if (!name) return
        p.name = name
        self._saveSettings(settings)
        self._render()
      })
    }

    // 删除预设
    var presetDeleteBtn = contentEl.querySelector('#set-preset-delete')
    if (presetDeleteBtn) {
      presetDeleteBtn.addEventListener('click', function() {
        if (settings.presets.length <= 1) { self._toast('\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u9884\u8BBE'); return }
        if (!confirm('\u786E\u5B9A\u5220\u9664\u5F53\u524D\u9884\u8BBE\uFF1F')) return
        var cur = settings.activePresetId
        var newPresets = []
        for (var di = 0; di < settings.presets.length; di++) {
          if (settings.presets[di].id !== cur) newPresets.push(settings.presets[di])
        }
        settings.presets = newPresets
        settings.activePresetId = settings.presets[0] ? settings.presets[0].id : ''
        self._saveSettings(settings)
        self._render()
      })
    }

    // 刷新主API模型
    var mainRefreshBtn = contentEl.querySelector('#set-main-refresh')
    if (mainRefreshBtn) {
      mainRefreshBtn.addEventListener('click', function() {
        var endpoint = (contentEl.querySelector('#set-main-endpoint') || {}).value || ''
        var apiKey = (contentEl.querySelector('#set-main-key') || {}).value || ''
        if (!endpoint || !apiKey) { self._toast('\u8BF7\u5148\u586B\u5199\u63A5\u53E3\u5730\u5740\u548C API Key'); return }
        var statusEl = contentEl.querySelector('#set-main-status')
        if (statusEl) statusEl.textContent = '\u5237\u65B0\u4E2D...'
        var url = endpoint.replace(/\/+$/, '') + '/models'
        fetch(url, { headers: { 'Authorization': 'Bearer ' + apiKey } }).then(function(r) { return r.json() }).then(function(data) {
          var models = data.data || data.models || []
          var select = contentEl.querySelector('#set-main-model-select')
          if (!select) return
          select.innerHTML = '<option value="">\u9009\u62E9\u6A21\u578B</option>'
          for (var mi = 0; mi < models.length; mi++) {
            var m = models[mi]
            var mId = m.id || m.model || ''
            if (!mId) continue
            if (mId.indexOf('embed') !== -1 || mId.indexOf('davinci') !== -1) continue
            var opt = document.createElement('option')
            opt.value = mId
            opt.textContent = mId
            select.appendChild(opt)
          }
          if (statusEl) statusEl.textContent = '\u627E\u5230 ' + models.length + ' \u4E2A\u6A21\u578B'
          select.addEventListener('change', function() {
            var modelInput = contentEl.querySelector('#set-main-model')
            if (modelInput) modelInput.value = this.value
          })
        }).catch(function(e) {
          if (statusEl) statusEl.textContent = '\u5237\u65B0\u5931\u8D25: ' + (e.message || e)
        })
      })
    }

    // 测试主API调用
    var mainTestBtn = contentEl.querySelector('#set-main-test')
    if (mainTestBtn) {
      mainTestBtn.addEventListener('click', function() {
        var endpoint = (contentEl.querySelector('#set-main-endpoint') || {}).value || ''
        var apiKey = (contentEl.querySelector('#set-main-key') || {}).value || ''
        var model = (contentEl.querySelector('#set-main-model') || {}).value || ''
        var statusEl = contentEl.querySelector('#set-main-status')
        if (statusEl) statusEl.textContent = '测试中...'

        // If no custom config, test with roche.ai.chat
        if (!endpoint || !apiKey || !model) {
          if (self.roche && self.roche.ai && self.roche.ai.chat) {
            self.roche.ai.chat({
              messages: [{ role: 'user', content: 'Hi' }],
              max_tokens: 5
            }).then(function(result) {
              var text = (result && result.text) || ''
              if (statusEl) statusEl.textContent = 'Roche 内置 AI 测试成功！回复: ' + text.substring(0, 50)
              self._toast('Roche 内置 AI 测试成功')
            }).catch(function(e) {
              if (statusEl) statusEl.textContent = 'Roche 内置 AI 测试失败: ' + (e.message || e)
            })
          } else {
            self._toast('Roche 内置 AI 不可用，请填写自定义配置')
          }
          return
        }

        var url = endpoint.replace(/\/+$/, '') + '/chat/completions'
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
          body: JSON.stringify({ model: model, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 })
        }).then(function(r) { return r.json() }).then(function(data) {
          if (data.choices && data.choices[0]) {
            if (statusEl) statusEl.textContent = '测试成功！回复: ' + (data.choices[0].message || {}).content
            self._toast('主 API 测试成功')
          } else {
            if (statusEl) statusEl.textContent = '测试失败: ' + (data.error || JSON.stringify(data)).substring(0, 100)
          }
        }).catch(function(e) {
          if (statusEl) statusEl.textContent = '测试失败: ' + (e.message || e)
        })
      })
    }

    // 刷新副API模型
    var subRefreshBtn = contentEl.querySelector('#set-sub-refresh')
    if (subRefreshBtn) {
      subRefreshBtn.addEventListener('click', function() {
        var endpoint = (contentEl.querySelector('#set-sub-endpoint') || {}).value || ''
        var apiKey = (contentEl.querySelector('#set-sub-key') || {}).value || ''
        if (!endpoint || !apiKey) { self._toast('\u8BF7\u5148\u586B\u5199\u63A5\u53E3\u5730\u5740\u548C API Key'); return }
        var statusEl = contentEl.querySelector('#set-sub-status')
        if (statusEl) statusEl.textContent = '\u5237\u65B0\u4E2D...'
        var url = endpoint.replace(/\/+$/, '') + '/models'
        fetch(url, { headers: { 'Authorization': 'Bearer ' + apiKey } }).then(function(r) { return r.json() }).then(function(data) {
          var models = data.data || data.models || []
          var select = contentEl.querySelector('#set-sub-model-select')
          if (!select) return
          select.innerHTML = '<option value="">\u9009\u62E9\u6A21\u578B</option>'
          for (var mi = 0; mi < models.length; mi++) {
            var m = models[mi]
            var mId = m.id || m.model || ''
            if (!mId) continue
            if (mId.indexOf('embed') !== -1 || mId.indexOf('davinci') !== -1) continue
            var opt = document.createElement('option')
            opt.value = mId
            opt.textContent = mId
            select.appendChild(opt)
          }
          if (statusEl) statusEl.textContent = '\u627E\u5230 ' + models.length + ' \u4E2A\u6A21\u578B'
          select.addEventListener('change', function() {
            var modelInput = contentEl.querySelector('#set-sub-model')
            if (modelInput) modelInput.value = this.value
          })
        }).catch(function(e) {
          if (statusEl) statusEl.textContent = '\u5237\u65B0\u5931\u8D25: ' + (e.message || e)
        })
      })
    }

    // 测试副API调用
    var subTestBtn = contentEl.querySelector('#set-sub-test')
    if (subTestBtn) {
      subTestBtn.addEventListener('click', function() {
        var endpoint = (contentEl.querySelector('#set-sub-endpoint') || {}).value || ''
        var apiKey = (contentEl.querySelector('#set-sub-key') || {}).value || ''
        var model = (contentEl.querySelector('#set-sub-model') || {}).value || ''
        if (!endpoint || !apiKey || !model) { self._toast('\u8BF7\u5148\u586B\u5199\u5B8C\u6574\u914D\u7F6E'); return }
        var statusEl = contentEl.querySelector('#set-sub-status')
        if (statusEl) statusEl.textContent = '\u6D4B\u8BD5\u4E2D...'
        var url = endpoint.replace(/\/+$/, '') + '/chat/completions'
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
          body: JSON.stringify({ model: model, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 })
        }).then(function(r) { return r.json() }).then(function(data) {
          if (data.choices && data.choices[0]) {
            if (statusEl) statusEl.textContent = '\u6D4B\u8BD5\u6210\u529F\uFF01\u56DE\u590D: ' + (data.choices[0].message || {}).content
            self._toast('\u526F API \u6D4B\u8BD5\u6210\u529F')
          } else {
            if (statusEl) statusEl.textContent = '\u6D4B\u8BD5\u5931\u8D25: ' + (data.error || JSON.stringify(data)).substring(0, 100)
          }
        }).catch(function(e) {
          if (statusEl) statusEl.textContent = '\u6D4B\u8BD5\u5931\u8D25: ' + (e.message || e)
        })
      })
    }

    // 刷新向量API模型
    var vecRefreshBtn = contentEl.querySelector('#set-vec-refresh')
    if (vecRefreshBtn) {
      vecRefreshBtn.addEventListener('click', function() {
        var endpoint = (contentEl.querySelector('#set-vec-endpoint') || {}).value || ''
        var apiKey = (contentEl.querySelector('#set-vec-key') || {}).value || ''
        if (!endpoint || !apiKey) { self._toast('\u8BF7\u5148\u586B\u5199\u63A5\u53E3\u5730\u5740\u548C API Key'); return }
        var statusEl = contentEl.querySelector('#set-vec-status')
        if (statusEl) statusEl.textContent = '\u5237\u65B0\u4E2D...'
        var url = endpoint.replace(/\/+$/, '') + '/models'
        fetch(url, { headers: { 'Authorization': 'Bearer ' + apiKey } }).then(function(r) { return r.json() }).then(function(data) {
          var models = data.data || data.models || []
          var select = contentEl.querySelector('#set-vec-model-select')
          if (!select) return
          select.innerHTML = '<option value="">\u9009\u62E9\u6A21\u578B</option>'
          for (var mi = 0; mi < models.length; mi++) {
            var m = models[mi]
            var mId = m.id || m.model || ''
            if (!mId) continue
            if (mId.indexOf('embed') === -1 && mId.indexOf('e5') === -1 && mId.indexOf('bge') === -1) continue
            var opt = document.createElement('option')
            opt.value = mId
            opt.textContent = mId
            select.appendChild(opt)
          }
          // 如果没有过滤到模型，显示全部
          if (select.options.length <= 1) {
            select.innerHTML = '<option value="">\u9009\u62E9\u6A21\u578B</option>'
            for (var mi2 = 0; mi2 < models.length; mi2++) {
              var m2 = models[mi2]
              var mId2 = m2.id || m2.model || ''
              if (!mId2) continue
              var opt2 = document.createElement('option')
              opt2.value = mId2
              opt2.textContent = mId2
              select.appendChild(opt2)
            }
          }
          if (statusEl) statusEl.textContent = '\u627E\u5230 ' + models.length + ' \u4E2A\u6A21\u578B'
          select.addEventListener('change', function() {
            var modelInput = contentEl.querySelector('#set-vec-model')
            if (modelInput) modelInput.value = this.value
          })
        }).catch(function(e) {
          if (statusEl) statusEl.textContent = '\u5237\u65B0\u5931\u8D25: ' + (e.message || e)
        })
      })
    }

    // 测试向量API调用
    var vecTestBtn = contentEl.querySelector('#set-vec-test')
    if (vecTestBtn) {
      vecTestBtn.addEventListener('click', function() {
        var endpoint = (contentEl.querySelector('#set-vec-endpoint') || {}).value || ''
        var apiKey = (contentEl.querySelector('#set-vec-key') || {}).value || ''
        var model = (contentEl.querySelector('#set-vec-model') || {}).value || ''
        if (!endpoint || !apiKey || !model) { self._toast('\u8BF7\u5148\u586B\u5199\u5B8C\u6574\u914D\u7F6E'); return }
        var statusEl = contentEl.querySelector('#set-vec-status')
        if (statusEl) statusEl.textContent = '\u6D4B\u8BD5\u4E2D...'
        var url = endpoint.replace(/\/+$/, '') + '/embeddings'
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
          body: JSON.stringify({ model: model, input: 'Hello' })
        }).then(function(r) { return r.json() }).then(function(data) {
          if (data.data && data.data[0] && data.data[0].embedding) {
            var dim = data.data[0].embedding.length
            if (statusEl) statusEl.textContent = '\u6D4B\u8BD5\u6210\u529F\uFF01\u5411\u91CF\u7EF4\u5EA6: ' + dim
            self._toast('\u5411\u91CF API \u6D4B\u8BD5\u6210\u529F')
          } else {
            if (statusEl) statusEl.textContent = '\u6D4B\u8BD5\u5931\u8D25: ' + (data.error || JSON.stringify(data)).substring(0, 100)
          }
        }).catch(function(e) {
          if (statusEl) statusEl.textContent = '\u6D4B\u8BD5\u5931\u8D25: ' + (e.message || e)
        })
      })
    }

    // 保存设置
    var saveBtn = contentEl.querySelector('#set-save-btn')
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        // 更新当前预设
        var cur = settings.activePresetId
        var p = null
        for (var si2 = 0; si2 < settings.presets.length; si2++) {
          if (settings.presets[si2].id === cur) { p = settings.presets[si2]; break }
        }
        if (!p) return
        p.mainEndpoint = (contentEl.querySelector('#set-main-endpoint') || {}).value || ''
        p.mainApiKey = (contentEl.querySelector('#set-main-key') || {}).value || ''
        p.mainModel = (contentEl.querySelector('#set-main-model') || {}).value || ''
        p.subEndpoint = (contentEl.querySelector('#set-sub-endpoint') || {}).value || ''
        p.subApiKey = (contentEl.querySelector('#set-sub-key') || {}).value || ''
        p.subModel = (contentEl.querySelector('#set-sub-model') || {}).value || ''
        p.vecEndpoint = (contentEl.querySelector('#set-vec-endpoint') || {}).value || ''
        p.vecApiKey = (contentEl.querySelector('#set-vec-key') || {}).value || ''
        p.vecModel = (contentEl.querySelector('#set-vec-model') || {}).value || ''
        // 全局参数
        settings.factSendCount = parseInt((contentEl.querySelector('#set-mem-fact-send') || {}).value) || 10
        settings.summarizeInterval = parseInt((contentEl.querySelector('#set-mem-summarize-interval') || {}).value) || 30
        settings.coreCharLimit = parseInt((contentEl.querySelector('#set-mem-core-limit') || {}).value) || 2000
        settings.eventsCharLimit = parseInt((contentEl.querySelector('#set-mem-events-limit') || {}).value) || 1000
        settings.recallMaxCount = parseInt((contentEl.querySelector('#set-mem-recall-max') || {}).value) || 8
        settings.recallMode = (contentEl.querySelector('#set-mem-recall-mode') || {}).value || 'vector'
        // 记忆总结设置
        settings.oneSentencePrompt = (contentEl.querySelector('#set-one-sentence-prompt') || {}).value || ''
        settings.keywordsPrompt = (contentEl.querySelector('#set-keywords-prompt') || {}).value || ''
        settings.summaryContentPrompt = (contentEl.querySelector('#set-summary-content-prompt') || {}).value || ''
        settings.batchOneSentencePrompt = (contentEl.querySelector('#set-batch-one-sentence-prompt') || {}).value || ''
        settings.batchKeywordsPrompt = (contentEl.querySelector('#set-batch-keywords-prompt') || {}).value || ''
        settings.relationshipPrompt = (contentEl.querySelector('#set-relationship-prompt') || {}).value || ''
        settings.summaryFilterMode = (contentEl.querySelector('#set-summary-filter-mode') || {}).value || 'none'
        settings.summaryCustomRegex = (contentEl.querySelector('#set-summary-custom-regex') || {}).value || ''
        // 界面适配（安全区域）
        var safeTopVal = (contentEl.querySelector('#set-safe-top') || {}).value
        var safeBottomVal = (contentEl.querySelector('#set-safe-bottom') || {}).value
        settings.safeTop = (safeTopVal === '' || safeTopVal == null) ? null : (parseInt(safeTopVal) || null)
        settings.safeBottom = (safeBottomVal === '' || safeBottomVal == null) ? null : (parseInt(safeBottomVal) || null)
        self._saveSettings(settings)
        self._toast('\u8BBE\u7F6E\u5DF2\u4FDD\u5B58')
      })
    }

    // Reset floating ball position
    var fabResetBtn = contentEl.querySelector('#set-fab-reset')
    if (fabResetBtn) {
      fabResetBtn.addEventListener('click', function() {
        self._fabPos = null
        try { localStorage.removeItem('pua_fab_pos') } catch(e) {}
        self._toast('\u60AC\u6D6E\u7403\u4F4D\u7F6E\u5DF2\u91CD\u7F6E\uFF0C\u5237\u65B0\u540E\u751F\u6548')
      })
    }

    // 导出诊断按钮
    var detectExportBtn = contentEl.querySelector('#set-detect-export')
    if (detectExportBtn) {
      detectExportBtn.addEventListener('click', function() {
        var report = self._detectExportCapabilities()
        var reportEl = contentEl.querySelector('#set-export-report')
        if (reportEl) {
          reportEl.style.display = 'block'
          reportEl.textContent = report
        }
      })
    }
  }

  P._loadSettings = function() {
    if (this._settingsCache) return this._settingsCache
    try {
      var raw = localStorage.getItem('pua-settings')
      if (raw) {
        this._settingsCache = JSON.parse(raw)
        // 确保预设列表存在
        if (!this._settingsCache.presets) {
          this._settingsCache.presets = [{ id: 'preset-default', name: '\u9ED8\u8BA4\u9884\u8BBE', mainEndpoint: '', mainApiKey: '', mainModel: '', subEndpoint: '', subApiKey: '', subModel: '', vecEndpoint: '', vecApiKey: '', vecModel: '' }]
        }
        if (!this._settingsCache.activePresetId) {
          this._settingsCache.activePresetId = this._settingsCache.presets[0].id
        }
        if (!this._settingsCache.eventsCharLimit) {
          this._settingsCache.eventsCharLimit = 1000
        }
        if (this._settingsCache.safeTop === undefined) {
          this._settingsCache.safeTop = null
        }
        if (this._settingsCache.safeBottom === undefined) {
          this._settingsCache.safeBottom = null
        }
        return this._settingsCache
      }
    } catch(e) {}
    this._settingsCache = {
      presets: [{ id: 'preset-default', name: '\u9ED8\u8BA4\u9884\u8BBE', mainEndpoint: '', mainApiKey: '', mainModel: '', subEndpoint: '', subApiKey: '', subModel: '', vecEndpoint: '', vecApiKey: '', vecModel: '' }],
      activePresetId: 'preset-default',
      factSendCount: 10, summarizeInterval: 30,
      coreCharLimit: 2000, eventsCharLimit: 1000, recallMaxCount: 8, recallMode: 'vector',
      renderLimit: 10, contextDepth: 30, autoScroll: false,
      convFontSize: 14, safeTop: null, safeBottom: null,
      oneSentencePrompt: '\u8BF7\u4ECE\u4EE5\u4E0B\u5BF9\u8BDD\u4E2D\u63D0\u53D6\u5173\u952E\u4E8B\u5B9E\uFF0C\u7528\u4E00\u53E5\u8BDD\u6982\u62EC\u6700\u91CD\u8981\u7684\u4E8B\u4EF6\u6216\u4FE1\u606F\u3002',
      keywordsPrompt: '\u8BF7\u4ECE\u4EE5\u4E0B\u5BF9\u8BDD\u4E2D\u63D0\u53D63-5\u4E2A\u5173\u952E\u8BCD\uFF0C\u7528\u9017\u53F7\u5206\u9694\u3002',
      summaryContentPrompt: '\u8BF7\u4ECE\u4EE5\u4E0B\u5BF9\u8BDD\u4E2D\u63D0\u53D6\u5173\u952E\u4E8B\u5B9E\u4FE1\u606F\uFF0C\u8BE6\u7EC6\u603B\u7ED3\u53D1\u751F\u4E86\u4EC0\u4E48\u3002',
      batchOneSentencePrompt: '\u8BF7\u4E3A\u4EE5\u4E0B\u6BCF\u6761\u4E8B\u5B9E\u8BB0\u5FC6\u751F\u6210\u4E00\u53E5\u8BDD\u6458\u8981\uFF0C\u7B80\u660E\u627C\u8981\u5730\u6982\u62EC\u6838\u5FC3\u5185\u5BB9\u3002',
      batchKeywordsPrompt: '\u8BF7\u4E3A\u4EE5\u4E0B\u6BCF\u6761\u4E8B\u5B9E\u8BB0\u5FC6\u63D0\u53D63-5\u4E2A\u5173\u952E\u8BCD\uFF0C\u7528\u9017\u53F7\u5206\u9694\u3002',
      relationshipPrompt: '\u8BF7\u6839\u636E\u4EE5\u4E0B\u4E8B\u5B9E\u8BB0\u5FC6\uFF0C\u603B\u7ED3char\u4E0Euser\u4E4B\u95F4\u7684\u5173\u7CFB\u8FDB\u5C55\u548C\u5267\u60C5\u8FDB\u5C55\u3002\u8FD9\u662F\u6A21\u578B\u5FC5\u987B\u957F\u4E45\u8BB0\u4F4F\u7684\u5185\u5BB9\u3002',
      summaryFilterMode: 'none',
      summaryCustomRegex: '',
      charPrompt: '\u8FD9\u662Fchar\u7684\u4EBA\u8BBE[\u5C55\u5F00/\u6298\u53E0]\uFF1A\n{content}\n\u9700\u5B8C\u6574\u7406\u89E3\u5E76\u5185\u5316\u89D2\u8272\u7684\u6240\u6709\u8BBE\u5B9A\u4FE1\u606F\uFF0C\u786E\u4FDD\u5728\u4E92\u52A8\u4E2D\u59CB\u7EC8\u4FDD\u6301\u89D2\u8272\u8BBE\u5B9A\u7684\u4E00\u81F4\u6027\u4E0E\u8FDE\u8D2F\u6027\u3002',
      userPrompt: '\u8FD9\u662Fuser\u7684\u4EBA\u8BBE[\u5C55\u5F00/\u6298\u53E0]\uFF1A\n{content}\n\u4E25\u683C\u9075\u5B88\u7528\u6237\u4EBA\u8BBE\u8FB9\u754C\uFF0C\u7EDD\u5BF9\u7981\u6B62\u4EE3\u66FF\u7528\u6237\u6267\u884C\u4EFB\u4F55\u64CD\u4F5C\uFF0C\u6240\u6709\u4EA4\u4E92\u5FC5\u987B\u5C0A\u91CD\u7528\u6237\u4EBA\u8BBE\u8BBE\u5B9A\u7684\u884C\u4E3A\u6A21\u5F0F\u4E0E\u504F\u597D\u3002',
      chatPrompt: '\u8FD9\u662Fuser\u4E0Echar\u4E4B\u524D\u7684\u7ECF\u5386[\u5C55\u5F00/\u6298\u53E0]\uFF1A\n{content}\n\u5FC5\u987B\u7262\u8BB0\u6240\u6709\u5386\u53F2\u4EA4\u4E92\u4FE1\u606F\uFF0C\u7406\u89E3\u5E76\u627F\u8BA4\u8FD9\u4E9B\u4E3A\u5DF2\u53D1\u751F\u7684\u65E2\u5B9A\u4E8B\u5B9E\uFF0C\u5728\u540E\u7EED\u4EA4\u4E92\u4E2D\u9700\u81EA\u7136\u878D\u5165\u5386\u53F2\u4FE1\u606F\uFF0C\u907F\u514D\u673A\u68B0\u91CD\u590D\u6216\u751F\u786C\u5F15\u7528\u3002',
      latestUserPrompt: '\u8FD9\u662Fuser\u7684\u6700\u65B0\u8F93\u5165: {content}\n\u8BF7\u53EA\u56DE\u590Duser\u6700\u65B0\u8F93\u5165\uFF0C\u4E4B\u524D\u7684user\u8F93\u5165\u4E3A\u65E2\u5B9A\u53D1\u751F\u8FC7\u7684\u4E8B\u5B9E\uFF0C\u4E0D\u9700\u8981\u8003\u8651\u3002\u8BF7\u4F9D\u7167\u683C\u5F0F\u89C4\u8303\u8981\u6C42\u8F93\u51FA\u601D\u7EF4\u94FE\u6B63\u6587\u53CA\u5185\u8054\u601D\u7EF4\u94FE\u4EE5\u53CA\u72B6\u6001\u680F\u65E5\u8BB0\u548C\u5C0F\u5267\u573A\u3002'
    }
    return this._settingsCache
  }

  P._saveSettings = function(s) {
    this._settingsCache = s
    try { localStorage.setItem('pua-settings', JSON.stringify(s)) } catch(e) {}
  }

  // 获取当前激活的API预设
  P._getActivePreset = function() {
    var settings = this._loadSettings()
    var presets = settings.presets || []
    var activeId = settings.activePresetId || ''
    for (var i = 0; i < presets.length; i++) {
      if (presets[i].id === activeId) return presets[i]
    }
    return presets[0] || null
  }

  /* ════════════════════════════════════════════════════════════
     记忆系统页面
     ════════════════════════════════════════════════════════════ */

  P._renderMemory = function(titleEl, actionsEl, contentEl) {
    var self = this
    titleEl.textContent = '\u8BB0\u5FC6\u7CFB\u7EDF'
    actionsEl.innerHTML = ''
    try {

    var savedScrollTop = contentEl.scrollTop
    var settings = this._loadSettings()

    // 分支选择器
    var branches = this.branches || []
    var currentBranchId = this._currentMemBranchId || ''

    // 加载当前分支的记忆数据
    var memData = currentBranchId ? this._loadMemData(currentBranchId) : { core: { relationship: '', events: [] }, facts: [] }
    // 最终安全兜底
    if (!memData) memData = { core: { relationship: '', events: [] }, facts: [] }
    if (!memData.core) memData.core = { relationship: '', events: [] }
    if (!memData.core.relationship) memData.core.relationship = ''
    if (!memData.core.events || !Array.isArray(memData.core.events)) memData.core.events = []
    if (!memData.facts || !Array.isArray(memData.facts)) memData.facts = []

    // 统计
    var coreRelLen = (memData.core.relationship || '').length || 0
    var coreEvtLen = 0
    for (var evi = 0; evi < memData.core.events.length; evi++) {
      coreEvtLen += (memData.core.events[evi].text || '').length
    }
    var factCount = memData.facts ? memData.facts.length : 0
    var totalFactChars = 0
    if (memData.facts) {
      for (var fi = 0; fi < memData.facts.length; fi++) {
        totalFactChars += (memData.facts[fi].text || '').length
      }
    }

    var h = ''

    // 分支选择器
    h += '<div class="pua-mem-card" style="margin-bottom:10px">'
    h += '<div class="pua-mem-card-title">\u5F53\u524D\u5206\u652F</div>'
    h += '<select class="pua-settings-select" id="mem-branch-select" style="width:100%">'
    h += '<option value="">-- \u9009\u62E9\u5206\u652F --</option>'
    for (var bi = 0; bi < branches.length; bi++) {
      var br = branches[bi]
      h += '<option value="' + br.id + '"' + (br.id === currentBranchId ? ' selected' : '') + '>' + self._escHtml(br.name || br.charName || br.id) + '</option>'
    }
    h += '</select>'
    h += '</div>'

    // 统计卡片
    h += '<div class="pua-mem-stat">'
    h += '<div class="pua-mem-stat-item"><div class="pua-mem-stat-num">' + coreRelLen + '</div><div class="pua-mem-stat-label">\u5173\u7CFB\u8FDB\u5C55\u5B57\u6570</div></div>'
    h += '<div class="pua-mem-stat-item"><div class="pua-mem-stat-num">' + coreEvtLen + '</div><div class="pua-mem-stat-label">\u4E8B\u4EF6\u6458\u8981\u5B57\u6570</div></div>'
    h += '<div class="pua-mem-stat-item"><div class="pua-mem-stat-num">' + factCount + '</div><div class="pua-mem-stat-label">\u4E8B\u5B9E\u8BB0\u5FC6</div></div>'
    h += '</div>'

    // 核心记忆
    h += '<div class="pua-mem-card">'
    h += '<div class="pua-mem-card-title">\u6838\u5FC3\u8BB0\u5FC6</div>'
    h += '<div style="margin-bottom:8px"><div style="font-size:10px;color:var(--pua-accent);font-weight:600;margin-bottom:4px">\u5173\u7CFB\u4E0E\u5267\u60C5\u8FDB\u5C55</div>'
    h += '<textarea class="pua-mem-detail-textarea" id="mem-core-rel">' + this._escHtml(memData.core && memData.core.relationship || '') + '</textarea></div>'
    h += '<div style="margin-bottom:8px"><div style="font-size:10px;color:var(--pua-accent);font-weight:600;margin-bottom:4px">\u4E8B\u4EF6\u6458\u8981 (' + (memData.core.events ? memData.core.events.length : 0) + ' \u6761)</div>'
    // 显示事件摘要列表
    if (memData.core.events && memData.core.events.length > 0) {
      for (var evti = 0; evti < memData.core.events.length; evti++) {
        var evt = memData.core.events[evti]
        h += '<div style="font-size:10px;padding:3px 6px;margin:2px 0;background:var(--pua-bg-input);border-radius:4px;display:flex;align-items:center;gap:4px" data-evt-id="' + (evt.id || evti) + '">'
        h += '<span style="flex:1;color:var(--pua-text-sub)">' + self._escHtml(evt.text || '') + '</span>'
        h += '<button class="pua-btn pua-btn-sm pua-btn-danger evt-del-btn" data-evt-idx="' + evti + '" style="padding:1px 4px;font-size:8px">\u00D7</button>'
        h += '</div>'
      }
    } else {
      h += '<div style="font-size:10px;color:var(--pua-text-dim);padding:4px">\u6682\u65E0\u4E8B\u4EF6\u6458\u8981</div>'
    }
    h += '</div>'
    h += '<div class="pua-mem-card-meta"><span>\u5173\u7CFB\u8FDB\u5C55 \u9650\u5236: ' + (settings.coreCharLimit || 2000) + ' \u5B57 / \u5F53\u524D: ' + coreRelLen + ' \u5B57</span>'
    h += '<span>\u4E8B\u4EF6\u6458\u8981 \u9650\u5236: ' + (settings.eventsCharLimit || 1000) + ' \u5B57 / \u5F53\u524D: ' + coreEvtLen + ' \u5B57</span></div>'
    h += '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">'
    h += '<button class="pua-btn pua-btn-sm" id="mem-core-save">\u4FDD\u5B58\u6838\u5FC3\u8BB0\u5FC6</button>'
    h += '<button class="pua-btn pua-btn-sm pua-btn-gold" id="mem-relationship-summary">\u5173\u7CFB\u8FDB\u5C55\u603B\u7ED3</button>'
    h += '</div>'
    h += '</div>'

    // 事实记忆列表
    h += '<div class="pua-mem-card">'
    h += '<div class="pua-mem-card-title">\u4E8B\u5B9E\u8BB0\u5FC6 (' + factCount + ' \u6761)</div>'
    if (memData.facts && memData.facts.length > 0) {
      for (var mi = 0; mi < memData.facts.length; mi++) {
        var fact = memData.facts[mi]
        h += '<div class="pua-mem-fact-item" data-fact-id="' + (fact.id || mi) + '">'
        var needsMark = fact.needsSummary ? ' <span style="color:var(--pua-accent);font-size:8px">[\u5F85\u603B\u7ED3]</span>' : ''
        var vecIcon = (fact.embedding && fact.embedding.length > 0) ? ' <span style="color:#4ec9a0;font-size:9px" title="\u5DF2\u751F\u6210\u5411\u91CF\u8BB0\u5FC6">\u25C6</span>' : ''
        h += '<div class="pua-mem-fact-summary">' + vecIcon + this._escHtml(fact.oneSentence || fact.summary || fact.text || '') + needsMark + '</div>'
        if (fact.keywords) {
          h += '<div class="pua-mem-fact-kw">\u5173\u952E\u8BCD: ' + this._escHtml(fact.keywords) + '</div>'
        }
        // 字数和token数
        var factText = fact.text || fact.summaryText || ''
        var factChars = factText.length
        var factTokens = Math.ceil(factChars * 0.6) // 粗略估算：中文约1.5字/token，英文约4字/token，取中间值
        if (fact.source) {
          h += '<span style="font-size:8px;color:var(--pua-text-dim);margin-right:6px">\u6765\u6E90: ' + this._escHtml(fact.source) + '</span>'
        }
        h += '<span style="font-size:8px;color:var(--pua-text-dim);margin-right:6px">' + factChars + '\u5B57 / ~' + factTokens + 'tok</span>'
        h += '<span class="pua-mem-fact-time">' + (fact.timestamp || '') + '</span>'
        h += '</div>'
      }
    } else {
      h += '<div style="font-size:11px;color:var(--pua-text-dim);text-align:center;padding:20px">\u6682\u65E0\u4E8B\u5B9E\u8BB0\u5FC6\uFF0C\u901A\u8FC7\u5206\u652F\u5B58\u6863\u83B7\u53D6\u6216\u624B\u52A8\u6DFB\u52A0</div>'
    }
    h += '<div style="display:flex;gap:6px;margin-top:8px;align-items:center;flex-wrap:wrap">'
    h += '<button class="pua-btn pua-btn-sm" id="mem-fact-add">+ \u6DFB\u52A0\u4E8B\u5B9E\u8BB0\u5FC6</button>'
    h += '<button class="pua-btn pua-btn-sm" id="mem-fact-embed">\u751F\u6210\u5411\u91CF</button>'
    h += '<button class="pua-btn pua-btn-sm" id="mem-fact-summarize">\u603B\u7ED3\u8BB0\u5FC6</button>'
    h += '<input type="number" id="mem-batch-size" value="10" min="1" max="50" style="width:48px;background:var(--pua-bg-input);border:1px solid var(--pua-border);border-radius:4px;padding:3px 5px;color:var(--pua-text);font-size:10px;text-align:center;outline:none" title="\u6BCF\u6279\u603B\u7ED3\u6570\u91CF">'
    h += '<button class="pua-btn pua-btn-sm pua-btn-gold" id="mem-fact-summarize-all">\u5168\u90E8\u603B\u7ED3</button>'
    h += '<button class="pua-btn pua-btn-sm" id="mem-fact-conv-summary" style="background:var(--pua-accent);color:#fff">\u624B\u52A8\u603B\u7ED3\u5BF9\u8BDD</button>'
    h += '<button class="pua-btn pua-btn-sm" id="mem-fact-clear">\u6E05\u7A7A\u5168\u90E8</button>'
    h += '</div>'
    h += '</div>'

    contentEl.innerHTML = h
    contentEl.scrollTop = savedScrollTop

    // 分支切换事件
    var branchSelect = contentEl.querySelector('#mem-branch-select')
    if (branchSelect) {
      branchSelect.addEventListener('change', function() {
        self._currentMemBranchId = this.value
        // 选择分支后，自动从Roche加载该分支绑定的记忆
        if (this.value) {
          var selBranch = null
          for (var sbi = 0; sbi < branches.length; sbi++) {
            if (branches[sbi].id === this.value) { selBranch = branches[sbi]; break }
          }
          if (selBranch && selBranch.memoryConvIds && selBranch.memoryConvIds.length > 0) {
            self._loadMemFromBranches(selBranch.memoryConvIds, selBranch.id)
          } else {
            self._render()
          }
        } else {
          self._render()
        }
      })
    }

    // 保存核心记忆
    var coreSaveBtn = contentEl.querySelector('#mem-core-save')
    if (coreSaveBtn) {
      coreSaveBtn.addEventListener('click', function() {
        var relEl = contentEl.querySelector('#mem-core-rel')
        if (!memData.core) memData.core = { relationship: '', events: [] }
        memData.core.relationship = relEl ? relEl.value : ''
        self._saveMemData(memData, currentBranchId)
        self._toast('\u6838\u5FC3\u8BB0\u5FC6\u5DF2\u4FDD\u5B58')
      })
    }

    // 关系进展总结按钮
    var relSummaryBtn = contentEl.querySelector('#mem-relationship-summary')
    if (relSummaryBtn) {
      relSummaryBtn.addEventListener('click', function() {
        if (!currentBranchId) { self._toast('\u8BF7\u5148\u9009\u62E9\u5206\u652F'); return }
        relSummaryBtn.disabled = true
        relSummaryBtn.textContent = '\u603B\u7ED3\u4E2D...'
        self._triggerRelationshipSummary(currentBranchId)
      })
    }

    // 删除事件摘要
    var evtDelBtns = contentEl.querySelectorAll('.evt-del-btn')
    for (var edi = 0; edi < evtDelBtns.length; edi++) {
      (function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation()
          var idx = parseInt(btn.getAttribute('data-evt-idx'))
          if (!isNaN(idx) && memData.core.events && idx >= 0 && idx < memData.core.events.length) {
            memData.core.events.splice(idx, 1)
            self._saveMemData(memData, currentBranchId)
            self._render()
          }
        })
      })(evtDelBtns[edi])
    }

    // 添加事实记忆
    var addFactBtn = contentEl.querySelector('#mem-fact-add')
    if (addFactBtn) {
      addFactBtn.addEventListener('click', function() {
        self._showAddFactModal(memData, currentBranchId)
      })
    }

    // 生成向量
    var embedBtn = contentEl.querySelector('#mem-fact-embed')
    if (embedBtn) {
      embedBtn.addEventListener('click', function() {
        self._generateEmbeddings(memData, currentBranchId)
      })
    }

    // 总结记忆
    var summarizeBtn = contentEl.querySelector('#mem-fact-summarize')
    if (summarizeBtn) {
      summarizeBtn.addEventListener('click', function() {
        var batchInput = contentEl.querySelector('#mem-batch-size')
        var batchSize = batchInput ? parseInt(batchInput.value) || 10 : 10
        if (batchSize < 1) batchSize = 1
        if (batchSize > 50) batchSize = 50
        self._summarizeFacts(memData, currentBranchId, batchSize, false)
      })
    }

    // 全部总结
    var summarizeAllBtn = contentEl.querySelector('#mem-fact-summarize-all')
    if (summarizeAllBtn) {
      summarizeAllBtn.addEventListener('click', function() {
        var batchInput = contentEl.querySelector('#mem-batch-size')
        var batchSize = batchInput ? parseInt(batchInput.value) || 10 : 10
        if (batchSize < 1) batchSize = 1
        if (batchSize > 50) batchSize = 50
        self._summarizeFacts(memData, currentBranchId, batchSize, true)
      })
    }

    // 手动总结对话 - 弹出确认对话框
    var convSummaryBtn = contentEl.querySelector('#mem-fact-conv-summary')
    if (convSummaryBtn) {
      convSummaryBtn.addEventListener('click', function() {
        if (!currentBranchId) { self._toast('\u8BF7\u5148\u9009\u62E9\u5206\u652F'); return }
        // 从多级数据源获取实际消息数量
        var maxFloor = 0
        // 1. 尝试 localStorage
        var branchKey = 'pua_conv_' + currentBranchId
        try {
          var rawMsgs = localStorage.getItem(branchKey)
          if (rawMsgs) {
            var msgs = JSON.parse(rawMsgs)
            if (Array.isArray(msgs) && msgs.length > 0) maxFloor = msgs.length
          }
        } catch(e) {}
        // 2. 尝试 branch.messages
        if (maxFloor === 0) {
          var branch = null
          for (var mbi = 0; mbi < self.branches.length; mbi++) {
            if (self.branches[mbi].id === currentBranchId) { branch = self.branches[mbi]; break }
          }
          if (branch && branch.messages && branch.messages.length > 0) {
            maxFloor = branch.messages.length
          }
        }
        // 3. 尝试 _convMessages
        if (maxFloor === 0 && self._convMessages && self._convMessages.length > 0) {
          maxFloor = self._convMessages.length
        }
        if (maxFloor < 1) maxFloor = 1
        self._showManualSummaryModal(currentBranchId, maxFloor)
      })
    }

    // 清空事实记忆
    var clearFactBtn = contentEl.querySelector('#mem-fact-clear')
    if (clearFactBtn) {
      clearFactBtn.addEventListener('click', function() {
        if (!confirm('\u786E\u5B9A\u6E05\u7A7A\u5168\u90E8\u4E8B\u5B9E\u8BB0\u5FC6\uFF1F')) return
        memData.facts = []
        self._saveMemData(memData, currentBranchId)
        self._toast('\u4E8B\u5B9E\u8BB0\u5FC6\u5DF2\u6E05\u7A7A')
        self._render()
      })
    }

    // 点击事实记忆查看详情
    var factItems = contentEl.querySelectorAll('.pua-mem-fact-item')
    for (var fii = 0; fii < factItems.length; fii++) {
      factItems[fii].addEventListener('click', function() {
        var factId = this.getAttribute('data-fact-id')
        self._showFactDetail(factId, memData, currentBranchId)
      })
    }
    } catch(e) {
      contentEl.innerHTML = '<div style="padding:20px;color:#ff6b6b">\u8BB0\u5FC6\u7CFB\u7EDF\u52A0\u8F7D\u5931\u8D25: ' + self._escHtml(e.message || String(e)) + '</div>'
    }
  }

  P._loadMemData = function(branchId) {
    var key = branchId ? 'pua-mem-data-' + branchId : 'pua-mem-data'
    if (this._memDataCache && this._memDataCacheKey === key) return this._memDataCache
    try {
      var raw = localStorage.getItem(key)
      if (raw) {
        var parsed = JSON.parse(raw)
        // 兼容旧格式：core 可能是字符串
        if (parsed && typeof parsed.core === 'string') {
          parsed.core = { relationship: parsed.core, events: [] }
        }
        if (!parsed.core || typeof parsed.core !== 'object') {
          parsed.core = { relationship: '', events: [] }
        }
        if (!parsed.core.relationship) parsed.core.relationship = ''
        // 兼容迁移：core.events 如果是字符串，转为数组格式
        if (typeof parsed.core.events === 'string') {
          var evtStr = parsed.core.events
          parsed.core.events = []
          if (evtStr.trim()) {
            var evtLines = evtStr.split('\n')
            for (var ei = 0; ei < evtLines.length; ei++) {
              var evtLine = evtLines[ei].trim()
              if (evtLine) {
                parsed.core.events.push({ id: 'evt_' + Date.now() + '-' + Math.random().toString(36).substr(2, 6), text: evtLine, timestamp: new Date().toISOString() })
              }
            }
          }
        }
        if (!parsed.core.events || !Array.isArray(parsed.core.events)) {
          parsed.core.events = []
        }
        if (!parsed.facts || !Array.isArray(parsed.facts)) parsed.facts = []
        // 兼容迁移：facts 条目没有 oneSentence 字段，从 summary 字段复制
        for (var fi = 0; fi < parsed.facts.length; fi++) {
          var f = parsed.facts[fi]
          if (!f.oneSentence) {
            f.oneSentence = f.summary || (f.text ? f.text.substring(0, 50) : '')
          }
          if (!f.summaryText) {
            f.summaryText = f.text || ''
          }
        }
        this._memDataCache = parsed
        this._memDataCacheKey = key
        return this._memDataCache
      }
    } catch(e) {
      // 损坏的数据，清除并返回默认
      try { localStorage.removeItem(key) } catch(e2) {}
    }
    this._memDataCache = { core: { relationship: '', events: [] }, facts: [] }
    this._memDataCacheKey = key
    return this._memDataCache
  }

  P._saveMemData = function(data, branchId) {
    var key = branchId ? 'pua-mem-data-' + branchId : 'pua-mem-data'
    this._memDataCache = data
    this._memDataCacheKey = key
    try { localStorage.setItem(key, JSON.stringify(data)) } catch(e) {}
  }

  P._showAddFactModal = function(memData, branchId) {
    var self = this
    var modal = this._modalOverlay
    if (!modal) return

    var body = ''
    body += '<div class="pua-field"><div class="pua-field-label">\u4E8B\u5B9E\u5185\u5BB9</div>'
    body += '<textarea class="pua-detail-textarea" id="fact-text" placeholder="\u8F93\u5165\u4E8B\u5B9E\u8BB0\u5FC6\u5185\u5BB9..." style="min-height:80px"></textarea></div>'
    body += '<div class="pua-field"><div class="pua-field-label">\u4E00\u53E5\u8BDD\u6458\u8981</div>'
    body += '<input class="pua-field-input" id="fact-summary" placeholder="\u7B80\u77ED\u6458\u8981"></div>'
    body += '<div class="pua-field"><div class="pua-field-label">\u5173\u952E\u8BCD</div>'
    body += '<input class="pua-field-input" id="fact-keywords" placeholder="\u7528\u9017\u53F7\u5206\u9694"></div>'

    var modalBody = modal.querySelector('.pua-modal-body')
    if (modalBody) modalBody.innerHTML = body

    var modalTitle = modal.querySelector('.pua-modal-title')
    if (modalTitle) modalTitle.textContent = '\u6DFB\u52A0\u4E8B\u5B9E\u8BB0\u5FC6'

    // Footer
    var footer = modal.querySelector('.pua-modal-footer')
    if (footer) footer.remove()
    footer = document.createElement('div')
    footer.className = 'pua-modal-footer'

    var cancelBtn = document.createElement('button')
    cancelBtn.className = 'pua-btn'
    cancelBtn.textContent = '\u53D6\u6D88'
    cancelBtn.addEventListener('click', function() { self._closeModal() })

    var saveBtn = document.createElement('button')
    saveBtn.className = 'pua-btn pua-btn-gold'
    saveBtn.textContent = '\u4FDD\u5B58'
    saveBtn.addEventListener('click', function() {
      var text = (modal.querySelector('#fact-text') || {}).value || ''
      var summary = (modal.querySelector('#fact-summary') || {}).value || ''
      var keywords = (modal.querySelector('#fact-keywords') || {}).value || ''
      if (!text) { self._toast('\u8BF7\u8F93\u5165\u4E8B\u5B9E\u5185\u5BB9'); return }
      if (!memData.facts) memData.facts = []
      var oneSentence = summary || text.substring(0, 50)
      memData.facts.push({
        id: 'f' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        text: text,
        summaryText: text,
        oneSentence: oneSentence,
        summary: oneSentence,
        keywords: keywords,
        embedding: null,
        timestamp: new Date().toLocaleString('zh-CN'),
        conversationId: '',
        source: 'manual',
        needsSummary: false
      })
      // oneSentence 同时写入核心记忆的 events 数组
      if (oneSentence && memData.core && Array.isArray(memData.core.events)) {
        memData.core.events.push({
          id: 'evt_' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          text: oneSentence,
          timestamp: new Date().toISOString()
        })
      }
      self._saveMemData(memData, branchId)
      self._closeModal()
      self._toast('\u4E8B\u5B9E\u8BB0\u5FC6\u5DF2\u6DFB\u52A0')
      self._render()
    })

    footer.appendChild(cancelBtn)
    footer.appendChild(saveBtn)

    var modalInner = modal.querySelector('.pua-modal')
    if (modalInner) modalInner.appendChild(footer)

    modal.classList.add('show')
  }

  P._showManualSummaryModal = function(branchId, maxFloor) {
    var self = this
    var modal = this._modalOverlay
    if (!modal) return

    var body = ''
    body += '<div style="font-size:11px;color:var(--pua-text-sub);margin-bottom:8px">\u5C06\u603B\u7ED3\u4EE5\u4E0B\u697C\u5C42\u7684\u5BF9\u8BDD\u5185\u5BB9\uFF1A</div>'
    body += '<div style="display:flex;gap:8px;align-items:center">'
    body += '<span style="font-size:11px;color:var(--pua-text-sub)">\u8D77\u59CB\u697C\u5C42</span>'
    body += '<input type="number" id="summary-start-floor" value="1" min="1" style="width:60px;background:var(--pua-bg-input);border:1px solid var(--pua-border);border-radius:4px;padding:4px 6px;color:var(--pua-text);font-size:11px;outline:none">'
    body += '<span style="font-size:11px;color:var(--pua-text-sub)">\u7ED3\u675F\u697C\u5C42</span>'
    body += '<input type="number" id="summary-end-floor" value="' + maxFloor + '" min="1" style="width:60px;background:var(--pua-bg-input);border:1px solid var(--pua-border);border-radius:4px;padding:4px 6px;color:var(--pua-text);font-size:11px;outline:none">'
    body += '</div>'
    body += '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">'
    body += '<button class="pua-btn" id="summary-cancel">\u53D6\u6D88</button>'
    body += '<button class="pua-btn pua-btn-gold" id="summary-confirm">\u786E\u8BA4\u603B\u7ED3</button>'
    body += '</div>'

    var modalBody = modal.querySelector('.pua-modal-body')
    if (modalBody) modalBody.innerHTML = body

    var modalTitle = modal.querySelector('.pua-modal-title')
    if (modalTitle) modalTitle.textContent = '\u624B\u52A8\u603B\u7ED3\u5BF9\u8BDD'

    // Footer
    var footer = modal.querySelector('.pua-modal-footer')
    if (footer) footer.style.display = 'none'

    // Cancel button
    var cancelBtn = modal.querySelector('#summary-cancel')
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        self._closeModal()
        if (footer) footer.style.display = ''
      })
    }

    // Confirm button
    var confirmBtn = modal.querySelector('#summary-confirm')
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function() {
        var startFloor = parseInt((modal.querySelector('#summary-start-floor') || {}).value) || 1
        var endFloor = parseInt((modal.querySelector('#summary-end-floor') || {}).value) || maxFloor
        if (startFloor < 1) startFloor = 1
        if (endFloor > maxFloor) endFloor = maxFloor
        if (startFloor > endFloor) {
          self._toast('\u8D77\u59CB\u697C\u5C42\u4E0D\u80FD\u5927\u4E8E\u7ED3\u675F\u697C\u5C42')
          return
        }
        confirmBtn.disabled = true
        confirmBtn.textContent = '\u603B\u7ED3\u4E2D...'
        self._closeModal()
        if (footer) footer.style.display = ''
        self._triggerConvSummary(branchId, { manual: true, startFloor: startFloor, endFloor: endFloor })
      })
    }

    modal.classList.add('show')
  }

  P._showFactDetail = function(factId, memData, branchId) {
    var self = this
    var modal = this._modalOverlay
    if (!modal) return

    var fact = null
    if (memData.facts) {
      for (var i = 0; i < memData.facts.length; i++) {
        if (memData.facts[i].id === factId) { fact = memData.facts[i]; break }
      }
    }
    if (!fact) return

    var body = ''
    body += '<div class="pua-field"><div class="pua-field-label">\u4E8B\u5B9E\u5185\u5BB9</div>'
    body += '<textarea class="pua-detail-textarea" id="fact-detail-text" style="min-height:100px">' + this._escHtml(fact.text || '') + '</textarea></div>'
    body += '<div class="pua-field"><div class="pua-field-label">\u4E00\u53E5\u8BDD\u6458\u8981</div>'
    body += '<input class="pua-field-input" id="fact-detail-one-sentence" value="' + this._escHtml(fact.oneSentence || '') + '"></div>'
    body += '<div class="pua-field"><div class="pua-field-label">\u5173\u952E\u8BCD</div>'
    body += '<input class="pua-field-input" id="fact-detail-keywords" value="' + this._escHtml(fact.keywords || '') + '"></div>'
    body += '<div style="font-size:9px;color:var(--pua-text-dim)">\u65F6\u95F4: ' + (fact.timestamp || '-') + ' | \u6765\u6E90: ' + (fact.source || '-') + '</div>'

    var modalBody = modal.querySelector('.pua-modal-body')
    if (modalBody) modalBody.innerHTML = body

    var modalTitle = modal.querySelector('.pua-modal-title')
    if (modalTitle) modalTitle.textContent = '\u4E8B\u5B9E\u8BB0\u5FC6\u8BE6\u60C5'

    var footer = modal.querySelector('.pua-modal-footer')
    if (footer) footer.remove()
    footer = document.createElement('div')
    footer.className = 'pua-modal-footer'

    var deleteBtn = document.createElement('button')
    deleteBtn.className = 'pua-btn pua-btn-danger'
    deleteBtn.textContent = '\u5220\u9664'
    deleteBtn.addEventListener('click', function() {
      memData.facts = memData.facts.filter(function(f) { return f.id !== factId })
      self._saveMemData(memData, branchId)
      self._closeModal()
      self._toast('\u4E8B\u5B9E\u8BB0\u5FC6\u5DF2\u5220\u9664')
      self._render()
    })

    var cancelBtn = document.createElement('button')
    cancelBtn.className = 'pua-btn'
    cancelBtn.textContent = '\u53D6\u6D88'
    cancelBtn.addEventListener('click', function() { self._closeModal() })

    var saveBtn = document.createElement('button')
    saveBtn.className = 'pua-btn pua-btn-gold'
    saveBtn.textContent = '\u4FDD\u5B58'
    saveBtn.addEventListener('click', function() {
      fact.text = (modal.querySelector('#fact-detail-text') || {}).value || fact.text
      fact.oneSentence = (modal.querySelector('#fact-detail-one-sentence') || {}).value || fact.oneSentence
      fact.summary = fact.oneSentence || fact.summary
      fact.summaryText = fact.text
      fact.keywords = (modal.querySelector('#fact-detail-keywords') || {}).value || fact.keywords
      self._saveMemData(memData, branchId)
      self._closeModal()
      self._toast('\u4E8B\u5B9E\u8BB0\u5FC6\u5DF2\u66F4\u65B0')
      self._render()
    })

    footer.appendChild(deleteBtn)
    footer.appendChild(cancelBtn)
    footer.appendChild(saveBtn)

    var modalInner = modal.querySelector('.pua-modal')
    if (modalInner) modalInner.appendChild(footer)

    modal.classList.add('show')
  }

  /* ════════════════════════════════════════════════════════════
     分支存档记忆联动
     ════════════════════════════════════════════════════════════ */

  P._loadMemFromBranches = function(convIds, branchId) {
    var self = this
    if (!convIds || convIds.length === 0) {
      this._toast('\u65E0\u7ED1\u5B9A\u7684\u8BB0\u5FC6\u4F1A\u8BDD')
      return
    }
    if (!this.roche || !this.roche.memory || !this.roche.memory.getLongTerm) {
      this._toast('Roche \u8BB0\u5FC6 API \u4E0D\u53EF\u7528')
      return
    }

    this._toast('\u6B63\u5728\u52A0\u8F7D\u8BB0\u5FC6...')
    var memData = this._loadMemData(branchId)
    var loaded = 0
    var total = convIds.length

    for (var i = 0; i < convIds.length; i++) {
      (function(convId) {
        self.roche.memory.getLongTerm({ conversationId: convId, limit: 100 }).then(function(data) {
          if (!data) { loaded++; if (loaded >= total) { self._saveMemData(memData, branchId); self._toast('\u8BB0\u5FC6\u52A0\u8F7D\u5B8C\u6210'); self._render() } return }

          // 合并核心记忆
          if (data.core) {
            if (!memData.core) memData.core = { relationship: '', events: [] }
            // 合并关系进展
            var relText = data.core.relationship || ''
            if (relText && memData.core.relationship.indexOf(relText) === -1) {
              if (memData.core.relationship) {
                memData.core.relationship += '\n' + relText
              } else {
                memData.core.relationship = relText
              }
            }
            // 合并事件摘要
            if (data.core.events && Array.isArray(data.core.events)) {
              if (!memData.core.events) memData.core.events = []
              for (var cei = 0; cei < data.core.events.length; cei++) {
                var evtItem = data.core.events[cei]
                var evtText = evtItem.text || evtItem.summaryText || ''
                if (!evtText) continue
                var evtExists = false
                for (var eei = 0; eei < memData.core.events.length; eei++) {
                  if (memData.core.events[eei].text === evtText) { evtExists = true; break }
                }
                if (!evtExists) {
                  memData.core.events.push({
                    id: evtItem.id || ('evt_' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)),
                    text: evtText,
                    timestamp: evtItem.timestamp || new Date().toISOString()
                  })
                }
              }
            }
            // 兼容旧格式：core.summary / core.text
            var coreSummary = data.core.summary || data.core.text || ''
            if (coreSummary && memData.core.relationship.indexOf(coreSummary) === -1) {
              if (memData.core.relationship) {
                memData.core.relationship += '\n' + coreSummary
              } else {
                memData.core.relationship = coreSummary
              }
            }
          }

          // 合并事实记忆（不生成summary/keywords，标记待总结）
          if (data.facts && data.facts.length > 0) {
            if (!memData.facts) memData.facts = []
            for (var fi = 0; fi < data.facts.length; fi++) {
              var fact = data.facts[fi]
              // 优先使用具体事实内容(text)，而非一句话摘要(summaryText)
              var factContent = fact.text || fact.content || fact.summaryText || fact.action || ''
              if (!factContent) continue
              var exists = false
              for (var ei = 0; ei < memData.facts.length; ei++) {
                if (memData.facts[ei].text === factContent) { exists = true; break }
              }
              if (!exists) {
                memData.facts.push({
                  id: fact.id || ('f' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)),
                  text: factContent,
                  summaryText: fact.summaryText || fact.action || '',
                  oneSentence: fact.summaryText || fact.action || '',
                  summary: fact.summaryText || fact.action || '',
                  keywords: '',
                  embedding: null,
                  timestamp: fact.timestamp || new Date().toLocaleString('zh-CN'),
                  conversationId: convId,
                  source: 'roche-import',
                  needsSummary: !!(fact.summaryText || fact.action)
                })
              }
            }
          }

          loaded++
          self._saveMemData(memData, branchId)
          if (loaded >= total) {
            self._toast('\u8BB0\u5FC6\u52A0\u8F7D\u5B8C\u6210 (' + memData.facts.length + ' \u6761\u4E8B\u5B9E\u8BB0\u5FC6)')
            self._render()
          }
        }).catch(function(e) {
          loaded++
          if (loaded >= total) {
            self._saveMemData(memData, branchId)
            self._toast('\u8BB0\u5FC6\u52A0\u8F7D\u90E8\u5206\u5931\u8D25')
            self._render()
          }
        })
      })(convIds[i])
    }
  }

  P._summarizeFacts = function(memData, branchId, batchSize, summarizeAll) {
    var self = this
    var preset = this._getActivePreset()
    if (!preset || !preset.subEndpoint || !preset.subApiKey || !preset.subModel) {
      this._toast('\u8BF7\u5148\u914D\u7F6E\u526F API')
      return
    }
    if (!memData.facts || memData.facts.length === 0) {
      this._toast('\u65E0\u4E8B\u5B9E\u8BB0\u5FC6')
      return
    }

    var settings = this._loadSettings()

    // 找出 needsSummary=true 的条目
    var toSummarize = []
    for (var i = 0; i < memData.facts.length; i++) {
      if (memData.facts[i].needsSummary) {
        toSummarize.push(i)
      }
    }

    if (toSummarize.length === 0) {
      this._toast('\u6240\u6709\u8BB0\u5FC6\u5DF2\u6709\u6458\u8981')
      return
    }

    // 如果不是全部总结，只取前N条
    if (!summarizeAll) {
      var limit = batchSize || 10
      if (limit < 1) limit = 1
      if (limit > 50) limit = 50
      toSummarize = toSummarize.slice(0, limit)
    }

    var total = toSummarize.length
    this._toast('\u6B63\u5728\u89E6\u53D1\u6279\u6B21\u603B\u7ED3...')

    var actualBatchSize = batchSize || 10
    if (actualBatchSize < 1) actualBatchSize = 1
    if (actualBatchSize > 50) actualBatchSize = 50
    var batchIdx = 0
    var processed = 0

    function processBatch() {
      if (batchIdx >= toSummarize.length) {
        self._saveMemData(memData, branchId)
        self._toast('\u6279\u6B21\u603B\u7ED3\u5B8C\u6210')
        // 自动为刚总结的事实记忆生成向量
        self._autoGenerateEmbeddingsForFacts(memData, branchId, toSummarize)
        self._render()
        return
      }

      var batchIndices = toSummarize.slice(batchIdx, batchIdx + actualBatchSize)
      var factsText = ''
      for (var bi = 0; bi < batchIndices.length; bi++) {
        var fi = batchIndices[bi]
        factsText += (bi + 1) + '. ' + memData.facts[fi].text + '\n'
      }

      var batchOneSentencePrompt = settings.batchOneSentencePrompt || '\u8BF7\u4E3A\u4EE5\u4E0B\u6BCF\u6761\u4E8B\u5B9E\u8BB0\u5FC6\u751F\u6210\u4E00\u53E5\u8BDD\u6458\u8981\uFF0C\u7B80\u660E\u627C\u8981\u5730\u6982\u62EC\u6838\u5FC3\u5185\u5BB9\u3002'
      var batchKeywordsPrompt = settings.batchKeywordsPrompt || '\u8BF7\u4E3A\u4EE5\u4E0B\u6BCF\u6761\u4E8B\u5B9E\u8BB0\u5FC6\u63D0\u53D63-5\u4E2A\u5173\u952E\u8BCD\uFF0C\u7528\u9017\u53F7\u5206\u9694\u3002'

      var prompt = batchOneSentencePrompt + '\n' + batchKeywordsPrompt + '\n\n' +
        '\u8BF7\u6309\u4EE5\u4E0BJSON\u683C\u5F0F\u8F93\u51FA\uFF0C\u6BCF\u6761\u8BB0\u5FC6\u4E00\u4E2A\u5BF9\u8C61\uFF1A\n' +
        '[{"index": \u7F16\u53F7, "oneSentence": "\u4E00\u53E5\u8BDD\u6458\u8981", "keywords": "\u5173\u952E\u8BCD1,\u5173\u952E\u8BCD2"}]\n\n' +
        '\u4E8B\u5B9E\u8BB0\u5FC6\u5217\u8868\uFF1A\n' + factsText

      self._toast('\u6B63\u5728\u603B\u7ED3 ' + (processed + 1) + '/' + total + '...')

      var url = preset.subEndpoint.replace(/\/+$/, '') + '/chat/completions'
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + preset.subApiKey },
        body: JSON.stringify({
          model: preset.subModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 2000
        })
      }).then(function(r) { return r.json() }).then(function(data) {
        if (!data.choices || !data.choices[0]) { batchIdx += actualBatchSize; processed += batchIndices.length; processBatch(); return }
        var content = (data.choices[0].message || {}).content || ''

        // 解析JSON结果
        var jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          try {
            var results = JSON.parse(jsonMatch[0])
            for (var ri = 0; ri < results.length; ri++) {
              var item = results[ri]
              var num = item.index
              if (num >= 1 && num <= batchIndices.length) {
                var fIdx = batchIndices[num - 1]
                if (item.oneSentence) {
                  memData.facts[fIdx].oneSentence = item.oneSentence
                  memData.facts[fIdx].summary = item.oneSentence
                }
                if (item.keywords) {
                  memData.facts[fIdx].keywords = item.keywords
                }
                memData.facts[fIdx].needsSummary = false
                // oneSentence 同时写入核心记忆的 events 数组
                if (item.oneSentence && memData.core && Array.isArray(memData.core.events)) {
                  memData.core.events.push({
                    id: 'evt_' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
                    text: item.oneSentence,
                    timestamp: new Date().toISOString()
                  })
                }
              }
            }
          } catch(parseErr) {
            // JSON解析失败，尝试旧的行格式解析
            var lines = content.split('\n')
            for (var li = 0; li < lines.length; li++) {
              var line = lines[li].trim()
              if (!line) continue
              var match = line.match(/^(\d+)\s*[|｜]\s*(.+?)\s*[|｜]\s*(.+)$/)
              if (match) {
                var lineNum = parseInt(match[1])
                var lineSummary = match[2].trim()
                var lineKeywords = match[3].trim()
                if (lineNum >= 1 && lineNum <= batchIndices.length) {
                  var lineFIdx = batchIndices[lineNum - 1]
                  memData.facts[lineFIdx].oneSentence = lineSummary
                  memData.facts[lineFIdx].summary = lineSummary
                  memData.facts[lineFIdx].keywords = lineKeywords
                  memData.facts[lineFIdx].needsSummary = false
                  if (memData.core && Array.isArray(memData.core.events)) {
                    memData.core.events.push({
                      id: 'evt_' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
                      text: lineSummary,
                      timestamp: new Date().toISOString()
                    })
                  }
                }
              }
            }
          }
        }

        batchIdx += actualBatchSize
        processed += batchIndices.length
        processBatch()
      }).catch(function(e) {
        self._toast('\u6279\u6B21\u603B\u7ED3\u5931\u8D25: ' + (e.message || e))
        self._saveMemData(memData, branchId)
      })
    }

    processBatch()
  }

  /* ════════════════════════════════════════════════════════════
     BM25 本地实现
     ════════════════════════════════════════════════════════════ */

  // 简易分词：中文按字符，英文按空格
  P._tokenize = function(text) {
    if (!text) return []
    var tokens = []
    var word = ''
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i)
      var code = text.charCodeAt(i)
      // 中文字符
      if (code >= 0x4E00 && code <= 0x9FFF) {
        if (word) { tokens.push(word.toLowerCase()); word = '' }
        tokens.push(ch)
      } else if (/[a-zA-Z0-9]/.test(ch)) {
        word += ch
      } else {
        if (word) { tokens.push(word.toLowerCase()); word = '' }
      }
    }
    if (word) tokens.push(word.toLowerCase())
    return tokens
  }

  // BM25 打分
  P._bm25Score = function(queryTokens, docTokens, avgDocLen, docCount, dfMap) {
    var k1 = 1.5
    var b = 0.75
    var score = 0
    var docLen = docTokens.length
    var tfMap = {}
    for (var i = 0; i < docTokens.length; i++) {
      tfMap[docTokens[i]] = (tfMap[docTokens[i]] || 0) + 1
    }
    for (var qi = 0; qi < queryTokens.length; qi++) {
      var qt = queryTokens[qi]
      var tf = tfMap[qt] || 0
      if (tf === 0) continue
      var df = dfMap[qt] || 1
      var idf = Math.log((docCount - df + 0.5) / (df + 0.5) + 1)
      var tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * docLen / (avgDocLen || 1)))
      score += idf * tfNorm
    }
    return score
  }

  // BM25 检索事实记忆
  P._bm25Recall = function(query, facts, topK) {
    if (!facts || facts.length === 0) return []
    var queryTokens = this._tokenize(query)
    if (queryTokens.length === 0) return []

    // 构建文档
    var docs = []
    var totalLen = 0
    var dfMap = {}
    for (var i = 0; i < facts.length; i++) {
      var text = (facts[i].text || '') + ' ' + (facts[i].keywords || '') + ' ' + (facts[i].summary || '')
      var tokens = this._tokenize(text)
      docs.push({ fact: facts[i], tokens: tokens })
      totalLen += tokens.length
      // 计算 df
      var seen = {}
      for (var ti = 0; ti < tokens.length; ti++) {
        if (!seen[tokens[ti]]) {
          seen[tokens[ti]] = true
          dfMap[tokens[ti]] = (dfMap[tokens[ti]] || 0) + 1
        }
      }
    }
    var avgDocLen = totalLen / docs.length

    // 打分
    var scored = []
    for (var si = 0; si < docs.length; si++) {
      var s = this._bm25Score(queryTokens, docs[si].tokens, avgDocLen, docs.length, dfMap)
      if (s > 0) scored.push({ fact: docs[si].fact, score: s })
    }

    // 排序
    scored.sort(function(a, b) { return b.score - a.score })

    return scored.slice(0, topK || 10)
  }

  /* ════════════════════════════════════════════════════════════
     向量召回流程
     ════════════════════════════════════════════════════════════ */

  // 获取文本的 embedding
  P._getEmbedding = function(text) {
    var preset = this._getActivePreset()
    if (!preset || !preset.vecEndpoint || !preset.vecApiKey || !preset.vecModel) {
      return Promise.reject(new Error('\u5411\u91CF API \u672A\u914D\u7F6E'))
    }
    var url = preset.vecEndpoint.replace(/\/+$/, '') + '/embeddings'
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + preset.vecApiKey },
      body: JSON.stringify({ model: preset.vecModel, input: text })
    }).then(function(r) { return r.json() }).then(function(data) {
      if (data.data && data.data[0] && data.data[0].embedding) {
        return data.data[0].embedding
      }
      return Promise.reject(new Error(data.error ? data.error.message : '\u65E0\u6548\u54CD\u5E94'))
    })
  }

  // 余弦相似度
  P._cosineSimilarity = function(a, b) {
    if (!a || !b || a.length !== b.length) return 0
    var dot = 0, na = 0, nb = 0
    for (var i = 0; i < a.length; i++) {
      dot += a[i] * b[i]
      na += a[i] * a[i]
      nb += b[i] * b[i]
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)
  }

  // 向量召回
  P._vectorRecall = function(query, facts, topK) {
    var self = this
    if (!facts || facts.length === 0) return Promise.resolve([])

    return self._getEmbedding(query).then(function(queryEmb) {
      var scored = []
      for (var i = 0; i < facts.length; i++) {
        if (facts[i].embedding && facts[i].embedding.length > 0) {
          var sim = self._cosineSimilarity(queryEmb, facts[i].embedding)
          if (sim > 0) scored.push({ fact: facts[i], score: sim })
        }
      }
      scored.sort(function(a, b) { return b.score - a.score })
      return scored.slice(0, topK || 10)
    }).catch(function(e) {
      // 向量检索失败，回退到 BM25
      return self._bm25Recall(query, facts, topK)
    })
  }

  // 混合召回：BM25 + 向量 + RRF 融合
  P._hybridRecall = function(query, facts, topK) {
    var self = this
    if (!facts || facts.length === 0) return Promise.resolve([])

    var k = 60 // RRF 参数

    // BM25 检索
    var bm25Results = self._bm25Recall(query, facts, topK * 3)

    // 向量检索
    return self._vectorRecall(query, facts, topK * 3).then(function(vecResults) {
      // RRF 融合
      var rrfScores = {}

      // BM25 排名
      for (var bi = 0; bi < bm25Results.length; bi++) {
        var fid = bm25Results[bi].fact.id
        rrfScores[fid] = (rrfScores[fid] || 0) + 1 / (k + bi + 1)
      }

      // 向量排名
      for (var vi = 0; vi < vecResults.length; vi++) {
        var vid = vecResults[vi].fact.id
        rrfScores[vid] = (rrfScores[vid] || 0) + 1 / (k + vi + 1)
      }

      // 按 RRF 分数排序
      var merged = []
      for (var ri = 0; ri < facts.length; ri++) {
        var fId = facts[ri].id
        if (rrfScores[fId]) {
          merged.push({ fact: facts[ri], score: rrfScores[fId] })
        }
      }
      merged.sort(function(a, b) { return b.score - a.score })

      return merged.slice(0, topK || 10)
    }).catch(function() {
      // 回退到纯 BM25
      return bm25Results.slice(0, topK || 10)
    })
  }

  /* ════════════════════════════════════════════════════════════
     副 API 召回流程
     ════════════════════════════════════════════════════════════ */

  P._subApiRecall = function(query, facts, topK) {
    var self = this
    var preset = self._getActivePreset()
    if (!preset || !preset.subEndpoint || !preset.subApiKey || !preset.subModel) {
      return Promise.reject(new Error('\u526F API \u672A\u914D\u7F6E'))
    }
    if (!facts || facts.length === 0) return Promise.resolve([])

    // 构建摘要列表
    var summaryList = ''
    for (var i = 0; i < facts.length; i++) {
      var kw = facts[i].keywords ? ' [' + facts[i].keywords + ']' : ''
      summaryList += (i + 1) + '. ' + (facts[i].summary || facts[i].text || '') + kw + '\n'
    }

    var settings = self._loadSettings()
    var maxRecall = settings.recallMaxCount || 8

    var prompt = '\u4F60\u662F\u4E00\u4E2A\u8BB0\u5FC6\u53EC\u56DE\u52A9\u624B\u3002\u6839\u636E\u7528\u6237\u5F53\u524D\u8F93\u5165\uFF0C\u4ECE\u4EE5\u4E0B\u4E8B\u5B9E\u8BB0\u5FC6\u6458\u8981\u5217\u8868\u4E2D\uFF0C\u9009\u51FA\u4E0E\u5F53\u524D\u5BF9\u8BDD\u6700\u76F8\u5173\u7684\u8BB0\u5FC6\u3002\n\n'
    prompt += '\u7528\u6237\u8F93\u5165: ' + query + '\n\n'
    prompt += '\u4E8B\u5B9E\u8BB0\u5FC6\u6458\u8981\u5217\u8868:\n' + summaryList + '\n'
    prompt += '\u8BF7\u53EA\u8F93\u51FA\u76F8\u5173\u8BB0\u5FC6\u7684\u7F16\u53F7\uFF0C\u7528\u9017\u53F7\u5206\u9694\uFF0C\u6700\u591A' + maxRecall + '\u4E2A\u3002\u4F8B\u5982: 3,7,15\n\u5982\u679C\u6CA1\u6709\u76F8\u5173\u7684\uFF0C\u8F93\u51FA none'

    var url = preset.subEndpoint.replace(/\/+$/, '') + '/chat/completions'
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + preset.subApiKey },
      body: JSON.stringify({
        model: preset.subModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 100
      })
    }).then(function(r) { return r.json() }).then(function(data) {
      if (!data.choices || !data.choices[0]) return []
      var content = (data.choices[0].message || {}).content || ''
      if (content.trim().toLowerCase() === 'none') return []

      // 解析编号
      var indices = []
      var parts = content.split(/[,，\s]+/)
      for (var pi = 0; pi < parts.length; pi++) {
        var num = parseInt(parts[pi])
        if (!isNaN(num) && num >= 1 && num <= facts.length) {
          indices.push(num - 1)
        }
      }

      var results = []
      for (var ii = 0; ii < indices.length; ii++) {
        if (results.length >= maxRecall) break
        var fact = facts[indices[ii]]
        results.push({ fact: fact, score: 1 - ii * 0.1 })
      }
      return results
    })
  }

  /* ════════════════════════════════════════════════════════════
     统一召回入口
     ════════════════════════════════════════════════════════════ */

  P._recallMemories = function(query, facts, topK) {
    var self = this
    var settings = this._loadSettings()
    var mode = settings.recallMode || 'vector'

    if (mode === 'subapi') {
      return self._subApiRecall(query, facts, topK)
    }
    // 默认向量模式（含BM25混合）
    return self._hybridRecall(query, facts, topK)
  }

  /* ════════════════════════════════════════════════════════════
     同步召回预览（用于详情面板展示，不依赖异步API）
     ════════════════════════════════════════════════════════════ */

  P._recallMemoriesSync = function(query, facts, topK) {
    if (!facts || facts.length === 0) return []
    var queryLower = (query || '').toLowerCase()
    var queryWords = queryLower.split(/[\s,，。.!?！？;；:：、]+/).filter(function(w) { return w.length > 1 })
    var scored = []
    for (var i = 0; i < facts.length; i++) {
      var f = facts[i]
      var text = (f.summaryText || f.action || f.text || '').toLowerCase()
      var score = 0
      // 关键词匹配评分
      for (var wi = 0; wi < queryWords.length; wi++) {
        if (text.indexOf(queryWords[wi]) !== -1) score += 1
      }
      // 也检查 keywords 字段
      if (f.keywords) {
        var kw = f.keywords.toLowerCase()
        for (var wi2 = 0; wi2 < queryWords.length; wi2++) {
          if (kw.indexOf(queryWords[wi2]) !== -1) score += 2
        }
      }
      // 如果有 embedding 相似度缓存，使用之
      if (f._simScore) score += f._simScore
      if (score > 0) scored.push({ fact: f, score: score })
    }
    scored.sort(function(a, b) { return b.score - a.score })
    var results = []
    var limit = Math.min(topK || 8, scored.length)
    for (var ri = 0; ri < limit; ri++) {
      results.push(scored[ri].fact)
    }
    // 如果没有匹配的，返回前 topK 条
    if (results.length === 0) {
      var fallback = Math.min(topK || 8, facts.length)
      for (var fi = 0; fi < fallback; fi++) {
        results.push(facts[fi])
      }
    }
    return results
  }

  /* ════════════════════════════════════════════════════════════
     生成 Embedding
     ════════════════════════════════════════════════════════════ */

  P._generateEmbeddings = function(memData, branchId) {
    var self = this
    var preset = this._getActivePreset()
    if (!preset || !preset.vecEndpoint || !preset.vecApiKey || !preset.vecModel) {
      this._toast('\u8BF7\u5148\u914D\u7F6E\u5411\u91CF API')
      return
    }
    if (!memData.facts || memData.facts.length === 0) {
      this._toast('\u65E0\u4E8B\u5B9E\u8BB0\u5FC6')
      return
    }

    this._toast('\u5F00\u59CB\u751F\u6210\u5411\u91CF...')

    var toEmbed = []
    for (var i = 0; i < memData.facts.length; i++) {
      if (!memData.facts[i].embedding || memData.facts[i].embedding.length === 0) {
        toEmbed.push(i)
      }
    }

    if (toEmbed.length === 0) {
      this._toast('\u6240\u6709\u8BB0\u5FC6\u5DF2\u6709\u5411\u91CF')
      return
    }

    var idx = 0
    function embedNext() {
      if (idx >= toEmbed.length) {
        self._saveMemData(memData, branchId)
        self._toast('\u5411\u91CF\u751F\u6210\u5B8C\u6210')
        self._render()
        return
      }
      var fi = toEmbed[idx]
      var text = memData.facts[fi].text || memData.facts[fi].summary || ''
      if (!text) { idx++; embedNext(); return }

      self._getEmbedding(text).then(function(emb) {
        memData.facts[fi].embedding = emb
        idx++
        embedNext()
      }).catch(function(e) {
        self._toast('\u5411\u91CF\u751F\u6210\u5931\u8D25: ' + (e.message || e))
        self._saveMemData(memData, branchId)
      })
    }

    embedNext()
  }

  /* ════════════════════════════════════════════════════════════
     注册入口
     ════════════════════════════════════════════════════════════ */

  var _instance = null

  window.RochePlugin.register({
    id: 'parallel-universe',
    name: '\u5E73\u884C\u65F6\u7A7A\u6863\u6848\u9986',
    version: '0.27.0',
    icon: '\u2606',
    apps: [{
      id: 'parallel-universe-home',
      name: '\u5E73\u884C\u65F6\u7A7A\u6863\u6848\u9986',
      icon: 'extension',
      iconImage: '',
      mount: function(container, roche) {
        if (!_instance) {
          _instance = new ParallelUniverse(roche)
          _instance.init(container)
        } else {
          _instance.roche = roche
          _instance.container = container
          // 重新注入样式（如果被销毁了）
          if (!_instance.styleEl) {
            _instance.styleEl = document.createElement('style')
            _instance.styleEl.textContent = CSS
            document.head.appendChild(_instance.styleEl)
          }
          // 重新注入字体
          if (!document.getElementById('pua-font-link')) {
            var link = document.createElement('link')
            link.id = 'pua-font-link'
            link.rel = 'stylesheet'
            link.href = 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-lite-webfont@1.1.0/style.css'
            document.head.appendChild(link)
          }
          _instance._loadBranches()
        }
      },
      unmount: function(container, roche) {
        if (_instance) {
          _instance.unmountAppView()
        }
      },
    }],
  })

  /* ── Hub联动API ── */
  if (!window.ParallelUniverseAPI) {
    window.ParallelUniverseAPI = {
      getInstance: function() { return _instance },
      createBranch: function() { if (_instance) _instance._showCreateBranchModal() },
    }
  }

})()
