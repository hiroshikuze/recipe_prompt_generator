"use strict";

(function(){
  /**
   * デフォルトの調理機材リスト
   * @type {string[]}
   */
  const DEFAULT_EQUIP = [
    "ホットクック","ヘルシオウォーターオーブン","ガスコンロ","ガスオーブン","炊飯器",
    "電子レンジ","フライパン","鍋","トースター","電気圧力鍋"
  ];

  /**
   * 各種DOM要素への参照
   * @type {Object.<string, HTMLElement>}
   */
  const els = {
    equipList: document.getElementById('equipList'),
    equipExtra: document.getElementById('equipExtra'),
    adults: document.getElementById('adults'),
    kids: document.getElementById('kids'),
    mealCount: document.getElementById('mealCount'),
    targetMin: document.getElementById('targetMin'),
    ingredients: document.getElementById('ingredients'),
    notes: document.getElementById('notes'),
    formatHint: document.getElementById('formatHint'),
    btnBuild: document.getElementById('btnBuild'),
    btnCopy: document.getElementById('btnCopy'),
    btnReset: document.getElementById('btnReset'),
    out: document.getElementById('out'),
    chips: document.getElementById('ingredientsChips')
  };

  /**
   * localStorageで利用するキー
   * @type {string}
   */
  const STORAGE_KEY = 'recipe_prompt_maker_v1';

  /**
   * 機材リストを画面に描画する
   * @param {Object} saved 保存済みの状態データ
   */
  const renderEquipList = (saved) => {
    els.equipList.innerHTML = '';
    DEFAULT_EQUIP.forEach(name => {
      const id = 'eq_' + name;
      const wrap = document.createElement('label');
      wrap.className = 'equip-item';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = name;
      cb.id = id;
      if(saved && saved.equip && saved.equip.includes(name)) cb.checked = true;
      const span = document.createElement('span');
      span.textContent = name;
      wrap.appendChild(cb); wrap.appendChild(span);
      els.equipList.appendChild(wrap);
    });
  }

  /**
   * カンマ区切りの文字列を配列に変換
   * @param {string} s
   * @returns {string[]}
   */
  const parseCSV = (s) => {
    return (s||'')
      .split(',')
      .map(v=>v.trim())
      .filter(Boolean);
  }

  /**
   * 配列の重複を除去
   * @param {Array} arr
   * @returns {Array}
   */
  const uniq = (arr) => {
    return [...new Set(arr.filter(Boolean))];
  }

  /**
   * 材料リストをチップ表示に変換する
   */
  const ingredientsToChips = () => {
      els.chips.innerHTML = '';
      parseCSV(els.ingredients.value).forEach(x=>{
        const tag = document.createElement('span');
        tag.className = 'chip';
        tag.textContent = x;
        els.chips.appendChild(tag);
      })
  }

  /**
   * 現在のフォーム状態を取得する
   * @returns {Object}
   */
  const getState = () => {
    const selectedEquip = [...els.equipList.querySelectorAll('input[type="checkbox"]:checked')].map(e=>e.value);
    const extra = parseCSV(els.equipExtra.value);
    const equip = uniq([...selectedEquip, ...extra]);
    return {
      equip,
      adults: +els.adults.value||0,
      kids: +els.kids.value||0,
      mealCount: +els.mealCount.value||1,
      targetMin: +els.targetMin.value||60,
      ingredients: parseCSV(els.ingredients.value),
      notes: els.notes.value.trim(),
      formatHint: els.formatHint.value,
      out: els.out.value
    }
  }

  /**
   * フォーム状態をセットする
   * @param {Object} s
   */
  const setState = (s) => {
    els.equipExtra.value = (s.equip||[]).filter(x=>!DEFAULT_EQUIP.includes(x)).join(', ');
    els.adults.value = s.adults ?? 2;
    els.kids.value = s.kids ?? 0;
    els.mealCount.value = s.mealCount ?? 3;
    els.targetMin.value = s.targetMin ?? 60;
    els.ingredients.value = (s.ingredients||[]).join(', ');
    els.notes.value = s.notes || '';
    els.formatHint.value = s.formatHint || defaultFormatHint();
    els.out.value = s.out || '';
    renderEquipList(s);
    ingredientsToChips();
  }

  /**
   * 現在の状態をlocalStorageに保存する
   */
  const save = () => {
    const state = getState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /**
   * localStorageから状態を読み込む
   * @returns {Object|null}
   */
  const load = () => {
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(e){ return null }
  }

  /**
   * デフォルトの出力フォーマットヒントを返す
   * @returns {string}
   */
  const defaultFormatHint = () => {
    return [
      '出力は次の順番・見出しで日本語でお願いします：',
      '1) まとめ（全体像・所要時間・洗い物の目安）',
      '2) 買い足すと良いもの（任意）',
      '3) 一度に作る段取り（分刻みのタイムライン）',
      '4) レシピ一覧（各レシピの材料・手順・保存方法）',
      '5) 余った材料の活用案',
      '6) 後片付けと保存のコツ',
      '※ 分量は大人=1.0, 子ども=0.6 係数で概算して明記してください。',
      '※ 家に無い機材は使わないでください。代替案があれば併記。',
      '※ 食事回数分の作りおき・リメイク前提で、再加熱手順も書いてください。'
    ].join('\n');
  }

  /**
   * プロンプトを生成し出力エリアに反映する
   */
  const buildPrompt = () => {
    const s = getState();
    const equipText = s.equip.length ? s.equip.join('、') : '一般的な家庭用調理器具';
    const ingText = s.ingredients.length ? s.ingredients.join('、') : '特に指定なし（家にある一般的な調味料と食材）';

    const base = [
      `以下の条件で、料理の計画とレシピを提案してください。`,
      `\n【前提】`,
      `・使用可能な機材：${equipText}。`,
      `・人数：大人${s.adults}人、子ども${s.kids}人。`,
      `・目標調理時間：一連の作業を ${s.targetMin} 分以内で完了。`,
      `・食事回数：${s.mealCount} 回分（作り置き/リメイク含む）。`,
      `・現在ある主な材料：${ingText}。`,
      s.notes ? `・備考：${s.notes}` : '',
      `\n【要望】`,
      `・最初に各レシピの分量（大人係数1.0、子ども0.6で計算）を明記してください。`,
      `・工程は同時並行で効率良く。洗い物が少なくなる順序で。`,
      `・保存方法（冷蔵/冷凍/日持ち目安）と再加熱手順を記載。`,
      `・不足食材があれば代替案を併記してください。`,
      `\n【出力フォーマット】\n${s.formatHint || defaultFormatHint()}`
    ].filter(Boolean).join('\n');

    els.out.value = base;
    save();
  }

  // Events
  ['input','change'].forEach(ev=>{
    ['equipExtra','adults','kids','mealCount','targetMin','ingredients','notes','formatHint','out']
      .forEach(id=> els[id].addEventListener(ev, ()=>{ ingredientsToChips(); save(); }));
  });
  els.btnBuild.addEventListener('click', buildPrompt);

  els.btnCopy.addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(els.out.value || '');
      toast('コピーしました');
    }catch(e){ toast('コピーに失敗しました…'); }
  });

  els.btnReset.addEventListener('click', ()=>{
    localStorage.removeItem(STORAGE_KEY);
    setState({});
    toast('保存内容を削除しました');
  });

  /**
   * 画面右下にトースト（通知）を表示する
   * @param {string} msg
   */
  const toast = (msg) => {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.position='fixed'; t.style.bottom='20px'; t.style.left='50%'; t.style.transform='translateX(-50%)';
    t.style.background='#111827'; t.style.border='1px solid #1f2937'; t.style.padding='10px 14px'; t.style.borderRadius='12px'; t.style.boxShadow='0 10px 30px rgba(0,0,0,.35)';
    t.style.color='#e5e7eb'; t.style.zIndex='9999';
    document.body.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .35s'; }, 1200);
    setTimeout(()=> t.remove(), 1700);
  }

  // Init
  (function init(){
    const saved = load();
    renderEquipList(saved);
    setState(saved || {});
    if(!saved){ els.formatHint.value = defaultFormatHint(); }
    ingredientsToChips();
  })();
})();
