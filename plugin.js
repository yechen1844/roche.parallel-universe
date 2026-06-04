/**
 * 平行时空档案馆 v0.1.6
 * Parallel Universe Archive — 让Roche拥有平行时空
 *
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
  }

  var P = ParallelUniverse.prototype

  /* ── 初始化 ── */
  P.init = function(container) {
    this.container = container

    // 注入样式
    if (!this.styleEl) {
      this.styleEl = document.createElement('style')
      this.styleEl.textContent = CSS
      document.head.appendChild(this.styleEl)
    }

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

    // 加载已保存的分支
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
    if (!this.roche || !this.roche.storage) { this._render(); return }
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

  /* ════════════════════════════════════════════════════════════
     渲染主框架
     ════════════════════════════════════════════════════════════ */

  P._render = function() {
    if (!this.container) return
    var self = this
    var c = this.container
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
    logToolbar.innerHTML = '<span>控制台日志</span>'
    var logBtns = document.createElement('div')
    logBtns.className = 'pua-log-toolbar-btns'
    var copyBtn = document.createElement('button')
    copyBtn.textContent = '复制'
    copyBtn.addEventListener('click', function() { self._copyLogs() })
    var exportBtn = document.createElement('button')
    exportBtn.textContent = '导出'
    exportBtn.addEventListener('click', function() { self._exportLogs() })
    var clearBtn = document.createElement('button')
    clearBtn.textContent = '清除'
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
    logToggle.title = '控制台'
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
  }

  P._renderSidebar = function() {
    var self = this
    var sidebar = document.createElement('div')
    sidebar.className = 'pua-sidebar'

    // Brand
    var brand = document.createElement('div')
    brand.className = 'pua-sidebar-brand'
    brand.innerHTML = '<h1>平行时空</h1><p>Parallel Universe</p>'
    sidebar.appendChild(brand)

    // Nav
    var nav = document.createElement('div')
    nav.className = 'pua-nav'

    var pages = [
      { id: 'branches', icon: '☆', label: '分支存档', badge: this.branches.length },
      { id: 'presets', icon: '✎', label: '预设编辑器' },
      { id: 'regex', icon: '✳', label: '正则管理' },
      { id: 'assembly', icon: '⚙', label: '上下文组装' },
      { id: 'memory', icon: '☽', label: '记忆系统' },
      { id: 'settings', icon: '♑', label: '设置' },
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
    footer.innerHTML = '<span>暗/亮</span>'
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

    var backBtn = document.createElement('button')
    backBtn.className = 'pua-back-btn'
    backBtn.textContent = '←'
    backBtn.title = '返回'
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

    switch (this.currentPage) {
      case 'branches': this._renderBranches(titleEl, actionsEl, contentEl); break
      case 'presets': this._renderPlaceholder(titleEl, actionsEl, contentEl, '✎', '预设编辑器', '预设条目管理、角色选择、拖拽排序、Roche格式导入导出'); break
      case 'regex': this._renderPlaceholder(titleEl, actionsEl, contentEl, '✳', '正则管理', '提示词替换 / 前端渲染、深度配置、Roche格式导入导出'); break
      case 'assembly': this._renderPlaceholder(titleEl, actionsEl, contentEl, '⚙', '上下文组装', '可视化拖拽组装、深度过滤、角色卡/世界书/记忆注入'); break
      case 'memory': this._renderPlaceholder(titleEl, actionsEl, contentEl, '☽', '记忆系统', '副API总结、核心记忆覆写、事实记忆压缩、向量记忆预留'); break
      case 'settings': this._renderPlaceholder(titleEl, actionsEl, contentEl, '♑', '设置', '副API配置、主题美化、导入导出、兼容性'); break
    }
  }

  /* ════════════════════════════════════════════════════════════
     分支存档页面
     ════════════════════════════════════════════════════════════ */

  P._renderBranches = function(titleEl, actionsEl, contentEl) {
    var self = this
    titleEl.textContent = '分支存档'
    actionsEl.innerHTML = ''

    var createBtn = document.createElement('button')
    createBtn.className = 'pua-btn pua-btn-gold'
    createBtn.textContent = '+ 从当前对话创建'
    createBtn.addEventListener('click', function() { self._showCreateBranchModal() })
    actionsEl.appendChild(createBtn)

    // 按char分组
    var groups = {}
    this.branches.forEach(function(b) {
      var key = b.charId || 'unknown'
      if (!groups[key]) groups[key] = { charId: b.charId, charName: b.charName, avatar: b.charAvatar || '', branches: [] }
      groups[key].branches.push(b)
    })

    if (Object.keys(groups).length === 0) {
      contentEl.innerHTML = '<div class="pua-empty"><div class="pua-empty-icon">☆</div><div class="pua-empty-text">还没有分支存档，点击右上角创建第一个</div></div>'
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
      name.textContent = g.charName || '未知角色'
      header.appendChild(name)
      var count = document.createElement('div')
      count.className = 'pua-char-group-count'
      count.textContent = g.branches.length + ' 个存档'
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
        meta.innerHTML = '<span>消息: ' + (b.msgCount || 0) + ' 条</span><span>创建: ' + (b.createdAt || '-') + '</span>'
        card.appendChild(meta)

        if (b.tags && b.tags.length) {
          var tags = document.createElement('div')
          tags.className = 'pua-branch-tags'
          b.tags.forEach(function(t) {
            var tag = document.createElement('span')
            tag.className = 'pua-tag'
            if (t.indexOf('预设') >= 0) tag.className += ' pua-tag-preset'
            else if (t.indexOf('记忆') >= 0) tag.className += ' pua-tag-mem'
            else tag.className += ' pua-tag-char'
            tag.textContent = t
            tags.appendChild(tag)
          })
          card.appendChild(tags)
        }

        grid.appendChild(card)
      })
      group.appendChild(grid)
      contentEl.appendChild(group)
    })
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
    body += '<div class="pua-field-label">分支名称</div>'
    body += '<input class="pua-field-input" id="pua-branch-name" placeholder="给这个分支起个名字..." value="">'
    body += '</div>'

    // 来源角色 — 下拉选择
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">来源角色 / 会话</div>'
    body += '<select class="pua-field-input pua-field-select" id="pua-branch-char">'
    body += '<option value="">加载中...</option>'
    body += '</select>'
    body += '<div class="pua-field-hint">选择要创建分支的角色或群聊</div>'
    body += '</div>'

    // 上下文深度
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">获取上下文深度</div>'
    body += '<input class="pua-field-input" type="number" id="pua-branch-depth" value="50" min="1" max="200">'
    body += '<div class="pua-field-hint">从当前对话获取最近N条消息（最大200）</div>'
    body += '</div>'

    // 标签
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">标签（逗号分隔）</div>'
    body += '<input class="pua-field-input" id="pua-branch-tags" placeholder="关键抉择, 番外, ...">'
    body += '</div>'

    // 记忆获取选项
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">记忆获取</div>'
    body += '<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--pua-text-sub);margin-bottom:4px">'
    body += '<input type="checkbox" id="pua-branch-mem-short" checked> 上下文记忆（短期）</label>'
    body += '<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--pua-text-sub);margin-bottom:4px">'
    body += '<input type="checkbox" id="pua-branch-mem-long" checked> 事实记忆 + 核心记忆（长期）</label>'
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
    if (modalTitle) modalTitle.textContent = '创建分支存档'

    // Footer buttons
    var footer = modal.querySelector('.pua-modal-footer')
    if (footer) footer.remove()
    footer = document.createElement('div')
    footer.className = 'pua-modal-footer'

    var cancelBtn = document.createElement('button')
    cancelBtn.className = 'pua-btn'
    cancelBtn.textContent = '取消'
    cancelBtn.addEventListener('click', function() { self._closeModal() })

    var createBtn = document.createElement('button')
    createBtn.className = 'pua-btn pua-btn-gold'
    createBtn.textContent = '创建'
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
    selectEl.innerHTML = '<option value="">加载中...</option>'

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
              var name = ch.handle || ch.name || '未知'
              options.push({
                label: '👤 ' + name + ' (单聊)',
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
              var name = cv.name || cv.handle || '未知'
              var isGroup = cv.type === 'group' || (cv.members && cv.members.length > 2)
              // 检查是否已存在
              var dup = false
              for (var i = 0; i < options.length; i++) {
                if (options[i].convId === convId) { dup = true; break }
              }
              if (!dup && convId) {
                options.push({
                  label: (isGroup ? '👥 ' : '📝 ') + name + (isGroup ? ' (群聊)' : ''),
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
      selectEl.innerHTML = '<option value="">无API可用</option>'
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

    console.log('[PUA] _doCreateBranch: convId=' + convId + ' charId=' + charId + ' charName=' + charName + ' depth=' + depth + ' getShort=' + getShort + ' getLong=' + getLong)

    if (!branchName) {
      branchName = '分支 · ' + new Date().toLocaleString('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' })
    }

    var tags = tagsStr ? tagsStr.split(/[,，]/).map(function(t) { return t.trim() }).filter(function(t) { return t }) : []

    var branch = {
      id: 'b' + Date.now(),
      name: branchName,
      charId: charId,
      charName: charName,
      charAvatar: charAvatar,
      sourceConvId: convId,
      msgCount: 0,
      createdAt: new Date().toLocaleString('zh-CN'),
      tags: tags,
      contextDepth: depth,
      longTermMemory: null,
      messages: [],
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

    if (promises.length === 0) {
      self.branches.push(branch)
      self._saveBranches()
      self._closeModal()
      self._toast('分支创建成功（未获取记忆）')
      self._render()
      return
    }

    // 显示加载
    this._toast('正在获取记忆...')

    Promise.all(promises).then(function() {
      self.branches.push(branch)
      self._saveBranches()
      self._closeModal()
      console.log('[PUA] branch created: id=' + branch.id + ' name=' + branch.name + ' convId=' + branch.sourceConvId + ' charId=' + branch.charId + ' msgs=' + branch.msgCount)
      self._toast('分支创建成功！已获取 ' + branch.msgCount + ' 条消息')
      self._render()
    }).catch(function(e) {
      console.error('[PUA] create branch failed', e)
      self.branches.push(branch)
      self._saveBranches()
      self._closeModal()
      self._toast('分支已创建，但记忆获取可能不完整')
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
    body += '<span>角色: ' + this._escHtml(branch.charName || '未知') + '</span>'
    body += '<span>消息: ' + branch.msgCount + ' 条</span>'
    body += '<span>创建: ' + this._escHtml(branch.createdAt || '-') + '</span>'
    body += '<span>上下文深度: ' + (branch.contextDepth || 50) + '</span>'
    body += '</div></div>'

    // 记忆概览
    if (branch.longTermMemory) {
      body += '<div style="margin-bottom:12px">'
      body += '<div style="font-size:11px;font-weight:600;color:var(--pua-accent);margin-bottom:4px">长期记忆</div>'
      if (branch.longTermMemory.core) {
        var coreText = branch.longTermMemory.core.summary || branch.longTermMemory.core.text || String(branch.longTermMemory.core)
        body += '<div style="font-size:10.5px;color:var(--pua-text-sub);background:var(--pua-bg-input);border-radius:6px;padding:8px;margin-bottom:4px;max-height:80px;overflow-y:auto">'
        body += '<b>核心:</b> ' + this._escHtml(coreText.substring(0, 200))
        if (coreText.length > 200) body += '...'
        body += '</div>'
      }
      if (branch.longTermMemory.facts) {
        var factCount = Array.isArray(branch.longTermMemory.facts) ? branch.longTermMemory.facts.length : 0
        body += '<div style="font-size:10px;color:var(--pua-text-dim)">事实记忆: ' + factCount + ' 条</div>'
      }
      if (branch.longTermMemory.vectors) {
        var vecCount = Array.isArray(branch.longTermMemory.vectors) ? branch.longTermMemory.vectors.length : 0
        if (vecCount > 0) body += '<div style="font-size:10px;color:var(--pua-text-dim)">向量记忆: ' + vecCount + ' 条</div>'
      }
      body += '</div>'
    }

    // 消息预览
    if (branch.messages && branch.messages.length) {
      body += '<div style="margin-bottom:12px">'
      body += '<div style="font-size:11px;font-weight:600;color:var(--pua-accent);margin-bottom:4px">聊天记录 (' + branch.messages.length + ' 条)</div>'
      body += '<div style="max-height:200px;overflow-y:auto;font-size:10.5px;line-height:1.6">'
      var previewCount = Math.min(branch.messages.length, 10)
      for (var j = branch.messages.length - previewCount; j < branch.messages.length; j++) {
        var msg = branch.messages[j]
        var sender = msg.senderHandle || msg.senderName || msg.type || 'unknown'
        var isUser = msg.type === 'user' || msg.senderId === 'user'
        var roleLabel = isUser ? 'USR' : 'AST'
        var roleColor = isUser ? 'var(--pua-user)' : 'var(--pua-mem)'
        var content = (msg.text || msg.content || '').substring(0, 100)
        body += '<div style="margin-bottom:4px;padding:4px 6px;border-radius:4px;background:rgba(255,255,255,0.02)">'
        body += '<span style="color:' + roleColor + ';font-weight:600;font-size:9px">[' + roleLabel + ']</span> '
        body += '<span style="color:var(--pua-text-sub)">' + this._escHtml(content) + '</span>'
        body += '</div>'
      }
      if (branch.messages.length > 10) {
        body += '<div style="font-size:9px;color:var(--pua-text-dim);text-align:center">仅显示最近 10 条</div>'
      }
      body += '</div></div>'
    }

    var modalBody = modal.querySelector('.pua-modal-body')
    if (!modalBody) {
      console.warn('[PUA] modal body not found in _openBranch')
      return
    }
    modalBody.innerHTML = body

    var modalTitle = modal.querySelector('.pua-modal-title')
    if (modalTitle) modalTitle.textContent = '分支详情'

    // Footer
    var footer = modal.querySelector('.pua-modal-footer')
    if (footer) footer.remove()
    footer = document.createElement('div')
    footer.className = 'pua-modal-footer'

    var closeBtn = document.createElement('button')
    closeBtn.className = 'pua-btn'
    closeBtn.textContent = '关闭'
    closeBtn.addEventListener('click', function() { self._closeModal() })

    var deleteBtn = document.createElement('button')
    deleteBtn.className = 'pua-btn pua-btn-danger'
    deleteBtn.textContent = '删除分支'
    deleteBtn.addEventListener('click', function() {
      self.branches = self.branches.filter(function(b) { return b.id !== branchId })
      self._saveBranches()
      self._closeModal()
      self._toast('分支已删除')
      self._render()
    })

    footer.appendChild(deleteBtn)
    footer.appendChild(closeBtn)

    var modalInner = modal.querySelector('.pua-modal')
    if (modalInner) modalInner.appendChild(footer)

    modal.classList.add('show')
  }

  /* ════════════════════════════════════════════════════════════
     占位页面（Phase 2-5 功能）
     ════════════════════════════════════════════════════════════ */

  P._renderPlaceholder = function(titleEl, actionsEl, contentEl, icon, title, desc) {
    titleEl.textContent = title
    actionsEl.innerHTML = '<span style="font-size:10px;color:var(--pua-text-dim)">待开发</span>'
    contentEl.innerHTML = '<div class="pua-placeholder">'
      + '<div class="pua-placeholder-icon">' + icon + '</div>'
      + '<div class="pua-placeholder-title">' + title + '</div>'
      + '<div class="pua-placeholder-desc">' + desc + '</div>'
      + '</div>'
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
      this._toast('日志已复制到剪贴板')
    } catch(e) {
      this._logBuffer.push({ level: 'info', text: '复制失败，请手动复制下方日志，总共' + this._logBuffer.length + '条', time: new Date().toLocaleTimeString('zh-CN') })
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
    this._toast('日志已导出')
  }

  P._clearLogs = function() {
    this._logBuffer = []
    if (this._logList) this._logList.innerHTML = ''
    if (this._logCount) this._logCount.style.display = 'none'
    this._toast('日志已清除')
  }

  /* ════════════════════════════════════════════════════════════
     注册入口
     ════════════════════════════════════════════════════════════ */

  var _instance = null

  window.RochePlugin.register({
    id: 'parallel-universe',
    name: '平行时空档案馆',
    version: '0.1.6',
    icon: '☆',
    apps: [{
      id: 'parallel-universe-home',
      name: '平行时空档案馆',
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