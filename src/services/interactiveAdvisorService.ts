/**
 * 대화형 AI 인터랙티브 은퇴 어드바이저 서비스 (Interactive Advisor Service)
 * 사용자 연금 자산 프로필 컨텍스트 생성 및 빠른 추천 질문 칩 제공
 */

export interface UserPensionContextBrief {
  currentAge: number;
  retirementAge: number;
  yearsToRetirement: number;
  targetMonthlySpending: number; // 만원
  minMonthlySpending: number; // 만원
  monthlyNationalPension: number; // 만원
  retirementPensionSavings: number; // 만원
  personalPensionSavings: number; // 만원
  liquidAssets: number; // 만원 (비연금 금융자산)
  realEstateAssets: number; // 만원
  hasSpouse: boolean;
  selectedStrategy: string; // S0 ~ S4
}

export interface InteractiveChatMessage {
  id: string;
  sender: "user" | "advisor";
  text: string;
  recommendedTool?: {
    id: string;
    name: string;
    icon: string;
  };
  keyTakeaway?: string;
  timestamp: string;
}

export interface SuggestedPrompt {
  id: string;
  label: string;
  question: string;
  targetToolId?: string;
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: "p-1",
    label: "💎 ISA 만기 자금 연금계좌 이전",
    question: "내 상황에서 ISA 만기 자금을 연금저축/IRP로 이전하면 세액공제와 절세 혜택이 얼마나 큰가요?",
    targetToolId: "ISA_TRANSFER",
  },
  {
    id: "p-2",
    label: "🪜 국민연금 조기 vs 연기 선택",
    question: "제 예상 연금액과 자산 상태를 고려할 때, 국민연금을 조기 수령하는 게 유리할까요, 연기하는 게 유리할까요?",
    targetToolId: "NPS_BEP",
  },
  {
    id: "p-3",
    label: "🛡️ 건보료 피부양자 자격 방어",
    question: "퇴직 후 국민연금과 배당을 받으면 건강보험 피부양자에서 탈락하나요? 합법적으로 건보료를 아끼는 방법은?",
    targetToolId: "HEALTH_INSURANCE",
  },
  {
    id: "p-4",
    label: "🏢 DB vs DC 퇴직연금 전환 시기",
    question: "현재 회사에서 임금피크제 진입을 앞두고 있는데, DB형에서 DC형으로 언제 전환해야 퇴직금을 지킬 수 있나요?",
    targetToolId: "DB_DC_TRANSITION",
  },
  {
    id: "p-5",
    label: "🪣 3-버킷 현금 버퍼 플랜",
    question: "은퇴 초기 주식 시장 하락(하락장 리스크)에 대비해 단기 비상금 버퍼를 몇 년 치나 마련해두어야 할까요?",
    targetToolId: "THREE_BUCKET",
  },
];

/**
 * 사용자 상태를 기반으로 AI 시스템 프롬프트용 텍스트 요약 생성
 */
export function buildPensionContextText(ctx: UserPensionContextBrief): string {
  return `[사용자 부부 연금 재정 프로필 요약]
- 현재 나이: 만 ${ctx.currentAge}세 (은퇴 예정: 만 ${ctx.retirementAge}세, 은퇴까지 ${ctx.yearsToRetirement}년 남음)
- 배우자 유무: ${ctx.hasSpouse ? "있음 (부부 가구)" : "없음 (1인 가구)"}
- 은퇴 후 목표 생활비: 월 ${ctx.targetMonthlySpending.toLocaleString()}만 원 (최소 생활비: 월 ${ctx.minMonthlySpending.toLocaleString()}만 원)
- 공적연금(국민연금) 예상 수령액: 월 약 ${ctx.monthlyNationalPension.toLocaleString()}만 원
- 퇴직연금 적립액: ${ctx.retirementPensionSavings.toLocaleString()}만 원
- 개인연금(연금저축) 적립액: ${ctx.personalPensionSavings.toLocaleString()}만 원
- 비연금 금융자산(예적금/주식/ISA): ${ctx.liquidAssets.toLocaleString()}만 원
- 주택/부동산 자산: ${ctx.realEstateAssets.toLocaleString()}만 원
- 현재 선택된 인출 전략: ${ctx.selectedStrategy} (전략 0~4)
`;
}
