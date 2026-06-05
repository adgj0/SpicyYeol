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
    else this.earnFertilizer(1, "기한 내 완료");
    if (wasProcrastinated) this.earnFertilizer(1, "미뤘던 일 완료");
  },

  // 가장 급한 일정 D-Day 기준으로 표정 업데이트
  updateMoodFromDDay(daysLeft) {
    this.moodIdx = getMoodIndex(daysLeft);
    SunflowerPanel.refresh();
    SunflowerNavIcon.refresh();
  },
};

// =========================
// 체크리스트 D-Day 기능
// =========================

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