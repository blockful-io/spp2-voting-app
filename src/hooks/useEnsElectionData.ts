import { useState, useEffect, useMemo } from "react";

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
  {
    name: "ENS.Vision",
    score: 3,
    averageSupport: 725000,
    basicBudget: 450000,
    extendedBudget: 650000,
    allocated: true,
    streamDuration: "2-year",
    allocatedBudget: 650000,
    rejectionReason: null,
    isEligibleForExtendedBudget: true,
  },
  {
    name: "ENSPortal",
    score: 2,
    averageSupport: 580000,
    basicBudget: 400000,
    extendedBudget: 600000,
    allocated: true,
    streamDuration: "1-year",
    allocatedBudget: 600000,
    rejectionReason: null,
    isEligibleForExtendedBudget: true,
  },
  {
    name: "NameSys",
    score: 2,
    averageSupport: 592000,
    basicBudget: 350000,
    extendedBudget: 550000,
    allocated: true,
    streamDuration: "1-year",
    allocatedBudget: 550000,
    rejectionReason: null,
    isEligibleForExtendedBudget: true,
  },
  {
    name: "ENS.Directory",
    score: 1,
    averageSupport: 485000,
    basicBudget: 300000,
    extendedBudget: 500000,
    allocated: true,
    streamDuration: "1-year",
    allocatedBudget: 500000,
    rejectionReason: null,
    isEligibleForExtendedBudget: false,
  },
  {
    name: "ENSManager",
    score: 1,
    averageSupport: 472000,
    basicBudget: 350000,
    extendedBudget: 550000,
    allocated: true,
    streamDuration: "1-year",
    allocatedBudget: 550000,
    rejectionReason: null,
    isEligibleForExtendedBudget: true,
  },
];

export function useEnsElectionData() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ElectionCandidate[]>([]);

  useEffect(() => {
    // Simulate a brief loading state
    const timer = setTimeout(() => {
      setData(mockElectionData);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const fetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
      setData(mockElectionData);
      return mockElectionData;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch data"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize the mapped data to prevent unnecessary re-renders
  const mappedData = useMemo(() => {
    return data.map((candidate) => ({
      name: candidate.name,
      score: candidate.score,
      averageSupport: candidate.averageSupport,
      allocatedBudget: candidate.allocatedBudget,
      streamDuration: candidate.streamDuration,
      isEligibleForExtendedBudget: candidate.isEligibleForExtendedBudget,
      wins: candidate.score,
      basicBudget: candidate.basicBudget,
      extendedBudget: candidate.extendedBudget,
    }));
  }, [data]);

  return {
    data: mappedData,
    isLoading,
    error,
    fetch,
  };
}
