/**
 * 平行时空档案馆 v0.1.4
 * Parallel Universe Archive — 让Roche拥有平行时空
 *
 * v0.1.4: modal overlay 改用 position:absolute + display:none/block（避免 fixed + pointer-events 在 WebView 中阻挡点击）
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
    '  background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 10 10\'%3E%3Cpath d=\'M2 3.5L5 6.5L8 3.5\' stroke=\'%23999\' stroke-width=\'1.2\' fill=\'none\'/%3E%3C/svg%3E");',
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

    // 加载已保存的分支
    this._loadBranches()
  }

  /* ── 卸载App视图（保留样式和实例） ── */
  P.unmountAppView = function() {
    if (this.container) { this.container.innerHTML = ''; this.container = null }
    this._modalOverlay = null
    this._toastEl = null
    this._contentEl = null
    this._titleEl = null
    this._actionsEl = null
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

    c.appendChild(root)

    // 存储关键元素引用（不再依赖 document.getElementById）
    this._modalOverlay = overlay
    this._toastEl = toast
    this._contentEl = content
    this._titleEl = root.querySelector('.pua-topbar-title')
    this._actionsEl = root.querySelector('.pua-topbar-actions')

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
    brand.innerHTML = '<h1>\u5E73\u884C\u65F6\u7A7A</h1><p>Parallel Universe</p>'
    sidebar.appendChild(brand)

    // Nav
    var nav = document.createElement('div')
    nav.className = 'pua-nav'

    var pages = [
      { id: 'branches', icon: '\u2606', label: '\u5206\u652F\u5B58\u6863', badge: this.branches.length },
      { id: 'presets', icon: '\u270E', label: '\u9884\u8BBE\u7F16\u8F91\u5668' },
      { id: 'regex', icon: '\u2733', label: '\u6B63\u5219\u7BA1\u7406' },
      { id: 'assembly', icon: '\u2699', label: '\u4E0A\u4E0B\u6587\u7EC4\u88C5' },
      { id: 'memory', icon: '\u263D', label: '\u8BB0\u5FC6\u7CFB\u7EDF' },
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

    switch (this.currentPage) {
      case 'branches': this._renderBranches(titleEl, actionsEl, contentEl); break
      case 'presets': this._renderPlaceholder(titleEl, actionsEl, contentEl, '\u270E', '\u9884\u8BBE\u7F16\u8F91\u5668', '\u9884\u8BBE\u6761\u76EE\u7BA1\u7406\u3001\u89D2\u8272\u9009\u62E9\u3001\u62D6\u63FD\u6392\u5E8F\u3001Roche\u683C\u5F0F\u5BFC\u5165\u5BFC\u51FA'); break
      case 'regex': this._renderPlaceholder(titleEl, actionsEl, contentEl, '\u2733', '\u6B63\u5219\u7BA1\u7406', '\u63D0\u793A\u8BCD\u66FF\u6362 / \u524D\u7AEF\u6E32\u67D3\u3001\u6DF1\u5EA6\u914D\u7F6E\u3001Roche\u683C\u5F0F\u5BFC\u5165\u5BFC\u51FA'); break
      case 'assembly': this._renderPlaceholder(titleEl, actionsEl, contentEl, '\u2699', '\u4E0A\u4E0B\u6587\u7EC4\u88C5', '\u53EF\u89C6\u5316\u62D6\u63FD\u7EC4\u88C5\u3001\u6DF1\u5EA6\u8FC7\u6EE4\u3001\u89D2\u8272\u5361/\u4E16\u754C\u4E66/\u8BB0\u5FC6\u6CE8\u5165'); break
      case 'memory': this._renderPlaceholder(titleEl, actionsEl, contentEl, '\u263D', '\u8BB0\u5FC6\u7CFB\u7EDF', '\u526FAPI\u603B\u7ED3\u3001\u6838\u5FC3\u8BB0\u5FC6\u8986\u5199\u3001\u4E8B\u5B9E\u8BB0\u5FC6\u538B\u7F29\u3001\u5411\u91CF\u8BB0\u5FC6\u9884\u7559'); break
      case 'settings': this._renderPlaceholder(titleEl, actionsEl, contentEl, '\u2691', '\u8BBE\u7F6E', '\u526FAPI\u914D\u7F6E\u3001\u4E3B\u9898\u7F8E\u5316\u3001\u5BFC\u5165\u5BFC\u51FA\u3001\u517C\u5BB9\u6027'); break
    }
  }

  /* ════════════════════════════════════════════════════════════
     分支存档页面
     ════════════════════════════════════════════════════════════ */

  P._renderBranches = function(titleEl, actionsEl, contentEl) {
    var self = this
    titleEl.textContent = '\u5206\u652F\u5B58\u6863'
    actionsEl.innerHTML = ''

    var createBtn = document.createElement('button')
    createBtn.className = 'pua-btn pua-btn-gold'
    createBtn.textContent = '+ \u4ECE\u5F53\u524D\u5BF9\u8BDD\u521B\u5EFA'
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
        meta.innerHTML = '<span>\u6D88\u606F: ' + (b.msgCount || 0) + ' \u6761</span><span>\u521B\u5EFA: ' + (b.createdAt || '-') + '</span>'
        card.appendChild(meta)

        if (b.tags && b.tags.length) {
          var tags = document.createElement('div')
          tags.className = 'pua-branch-tags'
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

    // 异步获取当前对话信息
    var currentConvId = ''
    var currentCharName = ''
    var currentCharId = ''
    var currentCharAvatar = ''

    // 先渲染模态框，再异步填充角色信息
    var body = ''

    // 分支名称
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">\u5206\u652F\u540D\u79F0</div>'
    body += '<input class="pua-field-input" id="pua-branch-name" placeholder="\u7ED9\u8FD9\u4E2A\u5206\u652F\u8D77\u4E2A\u540D\u5B57..." value="">'
    body += '</div>'

    // 来源角色
    body += '<div class="pua-field">'
    body += '<div class="pua-field-label">\u6765\u6E90\u89D2\u8272</div>'
    body += '<input class="pua-field-input" id="pua-branch-char" value="\u68C0\u6D4B\u4E2D..." readonly>'
    body += '<div class="pua-field-hint">\u81EA\u52A8\u68C0\u6D4B\u5F53\u524D\u5BF9\u8BDD\u89D2\u8272</div>'
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

    // 异步获取当前对话信息
    // 优先使用 character.list 获取角色（线下聊天用 conversationId）
    if (this.roche) {
      if (this.roche.character && this.roche.character.list) {
        this.roche.character.list().then(function(chars) {
          if (chars && chars.length) {
            var char = chars[0]
            self._pendingConvId = char.conversationId || ''
            self._pendingCharName = char.handle || char.name || ''
            self._pendingCharId = char.id || ''
            self._pendingCharAvatar = char.avatar || ''
            var charInput = document.getElementById('pua-branch-char')
            if (!charInput) charInput = modal.querySelector('#pua-branch-char')
            if (charInput) charInput.value = self._pendingCharName || '\u672A\u68C0\u6D4B\u5230'
          }
        }).catch(function(e) {
          console.warn('[PUA] character.list failed', e)
          self._fallbackConversationList()
        })
      } else if (this.roche.conversation && this.roche.conversation.list) {
        self._fallbackConversationList()
      } else {
        var charInput = document.getElementById('pua-branch-char')
        if (!charInput) charInput = modal.querySelector('#pua-branch-char')
        if (charInput) charInput.value = '\u65E0API\u53EF\u7528'
      }
    }
  }

  /* ── 备选：通过 conversation.list 获取会话 ── */
  P._fallbackConversationList = function() {
    var self = this
    var modal = this._modalOverlay
    if (!this.roche || !this.roche.conversation || !this.roche.conversation.list) {
      var charInput = document.getElementById('pua-branch-char')
      if (!charInput && modal) charInput = modal.querySelector('#pua-branch-char')
      if (charInput) charInput.value = '\u65E0API\u53EF\u7528'
      return
    }
    this.roche.conversation.list().then(function(convList) {
      if (convList && convList.length) {
        var latest = convList[0]
        self._pendingConvId = latest.id || latest.conversationId || ''
        self._pendingCharName = latest.handle || latest.name || ''
        self._pendingCharId = latest.contactId || ''
        self._pendingCharAvatar = latest.avatar || ''
        var charInput = document.getElementById('pua-branch-char')
        if (!charInput && modal) charInput = modal.querySelector('#pua-branch-char')
        if (charInput) charInput.value = self._pendingCharName || '\u672A\u68C0\u6D4B\u5230'
      }
    }).catch(function(e) {
      console.warn('[PUA] conversation.list failed', e)
      var charInput = document.getElementById('pua-branch-char')
      if (!charInput && modal) charInput = modal.querySelector('#pua-branch-char')
      if (charInput) charInput.value = '\u83B7\u53D6\u5931\u8D25'
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
      promises.push(
        this.roche.memory.getShortTerm({ conversationId: convId, limit: depth }).then(function(data) {
          if (data) {
            var msgs = data.messages || data
            if (Array.isArray(msgs)) {
              branch.messages = msgs
              branch.msgCount = msgs.length
            }
          }
          return data
        }).catch(function(e) { console.warn('[PUA] getShortTerm failed', e) })
      )
    }

    if (getLong && this.roche && this.roche.memory && convId) {
      promises.push(
        this.roche.memory.getLongTerm({ conversationId: convId }).then(function(data) {
          if (data) {
            branch.longTermMemory = data
          }
          return data
        }).catch(function(e) { console.warn('[PUA] getLongTerm failed', e) })
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
    body += '<span>\u4E0A\u4E0B\u6587\u6DF1\u5EA6: ' + (branch.contextDepth || 50) + '</span>'
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
        body += '<div style="font-size:9px;color:var(--pua-text-dim);text-align:center">\u4EC5\u663E\u793A\u6700\u8FD1 10 \u6761</div>'
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
    actionsEl.innerHTML = '<span style="font-size:10px;color:var(--pua-text-dim)">\u5F85\u5F00\u53D1</span>'
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
     注册入口
     ════════════════════════════════════════════════════════════ */

  var _instance = null

  window.RochePlugin.register({
    id: 'parallel-universe',
    name: '\u5E73\u884C\u65F6\u7A7A\u6863\u6848\u9986',
    version: '0.1.4',
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