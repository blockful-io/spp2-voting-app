"use client";

import { useEnsElectionData } from "@/hooks/useEnsElectionData";
import { ElectionResultsTable } from "@/components/ElectionResultsTable";
import { ProjectsOverview } from "@/components/ProjectsOverview";
import { AllocatedBudget } from "@/components/AllocatedBudget";
import { ResultsDetails } from "@/components/ResultsDetails";
import { useState, useEffect } from "react";

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
  const { data, isLoading, error } = useEnsElectionData();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null
  );

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSelectedCandidate(null);
      }
    };

    // Toggle body scroll
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleShowDetails = (candidateName: string) => {
    setSelectedCandidate(candidateName);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedCandidate(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-300">Loading election data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-red-400">Error loading election data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <h1 className="text-3xl font-bold text-gray-100">Election results</h1>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
        style={{ zIndex: 100 }}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-screen w-[500px] transform overflow-y-scroll bg-dark transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0 shadow-2xl shadow-black" : "translate-x-full"
        }`}
        style={{ zIndex: 101 }}
      >
        {selectedCandidate && (
          <ResultsDetails
            candidateName={selectedCandidate}
            onClose={handleClose}
          />
        )}
      </div>

      <div
        className="relative grid grid-cols-1 gap-6 lg:grid-cols-2"
        style={{ zIndex: 1 }}
      >
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
          <ElectionResultsTable
            candidates={data}
            onShowDetails={handleShowDetails}
          />
        </div>
      </div>
    </div>
  );
}
