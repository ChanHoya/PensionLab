// [Agent 4] AI 종합 진단 리포트, 5대 평가 등급 및 CFP 전문가 처방 내러티브 전담 에이전트
import { buildHouseholdReport, type HouseholdReport, type ReportInput } from "@/services/householdReport";
import { fallbackNarrative } from "@/services/reportNarrative";
import { calculateQuickDiagnosis } from "@/services/quickDiagnosis";

export const Agent4AiAdvisor = {
  // 가구 5대 영역(충분성·안정성·세후효율·3층분산·장수유족) 종합 평가 및 DTO 생성
  buildHouseholdReport,

  // 100% 무환각 CFP 룰베이스 처방 내러티브
  fallbackNarrative,

  // 초심자 30초 퀵 간편 진단
  calculateQuickDiagnosis,
};
