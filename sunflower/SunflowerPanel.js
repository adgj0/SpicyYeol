const SunflowerPanel = {
  _panel:  null,
  _dim:    null,
  _isOpen: false,

  init() {
    this._dim = document.createElement("div");
    Object.assign(this._dim.style, {
      position: "fixed", inset: "0",
      background: "rgba(0,0,0,0.18)",
      zIndex: "1000", display: "none",
    });
    this._dim.addEventListener("click", () => this.close());
    document.body.appendChild(this._dim);

    this._panel = document.createElement("div");
    Object.assign(this._panel.style, {
      position: "fixed", top: "0", right: "0", bottom: "0",
      width: "320px", background: "#fffdf8",
      boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
      transform: "translateX(100%)",
      transition: "transform 0.28s cubic-bezier(.4,0,.2,1)",
      zIndex: "1001", overflowY: "auto",
      fontFamily: "sans-serif", display: "flex", flexDirection: "column",
    });
    document.body.appendChild(this._panel);
    this._buildContent();
  },

  _buildContent() {
    this._panel.innerHTML = "";
    const s = SunflowerState;
    const stage = STAGES[s.stageIdx];
    const mood  = MOODS[s.moodIdx];

    // 헤더
    const header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 20px 12px", borderBottom: "0.5px solid #e8e4da",
    });
    header.innerHTML = `
      <div>
        <div style="font-weight:600;font-size:16px;color:#3a2e10">나의 해바라기</div>
        <div style="font-size:12px;color:#999;margin-top:2px">${stage.name} · 비료 ${s.fert}/14개 · 🌻 ${s.growCount}개 완성</div>
      </div>
      <button id="sf-close-btn" style="background:none;border:none;cursor:pointer;font-size:20px;color:#aaa">✕</button>
    `;
    this._panel.appendChild(header);
    header.querySelector("#sf-close-btn").addEventListener("click", () => this.close());

    // 메인 해바라기
    const main = document.createElement("div");
    Object.assign(main.style, {
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "24px 20px 16px", background: "#EAF3DE",
    });
    const mainCanvas = createSunflowerCanvas(s.stageIdx, s.moodIdx, 120);
    main.appendChild(mainCanvas);
    const stageLabel = document.createElement("div");
    stageLabel.style.cssText = "margin-top:10px;font-weight:600;font-size:17px;color:#2e4a0e";
    stageLabel.textContent = stage.name;
    main.appendChild(stageLabel);

    const moodBadge = document.createElement("div");
    moodBadge.style.cssText = `margin-top:6px;font-size:12px;font-weight:500;background:${mood.bg};color:${mood.color};padding:3px 12px;border-radius:20px`;
    moodBadge.textContent = `${mood.text} · ${mood.label}`;
    main.appendChild(moodBadge);

