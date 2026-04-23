"use strict";

const SPOTS = [
  { id: "takachiho", name: "高千穂峡", area: "高千穂町", icon: "🏞️" },
  { id: "amanoiwato", name: "天岩戸神社", area: "高千穂町", icon: "⛩️" },
  { id: "miyazakijingu", name: "宮崎神宮", area: "宮崎市", icon: "🌳" },
  { id: "aoshima", name: "青島神社", area: "宮崎市", icon: "🌴" },
  { id: "udo", name: "鵜戸神宮", area: "日南市", icon: "🌊" },
  { id: "sunmesse", name: "サンメッセ日南", area: "日南市", icon: "🗿" },
  { id: "toi", name: "都井岬", area: "串間市", icon: "🐎" },
  { id: "saitobaru", name: "西都原古墳群", area: "西都市", icon: "🌸" },
  { id: "ayabridge", name: "綾の照葉大吊橋", area: "綾町", icon: "🌉" },
  { id: "ebino", name: "えびの高原", area: "えびの市", icon: "🏔️" },
];

const RALLY_START = new Date("2026-05-01T00:00:00+09:00");
const RALLY_END = new Date("2026-05-30T23:59:59+09:00");
const STORAGE_KEY = "miyazaki-stamp-rally/v1";

const state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { stamps: {}, prizeCode: null };
    const parsed = JSON.parse(raw);
    return {
      stamps: parsed.stamps ?? {},
      prizeCode: parsed.prizeCode ?? null,
    };
  } catch {
    return { stamps: {}, prizeCode: null };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function now() {
  return new Date();
}

function isWithinPeriod(date = now()) {
  return date >= RALLY_START && date <= RALLY_END;
}

function formatStampedAt(iso) {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hh}:${mm} にスタンプ取得`;
}

function generatePrizeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "MGO-";
  for (let i = 0; i < 8; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function updatePeriodBanner() {
  const banner = document.getElementById("period-banner");
  const today = now();
  if (today < RALLY_START) {
    const days = Math.ceil((RALLY_START - today) / (1000 * 60 * 60 * 24));
    banner.textContent = `開催まであと ${days} 日 — 5月1日スタート!`;
    banner.hidden = false;
  } else if (today > RALLY_END) {
    banner.textContent = "本年度の開催は終了しました。ご参加ありがとうございました!";
    banner.hidden = false;
  } else {
    banner.hidden = true;
  }
}

function render() {
  const list = document.getElementById("spot-list");
  list.innerHTML = "";

  const active = isWithinPeriod();

  SPOTS.forEach((spot) => {
    const stampedAt = state.stamps[spot.id];
    const li = document.createElement("li");
    li.className = "spot" + (stampedAt ? " stamped" : "");

    const icon = document.createElement("div");
    icon.className = "spot-icon";
    icon.textContent = spot.icon;

    const body = document.createElement("div");
    body.className = "spot-body";
    const h3 = document.createElement("h3");
    h3.textContent = spot.name;
    const area = document.createElement("p");
    area.textContent = spot.area;
    body.appendChild(h3);
    body.appendChild(area);

    if (stampedAt) {
      const ts = document.createElement("span");
      ts.className = "stamped-at";
      ts.textContent = formatStampedAt(stampedAt);
      body.appendChild(ts);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "stamp-btn" + (stampedAt ? " done" : "");
    btn.textContent = stampedAt ? "済" : "スタンプ";
    btn.disabled = Boolean(stampedAt) || !active;
    btn.addEventListener("click", () => handleStamp(spot.id));

    li.appendChild(icon);
    li.appendChild(body);
    li.appendChild(btn);
    list.appendChild(li);
  });

  const collected = Object.keys(state.stamps).length;
  document.getElementById("collected").textContent = String(collected);
  document.getElementById("total").textContent = String(SPOTS.length);
  document.getElementById("progress-fill").style.width = `${
    (collected / SPOTS.length) * 100
  }%`;
}

function handleStamp(spotId) {
  if (!isWithinPeriod()) {
    alert("スタンプは開催期間(5/1〜5/30)のみ取得できます。");
    return;
  }
  if (state.stamps[spotId]) return;

  state.stamps[spotId] = new Date().toISOString();
  saveState();
  render();

  if (Object.keys(state.stamps).length === SPOTS.length) {
    if (!state.prizeCode) {
      state.prizeCode = generatePrizeCode();
      saveState();
    }
    openPrizeDialog();
  }
}

function openPrizeDialog() {
  const dlg = document.getElementById("prize-dialog");
  document.getElementById("prize-code").textContent = state.prizeCode ?? "";
  if (typeof dlg.showModal === "function") {
    dlg.showModal();
  } else {
    alert(
      `コンプリート!マンゴー引換券コード: ${state.prizeCode}\n(2026年6月15日まで有効)`,
    );
  }
}

function handleReset() {
  if (!confirm("スタンプと引換券コードをすべてリセットしますか?")) return;
  state.stamps = {};
  state.prizeCode = null;
  saveState();
  render();
}

document.getElementById("reset-btn").addEventListener("click", handleReset);
document.getElementById("close-dialog").addEventListener("click", () => {
  document.getElementById("prize-dialog").close();
});

updatePeriodBanner();
render();

if (
  Object.keys(state.stamps).length === SPOTS.length &&
  state.prizeCode
) {
  openPrizeDialog();
}
