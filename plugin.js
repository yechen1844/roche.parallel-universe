/**
 * 平行时空档案馆 v0.8.0
 * Parallel Universe Archive — 让Roche拥有平行时空
 *
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
    '  position:relative; overflow:hidden;',
    '  --pua-bg:rgba(18,18,22,0.92); --pua-bg-solid:#121216;',
    '  --pua-bg-card:rgba(28,28,36,0.75); --pua-bg-card-hover:rgba(36,36,48,0.8);',
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
    '  --pua-bg:rgba(248,248,250,0.92); --pua-bg-solid:#f8f8fa;',
    '  --pua-bg-card:rgba(255,255,255,0.7); --pua-bg-card-hover:rgba(255,255,255,0.85);',
    '  --pua-bg-input:rgba(0,0,0,0.04); --pua-border:rgba(0,0,0,0.08);',
    '  --pua-border-active:rgba(149,115,48,0.4); --pua-accent:#957330; --pua-accent-dim:#7a5f28;',
    '  --pua-accent-glow:rgba(149,115,48,0.15); --pua-text:#1A1A1E; --pua-text-sub:#45454A;',
    '  --pua-text-dim:#999; --pua-accent-text:#3b352d; --pua-shadow:0 8px 32px rgba(0,0,0,0.06);',
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
    '.pua-topbar { height:48px; min-height:48px; background:var(--pua-bg-card);',
    '  backdrop-filter:var(--pua-glass); -webkit-backdrop-filter:var(--pua-glass);',
    '  border-bottom:1px solid var(--pua-border); display:flex; align-items:center;',
    '  justify-content:space-between; padding:0 20px; }',
    '.pua-topbar-title { font-size:13px; font-weight:600; letter-spacing:0.3px; }',
    '.pua-topbar-actions { display:flex; gap:6px; align-items:center; }',
    '.pua-back-btn { width:28px; height:28px; border-radius:6px; border:1px solid var(--pua-border);',
    '  background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; font-size:14px;',
    '  display:flex; align-items:center; justify-content:center; transition:var(--pua-transition); margin-right:4px; }',
    '.pua-back-btn:hover { border-color:var(--pua-border-active); color:var(--pua-text); }',

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
    '.pua-modal-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.5);',
    '  backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);',
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
    '.pua-modal-body { flex:1; overflow-y:auto; padding:16px; }',
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
    '.pua-log-panel { position:absolute; bottom:0; left:0; right:0; height:160px;',
    '  background:rgba(0,0,0,0.85); border-top:1px solid var(--pua-border);',
    '  z-index:150; display:none; flex-direction:column; }',
    '.pua-log-panel.open { display:flex; }',
    '.pua-log-toolbar { display:flex; align-items:center; justify-content:space-between;',
    '  padding:4px 10px; border-bottom:1px solid var(--pua-border);',
    '  background:rgba(255,255,255,0.03); flex-shrink:0; }',
    '.pua-log-toolbar span { font-size:10px; color:var(--pua-accent); font-weight:600; }',
    '.pua-log-toolbar-btns { display:flex; gap:4px; }',
    '.pua-log-toolbar-btns button { padding:1px 6px; font-size:9px; border-radius:3px;',
    '  border:1px solid var(--pua-border); background:rgba(255,255,255,0.05);',
    '  color:var(--pua-text-sub); cursor:pointer; font-family:inherit; }',
    '.pua-log-toolbar-btns button:hover { background:rgba(255,255,255,0.1); color:var(--pua-text); }',
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
    '.pua-topbar { padding:0 12px; }',
    '.pua-btn { min-height:36px; padding:6px 14px; font-size:12px; }',
    '.pua-btn-gold { min-height:40px; }',
    '.pua-nav-item { padding:12px 16px; font-size:13px; }',
    '.pua-branch-card { padding:14px; }',
    '.pua-branch-card:active { transform:scale(0.98); opacity:0.9; }',
    '.pua-branch-name { font-size:14px; }',
    '.pua-topbar { height:52px; min-height:52px; }',
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
    '.pua-assistant-api-select { background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:4px; padding:4px 8px; color:var(--pua-text); font-size:10px; font-family:inherit; outline:none; }',
    '.pua-assistant-api-select:focus { border-color:var(--pua-accent); }',
    '.pua-assistant-chat { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:12px; }',
    '.pua-assistant-chat::-webkit-scrollbar { width:4px; }',
    '.pua-assistant-chat::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.06); border-radius:2px; }',
    '.pua-assistant-msg { max-width:85%; padding:10px 14px; border-radius:12px; font-size:11px; line-height:1.6; word-break:break-word; }',
    '.pua-assistant-msg-user { align-self:flex-end; background:var(--pua-accent-glow); border:1px solid var(--pua-border-active); color:var(--pua-accent-text); border-bottom-right-radius:4px; }',
    '.pua-assistant-msg-assistant { align-self:flex-start; background:var(--pua-bg-card); border:1px solid var(--pua-border); color:var(--pua-text); border-bottom-left-radius:4px; }',
    '.pua-assistant-msg-role { font-size:9px; font-weight:600; margin-bottom:4px; opacity:0.6; }',
    '.pua-assistant-action-card { margin-top:8px; padding:8px 10px; border-radius:8px; background:rgba(78,201,160,0.08); border:1px solid rgba(78,201,160,0.2); display:flex; align-items:center; gap:8px; flex-wrap:wrap; }',
    '.pua-assistant-action-label { font-size:10px; color:var(--pua-success); font-weight:600; }',
    '.pua-assistant-undo-btn { font-size:9px; padding:2px 8px; border-radius:4px; border:1px solid var(--pua-border); background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; transition:var(--pua-transition); }',
    '.pua-assistant-undo-btn:hover { border-color:var(--pua-accent); color:var(--pua-text); }',
    '.pua-assistant-undo-btn.done { opacity:0.4; cursor:default; text-decoration:line-through; }',
    '.pua-assistant-input-area { padding:10px 14px; border-top:1px solid var(--pua-border); }',
    '.pua-assistant-attach-row { display:flex; gap:6px; margin-bottom:6px; flex-wrap:wrap; }',
    '.pua-assistant-attach-btn { font-size:9px; padding:3px 8px; border-radius:4px; border:1px solid var(--pua-border); background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; transition:var(--pua-transition); }',
    '.pua-assistant-attach-btn:hover { border-color:var(--pua-accent); color:var(--pua-text); }',
    '.pua-assistant-attach-dropdown { position:relative; display:inline-block; }',
    '.pua-assistant-attach-list { position:absolute; bottom:100%; left:0; margin-bottom:4px; min-width:220px; max-height:200px; overflow-y:auto; background:var(--pua-bg-solid); border:1px solid var(--pua-border); border-radius:8px; box-shadow:var(--pua-shadow); z-index:100; padding:6px; display:none; }',
    '.pua-assistant-attach-list.open { display:block; }',
    '.pua-assistant-attach-item { display:flex; align-items:center; gap:6px; padding:5px 6px; border-radius:4px; cursor:pointer; font-size:10px; color:var(--pua-text-sub); transition:var(--pua-transition); }',
    '.pua-assistant-attach-item:hover { background:var(--pua-bg-card-hover); color:var(--pua-text); }',
    '.pua-assistant-input-row { display:flex; gap:8px; }',
    '.pua-assistant-input { flex:1; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:8px; padding:8px 12px; color:var(--pua-text); font-size:11px; font-family:inherit; outline:none; resize:none; min-height:36px; max-height:120px; }',
    '.pua-assistant-input:focus { border-color:var(--pua-accent); }',
    '.pua-assistant-send { padding:8px 16px; border-radius:8px; border:none; background:linear-gradient(135deg,var(--pua-accent-dim),var(--pua-accent)); color:#121216; font-size:11px; font-weight:600; cursor:pointer; transition:var(--pua-transition); }',
    '.pua-assistant-send:hover { opacity:0.9; }',
    '.pua-assistant-send:disabled { opacity:0.4; cursor:default; }',
    '.pua-assistant-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--pua-text-dim); }',
    '.pua-assistant-empty-icon { font-size:32px; margin-bottom:10px; opacity:0.3; }',
    '.pua-assistant-empty-text { font-size:11px; }',
    '.pua-assistant-typing { font-size:10px; color:var(--pua-accent); opacity:0.7; padding:4px 0; }',
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
    this.asmLoading = false
    // 助手数据
    this._assistantData = null
    this._assistantSending = false
    // 移动端状态
    this._sidebarOpen = false
    this._mobileDetailOpen = false
    // 设置数据
    this.settings = null
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

    // 加载已保存的分支和预设（同步数据）
    this._loadPresets()
    this._loadRegexes()
    this._loadRegexPresets()
    this._loadPromptPresets()
    this._loadAsmConfig()
    this._loadAsmOrder()
    this._loadSettings()
    this._loadAssistantData()
    this._currentMemBranchId = ''

    // 异步加载分支，完成后渲染
    this._loadBranches()
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
        text += typeof a === 'object' ? JSON.stringify(a, null, 0) : String(a)
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
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.set('pua_presets', { presets: this.presets }).catch(function(e) {
      console.error('[PUA] save presets failed', e)
    })
  }

  P._loadRegexes = function() {
    var self = this
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
      }
    }).catch(function() {})
  }

  P._saveRegexes = function() {
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.set('pua_regexes', { regexes: this.regexes }).catch(function(e) {
      console.error('[PUA] save regexes failed', e)
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
    if (!this.container) return
    // 防止重入
    if (this._rendering) return
    this._rendering = true
    var self = this
    var c = this.container

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
    logToolbar.innerHTML = '<span>\u63A7\u5236\u53F0\u65E5\u5FD7</span>'
    var logBtns = document.createElement('div')
    logBtns.className = 'pua-log-toolbar-btns'
    var copyBtn = document.createElement('button')
    copyBtn.textContent = '\u590D\u5236'
    copyBtn.addEventListener('click', function() { self._copyLogs() })
    var exportBtn = document.createElement('button')
    exportBtn.textContent = '\u5BFC\u51FA'
    exportBtn.addEventListener('click', function() { self._exportLogs() })
    var clearBtn = document.createElement('button')
    clearBtn.textContent = '\u6E05\u9664'
    clearBtn.addEventListener('click', function() { self._clearLogs() })
    logBtns.appendChild(copyBtn)
    logBtns.appendChild(exportBtn)
    logBtns.appendChild(clearBtn)
    logToolbar.appendChild(logBtns)
    logPanel.appendChild(logToolbar)
    var logList = document.createElement('div')
    logList.className = 'pua-log-list'
    logPanel.appendChild(logList)
    root.appendChild(logPanel)

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
      { id: 'chat', icon: '\uD83D\uDCAC', label: '\u5BF9\u8BDD', badge: 0 },
      { id: 'theme', icon: '\uD83C\uDFA8', label: '\u7F8E\u5316', badge: 0 },
      { id: 'assistant', icon: '\u2728', label: '\u52A9\u624B', badge: 0 },
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
      case 'chat': this._renderChat(titleEl, actionsEl, contentEl); break
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
    importBtn.textContent = '\u2B07 \u5BFC\u5165\u7EBF\u4E0B\u8BB0\u5F55'
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
          srcTag.className = 'pua-tag ' + (b.source === 'offline' ? 'pua-tag-offline' : 'pua-tag-online')
          srcTag.textContent = b.source === 'offline' ? '\u7EBF\u4E0B' : '\u7EBF\u4E0A'
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
          srcTag.className = 'pua-tag ' + (b.source === 'offline' ? 'pua-tag-offline' : 'pua-tag-online')
          srcTag.textContent = b.source === 'offline' ? '\u7EBF\u4E0B' : '\u7EBF\u4E0A'
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
    if (!selectEl) selectEl = document.getElementById('pua-branch-char')
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
                label: '\uD83D\uDC64 ' + name + ' (\u5355\u804A)',
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
    if (this.roche && this.roche.conversation && this.roche.conversation.list) {
      fetchPromises.push(
        this.roche.conversation.list().then(function(convs) {
          console.log('[PUA] conversation.list returned ' + (convs ? convs.length : 0) + ' convs')
          if (convs && convs.length) {
            self._convList = convs
            convs.forEach(function(cv) {
              var convId = cv.id || cv.conversationId || ''
              var name = cv.name || cv.handle || '\u672A\u77E5'
              var isGroup = cv.type === 'group' || (cv.members && cv.members.length > 2)
              // 检查是否已存在
              var dup = false
              for (var i = 0; i < options.length; i++) {
                if (options[i].convId === convId) { dup = true; break }
              }
              if (!dup && convId) {
                options.push({
                  label: (isGroup ? '\uD83D\uDC65 ' : '\uD83D\uDCDD ') + name + (isGroup ? ' (\u7FA4\u804A)' : ''),
                  value: 'conv_' + convId,
                  convId: convId,
                  charId: cv.contactId || '',
                  charName: name,
                  charAvatar: cv.avatar || '',
                  isGroup: isGroup
                })
              }
            })
          }
        }).catch(function(e) {
          console.warn('[PUA] conversation.list failed', e)
        })
      )
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
    if (!selectEl) selectEl = document.getElementById('pua-branch-char')
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
        var cid = this._convList[j].id || this._convList[j].conversationId || ''
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
    if (!nameInput) nameInput = document.getElementById('pua-branch-name')
    if (!depthInput) depthInput = document.getElementById('pua-branch-depth')
    if (!tagsInput) tagsInput = document.getElementById('pua-branch-tags')
    if (!memShortCheck) memShortCheck = document.getElementById('pua-branch-mem-short')
    if (!memLongCheck) memLongCheck = document.getElementById('pua-branch-mem-long')

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
    body += '<span>\u6765\u6E90: ' + (branch.source === 'offline' ? '\u7EBF\u4E0B\u8BB0\u5F55' : '\u7EBF\u4E0A\u5BF9\u8BDD') + '</span>'
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
    body += '<div class="pua-config-section-title">\u2726 \u8BB0\u5FC6\u7ED1\u5B9A</div>'
    body += '<div class="pua-config-section-desc">\u9009\u62E9\u8981\u5173\u8054\u7684\u4F1A\u8BDD\uFF0C\u83B7\u53D6\u5176\u6838\u5FC3\u8BB0\u5FC6\u548C\u4E8B\u5B9E\u8BB0\u5FC6</div>'
    body += '<div class="pua-config-section-body" id="branch-mem-list">'
    body += '<div style="text-align:center;padding:12px;color:var(--pua-text-dim);font-size:10px">\u52A0\u8F7D\u4E2D...</div>'
    body += '</div>'
    body += '<button class="pua-btn pua-btn-sm pua-config-save" id="branch-mem-save">\u4FDD\u5B58\u8BB0\u5FC6\u7ED1\u5B9A</button>'
    body += '</div>'

    // ===== 世界书挂载配置 =====
    body += '<div class="pua-config-section">'
    body += '<div class="pua-config-section-title">\u2726 \u4E16\u754C\u4E66\u6302\u8F7D</div>'
    body += '<div class="pua-config-section-desc">\u5168\u5C40\u4E16\u754C\u4E66\u81EA\u52A8\u6302\u8F7D\uFF0C\u672C\u5730\u4E16\u754C\u4E66\u9700\u624B\u52A8\u9009\u62E9</div>'
    body += '<div id="branch-wb-global-item" class="pua-check-item checked">'
    body += '<div class="pua-check-box">\u2713</div>'
    body += '<span class="pua-check-icon">\uD83C\uDF0D</span>'
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
    body += '<div class="pua-config-section-title">\u2726 \u89D2\u8272\u4EBA\u8BBE</div>'
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
      self.asmBranchId = branch.id
      self._currentMemBranchId = branch.id
      self.currentPage = 'assembly'
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
        var memList = document.getElementById('branch-mem-list')
        if (!memList) return
        var h = ''
        for (var i = 0; i < (convs || []).length; i++) {
          var cv = convs[i]
          var cvId = cv.conversationId || cv.id
          var cvName = cv.handle || cv.name || cv.title || '?'
          var isGroup = cv.isGroup || cv.type === 'group'
          var isBound = false
          for (var bi = 0; bi < (branch.memoryConvIds || []).length; bi++) {
            if (branch.memoryConvIds[bi] === cvId) { isBound = true; break }
          }
          if (branch.sourceConvId === cvId) isBound = true
          h += '<div class="pua-check-item' + (isBound ? ' checked' : '') + '" data-conv-id="' + cvId + '">'
          h += '<div class="pua-check-box">\u2713</div>'
          h += '<span class="pua-check-icon">' + (isGroup ? '\uD83D\uDC65' : '\uD83D\uDC64') + '</span>'
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
      }).catch(function() {
        var memList = document.getElementById('branch-mem-list')
        if (memList) memList.innerHTML = '<div style="font-size:10px;color:var(--pua-text-dim);text-align:center;padding:8px">\u52A0\u8F7D\u5931\u8D25</div>'
      })
    } else {
      var memListEl = document.getElementById('branch-mem-list')
      if (memListEl) memListEl.innerHTML = '<div style="font-size:10px;color:var(--pua-text-dim);text-align:center;padding:8px">\u4E0D\u53EF\u7528</div>'
    }

    // ===== 异步加载世界书 =====
    if (this.roche.worldbook && this.roche.worldbook.list) {
      this.roche.worldbook.list().then(function(cats) {
        var wbLocal = document.getElementById('branch-wb-local')
        var wbGlobalItem = document.getElementById('branch-wb-global-item')
        var wbGlobalCheck = document.getElementById('branch-wb-global')
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
          h += '<span class="pua-check-icon">\uD83D\uDCD6</span>'
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
        var wbLocal = document.getElementById('branch-wb-local')
        if (wbLocal) wbLocal.innerHTML = '<div style="font-size:10px;color:var(--pua-text-dim);text-align:center;padding:8px">\u52A0\u8F7D\u5931\u8D25</div>'
      })
    } else {
      var wbLocalEl = document.getElementById('branch-wb-local')
      if (wbLocalEl) wbLocalEl.innerHTML = '<div style="font-size:10px;color:var(--pua-text-dim);text-align:center;padding:8px">\u4E0D\u53EF\u7528</div>'
    }

    // ===== 异步加载角色列表 =====
    if (this.roche.character && this.roche.character.list) {
      this.roche.character.list().then(function(chars) {
        var charList = document.getElementById('branch-char-list')
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
          h += '<span class="pua-check-icon">\uD83D\uDC64</span>'
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
        var charList = document.getElementById('branch-char-list')
        if (charList) charList.innerHTML = '<div style="font-size:10px;color:var(--pua-text-dim);text-align:center;padding:8px">\u52A0\u8F7D\u5931\u8D25</div>'
      })
    } else {
      var charListEl = document.getElementById('branch-char-list')
      if (charListEl) charListEl.innerHTML = '<div style="font-size:10px;color:var(--pua-text-dim);text-align:center;padding:8px">\u4E0D\u53EF\u7528</div>'
    }

    // ===== 保存按钮事件 =====
    // 保存记忆绑定
    var memSaveBtn = document.getElementById('branch-mem-save')
    if (memSaveBtn) {
      memSaveBtn.addEventListener('click', function() {
        var items = document.querySelectorAll('#branch-mem-list .pua-check-item')
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
    var wbSaveBtn = document.getElementById('branch-wb-save')
    if (wbSaveBtn) {
      wbSaveBtn.addEventListener('click', function() {
        var globalCheck = document.getElementById('branch-wb-global')
        var local = {}
        var catChecks = document.querySelectorAll('.branch-wb-cat-check')
        for (var i = 0; i < catChecks.length; i++) {
          if (catChecks[i].classList.contains('checked')) {
            var catId = catChecks[i].getAttribute('data-cat-id')
            var entryChecks = document.querySelectorAll('.branch-wb-entry-check[data-cat-id="' + catId + '"]')
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
    var charSaveBtn = document.getElementById('branch-char-save')
    if (charSaveBtn) {
      charSaveBtn.addEventListener('click', function() {
        var items = document.querySelectorAll('#branch-char-list .pua-check-item')
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
      var charMatchName = p.charSenderName || p.charName || ''
      var msgs = p.messages.map(function(m) {
        var msgType = 'unknown'
        if (charMatchName && m.senderName === charMatchName) {
          msgType = 'assistant'
        } else if (charMatchName) {
          msgType = 'user'
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
    importBtn.textContent = '\u2B07 \u5BFC\u5165'
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
    h += '<div class="pua-glass pua-panel-list' + mobileHideList + '">'
    h += '<div class="pua-panel-header"><span>\u6761\u76EE\u5217\u8868</span><span style="font-size:10px;color:var(--pua-text-dim)">' + this.presets.length + ' \u9879</span></div>'
    h += '<div class="pua-panel-body" id="pua-preset-list">'
    
    for (var j = 0; j < this.presets.length; j++) {
      var e = this.presets[j]
      var rc = e.role === 'system' ? 'pua-role-system' : (e.role === 'user' ? 'pua-role-user' : 'pua-role-assistant')
      var rl = e.role === 'system' ? 'SYS' : (e.role === 'user' ? 'USR' : 'AST')
      h += '<div class="pua-entry-item' + (e.id === this.selPreset ? ' selected' : '') + '" data-id="' + e.id + '" draggable="true">'
      h += '<span class="pua-drag-handle">\u2630</span>'
      h += '<span class="pua-role-dot ' + rc + '"></span>'
      h += '<div class="pua-entry-info"><div class="pua-entry-title">' + self._escHtml(e.title) + '</div>'
      h += '<div class="pua-entry-sub">' + rl + (e.on ? '' : ' \u00B7 \u7981\u7528') + '</div></div>'
      h += '<button class="pua-toggle-item' + (e.on ? ' on' : '') + '" data-id="' + e.id + '"></button>'
      h += '</div>'
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
      h += '<button class="pua-btn pua-btn-sm" id="preset-save-btn" style="background:var(--pua-accent);color:#000">\u2726 \u4FDD\u5B58</button>'
      h += '</div>'
      // Content textarea
      h += '<div class="pua-detail-body">'
      h += '<div class="pua-detail-content"><textarea class="pua-detail-textarea pua-preset-content" data-id="' + selPreset.id + '" placeholder="\u8F93\u5165\u9884\u8BBE\u5185\u5BB9...">' + self._escHtml(selPreset.content) + '</textarea></div>'
      // Regex section
      h += '<div class="pua-regex-section">'
      h += '<div class="pua-regex-section-title">\uD83D\uDD10 \u63D0\u793A\u8BCD\u66FF\u6362\uFF08\u4FEE\u6539\u53D1\u7ED9AI\u7684\u6587\u672C\uFF09</div>'
      h += '<div class="pua-regex-row"><label>\u8F93\u51FA\u8FC7\u6EE4</label>'
      h += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600;background:rgba(91,141,239,0.12);color:var(--pua-preset)">发送过滤</span>'
      h += '<input type="text" class="pua-preset-outregex" value="' + self._escHtml(selPreset.outRegex) + '" placeholder="\u5339\u914D\u5185\u5BB9\u53EA\u53D1\u7ED9AI" data-id="' + selPreset.id + '">'
      h += '<button class="pua-toggle-item' + (selPreset.outRegexOn ? ' on' : '') + ' pua-preset-oregex-toggle" data-id="' + selPreset.id + '"></button></div>'
      h += '<div class="pua-regex-row"><label>\u8F93\u5165\u8FC7\u6EE4</label>'
      h += '<span style="font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600;background:rgba(91,141,239,0.12);color:var(--pua-preset)">发送过滤</span>'
      h += '<input type="text" class="pua-preset-inregex" value="' + self._escHtml(selPreset.inRegex) + '" placeholder="\u5339\u914D\u5185\u5BB9\u4ECEA-I\u56DE\u590D\u79FB\u9664" data-id="' + selPreset.id + '">'
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
      var listBody = document.getElementById('pua-preset-list')
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
    var listEl = document.getElementById('pua-preset-list')
    if (!listEl) return

    // Item click → select (ES5: manual for loop instead of forEach)
    var entryItems = listEl.querySelectorAll('.pua-entry-item')
    for (var ei = 0; ei < entryItems.length; ei++) {
      (function(el) {
        el.addEventListener('click', function(e) {
          if (e.target.classList.contains('pua-toggle-item') || e.target.classList.contains('pua-drag-handle')) return
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
    var titleInput = document.querySelector('.pua-preset-title')
    if (titleInput) {
      titleInput.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.presets.length; i++) {
          if (self.presets[i].id === id) { self.presets[i].title = this.value; break }
        }
      })
    }

    // Role change (no auto-save, just update memory)
    var roleSelect = document.querySelector('.pua-preset-role')
    if (roleSelect) {
      roleSelect.addEventListener('change', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.presets.length; i++) {
          if (self.presets[i].id === id) { self.presets[i].role = this.value; break }
        }
      })
    }

    // Content change (no auto-save, just update memory)
    var contentTextarea = document.querySelector('.pua-preset-content')
    if (contentTextarea) {
      contentTextarea.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.presets.length; i++) {
          if (self.presets[i].id === id) { self.presets[i].content = this.value; break }
        }
      })
    }

    // Output regex change (no auto-save, just update memory)
    var outRegexInput = document.querySelector('.pua-preset-outregex')
    if (outRegexInput) {
      outRegexInput.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.presets.length; i++) {
          if (self.presets[i].id === id) { self.presets[i].outRegex = this.value; break }
        }
      })
    }

    // Input regex change (no auto-save, just update memory)
    var inRegexInput = document.querySelector('.pua-preset-inregex')
    if (inRegexInput) {
      inRegexInput.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.presets.length; i++) {
          if (self.presets[i].id === id) { self.presets[i].inRegex = this.value; break }
        }
      })
    }

    // Output regex toggle
    var oRegexToggle = document.querySelector('.pua-preset-oregex-toggle')
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
    var iRegexToggle = document.querySelector('.pua-preset-iregex-toggle')
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
    var dMinInput = document.querySelector('.pua-preset-dmin')
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
    var dMaxInput = document.querySelector('.pua-preset-dmax')
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
    var delBtn = document.querySelector('.pua-preset-delete')
    if (delBtn) {
      delBtn.addEventListener('click', function() {
        var id = this.getAttribute('data-id')
        self._delPreset(id)
      })
    }

    // Save button
    var saveBtn = document.getElementById('preset-save-btn')
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        self._savePresets()
        self._toast('\u9884\u8BBE\u5DF2\u4FDD\u5B58')
      })
    }

    // Mobile back button
    var mobileBackBtn = document.querySelector('.pua-mobile-back')
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
    var listBody = document.getElementById('pua-preset-list')
    var savedScroll = listBody ? listBody.scrollTop : 0

    this._render()

    // 下一帧恢复滚动位置
    setTimeout(function() {
      var newListBody = document.getElementById('pua-preset-list')
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

  /* ── 导入Roche预设对话框 ── */
  P._importPresetDialog = function() {
    var self = this
    var modal = this._modalOverlay
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
    var reader = new FileReader()
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result)
        self._parsedPresetData = data
        var previewEl = document.getElementById('pua-preset-import-preview')
        var resultEl = document.getElementById('pua-preset-import-result')
        var confirmBtn = document.getElementById('pua-preset-import-confirm')
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
            var presets = cat.presets || []
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
        var resultEl = document.getElementById('pua-preset-import-result')
        if (resultEl) resultEl.textContent = '\u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u786E\u8BA4\u6587\u4EF6\u4E3A\u6709\u6548\u7684 JSON \u683C\u5F0F'
        var previewEl = document.getElementById('pua-preset-import-preview')
        if (previewEl) previewEl.style.display = 'block'
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  /* ── 执行导入预设 ── */
  P._doImportPreset = function() {
    if (!this._parsedPresetData) {
      this._toast('\u6CA1\u6709\u53EF\u5BFC\u5165\u7684\u6570\u636E')
      return
    }
    var data = this._parsedPresetData
    var count = 0

    if (data.type === 'pua_plugin_presets' && data.presets && Array.isArray(data.presets)) {
      // 插件格式：直接导入完整预设对象
      for (var pi0 = 0; pi0 < data.presets.length; pi0++) {
        var src0 = data.presets[pi0]
        var newP = {
          id: 'p' + Date.now() + '_' + count,
          title: src0.title || '\u672A\u547D\u540D',
          role: src0.role || 'system',
          on: src0.on !== undefined ? src0.on : true,
          content: src0.content || '',
          outRegex: src0.outRegex || '',
          outRegexOn: src0.outRegexOn || false,
          inRegex: src0.inRegex || '',
          inRegexOn: src0.inRegexOn || false,
          dMin: src0.dMin || 0,
          dMax: src0.dMax || Infinity
        }
        this.presets.push(newP)
        count++
      }
    } else if (data.categories && Array.isArray(data.categories)) {
      // Roche 格式：每个分类的预设作为一组导入，标题加 [分类名] 前缀
      for (var ci = 0; ci < data.categories.length; ci++) {
        var cat = data.categories[ci]
        var catName = cat.name || '\u672A\u547D\u540D\u5206\u7C7B'
        var presets = cat.presets || []
        for (var pi = 0; pi < presets.length; pi++) {
          var src = presets[pi]
          this.presets.push({
            id: 'p' + Date.now() + '_' + count,
            title: '[' + catName + '] ' + (src.title || '\u672A\u547D\u540D'),
            role: 'system',
            on: true,
            content: src.content || '',
            outRegex: src.outputRegex || '',
            outRegexOn: src.isOutputRegexEnabled || false,
            inRegex: src.inputRegex || '',
            inRegexOn: src.isInputRegexEnabled || false,
            dMin: 0,
            dMax: Infinity
          })
          count++
        }
      }
    } else if (data.presets && Array.isArray(data.presets)) {
      for (var pi2 = 0; pi2 < data.presets.length; pi2++) {
        var src2 = data.presets[pi2]
        this.presets.push({
          id: 'p' + Date.now() + '_' + pi2,
          title: src2.title || '\u672A\u547D\u540D',
          role: 'system',
          on: true,
          content: src2.content || '',
          outRegex: src2.outputRegex || '',
          outRegexOn: src2.isOutputRegexEnabled || false,
          inRegex: src2.inputRegex || '',
          inRegexOn: src2.isInputRegexEnabled || false,
          dMin: 0,
          dMax: Infinity
        })
        count++
      }
    }

    this.selPreset = this.presets.length > 0 ? this.presets[0].id : ''
    this._parsedPresetData = null
    this._savePresets()
    this._closeModal()
    this._toast('\u5DF2\u5BFC\u5165 ' + count + ' \u4E2A\u9884\u8BBE\u6761\u76EE')
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
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      var url = URL.createObjectURL(blob)
      var a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
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
    importBtn.textContent = '\u2B07 \u5BFC\u5165'
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
    h += '<div class="pua-glass pua-panel-list' + mobileHideList + '">'
    h += '<div class="pua-panel-header"><span>\u6B63\u5219\u6761\u76EE</span><span style="font-size:10px;color:var(--pua-text-dim)">' + this.regexes.length + ' \u9879</span></div>'
    h += '<div class="pua-panel-body" id="pua-regex-list">'

    for (var j = 0; j < this.regexes.length; j++) {
      var r = this.regexes[j]
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
      h += '<div class="pua-entry-item' + (r.id === this.selRegex ? ' selected' : '') + '" data-id="' + r.id + '" draggable="true">'
      h += '<span class="pua-drag-handle">\u2630</span>'
      h += '<div class="pua-entry-info"><div class="pua-entry-title">' + self._escHtml(r.name) + '</div>'
      h += '<div class="pua-entry-sub"><span class="pua-regex-type ' + typeClass + '">' + typeLabel + '</span>' + (r.on ? '' : ' \u00B7 \u7981\u7528') + '</div></div>'
      h += '<button class="pua-toggle-item' + (r.on ? ' on' : '') + '" data-id="' + r.id + '"></button>'
      h += '</div>'
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
      h += '<button class="pua-btn pua-btn-sm" id="regex-save-btn" style="background:var(--pua-accent);color:#000">\u2726 \u4FDD\u5B58</button>'
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
        h += '<input class="pua-field-input" id="regex-preview-input" placeholder="\u8F93\u5165\u6D4B\u8BD5\u6587\u672C..." style="flex:1">'
        h += '<button class="pua-btn pua-btn-sm" id="regex-preview-btn">\u9884\u89C8</button>'
        h += '<button class="pua-btn pua-btn-sm" id="regex-template-preview-btn">\u6A21\u677F\u9884\u89C8</button>'
        h += '</div>'
        h += '<div id="regex-preview-result" style="background:var(--pua-bg-input);border:1px solid var(--pua-border);border-radius:6px;padding:10px;min-height:60px;font-size:12px;color:var(--pua-text);overflow:auto;max-height:200px"></div>'
        h += '</div>'
      }
      // Depth section
      var dMin = selRegex.dMin || 0
      var dMaxStr = selRegex.dMax === Infinity ? '' : String(selRegex.dMax || '')
      h += '<div class="pua-regex-section">'
      h += '<div class="pua-regex-section-title">\uD83D\uDD10 \u751F\u6548\u6DF1\u5EA6</div>'
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
      var listBody = document.getElementById('pua-regex-list')
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
    var listEl = document.getElementById('pua-regex-list')
    if (!listEl) return

    // Item click → select
    var entryItems = listEl.querySelectorAll('.pua-entry-item')
    for (var ei = 0; ei < entryItems.length; ei++) {
      (function(el) {
        el.addEventListener('click', function(e) {
          if (e.target.classList.contains('pua-toggle-item') || e.target.classList.contains('pua-drag-handle')) return
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
    var nameInput = document.querySelector('.pua-regex-name')
    if (nameInput) {
      nameInput.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.regexes.length; i++) {
          if (self.regexes[i].id === id) { self.regexes[i].name = this.value; break }
        }
      })
    }

    // Type change (no auto-save, just update memory + re-render for preview area)
    var typeSelect = document.querySelector('.pua-regex-type-select')
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
    var patternTextarea = document.querySelector('.pua-regex-pattern')
    if (patternTextarea) {
      patternTextarea.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.regexes.length; i++) {
          if (self.regexes[i].id === id) { self.regexes[i].regex = this.value; break }
        }
      })
    }

    // HTML template change (no auto-save, just update memory)
    var htmlTextarea = document.querySelector('.pua-regex-html')
    if (htmlTextarea) {
      htmlTextarea.addEventListener('input', function() {
        var id = this.getAttribute('data-id')
        for (var i = 0; i < self.regexes.length; i++) {
          if (self.regexes[i].id === id) { self.regexes[i].html = this.value; break }
        }
      })
    }

    // Depth min (no auto-save, just update memory)
    var dMinInput = document.querySelector('.pua-regex-dmin')
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
    var dMaxInput = document.querySelector('.pua-regex-dmax')
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
    var delBtn = document.querySelector('.pua-regex-delete')
    if (delBtn) {
      delBtn.addEventListener('click', function() {
        var id = this.getAttribute('data-id')
        self._delRegex(id)
      })
    }

    // Save button
    var regexSaveBtn = document.getElementById('regex-save-btn')
    if (regexSaveBtn) {
      regexSaveBtn.addEventListener('click', function() {
        self._saveRegexes()
        self._toast('\u6B63\u5219\u5DF2\u4FDD\u5B58')
      })
    }

    // Mobile back button
    var mobileBackBtn = document.querySelector('.pua-mobile-back-regex')
    if (mobileBackBtn) {
      if (window.innerWidth < 768) mobileBackBtn.style.display = ''
      mobileBackBtn.addEventListener('click', function() {
        self.selRegex = ''
        self._render()
      })
    }

    // Regex render preview
    var previewBtn = document.getElementById('regex-preview-btn')
    if (previewBtn) {
      var selectedRegex = null
      for (var sri = 0; sri < self.regexes.length; sri++) {
        if (self.regexes[sri].id === self.selRegex) { selectedRegex = self.regexes[sri]; break }
      }
      previewBtn.addEventListener('click', function() {
        var inputText = (document.getElementById('regex-preview-input') || {}).value || ''
        var resultEl = document.getElementById('regex-preview-result')
        if (!resultEl || !selectedRegex) return

        if (!inputText) {
          resultEl.innerHTML = '<span style="color:var(--pua-text-dim)">\u8BF7\u8F93\u5165\u6D4B\u8BD5\u6587\u672C</span>'
          return
        }

        try {
          var regex = new RegExp(selectedRegex.regex || selectedRegex.pattern || '', 'g')
          var htmlTemplate = selectedRegex.html || selectedRegex.replace || ''
          var matchCount = 0

          // 替换所有匹配
          var result = inputText.replace(regex, function(match) {
            matchCount++
            var output = htmlTemplate
            // 替换 $0 为完整匹配
            output = output.replace(/\$0/g, match)
            // 替换 $1-$9 为捕获组（从回调参数获取）
            for (var gi = 1; gi <= 9; gi++) {
              try {
                var groupVal = arguments[gi] || ''
                output = output.replace(new RegExp('\\$' + gi, 'g'), groupVal)
              } catch(e) {}
            }
            return output
          })

          if (matchCount === 0) {
            resultEl.innerHTML = '<span style="color:var(--pua-text-dim)">\u65E0\u5339\u914D\u7ED3\u679C</span>'
          } else {
            resultEl.innerHTML = '<div style="font-size:9px;color:var(--pua-accent);margin-bottom:4px">\u5339\u914D ' + matchCount + ' \u5904</div>' + result
          }
        } catch(e) {
          resultEl.innerHTML = '<span style="color:#ff6b6b">\u6B63\u5219\u9519\u8BEF: ' + self._escHtml(e.message || String(e)) + '</span>'
        }
      })
    }

    // Template preview button
    var tplPreviewBtn = document.getElementById('regex-template-preview-btn')
    if (tplPreviewBtn) {
      var selectedRegexForTpl = null
      for (var sri2 = 0; sri2 < self.regexes.length; sri2++) {
        if (self.regexes[sri2].id === self.selRegex) { selectedRegexForTpl = self.regexes[sri2]; break }
      }
      tplPreviewBtn.addEventListener('click', function() {
        var resultEl = document.getElementById('regex-preview-result')
        if (!resultEl || !selectedRegexForTpl) return
        var htmlTpl = selectedRegexForTpl.html || selectedRegexForTpl.replace || ''
        if (!htmlTpl) {
          resultEl.innerHTML = '<span style="color:var(--pua-text-dim)">\u65E0\u66FF\u6362\u6A21\u677F</span>'
          return
        }
        var preview = htmlTpl
        preview = preview.replace(/\$0/g, '<span style="color:var(--pua-accent)">[\u5339\u914D\u6587\u672C]</span>')
        for (var gi = 1; gi <= 9; gi++) {
          preview = preview.replace(new RegExp('\\$' + gi, 'g'), '<span style="color:var(--pua-accent)">[\u6355\u83B7\u7EC4' + gi + ']</span>')
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
    var listBody = document.getElementById('pua-regex-list')
    var savedScroll = listBody ? listBody.scrollTop : 0

    this._render()

    // 下一帧恢复滚动位置
    setTimeout(function() {
      var newListBody = document.getElementById('pua-regex-list')
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
    var reader = new FileReader()
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result)
        self._parsedRegexData = data
        var previewEl = document.getElementById('pua-regex-import-preview')
        var resultEl = document.getElementById('pua-regex-import-result')
        var confirmBtn = document.getElementById('pua-regex-import-confirm')
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
            var entries = cat.entries || []
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
        var resultEl = document.getElementById('pua-regex-import-result')
        if (resultEl) resultEl.textContent = '\u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u786E\u8BA4\u6587\u4EF6\u4E3A\u6709\u6548\u7684 JSON \u683C\u5F0F'
        var previewEl = document.getElementById('pua-regex-import-preview')
        if (previewEl) previewEl.style.display = 'block'
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  /* ── 执行导入正则 ── */
  P._doImportRegex = function() {
    if (!this._parsedRegexData) {
      this._toast('\u6CA1\u6709\u53EF\u5BFC\u5165\u7684\u6570\u636E')
      return
    }
    var data = this._parsedRegexData
    var count = 0

    if (data.type === 'pua_plugin_regexes' && data.regexes && Array.isArray(data.regexes)) {
      // 插件格式：直接导入完整正则对象
      for (var ri = 0; ri < data.regexes.length; ri++) {
        var src0 = data.regexes[ri]
        this.regexes.push({
          id: 'r' + Date.now() + '_' + count,
          name: src0.name || '\u672A\u547D\u540D',
          regex: src0.regex || '',
          html: src0.html || '',
          type: src0.type || 'render',
          on: src0.on !== undefined ? src0.on : true,
          dMin: src0.dMin || 0,
          dMax: src0.dMax || Infinity
        })
        count++
      }
    } else if (data.categories && Array.isArray(data.categories)) {
      // Roche 格式：每个分类的正则作为一组导入，名称加 [分类名] 前缀
      for (var ci = 0; ci < data.categories.length; ci++) {
        var cat = data.categories[ci]
        var catName = cat.name || '\u672A\u547D\u540D\u5206\u7C7B'
        var entries = cat.entries || []
        for (var ei = 0; ei < entries.length; ei++) {
          var src = entries[ei]
          this.regexes.push({
            id: 'r' + Date.now() + '_' + count,
            name: '[' + catName + '] ' + (src.name || '\u672A\u547D\u540D'),
            regex: src.regex || '',
            html: src.html || '',
            type: 'render',
            on: true,
            dMin: 0,
            dMax: Infinity
          })
          count++
        }
      }
    }

    this.selRegex = this.regexes.length > 0 ? this.regexes[0].id : ''
    this._parsedRegexData = null
    this._saveRegexes()
    this._closeModal()
    this._toast('\u5DF2\u5BFC\u5165 ' + count + ' \u4E2A\u6B63\u5219\u6761\u76EE')
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
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      var url = URL.createObjectURL(blob)
      var a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
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
    order.push({ type: 'world-mid', id: 'world-mid' })
    order.push({ type: 'world-post', id: 'world-post' })
    return order
  }

  P._loadAsmOrder = function() {
    var self = this
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.get('pua_asm_order').then(function(data) {
      if (data && data.order && data.order.length) {
        self.asmOrder = data.order
        // 迁移：如果保存的顺序中没有 recall，自动补上（在 memory-fact 之后）
        var hasRecall = false
        for (var i = 0; i < self.asmOrder.length; i++) {
          if (self.asmOrder[i].type === 'recall') { hasRecall = true; break }
        }
        if (!hasRecall) {
          // 在 memory-fact 后面插入 recall
          for (var j = 0; j < self.asmOrder.length; j++) {
            if (self.asmOrder[j].type === 'memory-fact') {
              self.asmOrder.splice(j + 1, 0, { type: 'recall', id: 'recall' })
              break
            }
          }
          // 如果连 memory-fact 都没有，就追加到末尾
          if (!hasRecall) {
            hasRecall = false
            for (var k = 0; k < self.asmOrder.length; k++) {
              if (self.asmOrder[k].type === 'recall') { hasRecall = true; break }
            }
            if (!hasRecall) self.asmOrder.push({ type: 'recall', id: 'recall' })
          }
        }
      }
    }).catch(function() {})
  }

  P._saveAsmOrder = function() {
    if (!this.roche || !this.roche.storage) return
    this.roche.storage.set('pua_asm_order', { order: this.asmOrder }).catch(function(e) {
      console.error('[PUA] save asm order failed', e)
    })
  }

  /* ── 绑定导出 ── */
  P._showBundleExportModal = function() {
    var self = this
    var modal = this._modalOverlay
    if (!modal) return

    var body = '<div style="font-size:11px;color:var(--pua-text-sub);margin-bottom:12px">\u9009\u62E9\u8981\u5BFC\u51FA\u7684\u5185\u5BB9\uFF0C\u5C06\u6253\u5305\u4E3A\u4E00\u4E2A JSON \u6587\u4EF6</div>'
    body += '<div style="display:flex;flex-direction:column;gap:10px">'
    body += '<label style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--pua-border);border-radius:8px;cursor:pointer">'
    body += '<input type="checkbox" id="bundle-export-presets" checked>'
    body += '<div><div style="font-size:11px;font-weight:600;color:var(--pua-accent-text)">\u2714 \u9884\u8BBE\u6761\u76EE</div><div style="font-size:9px;color:var(--pua-text-dim)">' + this.presets.length + ' \u9879</div></div></label>'
    body += '<label style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--pua-border);border-radius:8px;cursor:pointer">'
    body += '<input type="checkbox" id="bundle-export-regexes" checked>'
    body += '<div><div style="font-size:11px;font-weight:600;color:var(--pua-accent-text)">\u2714 \u6B63\u5219\u89C4\u5219</div><div style="font-size:9px;color:var(--pua-text-dim)">' + this.regexes.length + ' \u9879</div></div></label>'
    body += '<label style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--pua-border);border-radius:8px;cursor:pointer">'
    body += '<input type="checkbox" id="bundle-export-asmorder" checked>'
    body += '<div><div style="font-size:11px;font-weight:600;color:var(--pua-accent-text)">\u2714 \u7EC4\u88C5\u987A\u5E8F</div><div style="font-size:9px;color:var(--pua-text-dim)">' + (this.asmOrder ? this.asmOrder.length : 0) + ' \u9879</div></div></label>'
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
    var modal = this._modalOverlay
    if (!modal) return
    var expPresets = modal.querySelector('#bundle-export-presets')
    var expRegexes = modal.querySelector('#bundle-export-regexes')
    var expAsmOrder = modal.querySelector('#bundle-export-asmorder')

    var bundle = {
      version: 1,
      type: 'pua_asm_bundle',
      presets: (expPresets && expPresets.checked) ? this.presets.slice() : [],
      regexes: (expRegexes && expRegexes.checked) ? this.regexes.slice() : [],
      asmOrder: (expAsmOrder && expAsmOrder.checked) ? (this.asmOrder || []).slice() : [],
      exportDate: new Date().toISOString()
    }

    var now = new Date()
    var y = now.getFullYear()
    var m = ('0' + (now.getMonth() + 1)).slice(-2)
    var d = ('0' + now.getDate()).slice(-2)
    var filename = 'pua-bundle-' + y + m + d + '.json'

    var blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

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
              ph += '<div style="font-size:10px;color:var(--pua-text-sub);margin-bottom:10px">\u7EC4\u88C5\u987A\u5E8F: ' + (data.asmOrder && data.asmOrder.length > 0 ? data.asmOrder.length + ' \u9879' : '\u65E0') + '</div>'
              ph += '<div style="display:flex;flex-direction:column;gap:8px">'
              ph += '<label style="display:flex;align-items:center;gap:8px;font-size:10px;color:var(--pua-text-sub);cursor:pointer"><input type="checkbox" id="bundle-import-presets" checked> \u5BFC\u5165\u9884\u8BBE (' + (data.presets ? data.presets.length : 0) + ')</label>'
              ph += '<label style="display:flex;align-items:center;gap:8px;font-size:10px;color:var(--pua-text-sub);cursor:pointer"><input type="checkbox" id="bundle-import-regexes" checked> \u5BFC\u5165\u6B63\u5219 (' + (data.regexes ? data.regexes.length : 0) + ')</label>'
              ph += '<label style="display:flex;align-items:center;gap:8px;font-size:10px;color:var(--pua-text-sub);cursor:pointer"><input type="checkbox" id="bundle-import-asmorder" checked> \u5BFC\u5165\u7EC4\u88C5\u987A\u5E8F</label>'
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
    var modal = this._modalOverlay
    if (!modal) return
    var data = this._parsedBundleData
    if (!data) { this._toast('\u6CA1\u6709\u53EF\u5BFC\u5165\u7684\u6570\u636E'); return }

    var impPresets = modal.querySelector('#bundle-import-presets')
    var impRegexes = modal.querySelector('#bundle-import-regexes')
    var impAsmOrder = modal.querySelector('#bundle-import-asmorder')

    var presetCount = 0, regexCount = 0, asmOrderImported = false
    var count = 0

    if (impPresets && impPresets.checked && data.presets && data.presets.length) {
      for (var pi = 0; pi < data.presets.length; pi++) {
        var src = data.presets[pi]
        this.presets.push({
          id: 'p' + Date.now() + '_' + count,
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

    if (impRegexes && impRegexes.checked && data.regexes && data.regexes.length) {
      for (var ri = 0; ri < data.regexes.length; ri++) {
        var src2 = data.regexes[ri]
        this.regexes.push({
          id: 'r' + Date.now() + '_' + count,
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

    if (impAsmOrder && impAsmOrder.checked && data.asmOrder && data.asmOrder.length) {
      this.asmOrder = data.asmOrder.slice()
      this._saveAsmOrder()
      asmOrderImported = true
    }

    this._parsedBundleData = null
    this._closeModal()

    var summary = ''
    if (presetCount > 0) summary += '\u9884\u8BBE ' + presetCount + ' \u9879'
    if (regexCount > 0) summary += (summary ? ', ' : '') + '\u6B63\u5219 ' + regexCount + ' \u9879'
    if (asmOrderImported) summary += (summary ? ', ' : '') + '\u7EC4\u88C5\u987A\u5E8F'
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
    var visualEl = document.querySelector('.asm-visual')
    var savedScroll = visualEl ? visualEl.scrollTop : 0

    this._render()

    // 下一帧恢复滚动位置
    setTimeout(function() {
      var newVisualEl = document.querySelector('.asm-visual')
      if (newVisualEl && savedScroll > 0) {
        newVisualEl.scrollTop = savedScroll
      }
    }, 0)
  }

  /* ── 数据拉取 ── */
  P._fetchAsmData = function() {
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
    this._render()

    var promises = []

    // 获取角色信息（主角色）
    if (branch.charId && this.roche.character && this.roche.character.get) {
      promises.push(
        this.roche.character.get(branch.charId).then(function(ch) {
          self.asmData.char = ch || null
        }).catch(function() {})
      )
    }

    // 获取选中的角色人设（多个）
    if (branch.selectedCharIds && branch.selectedCharIds.length > 0 && this.roche.character && this.roche.character.get) {
      for (var sci = 0; sci < branch.selectedCharIds.length; sci++) {
        (function(charId) {
          promises.push(
            self.roche.character.get(charId).then(function(ch) {
              if (ch) self.asmData.chars.push(ch)
            }).catch(function() {})
          )
        })(branch.selectedCharIds[sci])
      }
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
    if (branch.source === 'online' && branch.sourceConvId) {
      var convId = branch.sourceConvId
      if (this.roche.memory && this.roche.memory.getShortTerm) {
        promises.push(
          this.roche.memory.getShortTerm({ conversationId: convId, limit: 100 }).then(function(msgs) {
            self.asmData.shortTerm = msgs || []
          }).catch(function() {})
        )
      }
      if (this.roche.memory && this.roche.memory.getLongTerm) {
        promises.push(
          this.roche.memory.getLongTerm({ conversationId: convId, limit: 100 }).then(function(data) {
            self.asmData.longTerm = data || null
          }).catch(function() {})
        )
      }
    } else {
      // 离线分支：直接使用分支中的数据
      this.asmData.shortTerm = branch.messages || []
      this.asmData.longTerm = branch.longTermMemory || null
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
                  self.asmData.longTerm.core = data.core
                }
              }
              // 合并事实记忆
              if (data.facts && data.facts.length > 0) {
                for (var fi = 0; fi < data.facts.length; fi++) {
                  self.asmData.longTerm.facts.push(data.facts[fi])
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
              self.asmData.longTerm.core = { summary: '', text: '' }
            }
            var localCoreText = localMemData.core.relationship || ''
            if (localCoreText) {
              var existingCore = self.asmData.longTerm.core.summary || self.asmData.longTerm.core.text || ''
              if (existingCore.indexOf(localCoreText) === -1) {
                self.asmData.longTerm.core.summary = existingCore ? existingCore + '\n' + localCoreText : localCoreText
                self.asmData.longTerm.core.text = self.asmData.longTerm.core.summary
              }
            }
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
      self.asmLoading = false
      self._render()
    }).catch(function() {
      self.asmLoading = false
      self._render()
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
    var btnBundleExport = this._mkBtn('\uD83D\uDCE6 \u7ED1\u5B9A\u5BFC\u51FA', 'pua-btn', function() { self._showBundleExportModal() })
    var btnBundleImport = this._mkBtn('\uD83D\uDCE5 \u7ED1\u5B9A\u5BFC\u5165', 'pua-btn', function() { self._showBundleImportModal() })
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

    h += '</div>' // end asm-config
    h += '</div>' // end asm-layout

    contentEl.innerHTML = h

    // Bind branch selector
    var branchSelect = document.getElementById('asm-branch-select')
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
    var depthInput = document.getElementById('asm-depth')
    if (depthInput) depthInput.addEventListener('change', function() { self.asmConfig.contextDepth = parseInt(this.value) || 40 })

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
          if (!preset.on) continue
          roleLabel = preset.role ? '[' + preset.role.toUpperCase() + '] ' : ''
          title = roleLabel + this._escHtml(preset.title)
          meta = preset.role
          body = '\u53EF\u7F16\u8F91 \xB7 \u53EF\u62D6\u62FD'
          break
        case 'char':
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
          title = '\u89D2\u8272\u5361 \xB7 ' + this._escHtml(charDisplay)
          body = '\u70B9\u51FB\u67E5\u770B \xB7 \u53EF\u62D6\u62FD'
          break
        case 'user':
          typeClass = 'asm-type-user'
          var userDisplay = this.asmData.userPersona ? (this.asmData.userPersona.name || 'User') : '\u672A\u52A0\u8F7D'
          title = 'User\u4EBA\u8BBE \xB7 ' + this._escHtml(userDisplay)
          body = '\u70B9\u51FB\u67E5\u770B \xB7 \u53EF\u62D6\u62FD'
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
          title = '\u804A\u5929\u8BB0\u5F55'
          meta = chatCount + ' \u6761'
          body = '\u53D7\u6DF1\u5EA6\u8FC7\u6EE4 \xB7 \u70B9\u51FB\u67E5\u770B \xB7 \u53EF\u62D6\u62FD'
          break
      }

      if (!typeClass) continue

      h += '<div class="asm-block ' + typeClass + '" data-type="' + item.type + '" data-id="' + item.id + '">'
      h += '<div class="asm-conn"><div class="asm-dot"></div><div class="asm-line"></div></div>'
      h += '<div class="asm-card draggable" draggable="true">'
      h += '<div class="asm-card-head"><span class="asm-card-title">' + title + '</span>'
      if (meta) h += '<span class="asm-card-meta">' + meta + '</span>'
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
    var blocks = document.querySelectorAll('.asm-block')
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
        })
        card.addEventListener('dragend', function() {
          block.classList.remove('dragging')
        })
        block.addEventListener('dragover', function(e) {
          e.preventDefault()
          block.classList.add('drag-over')
        })
        block.addEventListener('dragleave', function() {
          block.classList.remove('drag-over')
        })
        block.addEventListener('drop', function(e) {
          e.preventDefault()
          block.classList.remove('drag-over')
          var parts = e.dataTransfer.getData('text/plain').split('|')
          if (parts.length === 2) {
            self._reorderAsm(parts[0], parts[1], bType, bId)
          }
        })

        // Click events (distinguish drag vs click)
        var dragDist = 0
        card.addEventListener('mousedown', function() { dragDist = 0 })
        card.addEventListener('mousemove', function() { dragDist++ })
        card.addEventListener('click', function() {
          if (dragDist < 5) {
            self._showAsmDetail(bType, bId)
          }
        })

        // Touch events
        var touchStartX = 0, touchStartY = 0
        card.addEventListener('touchstart', function(e) {
          if (e.touches.length > 0) {
            touchStartX = e.touches[0].clientX
            touchStartY = e.touches[0].clientY
          }
        })
        card.addEventListener('touchend', function(e) {
          if (e.changedTouches.length > 0) {
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
        h += '<div class="pua-field"><div class="pua-field-label">\u89D2\u8272\u8BBE\u5B9A' + (charName3 ? ' \xB7 ' + this._escHtml(charName3) : '') + '</div>'
        h += '<textarea class="pua-detail-textarea" readonly>' + this._escHtml(charText3) + '</textarea></div>'
        break
      case 'user':
        var userName = this.asmData.userPersona ? (this.asmData.userPersona.name || 'User') : ''
        var userText = this.asmData.userPersona ? (this.asmData.userPersona.persona || this.asmData.userPersona.bio || '') : ''
        h += '<div class="pua-field"><div class="pua-field-label">\u7528\u6237\u4EBA\u8BBE' + (userName ? ' \xB7 ' + this._escHtml(userName) : '') + '</div>'
        h += '<textarea class="pua-detail-textarea" readonly>' + this._escHtml(userText) + '</textarea></div>'
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
        var coreText = (this.asmData.longTerm && this.asmData.longTerm.core) ? (this.asmData.longTerm.core.summary || this.asmData.longTerm.core.text || '') : ''
        h += '<div class="pua-field"><div class="pua-field-label">\u6838\u5FC3\u8BB0\u5FC6</div>'
        h += '<textarea class="pua-detail-textarea" readonly>' + this._escHtml(coreText) + '</textarea></div>'
        break
      case 'memory-fact':
        var facts = (this.asmData.longTerm && this.asmData.longTerm.facts) ? this.asmData.longTerm.facts : []
        h += '<div class="pua-field"><div class="pua-field-label">\u4E8B\u5B9E\u8BB0\u5FC6 (' + facts.length + ')</div>'
        for (var fdi = 0; fdi < facts.length; fdi++) {
          h += '<div style="margin-bottom:4px;padding:4px 8px;background:var(--pua-bg-input);border-radius:4px;font-size:10px;color:var(--pua-text-sub)">'
          h += this._escHtml(facts[fdi].summaryText || facts[fdi].action || facts[fdi].text || '')
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
            h += this._escHtml(recalled[ri].summaryText || recalled[ri].action || recalled[ri].text || '')
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
        break
    }

    this._openModal('\u8BE6\u60C5 - ' + type, h)

    // Bind preset edit save button
    if (type === 'preset') {
      var saveBtn = document.querySelector('.asm-edit-save')
      if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          var pid = this.getAttribute('data-id')
          var titleInput = document.querySelector('.asm-edit-title[data-id="' + pid + '"]')
          var roleSelect = document.querySelector('.asm-edit-role[data-id="' + pid + '"]')
          var contentTextarea = document.querySelector('.asm-edit-content[data-id="' + pid + '"]')
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
  }

  /* ── 预览最终组装的 messages ── */
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
  P._buildMessages = function() {
    var messages = []
    var self = this
    var order = this.asmOrder
    if (!order || order.length === 0) {
      order = this._defaultAsmOrder()
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
            if (charText2) messages.push({ role: 'system', content: '[\u89D2\u8272\u8BBE\u5B9A \xB7 ' + (charObj2.handle || charObj2.name) + ']\n' + charText2 })
          }
          break
        case 'user':
          if (this.asmData.userPersona) {
            var userText = this.asmData.userPersona.persona || this.asmData.userPersona.bio || ''
            if (userText) messages.push({ role: 'system', content: '[\u7528\u6237\u4EBA\u8BBE]\n' + userText })
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
            var coreText = this.asmData.longTerm.core.summary || this.asmData.longTerm.core.text || ''
            if (coreText) messages.push({ role: 'system', content: '[\u6838\u5FC3\u8BB0\u5FC6]\n' + coreText })
          }
          break
        case 'memory-fact':
          if (this.asmData.longTerm && this.asmData.longTerm.facts && this.asmData.longTerm.facts.length > 0) {
            var factTexts = []
            for (var fi = 0; fi < this.asmData.longTerm.facts.length; fi++) {
              var f = this.asmData.longTerm.facts[fi]
              factTexts.push(f.summaryText || f.action || f.text || '')
            }
            var factStr = ''
            for (var fsi = 0; fsi < factTexts.length; fsi++) {
              if (factTexts[fsi]) {
                if (factStr) factStr += '\n'
                factStr += factTexts[fsi]
              }
            }
            if (factStr) messages.push({ role: 'system', content: '[\u4E8B\u5B9E\u8BB0\u5FC6]\n' + factStr })
          }
          break
        case 'recall':
          // 召回记忆：根据当前对话动态检索相关事实记忆
          var recallFacts2 = (this.asmData.longTerm && this.asmData.longTerm.facts) ? this.asmData.longTerm.facts : []
          if (recallFacts2.length > 0) {
            var recallQuery2 = ''
            var recallMsgs = this.asmData.shortTerm || []
            if (recallMsgs.length > 0) {
              var lastRecallMsg = recallMsgs[recallMsgs.length - 1]
              recallQuery2 = (lastRecallMsg.text || lastRecallMsg.content || '').substring(0, 200)
            }
            if (!recallQuery2) recallQuery2 = '对话上下文'
            var recallSettings2 = this._loadSettings()
            var recallMax2 = recallSettings2.recallMaxCount || 8
            var recalledFacts = this._recallMemoriesSync(recallQuery2, recallFacts2, recallMax2)
            if (recalledFacts.length > 0) {
              var recallTexts = []
              for (var rci = 0; rci < recalledFacts.length; rci++) {
                recallTexts.push(recalledFacts[rci].summaryText || recalledFacts[rci].action || recalledFacts[rci].text || '')
              }
              var recallStr = ''
              for (var rsi = 0; rsi < recallTexts.length; rsi++) {
                if (recallTexts[rsi]) {
                  if (recallStr) recallStr += '\n'
                  recallStr += recallTexts[rsi]
                }
              }
              if (recallStr) messages.push({ role: 'system', content: '[召回记忆]\n' + recallStr })
            }
          }
          break
        case 'chat':
          var msgs = this.asmData.shortTerm || []
          var depth = this.asmConfig.contextDepth || 40
          var start = Math.max(0, msgs.length - depth)
          for (var mi = start; mi < msgs.length; mi++) {
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
          break
      }
    }

    // Apply prompt regexes: only on chat assistant messages
    for (var ri = 0; ri < this.regexes.length; ri++) {
      var rx = this.regexes[ri]
      if (!rx.on || rx.type !== 'prompt' || !rx.regex) continue
      try {
        var re = new RegExp(rx.regex, 'g')
        for (var cai = 0; cai < chatAssistantIndices.length; cai++) {
          var msgIdx = chatAssistantIndices[cai]
          messages[msgIdx].content = messages[msgIdx].content.replace(re, rx.html || '')
        }
      } catch(e) {}
    }

    // Apply preset outRegex/inRegex: only on chat assistant messages
    for (var pri = 0; pri < this.presets.length; pri++) {
      var pr = this.presets[pri]
      if (pr.outRegex && pr.outRegexOn) {
        try {
          var ore = new RegExp(pr.outRegex, 'g')
          for (var oai = 0; oai < chatAssistantIndices.length; oai++) {
            var oIdx = chatAssistantIndices[oai]
            messages[oIdx].content = messages[oIdx].content.replace(ore, '')
          }
        } catch(e) {}
      }
      if (pr.inRegex && pr.inRegexOn) {
        try {
          var ire = new RegExp(pr.inRegex, 'g')
          for (var iai = 0; iai < chatAssistantIndices.length; iai++) {
            var iIdx = chatAssistantIndices[iai]
            messages[iIdx].content = messages[iIdx].content.replace(ire, '')
          }
        } catch(e) {}
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
    var contextStr = this._lastAsmContext || ''

    // 如果没有缓存的上下文，尝试构建
    if (!contextStr) {
      var messages = this._buildMessages()
      var parts = []
      for (var i = 0; i < messages.length; i++) {
        parts.push('[' + messages[i].role.toUpperCase() + ']\n' + (messages[i].content || ''))
      }
      contextStr = parts.join('\n\n---\n\n')
      this._lastAsmContext = contextStr
    }

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
          var blob = new Blob([contextStr], { type: 'text/plain;charset=utf-8' })
          var url = URL.createObjectURL(blob)
          var a = document.createElement('a')
          a.href = url
          a.download = 'context_' + new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19) + '.txt'
          a.click()
          URL.revokeObjectURL(url)
          self._toast('已下载')
        })
      }
    }
  }

  /* ════════════════════════════════════════════════════════════
     工具方法
     ════════════════════════════════════════════════════════════ */

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
      } else {
        self._assistantData = { apiChoice: 'sub', history: [], undoStack: [] }
      }
    }).catch(function() {
      self._assistantData = { apiChoice: 'sub', history: [], undoStack: [] }
    })
  }

  P._saveAssistantData = function() {
    if (!this.roche || !this.roche.storage) return
    if (!this._assistantData) this._assistantData = { apiChoice: 'sub', history: [], undoStack: [] }
    this.roche.storage.set('pua_assistant', this._assistantData).catch(function(e) {
      console.error('[PUA] save assistant data failed', e)
    })
  }

  P._getAssistantSystemPrompt = function() {
    return '\u4F60\u662F\u201C\u5E73\u884C\u65F6\u7A7A\u6863\u6848\u9986\u201D\u7684\u9884\u8BBE\u4E0E\u7F8E\u5316\u52A9\u624B\u3002\u4F60\u53EF\u4EE5\u5E2E\u52A9\u7528\u6237\uFF1A\n1. \u521B\u5EFA\u65B0\u7684\u9884\u8BBE\u6761\u76EE\uFF08system prompt\uFF09\n2. \u521B\u5EFA\u65B0\u7684\u6B63\u5219\u89C4\u5219\uFF08render/filter/replace\uFF09\n3. \u7F16\u8F91\u73B0\u6709\u7684\u9884\u8BBE\u548C\u6B63\u5219\n4. \u63D0\u4F9B\u7F8E\u5316\u5EFA\u8BAE\n\n\u5F53\u4F60\u9700\u8981\u6DFB\u52A0\u6216\u4FEE\u6539\u9884\u8BBE/\u6B63\u5219\u65F6\uFF0C\u8BF7\u7528\u4EE5\u4E0BJSON\u683C\u5F0F\u8F93\u51FA\uFF1A\n\u3010ADD_PRESET\u3011{"title":"...","content":"...","role":"system","outRegex":"","outRegexOn":false,"inRegex":"","inRegexOn":false}\u3010/ADD_PRESET\u3011\n\u3010ADD_REGEX\u3011{"name":"...","regex":"...","html":"...","type":"render"}\u3010/ADD_REGEX\u3011\n\u3010EDIT_PRESET\u3011{"id":"...","title":"...","content":"..."}\u3010/EDIT_PRESET\u3011\n\u3010EDIT_REGEX\u3011{"id":"...","name":"...","regex":"...","html":"..."}\u3010/EDIT_REGEX\u3011\n\n\u6BCF\u6B21\u53EA\u6267\u884C\u4E00\u4E2A\u64CD\u4F5C\u3002\u7528\u81EA\u7136\u8BED\u8A00\u89E3\u91CA\u4F60\u5728\u505A\u4EC0\u4E48\u3002\n\u7EDD\u4E0D\u5220\u9664\u4EFB\u4F55\u6761\u76EE\uFF0C\u53EA\u6DFB\u52A0\u6216\u4FEE\u6539\u3002'
  }

  P._renderAssistant = function(titleEl, actionsEl, contentEl) {
    var self = this
    titleEl.textContent = '\u9884\u8BBE\u4E0E\u7F8E\u5316\u52A9\u624B'
    actionsEl.innerHTML = ''

    if (!this._assistantData) {
      this._assistantData = { apiChoice: 'sub', history: [], undoStack: [] }
    }
    var data = this._assistantData

    var h = '<div class="pua-assistant-layout">'

    // Header with API selector
    h += '<div class="pua-assistant-header">'
    h += '<span style="font-size:10px;color:var(--pua-text-sub)">API:</span>'
    h += '<select class="pua-assistant-api-select" id="ast-api-select">'
    h += '<option value="sub"' + (data.apiChoice === 'sub' ? ' selected' : '') + '>\u526F API</option>'
    h += '<option value="vec"' + (data.apiChoice === 'vec' ? ' selected' : '') + '>\u5411\u91CF API</option>'
    h += '</select>'
    h += '<button class="pua-btn pua-btn-sm" id="ast-clear-history" style="margin-left:auto">\u6E05\u7A7A\u5BF9\u8BDD</button>'
    h += '</div>'

    // Chat area
    h += '<div class="pua-assistant-chat" id="ast-chat">'

    if (!data.history || data.history.length === 0) {
      h += '<div class="pua-assistant-empty">'
      h += '<div class="pua-assistant-empty-icon">\u2728</div>'
      h += '<div class="pua-assistant-empty-text">\u5411\u52A9\u624B\u8BE2\u95EE\uFF0C\u5982\u201C\u5E2E\u6211\u6DFB\u52A0\u4E00\u4E2A\u89D2\u8272\u626E\u6F14\u9884\u8BBE\u201D</div>'
      h += '</div>'
    } else {
      for (var mi = 0; mi < data.history.length; mi++) {
        var msg = data.history[mi]
        if (msg.role === 'user') {
          h += '<div class="pua-assistant-msg pua-assistant-msg-user">'
          h += '<div class="pua-assistant-msg-role">\uD83D\uDC64 \u4F60</div>'
          h += '<div>' + self._escHtml(msg.content) + '</div>'
          h += '</div>'
        } else if (msg.role === 'assistant') {
          h += '<div class="pua-assistant-msg pua-assistant-msg-assistant">'
          h += '<div class="pua-assistant-msg-role">\u2728 \u52A9\u624B</div>'
          // Render content with action cards
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
    h += '<button class="pua-assistant-attach-btn" id="ast-attach-preset-btn">\uD83D\uDCCE \u9009\u62E9\u9884\u8BBE</button>'
    h += '<div class="pua-assistant-attach-list" id="ast-attach-preset-list">'
    for (var pi = 0; pi < this.presets.length; pi++) {
      h += '<div class="pua-assistant-attach-item" data-type="preset" data-id="' + this._escHtml(this.presets[pi].id) + '">' + this._escHtml(this.presets[pi].title) + '</div>'
    }
    h += '</div></div>'
    // Attach regexes dropdown
    h += '<div class="pua-assistant-attach-dropdown" id="ast-attach-regex-dropdown">'
    h += '<button class="pua-assistant-attach-btn" id="ast-attach-regex-btn">\uD83D\uDCCE \u9009\u62E9\u6B63\u5219</button>'
    h += '<div class="pua-assistant-attach-list" id="ast-attach-regex-list">'
    for (var ri = 0; ri < this.regexes.length; ri++) {
      h += '<div class="pua-assistant-attach-item" data-type="regex" data-id="' + this._escHtml(this.regexes[ri].id) + '">' + this._escHtml(this.regexes[ri].name) + '</div>'
    }
    h += '</div></div>'
    h += '</div>'
    h += '<div class="pua-assistant-input-row">'
    h += '<textarea class="pua-assistant-input" id="ast-input" placeholder="\u8F93\u5165\u6D88\u606F..." rows="1"></textarea>'
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

    // Bind clear history
    var clearBtn = contentEl.querySelector('#ast-clear-history')
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        self._assistantData.history = []
        self._assistantData.undoStack = []
        self._saveAssistantData()
        self._render()
      })
    }

    // Bind attach preset dropdown
    var attachPresetBtn = contentEl.querySelector('#ast-attach-preset-btn')
    var attachPresetList = contentEl.querySelector('#ast-attach-preset-list')
    if (attachPresetBtn && attachPresetList) {
      attachPresetBtn.addEventListener('click', function(e) {
        e.stopPropagation()
        attachPresetList.classList.toggle('open')
        // Close other dropdown
        var otherList = contentEl.querySelector('#ast-attach-regex-list')
        if (otherList) otherList.classList.remove('open')
      })
      var presetItems = attachPresetList.querySelectorAll('.pua-assistant-attach-item')
      for (var ppi = 0; ppi < presetItems.length; ppi++) {
        (function(item) {
          item.addEventListener('click', function() {
            var id = this.getAttribute('data-id')
            var preset = null
            for (var fi = 0; fi < self.presets.length; fi++) {
              if (self.presets[fi].id === id) { preset = self.presets[fi]; break }
            }
            if (preset) {
              var input = contentEl.querySelector('#ast-input')
              if (input) {
                var ctx = '\n\u4EE5\u4E0B\u662F\u5F53\u524D\u7684\u9884\u8BBE\u6761\u76EE\uFF1A\n[id: ' + preset.id + '] title: ' + preset.title + ' content: ' + (preset.content || '').substring(0, 500) + '\n'
                input.value += ctx
              }
            }
            attachPresetList.classList.remove('open')
          })
        })(presetItems[ppi])
      }
    }

    // Bind attach regex dropdown
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
            var regex = null
            for (var fi2 = 0; fi2 < self.regexes.length; fi2++) {
              if (self.regexes[fi2].id === id) { regex = self.regexes[fi2]; break }
            }
            if (regex) {
              var input = contentEl.querySelector('#ast-input')
              if (input) {
                var ctx2 = '\n\u4EE5\u4E0B\u662F\u5F53\u524D\u7684\u6B63\u5219\u89C4\u5219\uFF1A\n[id: ' + regex.id + '] name: ' + regex.name + ' regex: ' + regex.regex + ' html: ' + (regex.html || '').substring(0, 300) + '\n'
                input.value += ctx2
              }
            }
            attachRegexList.classList.remove('open')
          })
        })(regexItems[rri])
      }
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

    // Bind send
    var sendBtn = contentEl.querySelector('#ast-send')
    var inputEl = contentEl.querySelector('#ast-input')
    if (sendBtn && inputEl) {
      sendBtn.addEventListener('click', function() { self._sendAssistantMessage(contentEl) })
      inputEl.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          self._sendAssistantMessage(contentEl)
        }
      })
    }

    // Bind undo buttons
    var undoBtns = contentEl.querySelectorAll('.pua-assistant-undo-btn:not(.done)')
    for (var ui = 0; ui < undoBtns.length; ui++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          var actionId = this.getAttribute('data-action-id')
          if (actionId) self._undoAssistantAction(actionId)
        })
      })(undoBtns[ui])
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

    var h = '<div>' + self._escHtml(displayContent) + '</div>'

    // Render action cards
    for (var ai = 0; ai < actions.length; ai++) {
      var action = actions[ai]
      var label = ''
      if (action.type === 'addPreset') label = '\u2705 \u5DF2\u6DFB\u52A0\u9884\u8BBE: ' + self._escHtml(action.data.title || '')
      else if (action.type === 'addRegex') label = '\u2705 \u5DF2\u6DFB\u52A0\u6B63\u5219: ' + self._escHtml(action.data.name || '')
      else if (action.type === 'editPreset') label = '\u2705 \u5DF2\u4FEE\u6539\u9884\u8BBE: ' + self._escHtml(action.data.title || '')
      else if (action.type === 'editRegex') label = '\u2705 \u5DF2\u4FEE\u6539\u6B63\u5219: ' + self._escHtml(action.data.name || '')

      // Check if undone
      var undone = false
      if (self._assistantData && self._assistantData.undoStack) {
        for (var usi = 0; usi < self._assistantData.undoStack.length; usi++) {
          if (self._assistantData.undoStack[usi].actionId === action.id && self._assistantData.undoStack[usi].undone) {
            undone = true
            break
          }
        }
      }

      h += '<div class="pua-assistant-action-card">'
      h += '<span class="pua-assistant-action-label">' + label + '</span>'
      h += '<button class="pua-assistant-undo-btn' + (undone ? ' done' : '') + '" data-action-id="' + self._escHtml(action.id) + '">' + (undone ? '\u5DF2\u64A4\u9500' : '\u21A9\uFE0F \u64A4\u9500') + '</button>'
      h += '</div>'
    }

    return h
  }

  P._sendAssistantMessage = function(contentEl) {
    var self = this
    if (this._assistantSending) return

    var input = contentEl.querySelector('#ast-input')
    if (!input) return
    var text = input.value.trim()
    if (!text) return

    if (!this._assistantData) this._assistantData = { apiChoice: 'sub', history: [], undoStack: [] }

    // Get API config
    var settings = this._loadSettings()
    var preset = this._getActivePreset()
    if (!preset) { this._toast('\u8BF7\u5148\u914D\u7F6E API'); return }

    var endpoint, apiKey, model
    if (this._assistantData.apiChoice === 'vec') {
      endpoint = preset.vecEndpoint
      apiKey = preset.vecApiKey
      model = preset.vecModel
    } else {
      endpoint = preset.subEndpoint
      apiKey = preset.subApiKey
      model = preset.subModel
    }

    if (!endpoint || !apiKey || !model) {
      this._toast('\u8BF7\u5148\u914D\u7F6E' + (this._assistantData.apiChoice === 'vec' ? '\u5411\u91CF' : '\u526F') + ' API')
      return
    }

    // Add user message
    var userMsg = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
      actions: [],
      timestamp: new Date().toISOString()
    }
    this._assistantData.history.push(userMsg)
    input.value = ''
    this._saveAssistantData()

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
    var history = this._assistantData.history
    var startIdx = Math.max(0, history.length - 20) // Last 20 messages
    for (var hi = startIdx; hi < history.length; hi++) {
      messages.push({ role: history[hi].role, content: history[hi].content })
    }

    var url = endpoint.replace(/\/+$/, '') + '/chat/completions'
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    }).then(function(r) { return r.json() }).then(function(data) {
      // Remove typing indicator
      var typingEl2 = contentEl.querySelector('#ast-typing')
      if (typingEl2) typingEl2.remove()

      if (!data.choices || !data.choices[0]) {
        self._assistantSending = false
        self._toast('API \u8FD4\u56DE\u5F02\u5E38')
        return
      }

      var content = (data.choices[0].message || {}).content || ''

      // Parse action tags
      var actions = []
      var addPresetMatch = content.match(/\u3010ADD_PRESET\u3011([\s\S]*?)\u3010\/ADD_PRESET\u3011/)
      if (addPresetMatch) {
        try {
          var pd = JSON.parse(addPresetMatch[1].trim())
          var actionId = 'action_' + Date.now()
          var newPreset = {
            id: 'p' + Date.now(),
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
          self.presets.push(newPreset)
          self._savePresets()
          actions.push({ type: 'addPreset', data: { id: newPreset.id, title: newPreset.title }, id: actionId })
          self._assistantData.undoStack.push({ actionId: actionId, undone: false, type: 'addPreset', itemId: newPreset.id })
        } catch(e) {}
      }

      var addRegexMatch = content.match(/\u3010ADD_REGEX\u3011([\s\S]*?)\u3010\/ADD_REGEX\u3011/)
      if (addRegexMatch) {
        try {
          var rd = JSON.parse(addRegexMatch[1].trim())
          var actionId2 = 'action_' + Date.now() + '_r'
          var newRegex = {
            id: 'r' + Date.now(),
            name: rd.name || '\u672A\u547D\u540D',
            regex: rd.regex || '',
            html: rd.html || '',
            type: rd.type || 'render',
            on: true,
            dMin: 0,
            dMax: Infinity
          }
          self.regexes.push(newRegex)
          self._saveRegexes()
          actions.push({ type: 'addRegex', data: { id: newRegex.id, name: newRegex.name }, id: actionId2 })
          self._assistantData.undoStack.push({ actionId: actionId2, undone: false, type: 'addRegex', itemId: newRegex.id })
        } catch(e2) {}
      }

      var editPresetMatch = content.match(/\u3010EDIT_PRESET\u3011([\s\S]*?)\u3010\/EDIT_PRESET\u3011/)
      if (editPresetMatch) {
        try {
          var epd = JSON.parse(editPresetMatch[1].trim())
          var actionId3 = 'action_' + Date.now() + '_ep'
          // Find and edit preset
          for (var epi = 0; epi < self.presets.length; epi++) {
            if (self.presets[epi].id === epd.id) {
              var beforeEdit = { title: self.presets[epi].title, content: self.presets[epi].content }
              if (epd.title) self.presets[epi].title = epd.title
              if (epd.content) self.presets[epi].content = epd.content
              self._savePresets()
              actions.push({ type: 'editPreset', data: { id: epd.id, title: self.presets[epi].title }, id: actionId3 })
              self._assistantData.undoStack.push({ actionId: actionId3, undone: false, type: 'editPreset', itemId: epd.id, before: beforeEdit })
              break
            }
          }
        } catch(e3) {}
      }

      var editRegexMatch = content.match(/\u3010EDIT_REGEX\u3011([\s\S]*?)\u3010\/EDIT_REGEX\u3011/)
      if (editRegexMatch) {
        try {
          var erd = JSON.parse(editRegexMatch[1].trim())
          var actionId4 = 'action_' + Date.now() + '_er'
          for (var eri = 0; eri < self.regexes.length; eri++) {
            if (self.regexes[eri].id === erd.id) {
              var beforeEdit2 = { name: self.regexes[eri].name, regex: self.regexes[eri].regex, html: self.regexes[eri].html }
              if (erd.name) self.regexes[eri].name = erd.name
              if (erd.regex) self.regexes[eri].regex = erd.regex
              if (erd.html) self.regexes[eri].html = erd.html
              self._saveRegexes()
              actions.push({ type: 'editRegex', data: { id: erd.id, name: self.regexes[eri].name }, id: actionId4 })
              self._assistantData.undoStack.push({ actionId: actionId4, undone: false, type: 'editRegex', itemId: erd.id, before: beforeEdit2 })
              break
            }
          }
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
      self._assistantData.history.push(assistantMsg)
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

  P._undoAssistantAction = function(actionId) {
    if (!this._assistantData || !this._assistantData.undoStack) return

    for (var i = 0; i < this._assistantData.undoStack.length; i++) {
      var entry = this._assistantData.undoStack[i]
      if (entry.actionId === actionId && !entry.undone) {
        if (entry.type === 'addPreset') {
          // Remove the added preset
          for (var pi = 0; pi < this.presets.length; pi++) {
            if (this.presets[pi].id === entry.itemId) {
              this.presets.splice(pi, 1)
              this._savePresets()
              break
            }
          }
        } else if (entry.type === 'addRegex') {
          // Remove the added regex
          for (var ri = 0; ri < this.regexes.length; ri++) {
            if (this.regexes[ri].id === entry.itemId) {
              this.regexes.splice(ri, 1)
              this._saveRegexes()
              break
            }
          }
        } else if (entry.type === 'editPreset') {
          // Restore original values
          for (var pi2 = 0; pi2 < this.presets.length; pi2++) {
            if (this.presets[pi2].id === entry.itemId) {
              if (entry.before) {
                if (entry.before.title) this.presets[pi2].title = entry.before.title
                if (entry.before.content) this.presets[pi2].content = entry.before.content
              }
              this._savePresets()
              break
            }
          }
        } else if (entry.type === 'editRegex') {
          // Restore original values
          for (var ri2 = 0; ri2 < this.regexes.length; ri2++) {
            if (this.regexes[ri2].id === entry.itemId) {
              if (entry.before) {
                if (entry.before.name) this.regexes[ri2].name = entry.before.name
                if (entry.before.regex) this.regexes[ri2].regex = entry.before.regex
                if (entry.before.html) this.regexes[ri2].html = entry.before.html
              }
              this._saveRegexes()
              break
            }
          }
        }

        entry.undone = true
        this._saveAssistantData()
        this._toast('\u5DF2\u64A4\u9500')
        this._render()
        return
      }
    }
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
    try {
      var ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:absolute;left:-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      this._toast('\u65E5\u5FD7\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F')
    } catch(e) {
      this._logBuffer.push({ level: 'info', text: '\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236\u4E0B\u65B9\u65E5\u5FD7\uFF0C\u603B\u5171' + this._logBuffer.length + '\u6761', time: new Date().toLocaleTimeString('zh-CN') })
    }
  }

  P._exportLogs = function() {
    var text = ''
    for (var i = 0; i < this._logBuffer.length; i++) {
      var e = this._logBuffer[i]
      text += '[' + e.time + '] [' + e.level + '] ' + e.text + '\n'
    }
    var blob = new Blob([text], { type: 'text/plain' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'pua-logs-' + Date.now() + '.txt'
    a.click()
    URL.revokeObjectURL(url)
    this._toast('\u65E5\u5FD7\u5DF2\u5BFC\u51FA')
  }

  P._clearLogs = function() {
    this._logBuffer = []
    if (this._logList) this._logList.innerHTML = ''
    if (this._logCount) this._logCount.style.display = 'none'
    this._toast('\u65E5\u5FD7\u5DF2\u6E05\u9664')
  }

  /* ════════════════════════════════════════════════════════════
     对话页面（Coming Soon）
     ════════════════════════════════════════════════════════════ */

  P._renderChat = function(titleEl, actionsEl, contentEl) {
    titleEl.textContent = '\u5BF9\u8BDD'
    actionsEl.innerHTML = ''

    var h = ''
    h += '<div style="display:flex;align-items:center;justify-content:center;height:100%;min-height:400px">'
    h += '<div style="text-align:center;padding:40px;max-width:480px">'
    h += '<div style="width:80px;height:80px;margin:0 auto 24px;border-radius:50%;background:linear-gradient(135deg,var(--pua-accent-dim),var(--pua-accent));display:flex;align-items:center;justify-content:center;font-size:36px;box-shadow:0 0 40px var(--pua-accent-glow);animation:pua-chat-pulse 2s ease-in-out infinite">\uD83D\uDCAC</div>'
    h += '<h2 style="font-size:20px;font-weight:700;color:var(--pua-accent-text);margin-bottom:8px">\u65F6\u7A7A\u5BF9\u8BDD\u7CFB\u7EDF</h2>'
    h += '<p style="font-size:12px;color:var(--pua-accent);margin-bottom:16px">\u6838\u5FC3\u529F\u80FD\u5F00\u53D1\u4E2D...</p>'
    h += '<p style="font-size:11px;color:var(--pua-text-sub);line-height:1.8">\u8FDE\u63A5\u4E3B API\uFF0C\u4F7F\u7528\u7EC4\u88C5\u4E0A\u4E0B\u6587 + \u8BB0\u5FC6\u7CFB\u7EDF\uFF0C<br>\u5B9E\u73B0\u771F\u6B63\u7684\u89D2\u8272\u626E\u6F14\u5BF9\u8BDD\u3002<br>\u652F\u6301\u591A\u5206\u652F\u8BB0\u5FC6\u8054\u52A8\u3001\u5411\u91CF\u53EC\u56DE\u3001\u81EA\u52A8\u603B\u7ED3\u3002</p>'
    h += '<div style="margin-top:24px;font-size:10px;color:var(--pua-text-dim)">\u8BF7\u671F\u5F85\u4E0B\u4E00\u7248\u672C \u2728</div>'
    h += '</div></div>'

    contentEl.innerHTML = h
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
    h += '<div class="pua-settings-title">\uD83C\uDFA8 \u4E3B\u9898\u9009\u62E9</div>'
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
    h += '<div class="pua-settings-title">\u270F CSS \u7F16\u8F91\u5668</div>'
    var currentCss = ''
    if (activeId) {
      for (var ci = 0; ci < themes.length; ci++) {
        if (themes[ci].id === activeId) { currentCss = themes[ci].css || ''; break }
      }
    }
    h += '<textarea id="theme-css-editor" style="width:100%;min-height:400px;background:#1a1a2e;border:1px solid var(--pua-border);border-radius:8px;padding:14px 16px;color:#e0e0e0;font-size:12px;font-family:Consolas,Monaco,monospace;line-height:1.7;outline:none;resize:vertical;tab-size:2">' + self._escHtml(currentCss) + '</textarea>'
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
        var blob = new Blob([json], { type: 'application/json' })
        var url = URL.createObjectURL(blob)
        var a = document.createElement('a')
        a.href = url
        a.download = (themeObj.name || 'theme') + '.json'
        a.click()
        URL.revokeObjectURL(url)
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
    h += '<div class="pua-settings-title">\u2726 API \u9884\u8BBE</div>'
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

    // 副 API 配置
    h += '<div class="pua-settings-group">'
    h += '<div class="pua-settings-title">\u2726 \u526F API \u914D\u7F6E</div>'
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
    h += '<div class="pua-settings-title">\u2726 \u5411\u91CF API \u914D\u7F6E</div>'
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
    h += '<div class="pua-settings-title">\u2726 \u8BB0\u5FC6\u53C2\u6570</div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u6BCF\u8F6E\u53D1\u9001\u4E8B\u5B9E\u8BB0\u5FC6</span>'
    h += '<input class="pua-settings-input" id="set-mem-fact-send" type="number" min="1" max="100" value="' + (settings.factSendCount || 10) + '" style="width:80px;flex:none">'
    h += '<span style="font-size:10px;color:var(--pua-text-dim)">\u6761</span></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u603B\u7ED3\u95F4\u9694</span>'
    h += '<input class="pua-settings-input" id="set-mem-summarize-interval" type="number" min="1" max="200" value="' + (settings.summarizeInterval || 30) + '" style="width:80px;flex:none">'
    h += '<span style="font-size:10px;color:var(--pua-text-dim)">\u8F6E</span></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u6838\u5FC3\u8BB0\u5FC6\u5B57\u6570\u4E0A\u9650</span>'
    h += '<input class="pua-settings-input" id="set-mem-core-limit" type="number" min="100" max="10000" value="' + (settings.coreCharLimit || 2000) + '" style="width:80px;flex:none">'
    h += '<span style="font-size:10px;color:var(--pua-text-dim)">\u5B57</span></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u4E8B\u4EF6\u6458\u8981\u5B57\u6570\u4E0A\u9650</span>'
    h += '<input class="pua-settings-input" id="set-mem-events-limit" type="number" min="100" max="10000" value="' + (settings.eventsCharLimit || 1000) + '" style="width:80px;flex:none">'
    h += '<span style="font-size:10px;color:var(--pua-text-dim)">\u5B57</span></div>'
    h += '<div class="pua-settings-row"><span class="pua-settings-label">\u53EC\u56DE\u8BB0\u5FC6\u4E0A\u9650</span>'
    h += '<input class="pua-settings-input" id="set-mem-recall-max" type="number" min="1" max="20" value="' + (settings.recallMaxCount || 8) + '" style="width:80px;flex:none">'
    h += '<span style="font-size:10px;color:var(--pua-text-dim)">\u6761</span></div>'
    h += '<div class="pua-settings-toggle-row"><span class="pua-settings-toggle-label">\u53EC\u56DE\u65B9\u5F0F</span>'
    h += '<select class="pua-settings-select" id="set-mem-recall-mode">'
    h += '<option value="vector"' + (settings.recallMode === 'vector' ? ' selected' : '') + '>\u5411\u91CF\u68C0\u7D22\uFF08\u4FBF\u5B9C\uFF09</option>'
    h += '<option value="subapi"' + (settings.recallMode === 'subapi' ? ' selected' : '') + '>\u526F API \u53EC\u56DE\uFF08\u7CBE\u51C6\u4F46\u66F4\u8D35\uFF09</option>'
    h += '</select></div>'
    h += '</div>'

    // 保存按钮
    h += '<div style="text-align:right;margin-top:6px">'
    h += '<button class="pua-btn pua-btn-gold" id="set-save-btn">\u4FDD\u5B58\u8BBE\u7F6E</button>'
    h += '</div>'

    contentEl.innerHTML = h
    contentEl.scrollTop = savedScrollTop

    // ===== 事件绑定 =====

    // 预设切换
    var presetSelect = document.getElementById('set-preset-select')
    if (presetSelect) {
      presetSelect.addEventListener('change', function() {
        settings.activePresetId = this.value
        self._saveSettings(settings)
        self._render()
      })
    }

    // 新建预设
    var presetAddBtn = document.getElementById('set-preset-add')
    if (presetAddBtn) {
      presetAddBtn.addEventListener('click', function() {
        var name = prompt('\u8BF7\u8F93\u5165\u9884\u8BBE\u540D\u79F0', '\u65B0\u9884\u8BBE')
        if (!name) return
        var newPreset = {
          id: 'preset-' + Date.now(),
          name: name,
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
    var presetRenameBtn = document.getElementById('set-preset-rename')
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
    var presetDeleteBtn = document.getElementById('set-preset-delete')
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

    // 刷新副API模型
    var subRefreshBtn = document.getElementById('set-sub-refresh')
    if (subRefreshBtn) {
      subRefreshBtn.addEventListener('click', function() {
        var endpoint = (document.getElementById('set-sub-endpoint') || {}).value || ''
        var apiKey = (document.getElementById('set-sub-key') || {}).value || ''
        if (!endpoint || !apiKey) { self._toast('\u8BF7\u5148\u586B\u5199\u63A5\u53E3\u5730\u5740\u548C API Key'); return }
        var statusEl = document.getElementById('set-sub-status')
        if (statusEl) statusEl.textContent = '\u5237\u65B0\u4E2D...'
        var url = endpoint.replace(/\/+$/, '') + '/models'
        fetch(url, { headers: { 'Authorization': 'Bearer ' + apiKey } }).then(function(r) { return r.json() }).then(function(data) {
          var models = data.data || data.models || []
          var select = document.getElementById('set-sub-model-select')
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
            var modelInput = document.getElementById('set-sub-model')
            if (modelInput) modelInput.value = this.value
          })
        }).catch(function(e) {
          if (statusEl) statusEl.textContent = '\u5237\u65B0\u5931\u8D25: ' + (e.message || e)
        })
      })
    }

    // 测试副API调用
    var subTestBtn = document.getElementById('set-sub-test')
    if (subTestBtn) {
      subTestBtn.addEventListener('click', function() {
        var endpoint = (document.getElementById('set-sub-endpoint') || {}).value || ''
        var apiKey = (document.getElementById('set-sub-key') || {}).value || ''
        var model = (document.getElementById('set-sub-model') || {}).value || ''
        if (!endpoint || !apiKey || !model) { self._toast('\u8BF7\u5148\u586B\u5199\u5B8C\u6574\u914D\u7F6E'); return }
        var statusEl = document.getElementById('set-sub-status')
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
    var vecRefreshBtn = document.getElementById('set-vec-refresh')
    if (vecRefreshBtn) {
      vecRefreshBtn.addEventListener('click', function() {
        var endpoint = (document.getElementById('set-vec-endpoint') || {}).value || ''
        var apiKey = (document.getElementById('set-vec-key') || {}).value || ''
        if (!endpoint || !apiKey) { self._toast('\u8BF7\u5148\u586B\u5199\u63A5\u53E3\u5730\u5740\u548C API Key'); return }
        var statusEl = document.getElementById('set-vec-status')
        if (statusEl) statusEl.textContent = '\u5237\u65B0\u4E2D...'
        var url = endpoint.replace(/\/+$/, '') + '/models'
        fetch(url, { headers: { 'Authorization': 'Bearer ' + apiKey } }).then(function(r) { return r.json() }).then(function(data) {
          var models = data.data || data.models || []
          var select = document.getElementById('set-vec-model-select')
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
            var modelInput = document.getElementById('set-vec-model')
            if (modelInput) modelInput.value = this.value
          })
        }).catch(function(e) {
          if (statusEl) statusEl.textContent = '\u5237\u65B0\u5931\u8D25: ' + (e.message || e)
        })
      })
    }

    // 测试向量API调用
    var vecTestBtn = document.getElementById('set-vec-test')
    if (vecTestBtn) {
      vecTestBtn.addEventListener('click', function() {
        var endpoint = (document.getElementById('set-vec-endpoint') || {}).value || ''
        var apiKey = (document.getElementById('set-vec-key') || {}).value || ''
        var model = (document.getElementById('set-vec-model') || {}).value || ''
        if (!endpoint || !apiKey || !model) { self._toast('\u8BF7\u5148\u586B\u5199\u5B8C\u6574\u914D\u7F6E'); return }
        var statusEl = document.getElementById('set-vec-status')
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
    var saveBtn = document.getElementById('set-save-btn')
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        // 更新当前预设
        var cur = settings.activePresetId
        var p = null
        for (var si2 = 0; si2 < settings.presets.length; si2++) {
          if (settings.presets[si2].id === cur) { p = settings.presets[si2]; break }
        }
        if (!p) return
        p.subEndpoint = (document.getElementById('set-sub-endpoint') || {}).value || ''
        p.subApiKey = (document.getElementById('set-sub-key') || {}).value || ''
        p.subModel = (document.getElementById('set-sub-model') || {}).value || ''
        p.vecEndpoint = (document.getElementById('set-vec-endpoint') || {}).value || ''
        p.vecApiKey = (document.getElementById('set-vec-key') || {}).value || ''
        p.vecModel = (document.getElementById('set-vec-model') || {}).value || ''
        // 全局参数
        settings.factSendCount = parseInt((document.getElementById('set-mem-fact-send') || {}).value) || 10
        settings.summarizeInterval = parseInt((document.getElementById('set-mem-summarize-interval') || {}).value) || 30
        settings.coreCharLimit = parseInt((document.getElementById('set-mem-core-limit') || {}).value) || 2000
        settings.eventsCharLimit = parseInt((document.getElementById('set-mem-events-limit') || {}).value) || 1000
        settings.recallMaxCount = parseInt((document.getElementById('set-mem-recall-max') || {}).value) || 8
        settings.recallMode = (document.getElementById('set-mem-recall-mode') || {}).value || 'vector'
        self._saveSettings(settings)
        self._toast('\u8BBE\u7F6E\u5DF2\u4FDD\u5B58')
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
          this._settingsCache.presets = [{ id: 'preset-default', name: '\u9ED8\u8BA4\u9884\u8BBE', subEndpoint: '', subApiKey: '', subModel: '', vecEndpoint: '', vecApiKey: '', vecModel: '' }]
        }
        if (!this._settingsCache.activePresetId) {
          this._settingsCache.activePresetId = this._settingsCache.presets[0].id
        }
        if (!this._settingsCache.eventsCharLimit) {
          this._settingsCache.eventsCharLimit = 1000
        }
        return this._settingsCache
      }
    } catch(e) {}
    this._settingsCache = {
      presets: [{ id: 'preset-default', name: '\u9ED8\u8BA4\u9884\u8BBE', subEndpoint: '', subApiKey: '', subModel: '', vecEndpoint: '', vecApiKey: '', vecModel: '' }],
      activePresetId: 'preset-default',
      factSendCount: 10, summarizeInterval: 30,
      coreCharLimit: 2000, eventsCharLimit: 1000, recallMaxCount: 8, recallMode: 'vector'
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
    var memData = currentBranchId ? this._loadMemData(currentBranchId) : { core: { relationship: '', events: '' }, facts: [] }
    // 最终安全兜底
    if (!memData) memData = { core: { relationship: '', events: '' }, facts: [] }
    if (!memData.core) memData.core = { relationship: '', events: '' }
    if (!memData.core.relationship) memData.core.relationship = ''
    if (!memData.core.events) memData.core.events = ''
    if (!memData.facts || !Array.isArray(memData.facts)) memData.facts = []

    // 统计
    var coreRelLen = (memData.core.relationship || '').length || 0
    var coreEvtLen = (memData.core.events || '').length || 0
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
    h += '<div class="pua-mem-card-title">\u2726 \u5F53\u524D\u5206\u652F</div>'
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
    h += '<div class="pua-mem-card-title">\u2726 \u6838\u5FC3\u8BB0\u5FC6</div>'
    h += '<div style="margin-bottom:8px"><div style="font-size:10px;color:var(--pua-accent);font-weight:600;margin-bottom:4px">\u5173\u7CFB\u4E0E\u5267\u60C5\u8FDB\u5C55</div>'
    h += '<textarea class="pua-mem-detail-textarea" id="mem-core-rel">' + this._escHtml(memData.core && memData.core.relationship || '') + '</textarea></div>'
    h += '<div style="margin-bottom:8px"><div style="font-size:10px;color:var(--pua-accent);font-weight:600;margin-bottom:4px">\u4E8B\u4EF6\u6458\u8981</div>'
    h += '<textarea class="pua-mem-detail-textarea" id="mem-core-evt">' + this._escHtml(memData.core && memData.core.events || '') + '</textarea></div>'
    h += '<div class="pua-mem-card-meta"><span>\u5173\u7CFB\u8FDB\u5C55 \u9650\u5236: ' + (settings.coreCharLimit || 2000) + ' \u5B57 / \u5F53\u524D: ' + coreRelLen + ' \u5B57</span>'
    h += '<span>\u4E8B\u4EF6\u6458\u8981 \u9650\u5236: ' + (settings.eventsCharLimit || 1000) + ' \u5B57 / \u5F53\u524D: ' + coreEvtLen + ' \u5B57</span></div>'
    h += '<button class="pua-btn pua-btn-sm" id="mem-core-save" style="margin-top:6px">\u4FDD\u5B58\u6838\u5FC3\u8BB0\u5FC6</button>'
    h += '</div>'

    // 事实记忆列表
    h += '<div class="pua-mem-card">'
    h += '<div class="pua-mem-card-title">\u2726 \u4E8B\u5B9E\u8BB0\u5FC6 (' + factCount + ' \u6761)</div>'
    if (memData.facts && memData.facts.length > 0) {
      for (var mi = 0; mi < memData.facts.length; mi++) {
        var fact = memData.facts[mi]
        h += '<div class="pua-mem-fact-item" data-fact-id="' + (fact.id || mi) + '">'
        var needsMark = fact.needsSummary ? ' <span style="color:var(--pua-accent);font-size:8px">[\u5F85\u603B\u7ED3]</span>' : ''
        h += '<div class="pua-mem-fact-summary">' + this._escHtml(fact.summary || fact.text || '') + needsMark + '</div>'
        if (fact.keywords) {
          h += '<div class="pua-mem-fact-kw">\u5173\u952E\u8BCD: ' + this._escHtml(fact.keywords) + '</div>'
        }
        h += '<span class="pua-mem-fact-time">' + (fact.timestamp || '') + '</span>'
        h += '</div>'
      }
    } else {
      h += '<div style="font-size:11px;color:var(--pua-text-dim);text-align:center;padding:20px">\u6682\u65E0\u4E8B\u5B9E\u8BB0\u5FC6\uFF0C\u901A\u8FC7\u5206\u652F\u5B58\u6863\u83B7\u53D6\u6216\u624B\u52A8\u6DFB\u52A0</div>'
    }
    h += '<div style="display:flex;gap:6px;margin-top:8px;align-items:center;flex-wrap:wrap">'
    h += '<button class="pua-btn pua-btn-sm" id="mem-fact-add">+ \u6DFB\u52A0\u4E8B\u5B9E\u8BB0\u5FC6</button>'
    h += '<button class="pua-btn pua-btn-sm" id="mem-fact-embed">\u751F\u6210\u5411\u91CF</button>'
    h += '<button class="pua-btn pua-btn-sm" id="mem-fact-summarize">\u2726 \u603B\u7ED3\u8BB0\u5FC6</button>'
    h += '<input type="number" id="mem-batch-size" value="10" min="1" max="50" style="width:48px;background:var(--pua-bg-input);border:1px solid var(--pua-border);border-radius:4px;padding:3px 5px;color:var(--pua-text);font-size:10px;text-align:center;outline:none" title="\u6BCF\u6279\u603B\u7ED3\u6570\u91CF">'
    h += '<button class="pua-btn pua-btn-sm pua-btn-gold" id="mem-fact-summarize-all">\u5168\u90E8\u603B\u7ED3</button>'
    h += '<button class="pua-btn pua-btn-sm pua-btn-danger" id="mem-fact-clear">\u6E05\u7A7A\u5168\u90E8</button>'
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
        var evtEl = contentEl.querySelector('#mem-core-evt')
        if (!memData.core) memData.core = { relationship: '', events: '' }
        memData.core.relationship = relEl ? relEl.value : ''
        memData.core.events = evtEl ? evtEl.value : ''
        self._saveMemData(memData, currentBranchId)
        self._toast('\u6838\u5FC3\u8BB0\u5FC6\u5DF2\u4FDD\u5B58')
      })
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
          parsed.core = { relationship: parsed.core, events: '' }
        }
        if (!parsed.core || typeof parsed.core !== 'object') {
          parsed.core = { relationship: '', events: '' }
        }
        if (!parsed.core.relationship) parsed.core.relationship = ''
        if (!parsed.core.events) parsed.core.events = ''
        if (!parsed.facts || !Array.isArray(parsed.facts)) parsed.facts = []
        this._memDataCache = parsed
        this._memDataCacheKey = key
        return this._memDataCache
      }
    } catch(e) {
      // 损坏的数据，清除并返回默认
      try { localStorage.removeItem(key) } catch(e2) {}
    }
    this._memDataCache = { core: { relationship: '', events: '' }, facts: [] }
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
      var text = (document.getElementById('fact-text') || {}).value || ''
      var summary = (document.getElementById('fact-summary') || {}).value || ''
      var keywords = (document.getElementById('fact-keywords') || {}).value || ''
      if (!text) { self._toast('\u8BF7\u8F93\u5165\u4E8B\u5B9E\u5185\u5BB9'); return }
      if (!memData.facts) memData.facts = []
      memData.facts.push({
        id: 'f' + Date.now(),
        text: text,
        summary: summary || text.substring(0, 50),
        keywords: keywords,
        embedding: null,
        timestamp: new Date().toLocaleString('zh-CN'),
        conversationId: ''
      })
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
    body += '<input class="pua-field-input" id="fact-detail-summary" value="' + this._escHtml(fact.summary || '') + '"></div>'
    body += '<div class="pua-field"><div class="pua-field-label">\u5173\u952E\u8BCD</div>'
    body += '<input class="pua-field-input" id="fact-detail-keywords" value="' + this._escHtml(fact.keywords || '') + '"></div>'
    body += '<div style="font-size:9px;color:var(--pua-text-dim)">\u65F6\u95F4: ' + (fact.timestamp || '-') + ' | \u4F1A\u8BDD: ' + (fact.conversationId || '-') + '</div>'

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
      fact.text = (document.getElementById('fact-detail-text') || {}).value || fact.text
      fact.summary = (document.getElementById('fact-detail-summary') || {}).value || fact.summary
      fact.keywords = (document.getElementById('fact-detail-keywords') || {}).value || fact.keywords
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

          // 合并核心记忆 → relationship
          if (data.core) {
            var coreText = data.core.summary || data.core.text || String(data.core)
            if (coreText) {
              if (!memData.core) memData.core = { relationship: '', events: '' }
              if (memData.core.relationship && memData.core.relationship.indexOf(coreText) === -1) {
                memData.core.relationship += '\n' + coreText
              } else if (!memData.core.relationship) {
                memData.core.relationship = coreText
              }
            }
          }

          // 合并事实记忆（不生成summary/keywords，标记待总结）
          if (data.facts && data.facts.length > 0) {
            if (!memData.facts) memData.facts = []
            for (var fi = 0; fi < data.facts.length; fi++) {
              var fact = data.facts[fi]
              var factText = fact.summaryText || fact.action || fact.text || ''
              if (!factText) continue
              var exists = false
              for (var ei = 0; ei < memData.facts.length; ei++) {
                if (memData.facts[ei].text === factText) { exists = true; break }
              }
              if (!exists) {
                memData.facts.push({
                  id: 'f' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
                  text: factText,
                  summary: '',
                  keywords: '',
                  embedding: null,
                  timestamp: new Date().toLocaleString('zh-CN'),
                  conversationId: convId,
                  source: 'roche',
                  needsSummary: true
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

    // 找出需要总结的事实记忆
    var toSummarize = []
    for (var i = 0; i < memData.facts.length; i++) {
      if (memData.facts[i].needsSummary || !memData.facts[i].summary || !memData.facts[i].keywords) {
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
    this._toast('\u5F00\u59CB\u603B\u7ED3 ' + total + ' \u6761\u8BB0\u5FC6...')

    var actualBatchSize = batchSize || 10
    if (actualBatchSize < 1) actualBatchSize = 1
    if (actualBatchSize > 50) actualBatchSize = 50
    var batchIdx = 0
    var processed = 0

    function processBatch() {
      if (batchIdx >= toSummarize.length) {
        self._saveMemData(memData, branchId)
        self._toast('\u8BB0\u5FC6\u603B\u7ED3\u5B8C\u6210')
        self._render()
        return
      }

      var batchIndices = toSummarize.slice(batchIdx, batchIdx + actualBatchSize)
      var factsText = ''
      for (var bi = 0; bi < batchIndices.length; bi++) {
        var fi = batchIndices[bi]
        factsText += (bi + 1) + '. ' + memData.facts[fi].text + '\n'
      }

      var prompt = '\u8BF7\u4E3A\u4EE5\u4E0B\u4E8B\u5B9E\u8BB0\u5FC6\u751F\u6210\u4E00\u53E5\u8BDD\u6458\u8981\u548C\u5173\u952E\u8BCD\u3002\u6BCF\u6761\u8BB0\u5FC6\u9700\u8981\u8F93\u51FA\uFF1A\u7F16\u53F7|\u6458\u8981|\u5173\u952E\u8BCD\uFF08\u9017\u53F7\u5206\u9694\uFF09\n\n' + factsText

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

        // 解析结果
        var lines = content.split('\n')
        for (var li = 0; li < lines.length; li++) {
          var line = lines[li].trim()
          if (!line) continue
          // 尝试匹配 "编号|摘要|关键词" 格式
          var match = line.match(/^(\d+)\s*[|｜]\s*(.+?)\s*[|｜]\s*(.+)$/)
          if (match) {
            var num = parseInt(match[1])
            var summary = match[2].trim()
            var keywords = match[3].trim()
            if (num >= 1 && num <= batchIndices.length) {
              var fIdx = batchIndices[num - 1]
              memData.facts[fIdx].summary = summary
              memData.facts[fIdx].keywords = keywords
              memData.facts[fIdx].needsSummary = false

              // 同步追加到 core.events
              if (!memData.core) memData.core = { relationship: '', events: '' }
              if (memData.core.events) {
                memData.core.events += '\n' + summary
              } else {
                memData.core.events = summary
              }
            }
          }
        }

        batchIdx += actualBatchSize
        processed += batchIndices.length
        processBatch()
      }).catch(function(e) {
        self._toast('\u603B\u7ED3\u5931\u8D25: ' + (e.message || e))
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
    version: '0.9.1',
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
