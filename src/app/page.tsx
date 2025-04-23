"use client";

import { useEnsElectionData } from "@/hooks/useEnsElectionData";
import { ElectionResultsTable } from "@/components/ElectionResultsTable";
import { ProjectsOverview } from "@/components/ProjectsOverview";
import { AllocatedBudget } from "@/components/AllocatedBudget";
import { ResultsDetails } from "@/components/ResultsDetails";
import { useState, useEffect } from "react";
import { LineChart } from "lucide-react";
import { ElectionStatus } from "@/components/ElectionStatus";

export default function EnsElectionPage() {
  const { data, isLoading, error, summary, allocationData } =
    useEnsElectionData();
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
      <div className="container mx-auto  max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-300">Loading election data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto  max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-red-400">Error loading election data</div>
        </div>
      </div>
    );
  }

  // Prepare budget data from summary
  const budgetData = summary
    ? [
        {
          name: "Budget",
          oneYear: summary.streamBreakdown.oneYear.allocated,
          twoYears: summary.streamBreakdown.twoYear.allocated,
          notAllocated: summary.unspentBudget,
          oneYearRemaining: summary.streamBreakdown.oneYear.remaining,
          twoYearsRemaining: summary.streamBreakdown.twoYear.remaining,
        },
      ]
    : [];

  // Prepare legend items with real data
  const budgetLegendItems = summary
    ? [
        {
          color: "#3B82F6",
          label: `1 year (${(
            summary.streamBreakdown.oneYear.budget / 1_000_000
          ).toFixed(1)}M)`,
          subtext:
            summary.streamBreakdown.oneYear.remaining > 0
              ? `${(
                  summary.streamBreakdown.oneYear.remaining / 1_000_000
                ).toFixed(1)}M not allocated`
              : "100% allocated",
        },
        {
          color: "#EC4899",
          label: `2 years (${(
            summary.streamBreakdown.twoYear.budget / 1_000_000
          ).toFixed(1)}M)`,
          subtext:
            summary.streamBreakdown.twoYear.remaining > 0
              ? `${(
                  summary.streamBreakdown.twoYear.remaining / 1_000_000
                ).toFixed(1)}M not allocated`
              : "100% allocated",
        },
        {
          color: "#93C5FD", // Lighter blue (disabled 3B82F6)
          label: `1 year remaining (${(
            summary.streamBreakdown.oneYear.remaining / 1_000_000
          ).toFixed(1)}M)`,
        },
        {
          color: "#F9A8D4", // Lighter pink (disabled EC4899)
          label: `2 years remaining (${(
            summary.streamBreakdown.twoYear.remaining / 1_000_000
          ).toFixed(1)}M)`,
        },
      ]
    : [];

  // Prepare projects data from summary
  const projectsData = summary
    ? [
        {
          name: "1 year",
          value: data.filter(
            (c) => c.streamDuration === "1-year" && c.allocatedBudget > 0
          ).length,
          color: "#3B82F6",
        },
        {
          name: "2 years",
          value: data.filter(
            (c) => c.streamDuration === "2-year" && c.allocatedBudget > 0
          ).length,
          color: "#EC4899",
        },
        {
          name: "Not funded",
          value: data.filter((c) => !c.isNoneBelow && c.allocatedBudget === 0)
            .length,
          color: "#374151",
        },
      ]
    : [];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex w-full items-center gap-3">
          <span className="text-2xl">
            <LineChart />
          </span>
          <div className="flex items-center justify-between w-full gap-3">
            <h1 className="text-3xl font-bold text-gray-100">
              Election Overview
            </h1>
            <ElectionStatus
              startDate={new Date("2025-04-25")}
              endDate={new Date("2025-04-29")}
            />
          </div>
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
        className={`fixed top-0 right-0 h-screen w-screen md:w-[500px] transform overflow-y-scroll bg-dark transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0 shadow-2xl shadow-black" : "translate-x-full"
        }`}
        style={{ zIndex: 101 }}
      >
        {selectedCandidate && allocationData && (
          <ResultsDetails
            candidateName={selectedCandidate}
            onClose={handleClose}
            data={{
              headToHeadMatches: allocationData.headToHeadMatches,
              allocations: allocationData.allocations,
            }}
          />
        )}
      </div>

      <div
        className="relative grid grid-cols-1 gap-6 lg:grid-cols-2"
        style={{ zIndex: 1 }}
      >
        {/* Allocated Budget Chart */}
        {summary && (
          <AllocatedBudget
            budgetData={budgetData}
            legendItems={budgetLegendItems}
            totalBudget={summary.totalBudget}
          />
        )}

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
