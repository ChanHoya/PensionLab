"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WithdrawalStrategyPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100vw",
      height: "100vh",
      backgroundColor: "var(--background)",
      color: "var(--text-secondary)",
    }}>
      <p>대시보드로 이동 중...</p>
    </div>
  );
}
