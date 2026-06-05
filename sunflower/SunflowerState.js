const SunflowerState = {
  fert: parseInt(localStorage.getItem("sf.fert") || "0"),
  inventory: parseInt(localStorage.getItem("sf.inventory") || "0"),
  growCount: parseInt(localStorage.getItem("sf.growCount") || "0"),
  moodIdx: 0,
  log: [],

  get stageIdx() {
    return getStageIndex(this.fert);
  },

  earnFertilizer(n, reason) {
    this.inventory += n;
    localStorage.setItem("sf.inventory", this.inventory);
    this.log.unshift(`+비료 ${n}개 획득 (${reason})`);
    if (this.log.length > 10) this.log.pop();
    SunflowerPanel.refresh();
    SunflowerNavIcon.refresh();
  },

  giveFertilizer(n = 1) {
    if (this.inventory <= 0) return;
    const give = Math.min(n, this.inventory);
    const next = Math.min(this.fert + give, 14);
    const given = next - this.fert;
    this.fert = next;
    this.inventory -= given;
    localStorage.setItem("sf.fert", this.fert);
    localStorage.setItem("sf.inventory", this.inventory);
    this.log.unshift(`비료 ${given}개 줌 🌻`);
    if (this.log.length > 10) this.log.pop();

    if (this.fert >= 14) {
      this.growCount += 1;
      localStorage.setItem("sf.growCount", this.growCount);
      this.fert = 0;
      localStorage.setItem("sf.fert", this.fert);
      this.log.unshift(`🌻 해바라기 완성! (총 ${this.growCount}개째)`);
    }

    SunflowerPanel.refresh();
    SunflowerNavIcon.refresh();
  },

  onTaskComplete(daysLeft, wasProcrastinated = false) {
    if (daysLeft >= 7) this.earnFertilizer(3, "7일 전 완료");
    else               this.earnFertilizer(1, "기한 내 완료");
    if (wasProcrastinated) this.earnFertilizer(1, "미뤘던 일 완료");
  },

  updateMoodFromDDay(daysLeft) {
    this.moodIdx = getMoodIndex(daysLeft);
    SunflowerPanel.refresh();
    SunflowerNavIcon.refresh();
  },
};