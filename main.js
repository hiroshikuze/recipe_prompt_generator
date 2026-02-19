"use strict";

(function(){
  /**
   * 多言語リソース
   */
  const I18N = {
    ja: {
      equipment: {
        hotcook: "ホットクック",
        healsio: "ヘルシオウォーターオーブン",
        gas_stove: "ガスコンロ",
        gas_oven: "ガスオーブン",
        rice_cooker: "炊飯器",
        microwave: "電子レンジ",
        frying_pan: "フライパン",
        pot: "鍋",
        toaster: "トースター",
        electric_pressure_cooker: "電気圧力鍋"
      },
      prompt: {
        default_equip: "一般的な家庭用調理器具",
        default_ingredients: "特に指定なし（家にある一般的な調味料と食材）",
        delimiter: "、",
        intro: "以下の条件で、料理の計画とレシピを提案してください。",
        headers: { premise: "【前提】", requests: "【要望】", format: "【出力フォーマット】" },
        premise: {
          equip: "・使用可能な機材：{{equip}}。",
          people: "・人数：大人{{adults}}人、子ども{{kids}}人。",
          time: "・目標調理時間：一連の作業を {{targetMin}} 分以内で完了。",
          meal_count: "・食事回数：{{mealCount}} 回分（作り置き/リメイク含む）。",
          ingredients: "・現在ある主な材料：{{ingredients}}。",
          notes: "・備考：{{notes}}"
        },
        requests: {
          portions: "・最初に各レシピの分量（大人係数1.0、子ども0.6で計算）を明記してください。",
          efficiency: "・工程は同時並行で効率良く。洗い物が少なくなる順序で。",
          storage: "・保存方法（冷蔵/冷凍/日持ち目安）と再加熱手順を記載。",
          substitutes: "・不足食材があれば代替案を併記してください。"
        }
      },
      format_hint: {
        intro: "出力は次の順番・見出しで日本語でお願いします：",
        sections: [
          "1) まとめ（全体像・所要時間・洗い物の目安）",
          "2) 買い足すと良いもの（任意）",
          "3) 一度に作る段取り（分刻みのタイムライン）",
          "4) レシピ一覧（各レシピの材料・手順・保存方法）",
          "5) 余った材料の活用案",
          "6) 後片付けと保存のコツ"
        ],
        notes: [
          "※ 分量は大人=1.0, 子ども=0.6 係数で概算して明記してください。",
          "※ 家に無い機材は使わないでください。代替案があれば併記。",
          "※ 食事回数分の作りおき・リメイク前提で、再加熱手順も書いてください。"
        ]
      },
      toast: { copy_success: "コピーしました", copy_fail: "コピーに失敗しました…", prompt_empty: "プロンプトが空です", perplexity_fail: "Perplexityを開くことに失敗しました" }
    },
    en: {
      equipment: {
        hotcook: "Hot Cook",
        healsio: "Healsio Water Oven",
        gas_stove: "Gas Stove",
        gas_oven: "Gas Oven",
        rice_cooker: "Rice Cooker",
        microwave: "Microwave",
        frying_pan: "Frying Pan",
        pot: "Pot",
        toaster: "Toaster",
        electric_pressure_cooker: "Electric Pressure Cooker"
      },
      prompt: {
        default_equip: "Standard household cookware",
        default_ingredients: "No specific preference (common household seasonings and ingredients)",
        delimiter: ", ",
        intro: "Please propose a meal plan and recipes based on the following conditions.",
        headers: { premise: "[Premise]", requests: "[Requests]", format: "[Output Format]" },
        premise: {
          equip: "- Available Equipment: {{equip}}.",
          people: "- People: {{adults}} adults, {{kids}} children.",
          time: "- Target Cooking Time: Complete all tasks within {{targetMin}} minutes.",
          meal_count: "- Number of Meals: {{mealCount}} meals (including meal prep/remakes).",
          ingredients: "- Main Ingredients Available: {{ingredients}}.",
          notes: "- Notes: {{notes}}"
        },
        requests: {
          portions: "- First, specify the portion sizes for each recipe (calculate with Adult factor 1.0, Child 0.6).",
          efficiency: "- Plan steps for parallel efficiency. Order tasks to minimize dishwashing.",
          storage: "- Include storage methods (fridge/freezer/shelf life) and reheating instructions.",
          substitutes: "- List alternatives if ingredients are missing."
        }
      },
      format_hint: {
        intro: "Please output in the following order and headings in English:",
        sections: [ "1) Summary (Overview, Time required, Dishwashing estimate)", "2) Items to buy (Optional)", "3) Step-by-step Workflow (Minute-by-minute timeline)", "4) Recipe List (Ingredients, Steps, Storage for each)", "5) Ideas for leftover ingredients", "6) Cleanup and Storage Tips" ],
        notes: [ "* Estimate portions with Adult=1.0, Child=0.6 coefficients.", "* Do not use equipment not listed. List alternatives if any.", "* Assume meal prep/remakes for the number of meals, and include reheating steps." ]
      },
      toast: { copy_success: "Copied!", copy_fail: "Failed to copy...", prompt_empty: "Prompt is empty", perplexity_fail: "Failed to open Perplexity" }
    }
  };

  /**
   * デフォルトの調理機材キーリスト
   * @type {string[]}
   */
  const EQUIP_KEYS = [
    "hotcook","healsio","gas_stove","gas_oven","rice_cooker",
    "microwave","frying_pan","pot","toaster","electric_pressure_cooker"
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
    btnOpenPerplexity: document.getElementById('btnOpenPerplexity'),
    out: document.getElementById('out'),
    chips: document.getElementById('ingredientsChips')
  };

  /**
   * 現在の言語設定を取得 (htmlタグのlang属性)
   * @type {string}
   */
  const currentLang = document.documentElement.lang === 'en' ? 'en' : 'ja';
  const t = I18N[currentLang];

  /**
   * プロンプト出力後のアクションボタン（コピー、Perplexityで開く）の表示を切り替える
   */
  const updateActionButtonsVisibility = () => {
    const hasPrompt = els.out.value && els.out.value.trim() !== '';
    els.btnCopy.style.display = hasPrompt ? '' : 'none';
    els.btnOpenPerplexity.style.display = hasPrompt ? '' : 'none';
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
    EQUIP_KEYS.forEach(key => {
      const id = 'eq_' + key;
      const wrap = document.createElement('label');
      wrap.className = 'equip-item';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = key;
      cb.id = id;
      if(saved && saved.equip && saved.equip.includes(key)) cb.checked = true;
      const span = document.createElement('span');
      span.textContent = t.equipment[key] || key;
      wrap.appendChild(cb); wrap.appendChild(span);
      els.equipList.appendChild(wrap);
    });
  }

  /**
   * カンマやスペースなどの区切りの文字列を配列に変換
   * @param {string} s
   * @returns {string[]}
   */
  const parseList = (s) => {
    return (s||'')
      .split(/[\s,、　]+/)
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
      parseList(els.ingredients.value).forEach(x=>{
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
    const selectedEquip = [...els.equipList.querySelectorAll('input[type="checkbox"]:checked')].map(e=>e.value); // keys
    const extra = parseList(els.equipExtra.value);
    const equip = uniq([...selectedEquip, ...extra]);
    return {
      equip,
      adults: +els.adults.value||0,
      kids: +els.kids.value||0,
      mealCount: +els.mealCount.value||1,
      targetMin: +els.targetMin.value||60,
      ingredients: parseList(els.ingredients.value),
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
    els.equipExtra.value = (s.equip||[]).filter(x=>!EQUIP_KEYS.includes(x)).join(', ');
    els.adults.value = s.adults ?? 2;
    els.kids.value = s.kids ?? 0;
    els.mealCount.value = s.mealCount ?? 3;
    els.targetMin.value = s.targetMin ?? 30;
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
      const data = JSON.parse(raw);
      
      // 互換性対応: 古い日本語の機材名が保存されている場合、キーに変換する
      if (data && data.equip && data.equip.length > 0) {
        data.equip = data.equip.map(item => {
          // 既にキーならそのまま
          if (EQUIP_KEYS.includes(item)) return item;
          // 日本語名からキーを探す (ja.jsonのvalueと一致するか)
          const entry = Object.entries(I18N.ja.equipment).find(([k, v]) => v === item);
          return entry ? entry[0] : item;
        });
      }
      
      return data;
    }catch(e){ return null }
  }

  /**
   * デフォルトの出力フォーマットヒントを返す
   * @returns {string}
   */
  const defaultFormatHint = () => {
    return [
      t.format_hint.intro,
      ...t.format_hint.sections,
      ...t.format_hint.notes
    ].join('\n');
  }

  /**
   * プロンプトを生成し出力エリアに反映する
   */
  const buildPrompt = () => {
    const p = t.prompt;
    const s = getState();
    
    // 機材リストを名称に変換
    const equipNames = s.equip.map(key => t.equipment[key] || key);
    const equipText = equipNames.length ? equipNames.join(p.delimiter) : p.default_equip;
    const ingText = s.ingredients.length ? s.ingredients.join(p.delimiter) : p.default_ingredients;

    const replaceVars = (str, vars) => str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k]);

    const base = [
      p.intro,
      `\n${p.headers.premise}`,
      replaceVars(p.premise.equip, { equip: equipText }),
      replaceVars(p.premise.people, { adults: s.adults, kids: s.kids }),
      replaceVars(p.premise.time, { targetMin: s.targetMin }),
      replaceVars(p.premise.meal_count, { mealCount: s.mealCount }),
      replaceVars(p.premise.ingredients, { ingredients: ingText }),
      s.notes ? replaceVars(p.premise.notes, { notes: s.notes }) : '',
      `\n${p.headers.requests}`,
      p.requests.portions,
      p.requests.efficiency,
      p.requests.storage,
      p.requests.substitutes,
      `\n${p.headers.format}\n${s.formatHint || defaultFormatHint()}`
    ].filter(Boolean).join('\n');

    els.out.value = base;
    updateActionButtonsVisibility();
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
      toast(t.toast.copy_success);
    }catch(e){ toast(t.toast.copy_fail); }
  });

  /**
   * Perplexity AIにプロンプトを送信してブラウザで開く
   */
  els.btnOpenPerplexity.addEventListener('click', () => {
    try {
      const promptText = els.out.value;
      if (promptText && promptText.trim() !== '') {
        const encodedPrompt = encodeURIComponent(promptText);
        const perplexityUrl = `https://www.perplexity.ai/search?q=${encodedPrompt}`;
        window.open(perplexityUrl, '_blank');
      } else {
        toast(t.toast.prompt_empty);
      }
    } catch (e) {
      toast(t.toast.perplexity_fail);
      console.error('Perplexity open error:', e);
    }
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
    updateActionButtonsVisibility();
  })();
})();
