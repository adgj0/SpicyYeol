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
      this.log.unshift(`🌻 해바라기 완성! (총 ${this.growCount}개째)`);
      SunflowerPanel.refresh();
      SunflowerNavIcon.refresh();
      setTimeout(() => {
        this.fert = 0;
        localStorage.setItem("sf.fert", this.fert);
        SunflowerPanel.refresh();
        SunflowerNavIcon.refresh();
      }, 3000);
      return;
    }

    SunflowerPanel.refresh();
    SunflowerNavIcon.refresh();
  },

  onTaskComplete(daysLeft, wasProcrastinated = false) {
    if (daysLeft >= 7)      this.earnFertilizer(3, "7일 전 완료");
    else if (daysLeft >= 1) this.earnFertilizer(2, "하루 전 완료");
    else if (daysLeft === 0) this.earnFertilizer(2, "당일 완료");
    else                    this.earnFertilizer(1, "마감 후 완료");
    if (wasProcrastinated) this.earnFertilizer(1, "미뤘던 일 완료");
  },

  updateMoodFromDDay(daysLeft) {
    this.moodIdx = getMoodIndex(daysLeft);
    SunflowerPanel.refresh();
    SunflowerNavIcon.refresh();
  },
};

SunflowerState.tasks = [
  { id: 1, title: "Docker 시험 공부", deadline: "2026-06-10" },
  { id: 2, title: "OSS 과제 제출", deadline: "2026-06-07" },
  { id: 3, title: "GitHub 실습 복습", deadline: "2026-06-08" },
  { id: 4, title: "발표자료 수정", deadline: "2026-06-15" },
  { id: 5, title: "논문계획서 정리", deadline: "2026-06-20" },
];

SunflowerState.getDaysLeft = function(deadline) {
  const today = new Date();
  const due = new Date(deadline);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return Math.ceil((due - today) / 86400000);
};

SunflowerState.getDdayText = function(daysLeft) {
  if (daysLeft > 0) return `D-${daysLeft}`;
  if (daysLeft === 0) return "D-Day";
  return `D+${Math.abs(daysLeft)}`;
};

SunflowerState.getUrgencyColor = function(daysLeft) {
  if (daysLeft > 7) return "#333333";
  if (daysLeft <= 0) return "#cc0000";

  const ratio = (7 - daysLeft) / 7;
  const start = [51, 51, 51];
  const end = [204, 0, 0];

  const r = Math.round(start[0] + (end[0] - start[0]) * ratio);
  const g = Math.round(start[1] + (end[1] - start[1]) * ratio);
  const b = Math.round(start[2] + (end[2] - start[2]) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
};

SunflowerState.getSortedTasks = function() {
  return [...this.tasks].sort((a, b) => {
    const daysA = this.getDaysLeft(a.deadline);
    const daysB = this.getDaysLeft(b.deadline);

    const urgentA = daysA <= 3 ? 0 : 1;
    const urgentB = daysB <= 3 ? 0 : 1;

    if (urgentA !== urgentB) return urgentA - urgentB;

    return daysA - daysB;
  });
};

SunflowerState.updateMoodForUrgentTodo = function() {
  const urgentTask = this.getSortedTasks()[0];

  if (!urgentTask) return;

  const daysLeft = this.getDaysLeft(urgentTask.deadline);

  this.updateMoodFromDDay(daysLeft);
};