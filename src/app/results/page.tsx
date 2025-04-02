"use client";

import { useEffect } from "react";
import { useEnsElectionData } from "@/hooks/useEnsElectionData";
import { ElectionResultsTable } from "@/components/ElectionResultsTable";
import { ProjectsOverview } from "@/components/ProjectsOverview";
import { AllocatedBudget } from "@/components/AllocatedBudget";

const budgetData = [
  {
    name: "Budget",
    oneYear: 2900000,
    twoYears: 1500000,
    notAllocated: 100000,
  },
];

const budgetLegendItems = [
  {
    color: "#F97316",
    label: "1 year (2.9M)",
    subtext: "0.1M not allocated",
  },
  {
    color: "#22C55E",
    label: "2 years (1.5M)",
    subtext: "100% allocated",
  },
];

const projectsData = [
  { name: "1 year", value: 4, color: "#F97316" },
  { name: "2 years", value: 2, color: "#22C55E" },
  { name: "Not funded", value: 16, color: "#374151" },
];

export default function EnsElectionPage() {
  const { data, isLoading, error, fetch } = useEnsElectionData();

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-300">Loading election data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-red-400">Error loading election data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <h1 className="text-3xl font-bold text-gray-100">Election results</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Allocated Budget Chart */}
        <AllocatedBudget
          budgetData={budgetData}
          legendItems={budgetLegendItems}
          totalBudget={4500000}
        />

        {/* Projects Overview Chart */}
        <ProjectsOverview projectsData={projectsData} />

        {/* Table */}
        <div className="lg:col-span-2">
          <ElectionResultsTable candidates={data} />
        </div>
      </div>
    </div>
  );
}
