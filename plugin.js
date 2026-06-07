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
  '  position:relative; overflow:visible;',
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
    '.pua-topbar { height:48px; min-height:48px; background:var(--pua-bg-card);',
    '  backdrop-filter:var(--pua-glass); -webkit-backdrop-filter:var(--pua-glass);',
    '  border-bottom:1px solid var(--pua-border); display:flex; align-items:center;',
    '  justify-content:space-between; padding:0 20px; }',
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
    '.pua-topbar { height:auto; min-height:52px; flex-wrap:wrap; padding:8px 12px; }',
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
    '.pua-assistant-input-area { padding:10px 14px; border-top:1px solid var(--pua-border); }',
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
    '.pua-conv-layout { display:flex; flex-direction:column; height:100%; }',
    '.pua-conv-topbar { padding:6px 14px; border-bottom:1px solid var(--pua-border); display:flex; align-items:center; gap:8px; flex-shrink:0; }',
    '.pua-conv-branch-name { font-size:12px; font-weight:600; color:var(--pua-accent-text); flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
    '.pua-conv-msg-count { font-size:9px; color:var(--pua-text-dim); background:var(--pua-bg-input); padding:2px 6px; border-radius:8px; }',
    '.pua-conv-topbar-btn { width:26px; height:26px; border-radius:6px; border:1px solid var(--pua-border); background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center; transition:var(--pua-transition); }',
    '.pua-conv-topbar-btn:hover { border-color:var(--pua-border-active); color:var(--pua-text); }',
    '.pua-conv-chat { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:10px; }',
    '.pua-conv-chat::-webkit-scrollbar { width:4px; }',
    '.pua-conv-chat::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.06); border-radius:2px; }',
    '.pua-conv-collapsed { text-align:center; padding:8px; font-size:10px; color:var(--pua-text-dim); cursor:pointer; }',
    '.pua-conv-collapsed:hover { color:var(--pua-accent); }',
    '.pua-conv-msg { max-width:92%; padding:12px 18px; border-radius:14px; font-size:12px; line-height:1.8; word-break:break-word; position:relative; margin:0 auto; width:100%; }',
    '.pua-conv-msg-user { background:transparent; border:none; color:var(--pua-accent-text); text-align:right; padding-right:0; font-style:italic; }',
    '.pua-conv-msg-assistant { background:var(--pua-bg-card); border:1px solid var(--pua-border); color:var(--pua-text); text-align:left; padding-left:0; }',
    '.pua-conv-msg-system { align-self:center; background:rgba(91,141,239,0.08); border:1px solid rgba(91,141,239,0.2); color:var(--pua-text-sub); border-radius:8px; font-size:10px; max-width:90%; }',
    '.pua-conv-msg-dimmed { opacity:0.4; }',
    '.pua-conv-msg-dimmed .pua-conv-msg-content { text-decoration:line-through; }',
    '.pua-conv-msg-header { display:flex; align-items:center; gap:6px; margin-bottom:2px; }',
    '.pua-conv-msg-floor { font-size:9px; color:var(--pua-text-dim); cursor:pointer; font-weight:600; }',
    '.pua-conv-msg-floor:hover { color:var(--pua-accent); }',
    '.pua-conv-msg-time { font-size:8px; color:var(--pua-text-dim); }',
    '.pua-conv-msg-content { white-space:pre-wrap; min-height:1em; }',
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
    '.pua-conv-alt-tabs { display:flex; gap:3px; margin-top:4px; }',
    '.pua-conv-alt-tab { font-size:8px; padding:1px 5px; border-radius:3px; border:1px solid var(--pua-border); background:var(--pua-bg-input); color:var(--pua-text-dim); cursor:pointer; }',
    '.pua-conv-alt-tab.active { border-color:var(--pua-accent); color:var(--pua-accent); background:var(--pua-accent-glow); }',
    '.pua-conv-input-area { padding:10px 14px; border-top:1px solid var(--pua-border); flex-shrink:0; }',
    '.pua-conv-input-row { display:flex; gap:8px; align-items:flex-end; }',
    '.pua-conv-input { flex:1; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:8px; padding:8px 12px; color:var(--pua-text); font-size:11px; font-family:inherit; outline:none; resize:none; height:60px; min-height:60px; max-height:150px; transition:height 0.25s ease, min-height 0.25s ease; }',
    '.pua-conv-input.expanded { height:150px; min-height:150px; }',
    '.pua-conv-input:focus { border-color:var(--pua-accent); }',
    '.pua-conv-send { padding:8px 16px; border-radius:8px; border:none; background:linear-gradient(135deg,var(--pua-accent-dim),var(--pua-accent)); color:#121216; font-size:13px; font-weight:600; cursor:pointer; transition:var(--pua-transition); align-self:flex-end; }',
    '.pua-conv-send:hover { opacity:0.9; }',
    '.pua-conv-send:disabled { opacity:0.4; cursor:default; }',
    '.pua-conv-input-btns { display:flex; gap:4px; margin-top:6px; align-items:center; }',
    '.pua-conv-input-btn { font-size:10px; padding:3px 8px; border-radius:4px; border:1px solid var(--pua-border); background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; transition:var(--pua-transition); }',
    '.pua-conv-input-btn:hover { border-color:var(--pua-accent); color:var(--pua-text); }',
    '.pua-conv-jump-input { width:60px; background:var(--pua-bg-input); border:1px solid var(--pua-border); border-radius:4px; padding:3px 6px; color:var(--pua-text); font-size:10px; outline:none; text-align:center; }',
    '.pua-conv-jump-input:focus { border-color:var(--pua-accent); }',
    '.pua-conv-jump-row { display:none; align-items:center; gap:4px; margin-top:4px; }',
    '.pua-conv-jump-row.show { display:flex; }',
    '.pua-conv-bottom-btn { position:absolute; bottom:80px; right:20px; width:32px; height:32px; border-radius:50%; border:1px solid var(--pua-border); background:var(--pua-bg-card); color:var(--pua-text-sub); cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; transition:var(--pua-transition); z-index:50; box-shadow:var(--pua-shadow); }',
    '.pua-conv-bottom-btn:hover { border-color:var(--pua-accent); color:var(--pua-accent); }',
    '.pua-conv-settings-panel { position:absolute; top:48px; right:10px; width:240px; background:var(--pua-bg-solid); border:1px solid var(--pua-border); border-radius:10px; box-shadow:var(--pua-shadow); z-index:100; padding:14px; display:none; }',
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
    this.asmLoading = false
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
        // Re-render if on conversation page to apply render regexes (but not during streaming)
        if (self._currentPage === 'conversation' && !self._convSending) {
          self._renderPage()
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

    // 悬浮球
    root.appendChild(this._renderFloatingBall())

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
      { id: 'favorites', icon: '\u2B50', label: '\u6536\u85CF', badge: 0 },
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

    // Regex render preview - auto-render with placeholders on load
    var selectedRegex = null
    for (var sri = 0; sri < self.regexes.length; sri++) {
      if (self.regexes[sri].id === self.selRegex) { selectedRegex = self.regexes[sri]; break }
    }
    var regexResultElAuto = document.getElementById('regex-preview-result')
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
    var regexResultEl = document.getElementById('regex-preview-result')
    if (regexResultEl) {
      var regexElemSelectActive = false
      var regexSelectedEl = null
      var regexOriginalStyles = null
      var regexElemInfoDiv = null
      // Add element select toggle button after the preview result
      var regexElemSelectBtn = document.createElement('button')
      regexElemSelectBtn.className = 'pua-code-block-btn'
      regexElemSelectBtn.textContent = '\uD83D\uDD0D \u9009\u4E2D\u5143\u7D20'
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
          this.textContent = '\uD83D\uDD0D \u53D6\u6D88\u9009\u4E2D'
          this.style.borderColor = '#4a9eff'
          this.style.color = '#4a9eff'
          regexResultEl.addEventListener('click', onRegexElemClick)
        } else {
          regexResultEl.classList.remove('pua-elem-select-active')
          this.textContent = '\uD83D\uDD0D \u9009\u4E2D\u5143\u7D20'
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
            var htmlTextarea = document.querySelector('.pua-regex-html')
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
      // Roche 格式：根据字段映射到正确的type
      // Roche: substituteRegex=替换输出→render, scanRegex=过滤输入→filter
      for (var ci = 0; ci < data.categories.length; ci++) {
        var cat = data.categories[ci]
        var catName = cat.name || '\u672A\u547D\u540D\u5206\u7C7B'
        var entries = cat.entries || []
        for (var ei = 0; ei < entries.length; ei++) {
          var src = entries[ei]
          // Determine type from Roche fields
          var regType = 'render'
          if (src.substituteRegex) regType = 'render'  // 替换输出 = 前端渲染
          if (src.scanRegex) regType = 'filter'         // 过滤输入 = 后端过滤
          if (src.scanRegex && src.substituteRegex) regType = 'replace' // 两者都有 = 后端替换
          this.regexes.push({
            id: 'r' + Date.now() + '_' + count,
            name: '[' + catName + '] ' + (src.name || '\u672A\u547D\u540D'),
            regex: src.substituteRegex || src.scanRegex || src.regex || '',
            html: src.substituteHtml || src.html || '',
            type: regType,
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
    return '\u4F60\u662F\u201C\u5E73\u884C\u65F6\u7A7A\u6863\u6848\u9986\u201D\u7684\u9884\u8BBE\u4E0E\u7F8E\u5316\u52A9\u624B\u3002\u4F60\u53EF\u4EE5\u5E2E\u52A9\u7528\u6237\uFF1A\n1. \u521B\u5EFA\u65B0\u7684\u9884\u8BBE\u6761\u76EE\uFF08system prompt\uFF09\n2. \u521B\u5EFA\u65B0\u7684\u6B63\u5219\u89C4\u5219\uFF08render/filter/replace\uFF09\n3. \u7F16\u8F91\u73B0\u6709\u7684\u9884\u8BBE\u548C\u6B63\u5219\n4. \u63D0\u4F9B\u7F8E\u5316\u5EFA\u8BAE\n5. \u7F16\u5199CSS\u7F8E\u5316\u4EE3\u7801\n\n\u5F53\u4F60\u9700\u8981\u6DFB\u52A0\u6216\u4FEE\u6539\u9884\u8BBE/\u6B63\u5219\u65F6\uFF0C\u8BF7\u7528\u4EE5\u4E0BJSON\u683C\u5F0F\u8F93\u51FA\uFF1A\n\u3010ADD_PRESET\u3011{"title":"...","content":"...","role":"system","outRegex":"","outRegexOn":false,"inRegex":"","inRegexOn":false}\u3010/ADD_PRESET\u3011\n\u3010ADD_REGEX\u3011{"name":"...","regex":"...","html":"...","type":"render"}\u3010/ADD_REGEX\u3011\n\u3010EDIT_PRESET\u3011{"id":"...","title":"...","content":"..."}\u3010/EDIT_PRESET\u3011\n\u3010EDIT_REGEX\u3011{"id":"...","name":"...","regex":"...","html":"..."}\u3010/EDIT_REGEX\u3011\n\n\u6BCF\u6B21\u53EA\u6267\u884C\u4E00\u4E2A\u64CD\u4F5C\u3002\u7528\u81EA\u7136\u8BED\u8A00\u89E3\u91CA\u4F60\u5728\u505A\u4EC0\u4E48\u3002\n\u7EDD\u4E0D\u5220\u9664\u4EFB\u4F55\u6761\u76EE\uFF0C\u53EA\u6DFB\u52A0\u6216\u4FEE\u6539\u3002\n\u4F60\u53EF\u4EE5\u53D1\u9001\u4EE3\u7801\u5757\u8BA9\u7528\u6237\u9884\u89C8\u6548\u679C\u3002'
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
    h += '<button class="pua-assistant-attach-btn" id="ast-prompt-btn" style="margin-left:4px">\uD83D\uDCDD \u63D0\u793A\u8BCD</button>'
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
    h += '<button class="pua-branch-btn" id="ast-branch-rename">\u270F\uFE0F</button>'
    h += '<button class="pua-branch-btn pua-branch-btn-danger" id="ast-branch-delete">\uD83D\uDDD1\uFE0F</button>'
    h += '<button class="pua-branch-btn" id="ast-branch-export">\uD83D\uDCE5 \u5BFC\u51FA</button>'
    h += '<button class="pua-branch-btn" id="ast-branch-import">\uD83D\uDCE4 \u5BFC\u5165</button>'
    h += '<span style="font-size:8px;color:var(--pua-text-dim);margin-left:auto">' + data.branches.length + '/10</span>'
    h += '</div>'

    // Chat area
    h += '<div class="pua-assistant-chat" id="ast-chat">'

    if (!branch.history || branch.history.length === 0) {
      h += '<div class="pua-assistant-empty">'
      h += '<div class="pua-assistant-empty-icon">\u2728</div>'
      h += '<div class="pua-assistant-empty-text">\u5411\u52A9\u624B\u8BE2\u95EE\uFF0C\u5982\u201C\u5E2E\u6211\u6DFB\u52A0\u4E00\u4E2A\u89D2\u8272\u626E\u6F14\u9884\u8BBE\u201D</div>'
      h += '</div>'
    } else {
      for (var mi = 0; mi < branch.history.length; mi++) {
        var msg = branch.history[mi]
        if (msg.role === 'user') {
          h += '<div class="pua-assistant-msg pua-assistant-msg-user' + (msg.dimmed ? ' pua-msg-dimmed' : '') + '" data-msg-id="' + self._escHtml(msg.id) + '">'
          h += '<div class="pua-assistant-msg-role">\uD83D\uDC64 \u4F60</div>'
          h += '<div class="pua-assistant-msg-content">' + self._escHtml(msg.content) + '</div>'
          h += '<button class="pua-assistant-edit-btn" data-edit-msg-id="' + self._escHtml(msg.id) + '">\u270F\uFE0F</button>'
          // Show attached badges
          if (msg.attached && (msg.attached.presets.length > 0 || msg.attached.regexes.length > 0)) {
            h += '<div class="pua-assistant-attached-badges">'
            for (var api = 0; api < msg.attached.presets.length; api++) {
              h += '<span class="pua-assistant-badge">\uD83D\uDCCB ' + self._escHtml(msg.attached.presets[api].title) + '</span>'
            }
            for (var ari = 0; ari < msg.attached.regexes.length; ari++) {
              h += '<span class="pua-assistant-badge">\u2699\uFE0F ' + self._escHtml(msg.attached.regexes[ari].name) + '</span>'
            }
            h += '</div>'
          }
          h += '</div>'
        } else if (msg.role === 'assistant') {
          h += '<div class="pua-assistant-msg pua-assistant-msg-assistant">'
          h += '<div class="pua-assistant-msg-role">\u2728 \u52A9\u624B</div>'
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
    h += '<button class="pua-assistant-attach-btn' + (attached.presets.length > 0 ? ' active' : '') + '" id="ast-attach-preset-btn">\uD83D\uDCCE \u9009\u62E9\u9884\u8BBE' + (attached.presets.length > 0 ? ' (' + attached.presets.length + ')' : '') + '</button>'
    h += '<div class="pua-assistant-attach-list" id="ast-attach-preset-list">'
    for (var pi = 0; pi < this.presets.length; pi++) {
      var isSelPreset = false
      for (var sp = 0; sp < attached.presets.length; sp++) { if (attached.presets[sp].id === this.presets[pi].id) { isSelPreset = true; break } }
      h += '<div class="pua-assistant-attach-item' + (isSelPreset ? ' selected' : '') + '" data-type="preset" data-id="' + this._escHtml(this.presets[pi].id) + '">' + (isSelPreset ? '\u2713 ' : '') + self._escHtml(this.presets[pi].title) + '</div>'
    }
    h += '</div></div>'
    // Attach regexes dropdown
    h += '<div class="pua-assistant-attach-dropdown" id="ast-attach-regex-dropdown">'
    h += '<button class="pua-assistant-attach-btn' + (attached.regexes.length > 0 ? ' active' : '') + '" id="ast-attach-regex-btn">\uD83D\uDCCE \u9009\u62E9\u6B63\u5219' + (attached.regexes.length > 0 ? ' (' + attached.regexes.length + ')' : '') + '</button>'
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
        h += '<span class="pua-assistant-badge" data-badge-type="preset" data-badge-id="' + self._escHtml(attached.presets[abp].id) + '">\uD83D\uDCCB ' + self._escHtml(attached.presets[abp].title) + '<span class="badge-remove">\u00D7</span></span>'
      }
      for (var abr = 0; abr < attached.regexes.length; abr++) {
        h += '<span class="pua-assistant-badge" data-badge-type="regex" data-badge-id="' + self._escHtml(attached.regexes[abr].id) + '">\u2699\uFE0F ' + self._escHtml(attached.regexes[abr].name) + '<span class="badge-remove">\u00D7</span></span>'
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
        var blob = new Blob([json], { type: 'application/json' })
        var url = URL.createObjectURL(blob)
        var a = document.createElement('a')
        a.href = url
        a.download = 'pua-assistant-branch-' + br.name + '.json'
        a.click()
        URL.revokeObjectURL(url)
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
            this.textContent = '\uD83D\uDD0D \u53D6\u6D88\u9009\u4E2D'
            this.style.borderColor = '#4a9eff'
            this.style.color = '#4a9eff'
            outputDiv.addEventListener('click', onElemClick)
          } else {
            previewDiv.classList.remove('pua-elem-select-active')
            this.textContent = '\uD83D\uDD0D \u9009\u4E2D\u5143\u7D20'
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
    for (var ai = 0; ai < actions.length; ai++) {
      var action = actions[ai]
      var actionStatus = action.status || 'confirmed'
      var label = ''
      var confirmLabel = ''
      if (action.type === 'addPreset') { label = '\uD83D\uDCCB \u6DFB\u52A0\u9884\u8BBE: ' + self._escHtml(action.data.title || ''); confirmLabel = '\u2705 \u6DFB\u52A0\u5230\u9884\u8BBE' }
      else if (action.type === 'addRegex') { label = '\u2699\uFE0F \u6DFB\u52A0\u6B63\u5219: ' + self._escHtml(action.data.name || ''); confirmLabel = '\u2705 \u6DFB\u52A0\u5230\u6B63\u5219' }
      else if (action.type === 'editPreset') { label = '\uD83D\uDCCB \u4FEE\u6539\u9884\u8BBE: ' + self._escHtml(action.data.title || ''); confirmLabel = '\u2705 \u5E94\u7528\u4FEE\u6539' }
      else if (action.type === 'editRegex') { label = '\u2699\uFE0F \u4FEE\u6539\u6B63\u5219: ' + self._escHtml(action.data.name || ''); confirmLabel = '\u2705 \u5E94\u7528\u4FEE\u6539' }

      h += '<div class="pua-assistant-action-card' + (actionStatus === 'ignored' ? ' pua-action-ignored' : '') + (actionStatus === 'confirmed' ? ' pua-action-confirmed' : '') + '">'
      h += '<span class="pua-assistant-action-label">' + label + '</span>'
      // Add regex preview for addRegex and editRegex actions
      if ((action.type === 'addRegex' || action.type === 'editRegex') && action.data.regex && action.data.html) {
        h += '<div class="pua-regex-preview pua-regex-preview-auto" data-regex="' + self._escHtml(action.data.regex) + '" data-html="' + self._escHtml(action.data.html) + '">'
        h += '<div class="pua-regex-preview-output"></div>'
        h += '<div style="display:flex;gap:4px;margin-top:4px"><button class="pua-code-block-btn pua-elem-select-toggle">\uD83D\uDD0D \u9009\u4E2D\u5143\u7D20</button></div>'
        h += '<div class="pua-elem-info" style="display:none"></div>'
        h += '</div>'
      }
      if (actionStatus === 'pending') {
        h += '<div class="pua-action-btns">'
        h += '<button class="pua-assistant-confirm-btn" data-action-id="' + self._escHtml(action.id) + '">' + confirmLabel + '</button>'
        h += '<button class="pua-assistant-dismiss-btn" data-action-id="' + self._escHtml(action.id) + '">\u274C \u5FFD\u7565</button>'
        h += '</div>'
      } else if (actionStatus === 'confirmed') {
        h += '<span class="pua-action-status">\u2705 \u5DF2\u6DFB\u52A0</span>'
      } else if (actionStatus === 'ignored') {
        h += '<span class="pua-action-status">\u274C \u5DF2\u5FFD\u7565</span>'
      }
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

      // Parse action tags - do NOT auto-add, store pending data for user confirmation
      var actions = []
      var addPresetMatch = content.match(/\u3010ADD_PRESET\u3011([\s\S]*?)\u3010\/ADD_PRESET\u3011/)
      if (addPresetMatch) {
        try {
          var pd = JSON.parse(addPresetMatch[1].trim())
          var actionId = 'action_' + Date.now()
          var pendingPreset = {
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
          actions.push({ type: 'addPreset', data: { id: pendingPreset.id, title: pendingPreset.title }, id: actionId, pending: pendingPreset, status: 'pending' })
        } catch(e) {}
      }

      var addRegexMatch = content.match(/\u3010ADD_REGEX\u3011([\s\S]*?)\u3010\/ADD_REGEX\u3011/)
      if (addRegexMatch) {
        try {
          var rd = JSON.parse(addRegexMatch[1].trim())
          var actionId2 = 'action_' + Date.now() + '_r'
          var pendingRegex = {
            id: 'r' + Date.now(),
            name: rd.name || '\u672A\u547D\u540D',
            regex: rd.regex || '',
            html: rd.html || '',
            type: rd.type || 'render',
            on: true,
            dMin: 0,
            dMax: Infinity
          }
          actions.push({ type: 'addRegex', data: { id: pendingRegex.id, name: pendingRegex.name, regex: pendingRegex.regex, html: pendingRegex.html }, id: actionId2, pending: pendingRegex, status: 'pending' })
        } catch(e2) {}
      }

      var editPresetMatch = content.match(/\u3010EDIT_PRESET\u3011([\s\S]*?)\u3010\/EDIT_PRESET\u3011/)
      if (editPresetMatch) {
        try {
          var epd = JSON.parse(editPresetMatch[1].trim())
          var actionId3 = 'action_' + Date.now() + '_ep'
          var beforeEdit = null
          for (var epi = 0; epi < self.presets.length; epi++) {
            if (self.presets[epi].id === epd.id) {
              beforeEdit = { title: self.presets[epi].title, content: self.presets[epi].content }
              break
            }
          }
          actions.push({ type: 'editPreset', data: { id: epd.id, title: epd.title || '' }, id: actionId3, pending: epd, before: beforeEdit, status: 'pending' })
        } catch(e3) {}
      }

      var editRegexMatch = content.match(/\u3010EDIT_REGEX\u3011([\s\S]*?)\u3010\/EDIT_REGEX\u3011/)
      if (editRegexMatch) {
        try {
          var erd = JSON.parse(editRegexMatch[1].trim())
          var actionId4 = 'action_' + Date.now() + '_er'
          var beforeEdit2 = null
          for (var eri = 0; eri < self.regexes.length; eri++) {
            if (self.regexes[eri].id === erd.id) {
              beforeEdit2 = { name: self.regexes[eri].name, regex: self.regexes[eri].regex, html: self.regexes[eri].html }
              break
            }
          }
          actions.push({ type: 'editRegex', data: { id: erd.id, name: erd.name || '', regex: erd.regex || '', html: erd.html || '' }, id: actionId4, pending: erd, before: beforeEdit2, status: 'pending' })
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
    var h = '<div class="pua-assistant-msg-role">\uD83D\uDC64 \u4F60</div>'
    h += '<div class="pua-assistant-msg-content">' + self._escHtml(userMsg.content) + '</div>'
    h += '<button class="pua-assistant-edit-btn" data-edit-msg-id="' + self._escHtml(userMsg.id) + '">\u270F\uFE0F</button>'
    if (userMsg.attached && (userMsg.attached.presets.length > 0 || userMsg.attached.regexes.length > 0)) {
      h += '<div class="pua-assistant-attached-badges">'
      for (var api = 0; api < userMsg.attached.presets.length; api++) {
        h += '<span class="pua-assistant-badge">\uD83D\uDCCB ' + self._escHtml(userMsg.attached.presets[api].title) + '</span>'
      }
      for (var ari = 0; ari < userMsg.attached.regexes.length; ari++) {
        h += '<span class="pua-assistant-badge">\u2699\uFE0F ' + self._escHtml(userMsg.attached.regexes[ari].name) + '</span>'
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
    h += '<span class="pua-prompt-modal-title">\uD83D\uDCDD \u7CFB\u7EDF\u63D0\u793A\u8BCD</span>'
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
    h += '<button class="pua-prompt-modal-preset-btn pua-prompt-modal-del-btn" id="ast-preset-del" title="\u5220\u9664\u5F53\u524D\u9884\u8BBE">\uD83D\uDDD1\uFE0F</button>'
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
     对话页面 — 完整聊天系统
     ════════════════════════════════════════════════════════════ */

  P._renderChat = function(titleEl, actionsEl, contentEl) {
    // Redirect to the new conversation renderer
    this._renderConversation(titleEl, actionsEl, contentEl)
  }

  P._renderConversation = function(titleEl, actionsEl, contentEl) {
    var self = this
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
    h += '<button class="pua-conv-topbar-btn" id="conv-context-btn" title="\u67E5\u770B\u4E0A\u4E0B\u6587">\uD83D\uDCCB</button>'
    h += '</div>'

    // Settings panel (hidden)
    h += '<div class="pua-conv-settings-panel' + (this._convShowSettings ? ' show' : '') + '" id="conv-settings-panel">'
    h += '<div class="pua-conv-settings-title">\u5BF9\u8BDD\u8BBE\u7F6E</div>'
    h += '<div class="pua-conv-settings-row"><span class="pua-conv-settings-label">\u6E32\u67D3\u9650\u5236</span><input class="pua-conv-settings-input" id="conv-set-renderlimit" type="number" value="' + this._convRenderLimit + '" min="1" max="100"></div>'
    h += '<div class="pua-conv-settings-row"><span class="pua-conv-settings-label">\u4E0A\u4E0B\u6587\u6DF1\u5EA6</span><input class="pua-conv-settings-input" id="conv-set-contextdepth" type="number" value="' + this._convContextDepth + '" min="1" max="200"></div>'
    h += '<div class="pua-conv-settings-row"><span class="pua-conv-settings-label">\u81EA\u52A8\u6EDA\u52A8</span><button class="pua-toggle-item' + (this._convAutoScroll ? ' on' : '') + '" id="conv-set-autoscroll"></button></div>'
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
      h += '<div class="pua-empty"><div class="pua-empty-icon">\uD83D\uDCAC</div><div class="pua-empty-text">\u9009\u62E9\u5206\u652F\u5F00\u59CB\u5BF9\u8BDD</div></div>'
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
    h += '<textarea class="pua-conv-input" id="conv-input" placeholder="\u8F93\u5165\u6D88\u606F..." rows="2"></textarea>'
    h += '<button class="pua-conv-send" id="conv-send">\u27A4</button>'
    h += '</div>'
    h += '<div class="pua-conv-input-btns">'
    h += '<button class="pua-conv-input-btn" id="conv-jump-btn">\uD83D\uDCCD \u8DF3\u8F6C\u697C\u5C42</button>'
    h += '<button class="pua-conv-input-btn" id="conv-export-btn">\uD83D\uDCE5 \u5BFC\u51FA</button>'
    h += '<button class="pua-conv-input-btn" id="conv-import-btn">\uD83D\uDCE4 \u5BFC\u5165</button>'
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
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); self._sendMessage(contentEl) }
      })
    }

    // Send button
    if (sendBtn) {
      sendBtn.addEventListener('click', function() { self._sendMessage(contentEl) })
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
        self._convRenderLimit = rl
        self._convContextDepth = cd
        self._convAutoScroll = as
        var s = self._loadSettings()
        s.renderLimit = rl
        s.contextDepth = cd
        s.autoScroll = as
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

    // Load more
    var loadMoreBtn = contentEl.querySelector('#conv-load-more')
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function() {
        self._convRenderLimit = self._convMessages.length
        self._renderPage()
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

    // Scroll to bottom if autoScroll
    if (chatEl && this._convAutoScroll) {
      chatEl.scrollTop = chatEl.scrollHeight
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
    if (msg.role === 'assistant') {
      // Get active version
      var altIdx = msg.activeAltIndex || 0
      if (msg.alternatives && msg.alternatives.length > 0 && altIdx > 0 && msg.alternatives[altIdx - 1]) {
        content = msg.alternatives[altIdx - 1]
      }
      if (isEditing) {
        // Edit mode: show raw content with filter/replace regex applied, but no render regex
        // Also show <> tags as-is (don't hide them)
        var filteredContent = this._applyConvFilterRegex(content, 'assistant')
        h += '<div class="pua-conv-msg-content pua-conv-edit-mode">' + this._escHtml(filteredContent) + '</div>'
      } else if (msg.rendered) {
        h += '<div class="pua-conv-msg-content">' + msg.rendered + '</div>'
      } else {
        h += '<div class="pua-conv-msg-content">' + this._escHtml(content) + '</div>'
      }
    } else {
      if (isEditing) {
        h += '<div class="pua-conv-msg-content pua-conv-edit-mode">' + this._escHtml(content) + '</div>'
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

    // Alternative version tabs
    if (msg.role === 'assistant' && msg.alternatives && msg.alternatives.length > 0) {
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

    // Long press to toggle edit mode
    var msgEls = contentEl.querySelectorAll('.pua-conv-msg')
    for (var mi = 0; mi < msgEls.length; mi++) {
      (function(msgEl) {
        var longPressTimer = null
        msgEl.addEventListener('touchstart', function(e) {
          longPressTimer = setTimeout(function() {
            var msgId = msgEl.getAttribute('data-msg-id')
            if (msgId) self._toggleEditMode(msgId)
          }, 600)
        }, { passive: true })
        msgEl.addEventListener('touchend', function() { clearTimeout(longPressTimer) })
        msgEl.addEventListener('touchmove', function() { clearTimeout(longPressTimer) })
        msgEl.addEventListener('contextmenu', function(e) {
          e.preventDefault()
          var msgId = msgEl.getAttribute('data-msg-id')
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

    // Create placeholder assistant message
    var astMsg = this._createMessage('assistant', '', 'live')
    astMsg.floorNumber = this._convMessages.length + 1
    this._convMessages.push(astMsg)
    this._convSending = true
    this._convStreamingMsg = astMsg

    // Re-render to show user message + typing indicator
    this._renderConvMessages(contentEl)

    // Build context
    var messages = this._buildConvContext()

    // Stream chat
    this._streamChat(messages).then(function(fullContent) {
      astMsg.content = fullContent
      // Apply render regexes
      astMsg.rendered = self._applyConvRegexRender(fullContent)
      self._convSending = false
      self._convStreamingMsg = null
      self._saveConvMessages()

      // Re-render conversation messages only (not the whole page)
      var contentEl = self._contentEl
      if (contentEl) self._renderConvMessages(contentEl)

      // Memory summarization trigger
      self._msgSinceLastSummary = (self._msgSinceLastSummary || 0) + 1
      var settings = self._loadSettings()
      if (self._msgSinceLastSummary >= (settings.summarizeInterval || 30)) {
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
      if (contentEl) self._renderConvMessages(contentEl)
      self._toast('API \u8C03\u7528\u5931\u8D25: ' + (err.message || err))
    })
  }

  P._buildConvContext = function(upToMsgId) {
    var messages = []
    var depth = this._convContextDepth || 30

    // Use _buildMessages for system context (presets, char, worldbook, memory)
    var systemCtx = this._buildMessages()

    // Add all system-level messages from _buildMessages
    for (var i = 0; i < systemCtx.length; i++) {
      messages.push({ role: systemCtx[i].role, content: systemCtx[i].content })
    }

    // Add conversation messages (limited by depth, optionally truncated up to a message)
    var convMsgs = this._convMessages
    var endIdx = convMsgs.length
    if (upToMsgId) {
      for (var ei = 0; ei < convMsgs.length; ei++) {
        if (convMsgs[ei].id === upToMsgId) { endIdx = ei; break }
      }
    }
    var start = Math.max(0, endIdx - depth)
    for (var mi = start; mi < endIdx; mi++) {
      var m = convMsgs[mi]
      if (m.dimmed) continue
      var content = m.content
      // Use active alternative version for assistant messages
      if (m.role === 'assistant' && m.alternatives && m.alternatives.length > 0 && m.activeAltIndex > 0) {
        content = m.alternatives[m.activeAltIndex - 1] || content
      }
      // Apply filter/replace regexes
      content = this._applyConvFilterRegex(content, m.role)
      if (content) {
        messages.push({ role: m.role, content: content })
      }
    }

    return messages
  }

  P._applyConvFilterRegex = function(text, role) {
    if (!text) return text
    // Apply filter and replace type regexes
    for (var ri = 0; ri < this.regexes.length; ri++) {
      var rx = this.regexes[ri]
      if (!rx.on) continue
      if (rx.type === 'filter' || rx.type === 'replace') {
        try {
          var re = new RegExp(rx.regex, 'g')
          text = text.replace(re, rx.html || '')
        } catch(e) {}
      }
    }
    // Apply preset outRegex/inRegex for assistant messages
    if (role === 'assistant') {
      for (var pi = 0; pi < this.presets.length; pi++) {
        var pr = this.presets[pi]
        if (pr.outRegex && pr.outRegexOn) {
          try { text = text.replace(new RegExp(pr.outRegex, 'g'), '') } catch(e) {}
        }
        if (pr.inRegex && pr.inRegexOn) {
          try { text = text.replace(new RegExp(pr.inRegex, 'g'), '') } catch(e) {}
        }
      }
    }
    return text
  }

  P._applyConvRegexRender = function(text) {
    if (!text) return this._escHtml(text)
    // Apply render-type regexes on raw text FIRST
    var result = text
    var replacements = []
    for (var ri = 0; ri < this.regexes.length; ri++) {
      var rx = this.regexes[ri]
      if (!rx.on || rx.type !== 'render' || !rx.regex) continue
      try {
        var re = new RegExp(rx.regex, 'g')
        result = result.replace(re, function(match) {
          var idx = replacements.length
          replacements.push({ html: rx.html || '', match: match })
          return '\x01R' + idx + 'R\x01'
        })
      } catch(e) {}
    }
    // Escape HTML in the remaining text
    result = this._escHtml(result)
    // Restore replacement HTML
    for (var k = 0; k < replacements.length; k++) {
      result = result.replace('\x01R' + k + 'R\x01', replacements[k].html)
    }
    // Hide <> tags but preserve their content (e.g. <nexus>1</nexus> → 1)
    result = result.replace(/&lt;\/?[^&]*?&gt;/g, '')
    return result
  }

  P._streamChat = function(messages) {
    var self = this

    // Priority 1: Use roche.ai.chat (Roche's built-in AI API)
    if (this.roche && this.roche.ai && this.roche.ai.chat) {
      return this._streamChatViaRoche(messages)
    }

    // Priority 2: Fallback to user-configured endpoint
    var preset = this._getActivePreset()
    if (!preset) return Promise.reject(new Error('请先配置 API'))
    var endpoint = (preset.mainEndpoint || '').replace(/\/+$/, '')
    var apiKey = preset.mainApiKey || ''
    var model = preset.mainModel || ''
    if (!endpoint || !apiKey || !model) return Promise.reject(new Error('roche.ai.chat 不可用，请先配置主 API'))

    return this._streamChatViaFetch(messages, endpoint, apiKey, model)
  }

  P._streamChatViaRoche = function(messages) {
    var self = this
    var contentEl = self._contentEl

    return this.roche.ai.chat({
      messages: messages,
      stream: true
    }).then(function(result) {
      // Check if result is a ReadableStream (streaming response)
      if (result && typeof result.getReader === 'function') {
        return self._processStream(result, contentEl)
      }
      // Check if result has body as ReadableStream
      if (result && result.body && typeof result.body.getReader === 'function') {
        return self._processStream(result.body, contentEl)
      }
      // Non-streaming result
      var text = (result && result.text) || ''
      if (text) {
        self._updateStreamingMessage(contentEl, self._escHtml(text), false)
      }
      return text
    }).catch(function(e) {
      // If roche.ai.chat streaming fails, try non-streaming
      return self.roche.ai.chat({
        messages: messages
      }).then(function(result) {
        var text = (result && result.text) || ''
        if (text) {
          self._updateStreamingMessage(contentEl, self._escHtml(text), false)
        }
        return text
      }).catch(function(e2) {
        // Final fallback: try user-configured endpoint
        var preset = self._getActivePreset()
        if (preset && preset.mainEndpoint && preset.mainApiKey && preset.mainModel) {
          return self._streamChatViaFetch(messages, preset.mainEndpoint.replace(/\/+$/, ''), preset.mainApiKey, preset.mainModel)
        }
        return Promise.reject(new Error('AI 调用失败: ' + (e2.message || e2)))
      })
    })
  }

  P._processStream = function(readableStream, contentEl) {
    var self = this
    var reader = readableStream.getReader()
    var decoder = new TextDecoder()
    var buffer = ''
    var fullContent = ''

    function processChunk() {
      return reader.read().then(function(result) {
        if (result.done) {
          // Update streaming message content
          if (self._convStreamingMsg) self._convStreamingMsg.content = fullContent
          self._updateStreamingMessage(contentEl, self._escHtml(fullContent), false)
          return fullContent
        }
        buffer += decoder.decode(result.value, { stream: true })
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
              fullContent += delta
              // Store content in message object so it survives page switches
              if (self._convStreamingMsg) self._convStreamingMsg.content = fullContent
              self._updateStreamingMessage(contentEl, self._escHtml(fullContent), true)
            }
          } catch(e) {}
        }
        return processChunk()
      })
    }

    return processChunk()
  }

  P._streamChatViaFetch = function(messages, endpoint, apiKey, model) {
    var self = this
    var url = endpoint + '/v1/chat/completions'
    var contentEl = self._contentEl

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
      if (!response.ok) throw new Error('HTTP ' + response.status)
      return self._processStream(response.body, contentEl)
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
    }
    // Auto-scroll if enabled
    if (this._convAutoScroll) {
      chatEl.scrollTop = chatEl.scrollHeight
    }
  }

  P._renderConvMessages = function(contentEl) {
    var chatEl = contentEl.querySelector('#conv-chat')
    if (!chatEl) return

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

    // Re-bind load more
    var loadMoreBtn = chatEl.querySelector('#conv-load-more')
    var self = this
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function() {
        self._convRenderLimit = self._convMessages.length
        self._renderPage()
      })
    }

    // Update message count
    var countEl = contentEl.querySelector('#conv-msg-count')
    if (countEl) countEl.textContent = msgs.length + ' \u6761'

    // Scroll
    if (this._convAutoScroll) {
      chatEl.scrollTop = chatEl.scrollHeight
    }
  }

  /* ── Regenerate message ── */

  P._regenerateMessage = function(msgId) {
    var self = this
    // Find the message
    var msg = null
    var msgIdx = -1
    for (var i = 0; i < this._convMessages.length; i++) {
      if (this._convMessages[i].id === msgId) { msg = this._convMessages[i]; msgIdx = i; break }
    }
    if (!msg || msg.role !== 'assistant') return

    // Add to alternatives
    if (!msg.alternatives) msg.alternatives = []
    msg.alternatives.push(msg.content)

    // Create new response
    this._convSending = true
    this._convStreamingMsg = msg
    msg.content = ''
    msg.rendered = null

    // Build context up to this message (exclude it and everything after)
    var prevMsgId = null
    for (var pi = 0; pi < msgIdx; pi++) {
      if (!this._convMessages[pi].dimmed) prevMsgId = this._convMessages[pi].id
    }
    var messages = this._buildConvContext(prevMsgId)

    this._streamChat(messages).then(function(fullContent) {
      msg.content = fullContent
      msg.activeAltIndex = msg.alternatives.length
      msg.rendered = self._applyConvRegexRender(fullContent)
      self._convSending = false
      self._convStreamingMsg = null
      self._saveConvMessages()
      var contentEl = self._contentEl
      if (contentEl) self._renderConvMessages(contentEl)
    }).catch(function(err) {
      msg.content = '[\u9519\u8BEF] ' + (err.message || err)
      msg.rendered = self._escHtml(msg.content)
      self._convSending = false
      self._convStreamingMsg = null
      self._saveConvMessages()
      var contentEl = self._contentEl
      if (contentEl) self._renderConvMessages(contentEl)
      self._toast('\u91CD\u65B0\u751F\u6210\u5931\u8D25: ' + (err.message || err))
    })
  }

  /* ── Edit & Resend ── */

  P._editMessage = function(msgId) {
    var contentEl = this._contentEl
    if (!contentEl) return

    // Find the message
    var msg = null
    for (var i = 0; i < this._convMessages.length; i++) {
      if (this._convMessages[i].id === msgId) { msg = this._convMessages[i]; break }
    }
    if (!msg || msg.role !== 'user') return

    // Put content into input
    var inputEl = contentEl.querySelector('#conv-input')
    if (inputEl) {
      inputEl.value = msg.content
      inputEl.classList.add('expanded')
      inputEl.focus()
    }

    // Dim the original message
    msg.dimmed = true
    this._saveConvMessages()

    // Re-render
    this._renderConvMessages(contentEl)
  }

  P._deleteMessage = function(msgId) {
    var self = this
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
    // Remove from messages array
    this._convMessages.splice(msgIdx, 1)

    // Re-assign floor numbers
    for (var i = 0; i < this._convMessages.length; i++) {
      this._convMessages[i].floorNumber = i + 1
    }

    this._saveConvMessages()
    this._renderPage()
    this._toast('消息已删除')
  }

  P._toggleEditMode = function(msgId) {
    if (this._editingMsgId === msgId) {
      this._editingMsgId = null
    } else {
      this._editingMsgId = msgId
    }
    var contentEl = this._contentEl
    if (contentEl) this._renderConvMessages(contentEl)
  }

  /* ── Switch alternative version ── */

  P._switchAltVersion = function(msgId, altIdx) {
    for (var i = 0; i < this._convMessages.length; i++) {
      if (this._convMessages[i].id === msgId) {
        this._convMessages[i].activeAltIndex = altIdx
        // Re-render the displayed content
        var content = this._convMessages[i].content
        if (altIdx > 0 && this._convMessages[i].alternatives && this._convMessages[i].alternatives[altIdx - 1]) {
          content = this._convMessages[i].alternatives[altIdx - 1]
        }
        this._convMessages[i].rendered = this._applyConvRegexRender(content)
        break
      }
    }
    this._saveConvMessages()
    this._renderPage()
  }

  /* ── Toggle favorite ── */

  P._toggleFavorite = function(msgId) {
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
    this._renderPage()
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

  P._triggerConvSummary = function() {
    var self = this
    var preset = this._getActivePreset()
    if (!preset || !preset.subEndpoint || !preset.subApiKey || !preset.subModel) return

    // Build a summary of recent conversation
    var recentMsgs = this._convMessages.slice(-10)
    var convText = ''
    for (var i = 0; i < recentMsgs.length; i++) {
      convText += recentMsgs[i].role + ': ' + (recentMsgs[i].content || '').substring(0, 200) + '\n'
    }

    var prompt = '\u8BF7\u4ECE\u4EE5\u4E0B\u5BF9\u8BDD\u4E2D\u63D0\u53D6\u5173\u952E\u4E8B\u5B9E\u4FE1\u606F\uFF0C\u7528\u4E00\u53E5\u8BDD\u6982\u62EC\uFF1A\n\n' + convText

    var url = preset.subEndpoint.replace(/\/+$/, '') + '/chat/completions'
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + preset.subApiKey },
      body: JSON.stringify({
        model: preset.subModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 200
      })
    }).then(function(r) { return r.json() }).then(function(data) {
      if (data.choices && data.choices[0]) {
        var summary = (data.choices[0].message || {}).content || ''
        if (summary) {
          // Add to memory system
          var branchId = self._convBranchId
          if (branchId) {
            var memData = self._loadMemData(branchId)
            if (memData) {
              if (!memData.facts) memData.facts = []
              memData.facts.push({
                text: summary,
                summaryText: summary,
                needsSummary: false,
                timestamp: new Date().toISOString()
              })
              self._saveMemData(memData, branchId)
            }
          }
        }
      }
    }).catch(function() {})
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

    // ── Free drag (no snap) ──
    var isDragging = false
    var dragStartX = 0, dragStartY = 0
    var fabStartX = 0, fabStartY = 0
    var hasMoved = false

    // Restore saved position
    var savedPos = this._fabPos || null
    if (savedPos) {
      fab.style.left = savedPos.x + 'px'
      fab.style.top = savedPos.y + 'px'
      fab.style.right = 'auto'
      fab.style.bottom = 'auto'
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
      var newX = fabStartX + dx
      var newY = fabStartY + dy
      fab.style.left = newX + 'px'
      fab.style.top = newY + 'px'
      fab.style.right = 'auto'
      fab.style.bottom = 'auto'
    }
    function onEnd() {
      if (!isDragging) return
      isDragging = false
      // Save position
      var rect = fab.getBoundingClientRect()
      self._fabPos = { x: rect.left, y: rect.top }
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

    var menu = document.createElement('div')
    menu.className = 'pua-fab-menu' + (this._fabExpanded ? ' show' : '')

    // Quick navigation
    var navItems = [
      { id: 'branches', icon: '\u2606', label: '\u5206\u652F\u5B58\u6863' },
      { id: 'chat', icon: '\uD83D\uDCAC', label: '\u5BF9\u8BDD' },
      { id: 'favorites', icon: '\u2B50', label: '\u6536\u85CF' },
      { id: 'memory', icon: '\u263D', label: '\u8BB0\u5FC6\u7CFB\u7EDF' },
      { id: 'settings', icon: '\u2691', label: '\u8BBE\u7F6E' }
    ]

    var navTitle = document.createElement('div')
    navTitle.className = 'pua-fab-menu-title'
    navTitle.textContent = '\u5FEB\u6377\u5BFC\u822A'
    menu.appendChild(navTitle)

    for (var ni = 0; ni < navItems.length; ni++) {
      (function(item) {
        var el = document.createElement('div')
        el.className = 'pua-fab-menu-item'
        el.innerHTML = '<span class="pua-fab-menu-item-icon">' + item.icon + '</span>' + item.label
        el.addEventListener('click', function() {
          self.currentPage = item.id
          self._fabExpanded = false
          self._render()
        })
        menu.appendChild(el)
      })(navItems[ni])
    }

    // Quick toggles
    var toggleTitle = document.createElement('div')
    toggleTitle.className = 'pua-fab-menu-title'
    toggleTitle.style.marginTop = '8px'
    toggleTitle.textContent = '\u5FEB\u6377\u5F00\u5173'
    menu.appendChild(toggleTitle)

    var toggles = [
      { key: 'regexOn', label: '\u6B63\u5219', getValue: function() { return self.regexes.length > 0 && self.regexes[0].on } },
      { key: 'presetOn', label: '\u9884\u8BBE', getValue: function() { return self.presets.length > 0 && self.presets[0].on } }
    ]

    for (var ti = 0; ti < toggles.length; ti++) {
      (function(toggle) {
        var row = document.createElement('div')
        row.className = 'pua-fab-toggle-row'
        var label = document.createElement('span')
        label.textContent = toggle.label
        var toggleBtn = document.createElement('button')
        toggleBtn.className = 'pua-toggle-item' + (toggle.getValue() ? ' on' : '')
        toggleBtn.addEventListener('click', function() {
          toggleBtn.classList.toggle('on')
        })
        row.appendChild(label)
        row.appendChild(toggleBtn)
        menu.appendChild(row)
      })(toggles[ti])
    }

    // Memory config
    var memTitle = document.createElement('div')
    memTitle.className = 'pua-fab-menu-title'
    memTitle.style.marginTop = '8px'
    memTitle.textContent = '\u8BB0\u5FC6\u914D\u7F6E'
    menu.appendChild(memTitle)

    var settings = this._loadSettings()
    var recallRow = document.createElement('div')
    recallRow.className = 'pua-fab-slider-row'
    recallRow.innerHTML = '<span>\u53EC\u56DE\u6570</span><input type="range" class="pua-fab-slider" min="1" max="20" value="' + (settings.recallMaxCount || 8) + '"><span id="fab-recall-val">' + (settings.recallMaxCount || 8) + '</span>'
    menu.appendChild(recallRow)

    var sliderEl = recallRow.querySelector('.pua-fab-slider')
    var sliderVal = recallRow.querySelector('#fab-recall-val')
    if (sliderEl) {
      sliderEl.addEventListener('input', function() {
        if (sliderVal) sliderVal.textContent = this.value
      })
    }

    // Action buttons
    var actionTitle = document.createElement('div')
    actionTitle.className = 'pua-fab-menu-title'
    actionTitle.style.marginTop = '8px'
    actionTitle.textContent = '\u64CD\u4F5C'
    menu.appendChild(actionTitle)

    var actions = [
      { icon: '\uD83D\uDCCD', label: '\u8DF3\u8F6C\u697C\u5C42', action: function() { self.currentPage = 'chat'; self._convShowJump = true; self._fabExpanded = false; self._render() } },
      { icon: '\u2B07', label: '\u8DF3\u5230\u5E95\u90E8', action: function() { var chatEl = self._contentEl.querySelector('#conv-chat'); if (chatEl) chatEl.scrollTop = chatEl.scrollHeight; self._fabExpanded = false; menu.classList.remove('show') } }
    ]

    for (var ai = 0; ai < actions.length; ai++) {
      (function(act) {
        var el = document.createElement('div')
        el.className = 'pua-fab-menu-item'
        el.innerHTML = '<span class="pua-fab-menu-item-icon">' + act.icon + '</span>' + act.label
        el.addEventListener('click', function() { act.action() })
        menu.appendChild(el)
      })(actions[ai])
    }

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
    titleEl.textContent = '\u2B50 \u6536\u85CF'
    actionsEl.innerHTML = ''

    var favs = this._loadFavorites()

    // Check which branches still exist
    var branchIds = {}
    for (var bi = 0; bi < this.branches.length; bi++) {
      branchIds[this.branches[bi].id] = true
    }

    if (favs.length === 0) {
      contentEl.innerHTML = '<div class="pua-empty"><div class="pua-empty-icon">\u2B50</div><div class="pua-empty-text">\u8FD8\u6CA1\u6709\u6536\u85CF\u7684\u6D88\u606F</div></div>'
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
        h += '<span class="pua-fav-warning">\u26A0\uFE0F \u5DF2\u5220\u9664</span>'
      }
      h += '</div>'
      h += '<div class="pua-fav-content">' + this._escHtml(fav.content || '') + '</div>'
      if (fav.note) {
        h += '<div class="pua-fav-note">\uD83D\uDCDD ' + this._escHtml(fav.note) + '</div>'
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
    var blob = new Blob([data], { type: 'text/plain;charset=utf-8' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'chat_' + (this._convBranchId || 'export') + '_' + new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19) + ext
    a.click()
    URL.revokeObjectURL(url)
    this._toast('\u5BFC\u51FA\u6210\u529F')
  }

  P._importChat = function() {
    var self = this
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

    // 刷新主API模型
    var mainRefreshBtn = document.getElementById('set-main-refresh')
    if (mainRefreshBtn) {
      mainRefreshBtn.addEventListener('click', function() {
        var endpoint = (document.getElementById('set-main-endpoint') || {}).value || ''
        var apiKey = (document.getElementById('set-main-key') || {}).value || ''
        if (!endpoint || !apiKey) { self._toast('\u8BF7\u5148\u586B\u5199\u63A5\u53E3\u5730\u5740\u548C API Key'); return }
        var statusEl = document.getElementById('set-main-status')
        if (statusEl) statusEl.textContent = '\u5237\u65B0\u4E2D...'
        var url = endpoint.replace(/\/+$/, '') + '/models'
        fetch(url, { headers: { 'Authorization': 'Bearer ' + apiKey } }).then(function(r) { return r.json() }).then(function(data) {
          var models = data.data || data.models || []
          var select = document.getElementById('set-main-model-select')
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
            var modelInput = document.getElementById('set-main-model')
            if (modelInput) modelInput.value = this.value
          })
        }).catch(function(e) {
          if (statusEl) statusEl.textContent = '\u5237\u65B0\u5931\u8D25: ' + (e.message || e)
        })
      })
    }

    // 测试主API调用
    var mainTestBtn = document.getElementById('set-main-test')
    if (mainTestBtn) {
      mainTestBtn.addEventListener('click', function() {
        var endpoint = (document.getElementById('set-main-endpoint') || {}).value || ''
        var apiKey = (document.getElementById('set-main-key') || {}).value || ''
        var model = (document.getElementById('set-main-model') || {}).value || ''
        var statusEl = document.getElementById('set-main-status')
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
        p.mainEndpoint = (document.getElementById('set-main-endpoint') || {}).value || ''
        p.mainApiKey = (document.getElementById('set-main-key') || {}).value || ''
        p.mainModel = (document.getElementById('set-main-model') || {}).value || ''
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
          this._settingsCache.presets = [{ id: 'preset-default', name: '\u9ED8\u8BA4\u9884\u8BBE', mainEndpoint: '', mainApiKey: '', mainModel: '', subEndpoint: '', subApiKey: '', subModel: '', vecEndpoint: '', vecApiKey: '', vecModel: '' }]
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
      presets: [{ id: 'preset-default', name: '\u9ED8\u8BA4\u9884\u8BBE', mainEndpoint: '', mainApiKey: '', mainModel: '', subEndpoint: '', subApiKey: '', subModel: '', vecEndpoint: '', vecApiKey: '', vecModel: '' }],
      activePresetId: 'preset-default',
      factSendCount: 10, summarizeInterval: 30,
      coreCharLimit: 2000, eventsCharLimit: 1000, recallMaxCount: 8, recallMode: 'vector',
      renderLimit: 10, contextDepth: 30, autoScroll: false
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
