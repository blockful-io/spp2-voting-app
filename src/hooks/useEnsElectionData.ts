import { useState, useRef, useEffect } from "react";

interface ElectionCandidate {
  name: string;
  score: number;
  averageSupport: number;
  basicBudget: number;
  extendedBudget: number;
  allocated: boolean;
  streamDuration: string;
  allocatedBudget: number;
  rejectionReason: string | null;
  isEligibleForExtendedBudget: boolean;
}

const mockElectionData: ElectionCandidate[] = [
  {
    name: "Namespace",
    score: 4, // o que ranqueia o candidato - primeira forma / wins
    averageSupport: 863000,
    basicBudget: 500000,
    extendedBudget: 700000,
    allocated: true,
    streamDuration: "2-year",
    allocatedBudget: 700000,
    rejectionReason: null,
    isEligibleForExtendedBudget: true,
  },
  {
    name: "Unruggable",
    score: 2,
    averageSupport: 689750,
    basicBudget: 400000,
    extendedBudget: 700000,
    allocated: true,
    streamDuration: "2-year",
    allocatedBudget: 700000,
    rejectionReason: null,
    isEligibleForExtendedBudget: true,
  },
  {
    name: "eth.limo",
    score: 2,
    averageSupport: 613250,
    basicBudget: 700000,
    extendedBudget: 800000,
    allocated: true,
    streamDuration: "1-year",
    allocatedBudget: 800000,
    rejectionReason: null,
    isEligibleForExtendedBudget: false,
  },
  {
    name: "Blockful",
    score: 2,
    averageSupport: 596500,
    basicBudget: 400000,
    extendedBudget: 700000,
    allocated: true,
    streamDuration: "1-year",
    allocatedBudget: 700000,
    rejectionReason: null,
    isEligibleForExtendedBudget: true,
  },
  {
    name: "EFP",
    score: 0,
    averageSupport: 704500,
    basicBudget: 0,
    extendedBudget: 0,
    allocated: true,
    streamDuration: "1-year",
    allocatedBudget: 0,
    rejectionReason: null,
    isEligibleForExtendedBudget: true,
  },
];

export function useEnsElectionData() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ElectionCandidate[]>(mockElectionData);
  const isMounted = useRef(false);

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const fetch = async () => {
    if (isMounted.current) return;
    isMounted.current = true;

    setIsLoading(true);
    setError(null);
    try {
      await delay(1000); // 1 second delay
      setData(mockElectionData);
      return mockElectionData;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch data"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    fetch,
  };
}
