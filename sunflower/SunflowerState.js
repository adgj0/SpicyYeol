const SunflowerState = {
  fert: 0,          // 해바라기에 준 비료
  inventory: 0,     // 보유 비료 (아직 안 준 것)
  moodIdx: 0,
  log: [],

  get stageIdx() {
    return getStageIndex(this.fert);
  },

  // 비료 인벤토리에 추가 — 할일 완료 시 호출
  earnFertilizer(n, reason) {
    this.inventory += n;
    this.log.unshift(`+비료 ${n}개 획득 (${reason})`);
    if (this.log.length > 10) this.log.pop();
    SunflowerPanel.refresh();
    SunflowerNavIcon.refresh();
  },

  // 해바라기에 비료 주기 — 패널에서 버튼 클릭 시 호출
  giveFertilizer(n = 1) {
    if (this.inventory <= 0) return;
    const give = Math.min(n, this.inventory);
    const next = Math.min(this.fert + give, 14);
    const given = next - this.fert;
    this.fert = next;
    this.inventory -= given;
    this.log.unshift(`비료 ${given}개 줌 🌻`);
    if (this.log.length > 10) this.log.pop();
    SunflowerPanel.refresh();
    SunflowerNavIcon.refresh();
  },

  // 할일 완료 시 호출
  // daysLeft: 마감까지 남은 일수
  // wasProcrastinated: 미뤘던 일 여부
  onTaskComplete(daysLeft, wasProcrastinated = false) {
    if (daysLeft >= 7) this.earnFertilizer(3, "7일 전 완료");
    else               this.earnFertilizer(1, "기한 내 완료");
    if (wasProcrastinated) this.earnFertilizer(1, "미뤘던 일 완료");
  },

  // 가장 급한 일정 D-Day 기준으로 표정 업데이트
  updateMoodFromDDay(daysLeft) {
    this.moodIdx = getMoodIndex(daysLeft);
    SunflowerPanel.refresh();
    SunflowerNavIcon.refresh();
  },
};

/*
  ── 연동 방법 (script.js에서) ──────────────────────────

  할일 완료 시:
  const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / 86400000);
  SunflowerState.onTaskComplete(daysLeft, task.wasProcrastinated);

  ────────────────────────────────────────────────────────
*/
