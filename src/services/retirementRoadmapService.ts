/**
 * retirementRoadmapService.ts
 * 은퇴 생애 D-Day 타임라인 및 연령대별 필수 실행 체크리스트 계산 서비스
 */

export interface RoadmapMilestone {
  id: string;
  age: number; // 대상 나이
  relativeYears: number; // 현재 나이로부터 남은 연수 (0: 지금, 음수: 과거, 양수: 미래)
  title: string;
  category: 'PREPARE' | 'RETIRE' | 'WITHDRAW' | 'CARE' | 'TAX';
  badgeText: string;
  badgeColor: string; // Tailwind color class
  description: string;
  actionItems: {
    id: string;
    text: string;
    isPrimary?: boolean;
    relatedToolId?: string; // 모달 내에서 다른 툴킷 팝업을 열 수 있는 ID
  }[];
}

export interface RoadmapParams {
  currentAge: number;
  retireAge: number;
  npsStartAge: number;
  spouseAge?: number;
  spouseRetireAge?: number;
  hasPrivatePension?: boolean;
  hasRetirementPension?: boolean;
}

export function generateRetirementRoadmap(params: RoadmapParams): RoadmapMilestone[] {
  const { currentAge, retireAge, npsStartAge, spouseAge } = params;

  const milestones: RoadmapMilestone[] = [];

  // 1. 현재 나이 (준비기/골든타임)
  milestones.push({
    id: 'MILESTONE_CURRENT',
    age: currentAge,
    relativeYears: 0,
    title: `현재 (${currentAge}세) - 은퇴 기초 체력 다지기`,
    category: 'PREPARE',
    badgeText: 'D-Day NOW',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: '연금계좌 세액공제 한도(연 900만원)를 전액 채우고, 잠자고 있는 1~2%대 은행/보험 연금을 증권사로 이전합니다.',
    actionItems: [
      {
        id: 'act_curr_1',
        text: '연금저축(600만) + IRP(300만) 연간 900만원 세액공제 한도 납입 (연 최대 148.5만원 환급)',
        isPrimary: true,
      },
      {
        id: 'act_curr_2',
        text: '1~2%대 저수익 은행 신탁·보험사 연금, 수수료 0원 증권사 ETF/TDF로 계약이전(갈아타기) 검토',
        relatedToolId: 'PENSION_TRANSFER',
      },
      {
        id: 'act_curr_3',
        text: 'ISA 3년 만기 자금 IRP 전환 신청 (전환액의 10%, 최대 300만원 추가 세액공제 확보)',
        relatedToolId: 'ISA_TRANSFER',
      },
      {
        id: 'act_curr_4',
        text: '국민연금 공백 기간(군복무, 실직 등) 추가납부(추납) 자격 확인 및 분납 신청',
        relatedToolId: 'NPS_BOOST',
      },
    ],
  });

  // 2. 만 55세 (사적연금 수령 자격 획득 & 3-Bucket 시동)
  if (currentAge <= 55) {
    milestones.push({
      id: 'MILESTONE_AGE_55',
      age: 55,
      relativeYears: 55 - currentAge,
      title: '55세 - 사적연금 수령 자격 획득 & 3-Bucket 안심 현금 분리',
      category: 'TAX',
      badgeText: `D-${55 - currentAge}년`,
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      description: '소득세법상 연금저축/IRP 수령이 가능해지는 첫 해입니다. 하락장 방어용 3-Bucket 포트폴리오를 구성합니다.',
      actionItems: [
        {
          id: 'act_55_1',
          text: '소득세법상 법정 최소 연금수령 자격(만 55세 + 가입 5년 경과) 충족 확인',
        },
        {
          id: 'act_55_2',
          text: '3-Bucket 전략 가동: 은퇴 초기 1~2년치 필수 생활비를 Bucket 1(CMA/단기채)에 현금 분리',
          isPrimary: true,
          relatedToolId: 'THREE_BUCKET_PLAN',
        },
        {
          id: 'act_55_3',
          text: '부부 사적연금 명의 분산 점검 (연 1,500만원 초과 종합과세 방지 수령 계획 수립)',
          relatedToolId: 'SAVINGS_PLAN',
        },
      ],
    });
  }

  // 3. 임금피크제 1년 전 (퇴직연금 DB ➔ DC 전환 골든타임)
  const wagePeakPrepAge = Math.max(currentAge, retireAge - 3);
  if (wagePeakPrepAge < retireAge && wagePeakPrepAge >= currentAge) {
    milestones.push({
      id: 'MILESTONE_WAGE_PEAK',
      age: wagePeakPrepAge,
      relativeYears: wagePeakPrepAge - currentAge,
      title: `${wagePeakPrepAge}세 - 임금피크제 진입 전 퇴직연금 DB ➔ DC 전환 신청`,
      category: 'PREPARE',
      badgeText: `D-${wagePeakPrepAge - currentAge}년`,
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      description: '임금피크제가 시작되면 최근 3개월 평균임금이 삭감되어 DB형 퇴직금이 급감합니다. 피크 직전 DC로 전환하여 퇴직금을 보전합니다.',
      actionItems: [
        {
          id: 'act_wp_1',
          text: '회사 퇴직연금 규약 확인: DB ➔ DC 중도 전환 가능 여부 및 인사팀 신청 일정 확인',
          isPrimary: true,
          relatedToolId: 'DB_DC_TRANSITION',
        },
        {
          id: 'act_wp_2',
          text: '최고 호봉 시점의 퇴직금을 DC 계좌로 이전하고, 원리금보장형 70% + 안전성장형(TDF/배당) 30% 배분',
        },
      ],
    });
  }

  // 4. 주된 직장 퇴직/은퇴 시점 (소득 절벽 & 건보료 방어)
  milestones.push({
    id: 'MILESTONE_RETIRE',
    age: retireAge,
    relativeYears: Math.max(0, retireAge - currentAge),
    title: `${retireAge}세 - 주된 직장 은퇴 (퇴직금 IRP 수령 & 건보료 절벽 방어)`,
    category: 'RETIRE',
    badgeText: retireAge <= currentAge ? '달성' : `D-${retireAge - currentAge}년`,
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    description: '퇴직소득세 감면(30~40%)을 위해 IRP로 퇴직금을 수령하고, 지역건보료 폭탄을 피하기 위해 임의계속가입을 신청합니다.',
    actionItems: [
      {
        id: 'act_ret_1',
        text: '퇴직금 전액 IRP 계좌로 수령 신청 (퇴직소득세 100% 과세이연 및 연금 수령 시 30~40% 세금 감면)',
        isPrimary: true,
      },
      {
        id: 'act_ret_2',
        text: '퇴직 후 14일 이내 고용센터 실업급여(구직급여 최대 9개월, 월 약 200만원) 신청',
        relatedToolId: 'INCOME_BRIDGE',
      },
      {
        id: 'act_ret_3',
        text: '국민건강보험공단에 「임의계속가입(36개월)」 신청 (첫 지역보험료 고지서 수령 후 2달 이내 필수)',
        relatedToolId: 'HEALTH_BILL',
      },
      {
        id: 'act_ret_4',
        text: '국민연금 조기노령연금 수령 유불리 점검 (일찍 받기 vs 정상 개시 비교)',
        relatedToolId: 'NPS_BEP',
      },
    ],
  });

  // 5. 국민연금 개시 시점 (63~65세)
  milestones.push({
    id: 'MILESTONE_NPS',
    age: npsStartAge,
    relativeYears: Math.max(0, npsStartAge - currentAge),
    title: `${npsStartAge}세 - 국민연금 수령 개시 (평생 평탄화 현금흐름 완성)`,
    category: 'WITHDRAW',
    badgeText: npsStartAge <= currentAge ? '달성' : `D-${npsStartAge - currentAge}년`,
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    description: '물가상승률이 100% 반영되는 종신 국민연금이 유입되어 소득 공백기가 종료됩니다.',
    actionItems: [
      {
        id: 'act_nps_1',
        text: '국민연금 정상 수령 신청 (단, 다른 근로/사업 소득이 있다면 연 7.2% 가산되는 연기연금 신청 검토)',
        isPrimary: true,
        relatedToolId: 'NPS_BEP',
      },
      {
        id: 'act_nps_2',
        text: '사적연금 인출액 재조정: 국민연금 유입액만큼 사적연금 인출을 줄여 100세까지 고갈 방지',
      },
      {
        id: 'act_nps_3',
        text: '금융소득(이자/배당) 연 1,000만원 이하 점검하여 건보료 피부양자 자격 유지',
        relatedToolId: 'DIVIDEND_STRATEGY',
      },
    ],
  });

  // 6. 만 70세 (주택연금 결합 & 고령기 생활비 안정)
  if (currentAge <= 70) {
    milestones.push({
      id: 'MILESTONE_AGE_70',
      age: 70,
      relativeYears: 70 - currentAge,
      title: '70세 - 주택연금 결합 및 안정기 지출 리밸런싱',
      category: 'CARE',
      badgeText: `D-${70 - currentAge}년`,
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      description: '활동기 지출이 줄어들고 의료비 비중이 늘어나는 시기입니다. 주택금융공사 주택연금으로 추가 안전판을 확보합니다.',
      actionItems: [
        {
          id: 'act_70_1',
          text: '거주 주택을 담보로 한국주택금융공사(HF) 주택연금 결합 신청 검토 (부부 종신 거주 및 월지급금 수령)',
          isPrimary: true,
          relatedToolId: 'REVERSE_MORTGAGE',
        },
        {
          id: 'act_70_2',
          text: '3-Bucket 포트폴리오를 Bucket 1(현금) 30% + Bucket 2(배당/채권) 50%의 저변동성 구조로 점진적 전환',
          relatedToolId: 'THREE_BUCKET_PLAN',
        },
      ],
    });
  }

  // 7. 만 80세 이상 (초고령기 & 홀로 남은 배우자 유족 케어)
  milestones.push({
    id: 'MILESTONE_AGE_80',
    age: 80,
    relativeYears: Math.max(0, 80 - currentAge),
    title: '80세+ - 초고령기 집중 간병비 & 홀로 남은 배우자 종신 승계',
    category: 'CARE',
    badgeText: 80 <= currentAge ? '달성' : `D-${80 - currentAge}년`,
    badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    description: '장기요양 간병비 버퍼를 확보하고, 한 배우자가 먼저 세상을 떠나도 1인 생활비가 보전되도록 승계 플랜을 점검합니다.',
    actionItems: [
      {
        id: 'act_80_1',
        text: '주택연금 사전 보증 승계 동의 완료 (사망 시 배우자에게 월지급금 100% 감액 없이 전액 종신 승계)',
        isPrimary: true,
        relatedToolId: 'SURVIVOR_CARE',
      },
      {
        id: 'act_80_2',
        text: '국민연금 유족연금(기본연금의 60%)과 배우자 본인연금 간의 중복급여 조정(제56조) 유불리 사전 확인',
        relatedToolId: 'SURVIVOR_CARE',
      },
      {
        id: 'act_80_3',
        text: '간병비 전용 비상금(Bucket 1) 3,000만원 즉시 인출 가능한 수시입출금 계좌 유지',
      },
    ],
  });

  // 나이 오름차순 정렬
  return milestones.sort((a, b) => a.age - b.age);
}
