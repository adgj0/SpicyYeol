const SunflowerState = {
  fert:    0,
  moodIdx: 0,
  log:     [],

  get stageIdx() {
    return getStageIndex(this.fert);
  },

  // 비료 추가 — 외부에서 직접 호출 가능
  addFertilizer(n, reason) {
    const next   = Math.min(this.fert + n, 14);
    const gained = next - this.fert;
    if (gained > 0) {
      this.fert = next;
      this.log.unshift(`+비료 ${gained}개 (${reason})`);
      if (this.log.length > 10) this.log.pop();
    }
    SunflowerPanel.refresh();
    SunflowerNavIcon.refresh();
  },

  // 할일 완료 시 호출
  // daysLeft: 마감까지 남은 일수
  // wasProcrastinated: 미뤘던 일 여부 (true/false)
  onTaskComplete(daysLeft, wasProcrastinated = false) {
    if (daysLeft >= 7) this.addFertilizer(3, "7일 전 완료");
    else               this.addFertilizer(1, "기한 내 완료");
    if (wasProcrastinated) this.addFertilizer(1, "미뤘던 일 완료");
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

  할일 완료 버튼 클릭 시:

  const deadline  = new Date(task.deadline);
  const today     = new Date();
  const daysLeft  = Math.ceil((deadline - today) / 86400000);
  SunflowerState.onTaskComplete(daysLeft, task.wasProcrastinated);

  가장 급한 일정 D-Day 반영 시:
  SunflowerState.updateMoodFromDDay(daysLeft);

  ────────────────────────────────────────────────────────
*/
