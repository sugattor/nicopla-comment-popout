// NicoPla Comment Popout Bookmarklet
// コメント欄を入力・送信・NG登録込みでそのまま別ウィンドウに開き、元ページは動画列を全幅化
// 実装方針:
//   - CSSは書き写さない。元ページのcssRulesをシリアライズ＋linkコピーでポップアウトに注入
//   - コメント欄(.EnableCommentArea-chatContent)を入力欄込みでまるごとクローン
//   - Reactイベントは跨げないため、入力送信と三点メニュー(NG)は元ページへ転写
//   - 元ページ側はコメント列を非表示＋grid 1fr化で動画を最大化。ウィンドウ閉じで復元

javascript:(function() {
  'use strict';

  // 既にポップアウト済みならフォーカスだけして終了
  if (window.__nicoPopout && !window.__nicoPopout.closed) {
    window.__nicoPopout.focus();
    return;
  }

  const chat = document.querySelector('.EnableCommentArea-chatContent');
  if (!chat) { alert('コメント欄が見つかりません'); return; }
  const col = chat.parentElement;   // 動画と並ぶコメント列
  const grid = col.parentElement;   // 動画列+コメント列のgridコンテナ

  // --- ポップアウトウィンドウを開く ---
  const w = Math.min(420, screen.width * 0.4);
  const h = screen.height * 0.9;
  const popout = window.open('', 'nicoCommentPopout',
    `width=${w},height=${h},left=${screen.width - w - 20},top=20,resizable=yes,scrollbars=yes`);
  if (!popout) { alert('ポップアップを許可してください'); return; }
  const d = popout.document;

  // --- ページのCSSをコピー ---
  // emotion(MUI)の動的スタイルはcssRulesから、外部CSSはlinkごと複製して持ち込む
  const css = [...document.styleSheets].map(s => {
    try { return [...s.cssRules].map(r => r.cssText).join(''); } catch (e) { return ''; }
  }).join('');
  d.head.innerHTML =
    `<style>${css}</style>` +
    [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.outerHTML).join('') +
    `<style>
      html,body{margin:0;padding:0;background:#fff;height:100%}
      .EnableCommentArea-chatContent{position:static !important;height:100vh;padding:0 !important;overflow:hidden}
      .EnableCommentArea-commentArea{flex:1 1 0;min-height:0;overflow-y:auto !important}
      .nctx{position:fixed;background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);padding:4px 0;z-index:1e3;min-width:160px}
      .nctx button{display:block;width:100%;text-align:left;padding:8px 16px;border:0;background:none;cursor:pointer;font:14px/1.4 sans-serif}
      .nctx button:hover{background:#f5f5f5}
    </style>`;
  d.body.className = document.body.className;

  // コピーはv1実証済みの経路（popout側のclipboardを叩く）へ。クリックのactivationはポップアウト側にあるため、opener側clipboardではNotAllowedErrorになる
  popout.copyToClipboard = t => popout.navigator.clipboard.writeText(t).catch(() => {});

  // --- コメント欄まるごとクローン（入力欄込み） ---
  const clone = chat.cloneNode(true);
  d.body.appendChild(clone);
  const list = clone.querySelector('.EnableCommentArea-commentArea');
  list.innerHTML = ''; // 既存コメントはadd()で流し込むため、クローン内の初期子は除去

  // --- 入力転写: クローンtextarea → 元textarea＋元送信ボタン ---
  const ota = document.querySelector('.CommentInputArea-commentInput');
  const obtn = document.querySelector('.CommentInputArea-submitIcon');
  const ta = clone.querySelector('.CommentInputArea-commentInput');
  const sbtn = clone.querySelector('.CommentInputArea-submitIcon');
  // React制御のtextareaへ値を渡すにはネイティブsetter経由が必須（直接代入はReactの値トラッカーに無視される）
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
  function send() {
    if (!ta.value || !ota) return;
    nativeSetter.call(ota, ta.value);
    ota.dispatchEvent(new Event('input', { bubbles: true }));
    if (obtn) obtn.click();
    ta.value = '';
    toggleBtn();
  }
  // 元ページと同じく、入力中の間は送信ボタンを表示（React管理なのでクラスを手動連動）
  function toggleBtn() {
    if (!sbtn) return;
    const on = d.activeElement === ta || !!ta.value;
    sbtn.classList.toggle('hidden', !on);
    sbtn.classList.toggle('show', on);
  }
  if (ta) {
    ta.addEventListener('input', toggleBtn);
    ta.addEventListener('focus', toggleBtn);
    ta.addEventListener('blur', toggleBtn);
  }
  if (sbtn) sbtn.addEventListener('click', send);
  if (ta) ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  // --- 三点メニュー: 元ページで開くNGメニューへの転写 ---
  let menu = null;
  function hideMenu() { if (menu) { menu.remove(); menu = null; } }

  function ngUser(orig) {
    const b = orig.querySelector('.MuiIconButton-root');
    if (!b) return;
    const hs = document.createElement('style');
    hs.textContent = '.MuiMenu-root .MuiPaper-root{display:none !important}';
    document.head.appendChild(hs);
    b.click();
    const t0 = Date.now();
    (function tryClick() {
      if (Date.now() - t0 > 3000) { hs.remove(); return; }
      for (const it of document.querySelectorAll('.MuiMenu-root [role="menuitem"]')) {
        if (it.textContent.includes('NG')) { it.click(); setTimeout(() => hs.remove(), 300); return; }
      }
      setTimeout(tryClick, 50);
    })();
  }

  function menuHook(cl, orig) {
    const b = cl.querySelector('.MuiIconButton-root');
    if (!b) return;
    b.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      hideMenu();
      menu = d.createElement('div');
      menu.className = 'nctx';
      const r = b.getBoundingClientRect();
      d.body.appendChild(menu);
      // 下に収まらない場合は上へ反転（下端のコメントでメニューが画面外になる対策）
      const mh = menu.offsetHeight;
      let top = r.bottom + 4;
      if (top + mh > popout.innerHeight) top = Math.max(4, r.top - mh - 4);
      menu.style.top = top + 'px';
      menu.style.left = Math.min(Math.max(4, r.right - 160), popout.innerWidth - 164) + 'px';
      const mk = (label, fn) => {
        const it = d.createElement('button');
        it.textContent = label;
        it.addEventListener('click', () => { fn(); hideMenu(); });
        menu.appendChild(it);
      };
      mk('コメントコピー', () => {
        const t = orig.querySelector('.CommentDetail-comment')?.textContent.trim();
        if (t) popout.copyToClipboard(t);
      });
      mk('NGユーザー登録', () => ngUser(orig));
      // 項目追記後に高さが変わった分も再調整
      const mh2 = menu.offsetHeight;
      if (top + mh2 > popout.innerHeight) menu.style.top = Math.max(4, r.top - mh2 - 4) + 'px';
      setTimeout(() => d.addEventListener('click', hideMenu, { once: true }), 100);
    });
  }

  // --- 増分同期: 元コメント欄の追加/削除をクローンへ反映 ---
  const byOrig = new WeakMap();
  function add(c) {
    if (byOrig.has(c)) return;
    const cl = c.cloneNode(true);
    byOrig.set(c, cl);
    menuHook(cl, c);
    list.appendChild(cl);
  }

  // 自動スクロール: 最下部にいて上スクロールしていない間だけ追従
  let stick = true;
  list.addEventListener('scroll', () => {
    stick = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
  }, { passive: true });
  function toBottom() { if (stick) list.scrollTop = list.scrollHeight; }

  const mo = new MutationObserver(ms => {
    for (const m of ms) {
      for (const n of m.removedNodes) {
        if (n.nodeType !== 1) continue;
        const cs = n.classList?.contains('CommentDetail-wrapper')
          ? [n] : [...(n.querySelectorAll?.('.CommentDetail-wrapper') ?? [])];
        cs.forEach(c => { const cl = byOrig.get(c); if (cl) cl.remove(); });
      }
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        const cs = n.classList?.contains('CommentDetail-wrapper')
          ? [n] : [...(n.querySelectorAll?.('.CommentDetail-wrapper') ?? [])];
        cs.forEach(add);
        if (cs.length) toBottom();
      }
    }
  });
  mo.observe(document.querySelector('.EnableCommentArea-commentArea'), { childList: true, subtree: true });

  // 初期取り込み
  document.querySelectorAll('.CommentDetail-wrapper').forEach(add);
  toBottom();

  // --- 元ページ: コメント列を隠し、grid 1fr化で動画を最大化 ---
  const hs = document.createElement('style');
  hs.textContent = '.popout-hidden{display:none !important}';
  document.head.appendChild(hs);
  col.classList.add('popout-hidden');
  const isGrid = getComputedStyle(grid).display === 'grid';
  if (isGrid) grid.style.gridTemplateColumns = '1fr';

  // --- ウィンドウを閉じたら復元 ---
  popout.addEventListener('pagehide', () => {
    mo.disconnect();
    col.classList.remove('popout-hidden');
    if (isGrid) grid.style.gridTemplateColumns = '';
    hs.remove();
  });

  window.__nicoPopout = popout;
})();
