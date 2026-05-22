// NicoPla Comment Popout Bookmarklet
// コメント欄を別ウィンドウでポップアウト表示するブックマークレット

javascript:(function() {
  'use strict';

  // 既にポップアウトされている場合は何もしない
  if (window.__nicoPopoutWindow && !window.__nicoPopoutWindow.closed) {
    window.__nicoPopoutWindow.focus();
    hideOriginalComments();
    return;
  }

  // 元のコメント関連要素のセレクタ
  const HIDE_SELECTORS = ['.EnableCommentArea-chatContent'];

  // 元のコメント関連要素を非表示にする関数
  function hideOriginalComments() {
    HIDE_SELECTORS.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.display = 'none';
      });
    });
  }

  // 元のコメント関連要素を表示する関数
  function showOriginalComments() {
    HIDE_SELECTORS.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.display = '';
      });
    });
  }

  // コメントエリアを取得
  const commentArea = document.querySelector('.EnableCommentArea-commentArea');
  if (!commentArea) {
    alert('コメントエリアが見つかりません');
    return;
  }

  // ポップアウトウィンドウを開く
  const popoutWidth = Math.min(400, window.screen.width * 0.4);
  const popoutHeight = Math.floor(window.screen.height * 0.8);
  const left = window.screen.width - popoutWidth - 20;
  const top = 20;

  const popout = window.open(
    '',
    'nicoCommentPopout',
    `width=${popoutWidth},height=${popoutHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );

  if (!popout) {
    alert('ポップアップブロックが有効です。ポップアップを許可してください');
    return;
  }

  // ポップアウトウィンドウにHTMLを書き込む
  popout.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>NicoPla コメント</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background: #fff; color: rgba(0,0,0,0.8);
          overflow: hidden; height: 100vh; margin: 0; padding: 0;
        }
        #popout-wrapper {
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        #comment-container {
          flex: 1;
          overflow-y: auto;
          scroll-behavior: smooth;
          padding: 8px 12px;
        }
        .CommentDetail-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          padding: 4px 0;
        }
        .CommentDetail-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .CommentDetail-subtitle {
          font-size: 12px;
          color: rgba(22,22,25,0.6);
        }
        .CommentDetail-comment {
          font-size: 14px;
          line-height: 1.5;
          color: rgba(0,0,0,0.8);
        }
        .CommentDetail-wrapper .MuiIconButton-root {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 0;
        }
        .CommentDetail-wrapper .MuiIconButton-root:hover {
          background: rgba(0,0,0,0.05);
          border-radius: 50%;
        }
        .comment-context-menu {
          position: absolute;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          padding: 4px 0;
          z-index: 1000;
          min-width: 160px;
        }
        .comment-context-menu-item {
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          color: rgba(0,0,0,0.8);
          display: block;
          width: 100%;
          text-align: left;
          border: none;
          background: transparent;
        }
        .comment-context-menu-item:hover {
          background: #f5f5f5;
        }
        #input-container {
          border-top: 1px solid #e0e0e0;
          padding: 8px 12px;
          background: #fff;
        }
        .CommentInputArea-wrapper {
          display: flex;
          width: 100%;
        }
        .CommentInputArea-input {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          width: 100%;
        }
        .CommentInputArea-commentInput {
          flex: 1;
          background: #f5f5f5;
          color: rgba(0,0,0,0.8);
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 14px;
          min-height: 36px;
          resize: none;
          font-family: inherit;
          outline: none;
        }
        .CommentInputArea-commentInput:focus {
          border-color: #1da1f2;
          background: #fff;
        }
        .CommentInputArea-submitIcon {
          display: flex !important;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 0;
          visibility: visible !important;
          opacity: 1 !important;
        }
        .CommentInputArea-submitIcon.hidden {
          display: flex !important;
        }
        .CommentInputArea-submitIcon:hover {
          background: rgba(0,0,0,0.05);
          border-radius: 50%;
        }
        #scroll-to-bottom-btn {
          position: fixed;
          bottom: 60px;
          right: 20px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0,0,0,0.7);
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          opacity: 0;
          transform: scale(0.8);
          transition: opacity 0.2s, transform 0.2s;
          pointer-events: none;
          z-index: 999;
        }
        #scroll-to-bottom-btn.visible {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }
        #scroll-to-bottom-btn:hover {
          background: rgba(0,0,0,0.9);
        }
      </style>
    </head>
    <body>
      <div id="popout-wrapper">
        <div id="comment-container"></div>
        <div id="input-container"></div>
        <button id="scroll-to-bottom-btn" aria-label="最下部へ移動">▼</button>
      </div>
    </body>
    </html>
  `);
  popout.document.close();

  // コンテナを取得
  const popoutContainer = popout.document.getElementById('comment-container');
  const popoutInputContainer = popout.document.getElementById('input-container');

  // コメント入力欄をコピー
  const originalInputArea = document.querySelector('.CommentInputArea-wrapper');
  if (originalInputArea) {
    const clonedInput = originalInputArea.cloneNode(true);
    const textarea = clonedInput.querySelector('textarea');

    // aria-hidden を解除
    const inputDiv = clonedInput.querySelector('.CommentInputArea-input');
    if (inputDiv) {
      inputDiv.removeAttribute('aria-hidden');
    }

    // textarea を input に置き換え（単一行で十分）
    if (textarea) {
      const input = popout.document.createElement('input');
      input.type = 'text';
      input.className = textarea.className;
      textarea.replaceWith(input);
    }
    const input = clonedInput.querySelector('input');

    // 送信ボタンを取得して設定
    const button = clonedInput.querySelector('button');
    if (button) {
      button.classList.remove('hidden');
      button.style.display = 'flex';
      button.style.visibility = 'visible';
      button.style.opacity = '1';

      // 元のページの textarea に値を設定して送信
      function submitComment() {
        const originalTextarea = document.querySelector('.CommentInputArea-commentInput');
        if (originalTextarea && input && input.value) {
          originalTextarea.value = input.value;
          originalTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const originalButton = document.querySelector('.CommentInputArea-submitIcon');
        if (originalButton) {
          originalButton.click();
        }
        if (input) {
          input.value = '';
        }
      }

      button.addEventListener('click', submitComment);

      // Enter キーで投稿
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitComment();
        }
      });
    }

    popoutInputContainer.appendChild(clonedInput);
  }

  // ポップアウトウィンドウにコピー関数を定義
  popout.copyToClipboard = function(text) {
    popout.navigator.clipboard.writeText(text);
  };

   // コンテキストメニューを表示する関数
  let currentContextMenu = null;
  
  function showContextMenu(button, originalComment) {
    // 既存のメニューを閉じる
    hideContextMenu();
    
    const menu = popout.document.createElement('div');
    menu.className = 'comment-context-menu';
    
    // ボタンの位置を取得
    const rect = button.getBoundingClientRect();
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.left = (rect.right - 160) + 'px';
    
    // メニュー項目を作成
    const items = [
      { label: 'コメントコピー', action: () => {
          const commentText = originalComment.querySelector('.CommentDetail-comment')?.textContent;
          if (commentText) {
            popout.copyToClipboard(commentText.trim());
          }
        }
      },
      { label: 'NG ユーザー登録', action: () => ngUser(originalComment) }
    ];
    
    items.forEach(item => {
      const menuItem = popout.document.createElement('div');
      menuItem.className = 'comment-context-menu-item';
      menuItem.textContent = item.label;
      menuItem.addEventListener('click', () => {
        item.action();
        hideContextMenu();
      });
      menu.appendChild(menuItem);
    });
    
    popout.document.body.appendChild(menu);
    currentContextMenu = menu;
    
    // メニュー外をクリックしたら閉じる
    setTimeout(() => {
      popout.document.addEventListener('click', hideContextMenu, { once: true });
    }, 100);
  }
  
  function hideContextMenu() {
    if (currentContextMenu) {
      currentContextMenu.remove();
      currentContextMenu = null;
    }
  }
  
  function ngUser(originalComment) {
    const originalMenuButton = originalComment.querySelector('.MuiIconButton-root');
    if (!originalMenuButton) return;

    const hideStyle = document.createElement('style');
    hideStyle.textContent = '.MuiMenu-root .MuiPaper-root{display:none !important}';
    document.head.appendChild(hideStyle);

    originalMenuButton.click();

    const startTime = Date.now();
    const timeout = 3000;

    function tryClick() {
      if (Date.now() - startTime > timeout) {
        hideStyle.remove();
        return;
      }
      const menus = document.querySelectorAll('.MuiMenu-root');
      for (const menuContainer of menus) {
        const items = menuContainer.querySelectorAll('[role="menuitem"]');
        for (const item of items) {
          if (item.textContent.includes('NG')) {
            item.click();
            setTimeout(() => hideStyle.remove(), 300);
            return;
          }
        }
      }
      setTimeout(tryClick, 50);
    }
    setTimeout(tryClick, 100);
  }
  
  // 元DOM → 複製DOM の対応表（WeakMapで自動GC）
  const clonedByOriginal = new WeakMap();

  // 三点リーダーボタンのクリックハンドラーを追加する関数
  function addMenuButtonHandler(clonedComment, originalComment) {
    const menuButton = clonedComment.querySelector('.MuiIconButton-root');
    if (menuButton) {
      menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        showContextMenu(menuButton, originalComment);
      });
    }
  }

  // コメントを複製してポップアウトに追加（重複防止付き）
  function appendComment(originalComment) {
    if (clonedByOriginal.has(originalComment)) return;
    
    const clonedComment = originalComment.cloneNode(true);
    addMenuButtonHandler(clonedComment, originalComment);
    clonedByOriginal.set(originalComment, clonedComment);
    popoutContainer.appendChild(clonedComment);
  }

  // コメントをコピーする関数
  function copyComments() {
    commentArea.querySelectorAll('.CommentDetail-wrapper').forEach(appendComment);
  }

  // 元のページのコメント関連要素を非表示にする
  hideOriginalComments();

  // 最新コメントにスクロールする関数
  // autoScrollEnabled: 自動スクロール有効フラグ（ユーザーが上にスクロールしたら無効化）
  let autoScrollEnabled = true;

  function scrollToBottom() {
    if (autoScrollEnabled) {
      popoutContainer.scrollTo({ top: 999999, behavior: 'smooth' });
    }
  }

  // 最下部へ戻るボタン
  const scrollToBottomBtn = popout.document.getElementById('scroll-to-bottom-btn');
  const SCROLL_THRESHOLD = 80; // 最下部からこの値以上離れるとボタンを表示

  function updateScrollButton() {
    // 最下部からどれだけ離れているかを計算
    const { scrollTop, scrollHeight, clientHeight } = popoutContainer;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    if (distanceFromBottom > SCROLL_THRESHOLD) {
      scrollToBottomBtn.classList.add('visible');
    } else {
      scrollToBottomBtn.classList.remove('visible');
      // 最下部に戻ったら自動スクロールを再有効化
      autoScrollEnabled = true;
    }
  }

  // ボタンクリックで最下部へ
  scrollToBottomBtn.addEventListener('click', () => {
    popoutContainer.scrollTo({ top: 999999, behavior: 'smooth' });
    autoScrollEnabled = true;
    scrollToBottomBtn.classList.remove('visible');
  });

  // スクロールイベントでボタン表示/非表示を切り替え
  popoutContainer.addEventListener('scroll', () => {
    // ユーザーが上にスクロールしたら自動スクロールを無効化
    const { scrollTop, scrollHeight, clientHeight } = popoutContainer;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    if (distanceFromBottom > SCROLL_THRESHOLD) {
      autoScrollEnabled = false;
    }
    
    updateScrollButton();
  }, { passive: true });

  // 初期コピー＆スクロール
  copyComments();
  scrollToBottom();

  // MutationObserver で新しいコメントを検知
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // 削除されたノードを処理
      for (const node of mutation.removedNodes) {
        if (node.nodeType !== 1) continue;
        // 直接コメントノードが削除された場合
        if (node.classList?.contains('CommentDetail-wrapper')) {
          const cloned = clonedByOriginal.get(node);
          if (cloned) cloned.remove();
        }
        // 親ノードが削除された場合は子コメントも削除
        node.querySelectorAll?.('.CommentDetail-wrapper').forEach(child => {
          const cloned = clonedByOriginal.get(child);
          if (cloned) cloned.remove();
        });
      }
      
      // 追加されたノードを処理
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        const comments = node.classList?.contains('CommentDetail-wrapper')
          ? [node]
          : node.querySelectorAll?.('.CommentDetail-wrapper') ?? [];
        comments.forEach(appendComment);
        if (comments.length > 0) scrollToBottom();
      }
    }
  });
  observer.observe(commentArea, { childList: true, subtree: true });

  // ウィンドウが閉じられたらクリーンアップ
  popout.addEventListener('unload', () => {
    observer.disconnect();
    showOriginalComments();
  });

  window.__nicoPopoutWindow = popout;
})();
