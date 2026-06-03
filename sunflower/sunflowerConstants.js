const STAGES = [
  { name: "씨앗",     minFert: 0  },
  { name: "새싹",     minFert: 2  },
  { name: "줄기",     minFert: 5  },
  { name: "꽃봉오리", minFert: 9  },
  { name: "만개",     minFert: 14 },
];

const MOODS = [
  { label: "7일 전 이상", color: "#639922", bg: "#EAF3DE", text: "행복" },
  { label: "3일 전",      color: "#854F0B", bg: "#FAEEDA", text: "긴장" },
  { label: "하루 전",     color: "#993C1D", bg: "#FAECE7", text: "초조" },
  { label: "마감 지남",   color: "#A32D2D", bg: "#FCEBEB", text: "시듦" },
];

function getStageIndex(fert) {
  return STAGES.reduce((acc, s, i) => (fert >= s.minFert ? i : acc), 0);
}

function getMoodIndex(daysLeft) {
  if (daysLeft > 7)  return 0;
  if (daysLeft > 3)  return 1;
  if (daysLeft > 0)  return 2;
  return 3;
}
