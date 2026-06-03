const SunflowerNavIcon = {
  _btn: null,
  _canvas: null,
  _badge: null,

  // 네비바에 아이콘 삽입 — navbarEl: 아이콘을 넣을 부모 요소
  init(navbarEl) {
    this._btn = document.createElement("button");
    this._btn.title = "해바라기 성장";
    Object.assign(this._btn.style, {
      background: "none", border: "none", cursor: "pointer",
      padding: "4px", borderRadius: "8px",
      position: "relative", display: "inline-flex",
      alignItems: "center", justifyContent: "center",
    });

    this._canvas = createSunflowerCanvas(SunflowerState.stageIdx, SunflowerState.moodIdx, 36);
    this._btn.appendChild(this._canvas);

    this._badge = document.createElement("span");
    Object.assign(this._badge.style, {
      position: "absolute", top: "-2px", right: "-2px",
      background: "#1D9E75", color: "white",
      fontSize: "9px", fontWeight: "700",
      borderRadius: "10px", padding: "1px 4px", lineHeight: "1.4",
    });
    this._badge.textContent = SunflowerState.fert;
    this._btn.appendChild(this._badge);

    this._btn.addEventListener("click", () => SunflowerPanel.open());
    navbarEl.appendChild(this._btn);
  },

  refresh() {
    if (!this._canvas) return;
    refreshCanvas(this._canvas, SunflowerState.stageIdx, SunflowerState.moodIdx);
    this._badge.textContent = SunflowerState.fert;
  },
};