this._panel.appendChild(main);

    // ✅ 인벤토리 & 비료 주기 버튼
    const inv = document.createElement("div");
    inv.style.padding = "16px 20px 0";
    inv.innerHTML = `
      <div style="font-size:12px;color:#888;margin-bottom:8px">보유 비료</div>
      <div style="display:flex;align-items:center;gap:12px;background:#f5f5f0;border-radius:10px;padding:12px 14px">
        <div style="font-size:24px">🌿</div>
        <div>
          <div style="font-size:20px;font-weight:700;color:#1D9E75">${s.inventory}개</div>
          <div style="font-size:11px;color:#888">보유 중</div>
        </div>
        <button id="sf-give-btn" style="
          margin-left:auto;
          background:${s.inventory > 0 ? '#1D9E75' : '#ddd'};
          color:white;border:none;border-radius:8px;
          padding:8px 14px;font-size:13px;cursor:${s.inventory > 0 ? 'pointer' : 'not-allowed'};
        ">비료 주기</button>
      </div>
    `;
    this._panel.appendChild(inv);
    const giveBtn = inv.querySelector("#sf-give-btn");
    if (s.inventory > 0) {
      giveBtn.addEventListener("click", () => {
        SunflowerState.giveFertilizer(1);
      });
    }

    // 비료 게이지
    const gauge = document.createElement("div");
    gauge.style.padding = "16px 20px 0";
    const dots = Array.from({ length: 14 }).map((_, i) => `
      <div style="width:18px;height:18px;border-radius:50%;
        background:${i < s.fert ? "#1D9E75" : "#ddd"};
        display:flex;align-items:center;justify-content:center;
        font-size:9px;color:white;transition:background .3s">
        ${i < s.fert ? "✿" : ""}
      </div>
    `).join("");
    gauge.innerHTML = `
      <div style="font-size:12px;color:#888;margin-bottom:8px">해바라기 비료 현황</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">${dots}</div>
      <div style="height:6px;border-radius:3px;background:#ddd;overflow:hidden">
        <div style="height:100%;border-radius:3px;background:#1D9E75;width:${(s.fert/14)*100}%;transition:width .5s ease"></div>
      </div>
      <div style="font-size:11px;color:#1D9E75;margin-top:4px;text-align:right">${s.fert} / 14</div>
    `;
    this._panel.appendChild(gauge);

    // 성장 단계
    const stageRow = document.createElement("div");
    stageRow.style.padding = "16px 20px 0";
    const stageWrap = document.createElement("div");
    Object.assign(stageWrap.style, { display: "flex", gap: "5px" });
    STAGES.forEach((st, i) => {
      const card = document.createElement("div");
      Object.assign(card.style, {
        flex: "1", border: i === s.stageIdx ? "1.5px solid #1D9E75" : "0.5px solid #ddd",
        borderRadius: "10px", padding: "6px 2px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
        background: i === s.stageIdx ? "#E1F5EE" : "white",
      });
      const c = createSunflowerCanvas(i, 0, 38);
      card.appendChild(c);
      const label = document.createElement("div");
      label.style.cssText = `font-size:9px;color:${i === s.stageIdx ? "#1D9E75" : "#888"}`;
      label.textContent = st.name;
      card.appendChild(label);
      stageWrap.appendChild(card);
    });
    stageRow.innerHTML = `<div style="font-size:12px;color:#888;margin-bottom:8px">성장 단계</div>`;
    stageRow.appendChild(stageWrap);
    this._panel.appendChild(stageRow);

    // 비료 획득 방법
    const guide = document.createElement("div");
    guide.style.padding = "16px 20px 0";
    guide.innerHTML = `
      <div style="font-size:12px;color:#888;margin-bottom:8px">비료 획득 방법</div>
      <div style="background:#f5f5f0;border-radius:10px;padding:10px 14px;font-size:12px;color:#555;line-height:1.8">
        <div>🌿 7일 전 완료 → <strong>+3개</strong></div>
        <div>✅ 당일/하루 전 완료 → <strong>+2개</strong></div>
        <div>🔄 마감 후 완료 → <strong>+1개</strong></div>
      </div>
    `;
    this._panel.appendChild(guide);

    // 이벤트 로그
    if (s.log.length > 0) {
      const logEl = document.createElement("div");
      logEl.style.padding = "16px 20px 24px";
      const items = s.log.map(l => `<div style="font-size:12px;color:#555;padding:2px 0">• ${l}</div>`).join("");
      logEl.innerHTML = `
        <div style="font-size:12px;color:#888;margin-bottom:8px">최근 이벤트</div>
        <div style="background:#f9f9f7;border-radius:10px;padding:10px 14px">${items}</div>
      `;
      this._panel.appendChild(logEl);
    }
  },

  refresh() {
    if (this._isOpen) this._buildContent();
  },

  open() {
    this._buildContent();
    this._dim.style.display = "block";
    this._panel.style.transform = "translateX(0)";
    this._isOpen = true;
  },

  close() {
    this._dim.style.display = "none";
    this._panel.style.transform = "translateX(100%)";
    this._isOpen = false;
  },
};
