/**
 * 금융/연금 전문 용어 사전 (Glossary)
 * 초보자 및 일반 사용자의 인지부하를 줄이기 위한 쉬운 일상 비유와 실전 대응 꿀팁 정의
 */

export interface GlossaryTerm {
  id: string;
  term: string; // 용어명
  aliases?: string[]; // 유사 검색어 / 별칭
  category: "pension" | "tax" | "health" | "investment" | "general";
  categoryLabel: string;
  shortDefinition: string; // 중학생도 이해하는 1줄 일상 비유
  detailExplanation: string; // 구체적 원리와 제도적 영향
  actionTip: string; // 사용자가 취해야 할 실전 대응 팁
  relatedModal?: string; // 대시보드 모달 연계 ID
  relatedToolLabel?: string; // 툴팁 내 바로가기 버튼 라벨
}

export const GLOSSARY_TERMS: Record<string, GlossaryTerm> = {
  INCOME_CREVASSE: {
    id: "INCOME_CREVASSE",
    term: "소득 크레바스 (소득 공백기)",
    aliases: ["소득 크레바스", "소득공백기", "은퇴 공백기"],
    category: "pension",
    categoryLabel: "연금 공백",
    shortDefinition: "직장을 그만둔 후 국민연금을 받기 전까지 5~10년 동안 월급도 연금도 끊기는 '소득 빙하기' 구간입니다.",
    detailExplanation: "정년(만 60세) 직후부터 국민연금 수령(만 63~65세) 전까지 소득이 0원이 되는 시기로, 퇴직금 일시금이나 비상금이 급격히 소진되는 가장 취약한 시기입니다.",
    actionTip: "실업급여(최대 9개월), 사적연금(연금저축/IRP) 55세 조기 분할 인출, 임의계속가입, 주택연금 조기 브릿지 4대 방패로 소득 공백을 메워야 합니다.",
    relatedModal: "incomeBridge",
    relatedToolLabel: "🌉 소득공백기 플래너 열기",
  },
  DEPENDENT_DISQUALIFICATION: {
    id: "DEPENDENT_DISQUALIFICATION",
    term: "건보료 피부양자 자격 및 탈락",
    aliases: ["피부양자", "피부양자 자격", "피부양자 탈락"],
    category: "health",
    categoryLabel: "건강보험",
    shortDefinition: "자녀의 건강보험에 얹혀 보험료를 0원 내다가, 소득이나 재산이 기준을 넘어 매달 20~30만원씩 내게 되는 현상입니다.",
    detailExplanation: "연간 합산소득(공적연금 100%, 금융소득, 사업소득 등)이 2,000만원을 1원이라도 초과하거나, 재산 과표가 5.4억 초과~9억원 이하이면서 연 소득 1,000만원 초과 시 피부양자에서 탈락하여 지역가입자로 전환됩니다.",
    actionTip: "국민연금 부분연기(50~90%)로 연 2,000만원 이하로 맞추거나, 배당소득을 부부 명의로 분산(인당 연 1,000만원 이하)하고 사적연금(연금저축/IRP)을 활용하여 방어해야 합니다.",
    relatedModal: "healthBill",
    relatedToolLabel: "🧾 건보료 모의 고지서 열기",
  },
  PRIVATE_PENSION_1500: {
    id: "PRIVATE_PENSION_1500",
    term: "사적연금 연 1,500만원 절세 한도",
    aliases: ["1500만원 한도", "사적연금 1500만원", "종합과세 1500만원"],
    category: "tax",
    categoryLabel: "세금·절세",
    shortDefinition: "연금저축/IRP에서 1년에 1,500만원까지만 저렴한 세금(3.3~5.5%)을 매겨주고, 넘으면 세금 폭탄을 때리는 기준선입니다.",
    detailExplanation: "연간 사적연금 수령액이 1,500만원을 단 1원이라도 초과하면 초과분이 아닌 '전액'에 대해 16.5% 기타소득세 분리과세 또는 타 소득과의 종합과세 중 하나를 선택해야 합니다.",
    actionTip: "인출 기간을 10년 대신 15~20년으로 늘려 연간 수령액을 연 1,500만원 이하로 안분 분산하면 평생 수백만~수천만원의 세금을 아낄 수 있습니다.",
    relatedModal: "tax15",
    relatedToolLabel: "💰 1,500만원 절세 계산기 열기",
  },
  NPS_BEP: {
    id: "NPS_BEP",
    term: "국민연금 손익분기점 (BEP)",
    aliases: ["손익분기점", "조기연금 손익분기", "연기연금 손익분기", "BEP"],
    category: "pension",
    categoryLabel: "국민연금",
    shortDefinition: "국민연금을 일찍 당겨 받는 게 이득인지, 늦게 미뤄서 많이 받는 게 이득인지 누적 총액이 역전되는 나이입니다.",
    detailExplanation: "조기노령연금은 1년당 6%(최대 30%) 깎이고, 연기연금은 1년당 7.2%(최대 36%) 가산됩니다. 법정 단순 누적 기준 조기-정상은 약 77세, 정상-연기는 약 84세에 누적액이 역전됩니다.",
    actionTip: "A값(전체 평균소득) 재평가율을 감안한 실질 체감 BEP는 72세/81세로 약 3~5년 앞당겨집니다. 건강 상태와 가족력, 65세 이후 근로소득 여부를 종합 고려해 결정해야 합니다.",
    relatedModal: "bep",
    relatedToolLabel: "⚖️ 조기 vs 정상 vs 연기 비교기 열기",
  },
  NPS_A_B_VALUE: {
    id: "NPS_A_B_VALUE",
    term: "국민연금 A값 & B값",
    aliases: ["A값", "B값", "과거소득 재평가율"],
    category: "pension",
    categoryLabel: "국민연금",
    shortDefinition: "국민연금 계산 시 '전체 가입자 평균 월급(A값)'과 '내 과거 월급을 지금 돈으로 환산해주는 배수(B값)'입니다.",
    detailExplanation: "A값은 연금 수급 직전 3년간 전체 국민연금 가입자의 평균 소득월액이며, B값은 본인의 과거 가입기간별 기준소득월액을 현재가치로 재평가한 평균치입니다. 매년 물가와 임금상승률에 따라 갱신되어 연금액의 실질가치를 보장합니다.",
    actionTip: "A값과 B값의 매년 상승 효과 덕분에 연기연금의 실질 손익분기점은 법정 수치보다 빠르게 도달합니다.",
    relatedModal: "bep",
    relatedToolLabel: "⚖️ A·B값 반영 손익분기 확인",
  },
  NPS_ADDITIONAL_PAYMENT: {
    id: "NPS_ADDITIONAL_PAYMENT",
    term: "국민연금 추납 (추후납부) & 반납",
    aliases: ["추납", "추후납부", "반납", "반환일시금 반납"],
    category: "pension",
    categoryLabel: "국민연금",
    shortDefinition: "실직이나 군 복무, 경력단절로 못 냈던 과거 연금보험료를 지금 몰아서 내고 평생 월 연금액을 뻥튀기하는 치트키입니다.",
    detailExplanation: "과거에 받지 못했던 기간(최대 119개월)의 보험료를 현재 기준으로 납부하여 가입 기간을 늘립니다. 10년(120개월) 미만으로 연금을 못 받던 사람도 수급권을 얻을 수 있습니다.",
    actionTip: "추납 비용은 평균 3~5년이면 연금 증액분으로 원금을 회수할 수 있어 국내 금융상품 중 가장 높은 수익비를 자랑합니다.",
    relatedModal: "npsBoost",
    relatedToolLabel: "🪜 국민연금 증액 로드맵 열기",
  },
  TAX_DEFERRED: {
    id: "TAX_DEFERRED",
    term: "과세이연 (과세 유예)",
    aliases: ["과세이연", "비과세 이연"],
    category: "tax",
    categoryLabel: "세금·절세",
    shortDefinition: "지금 떼여야 할 배당소득세(15.4%)를 나중에 은퇴해서 연금으로 찾을 때까지 세금을 한 푼도 안 떼고 그대로 굴려주는 혜택입니다.",
    detailExplanation: "연금저축, IRP, ISA 계좌에서 발생한 이자와 배당은 발생하는 즉시 세금을 원천징수하지 않고 복리로 재투자됩니다. 만 55세 이후 연금으로 수령할 때 낮은 연금소득세(3.3~5.5%)만 납부합니다.",
    actionTip: "배당주나 커버드콜 ETF는 일반 종합계좌 대신 연금계좌(연금저축/IRP)에서 매수해야 15.4% 배당소득세와 건보료 금융소득 1,000만원 기준을 완벽하게 방어할 수 있습니다.",
    relatedModal: "dividendStrategy",
    relatedToolLabel: "💡 연금 배당 전략 가이드 열기",
  },
  HEALTH_VOLUNTARY_CONTINUATION: {
    id: "HEALTH_VOLUNTARY_CONTINUATION",
    term: "건보료 임의계속가입 (36개월 특례)",
    aliases: ["임의계속가입", "임의계속가입제도"],
    category: "health",
    categoryLabel: "건강보험",
    shortDefinition: "퇴직 후 갑자기 폭등하는 지역건보료 대신, 회사 다닐 때 내던 저렴한 직장 건보료를 최대 3년(36개월) 동안 그대로 내는 제도입니다.",
    detailExplanation: "퇴직 전 18개월 중 1년 이상 직장가입자 자격을 유지했던 근로자가 퇴직 후 첫 지역고지서를 받은 날로부터 2개월 이내에 건강보험공단에 신청할 수 있습니다.",
    actionTip: "보유 아파트 공시가격이 높거나 연금소득이 많아 지역건보료가 30~50만원 이상 예상되는 은퇴자는 무조건 퇴직 직후 신청해야 수백만원을 절감합니다.",
    relatedModal: "healthBill",
    relatedToolLabel: "🧾 건보료 절감액 시뮬레이션",
  },
  REVERSE_MORTGAGE_YOUNGER: {
    id: "REVERSE_MORTGAGE_YOUNGER",
    term: "주택연금 연소자 기준 & 100% 종신승계",
    aliases: ["주택연금", "역모기지", "주택연금 연소자"],
    category: "pension",
    categoryLabel: "주택연금",
    shortDefinition: "집을 담보로 평생 연금을 받을 때, 부부 중 더 젊은 사람 나이로 금액이 결정되고 한 사람이 먼저 세상을 떠나도 100% 동일한 금액을 계속 받습니다.",
    detailExplanation: "한국주택금융공사(HF)의 주택연금은 공시가격 12억원 이하 주택을 대상으로 하며, 소득세와 건강보험료가 100% 비과세(대출금) 처리됩니다. 부부 모두 사망 시까지 종신 지급되며 남는 집값은 자녀에게 상속됩니다.",
    actionTip: "연금 소득이 부족한 70대 이후 생활비 부족분을 메우거나, 60~64세 소득 공백기 구간에 조기 브릿지 연금으로 탁월한 안전판 역할을 합니다.",
    relatedModal: "reverseMortgage",
    relatedToolLabel: "🏠 주택연금 시뮬레이터 열기",
  },
  ISA_PENSION_TRANSFER: {
    id: "ISA_PENSION_TRANSFER",
    term: "ISA 만기 자금 연금계좌 전환",
    aliases: ["ISA 전환", "ISA 연금전환", "ISA 풍차돌리기"],
    category: "tax",
    categoryLabel: "세금·절세",
    shortDefinition: "3년 만기가 된 ISA 계좌의 목돈을 연금계좌(연금저축/IRP)로 옮기면, 옮긴 돈의 10%(최대 300만원)를 추가로 세액공제 환급해주는 보너스입니다.",
    detailExplanation: "조세특례제한법 제91조의18에 따라 만기일로부터 60일 이내에 연금계좌로 전환해야 합니다. 기본 연금 세액공제(연 900만원)와 합쳐 당해 연도 최대 1,200만원까지 세액공제를 받을 수 있습니다.",
    actionTip: "3년마다 ISA 만기금을 연금계좌로 넘기고 새 ISA를 개설하는 '3년 풍차돌리기'를 실행하면 10년간 수천만원의 세금을 환급받습니다.",
    relatedModal: "isaTransfer",
    relatedToolLabel: "💎 ISA 전환 플래너 열기",
  },
  COVERED_CALL_NAV_EROSION: {
    id: "COVERED_CALL_NAV_EROSION",
    term: "커버드콜 ETF NAV(원금) 침식 위험",
    aliases: ["커버드콜", "NAV 침식", "원금 갉아먹기", "제 살 깎아먹기"],
    category: "investment",
    categoryLabel: "투자·자산",
    shortDefinition: "연 10~15% 고배당을 준다고 해서 샀더니, 알고 보니 내 원금을 깎아서 배당으로 돌려주는 '제 살 깎아먹기' 위험입니다.",
    detailExplanation: "콜옵션을 매도하여 프리미엄을 얻는 대신 기초자산 상승 시 수익이 제한되고, 하락 시에는 하락폭을 그대로 얻어맞아 장기적으로 원금(기준가)이 우하향 침식될 수 있습니다.",
    actionTip: "초고배당(12%+) 상품만 몰빵하지 말고, 미국배당다우존스(SCHD)나 미국채 혼합형 등 기초자산 가치가 유지되는 배당성장형 ETF와 분산 투자해야 합니다.",
    relatedModal: "dividendStrategy",
    relatedToolLabel: "💡 전문가 실전 ETF 포트폴리오",
  },
  IRP_SAFETY_ASSET_RULE: {
    id: "IRP_SAFETY_ASSET_RULE",
    term: "IRP 30% 안전자산 의무 보유 룰",
    aliases: ["IRP 30%", "안전자산 30%", "위험자산 70%"],
    category: "investment",
    categoryLabel: "퇴직연금",
    shortDefinition: "퇴직연금(IRP/DC)에서는 계좌 내 주식형 ETF를 70%까지만 담을 수 있고, 나머지 30%는 무조건 예금/채권 같은 안전자산으로 채워야 하는 법적 규제입니다.",
    detailExplanation: "퇴직연금감독규정에 따라 근로자의 노후 자산 보호를 위해 위험자산 한도를 70%로 제한합니다. 규정을 위반하면 추가 주식 매수가 거부됩니다.",
    actionTip: "최근에는 30% 안전자산 슬롯에도 편입 가능한 '미국채혼합50 ETF'나 '만기매칭형 채권 ETF', '공모리츠' 등을 활용하면 안전자산에서도 연 5~7% 배당 수익률을 챙길 수 있습니다.",
    relatedModal: "dividendStrategy",
    relatedToolLabel: "💡 IRP 30% 안전자산 활용 팁 보기",
  },
  REAL_PURCHASING_POWER: {
    id: "REAL_PURCHASING_POWER",
    term: "현재가치 (실질 구매력) vs 명목금액",
    aliases: ["실질 구매력", "현재가치", "명목금액", "물가할인"],
    category: "general",
    categoryLabel: "화폐가치",
    shortDefinition: "지금의 100만원과 30년 뒤의 100만원은 살 수 있는 자장면 그릇 수가 다릅니다. '지금 돈의 실질적인 힘'으로 계산한 것이 현재가치입니다.",
    detailExplanation: "연 물가상승률 3% 가정 시 24년 뒤 화폐 가치는 절반으로 떨어집니다. 명목 숫자로만 보면 연금이 많아 보이지만, 실질 구매력(현재가치)으로 보아야 은퇴 생활비 목표선과 정직하게 비교할 수 있습니다.",
    actionTip: "PensionLab의 대시보드와 AI 진단 리포트는 '현재가치(실질 구매력)'를 기본값으로 일원화하여 왜곡 없는 정확한 노후 설계를 지원합니다.",
  },
  SURVIVOR_PENSION_ADJUSTMENT: {
    id: "SURVIVOR_PENSION_ADJUSTMENT",
    term: "국민연금 중복급여 조정 (유족연금 30% 룰)",
    aliases: ["중복급여 조정", "유족연금 중복", "유족연금 30%"],
    category: "pension",
    categoryLabel: "국민연금",
    shortDefinition: "부부 모두 국민연금을 받다가 한 사람이 먼저 사망했을 때, 배우자의 유족연금을 100% 다 주지 않고 30%만 얹어주는 제도입니다.",
    detailExplanation: "국민연금법 제56조에 따라 [대안 1: 내 국민연금 100% + 배우자 유족연금의 30%]와 [대안 2: 내 연금 포기 + 배우자 유족연금 100%] 중 본인에게 더 유리한 금액 하나만 선택해야 합니다.",
    actionTip: "홀로 남은 배우자의 1인 가구 생활비는 기존 부부 생활비의 약 70% 수준으로 줄어들지만, 중복급여 조정으로 연금도 감소하므로 주택연금이나 사적연금 보완책이 필수적입니다.",
    relatedModal: "survivorCare",
    relatedToolLabel: "🕊️ 홀로 남은 배우자 케어 열기",
  },
};

/**
 * 용어 ID로 사전 항목 검색
 */
export function getGlossaryTerm(termIdOrAlias: string): GlossaryTerm | undefined {
  if (GLOSSARY_TERMS[termIdOrAlias]) {
    return GLOSSARY_TERMS[termIdOrAlias];
  }
  const lower = termIdOrAlias.toLowerCase();
  return Object.values(GLOSSARY_TERMS).find(
    (t) => t.term.toLowerCase().includes(lower) || t.aliases?.some((a) => a.toLowerCase().includes(lower))
  );
}
