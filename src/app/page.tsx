"use client";

import { useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import Link from "next/link";
import { useEnsElectionData } from "@/hooks/useEnsElectionData";

const budgetData = [
  {
    name: "Budget",
    oneYear: 2900000,
    twoYears: 1500000,
    notAllocated: 100000,
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
        <div className="rounded-lg border border-lightDark bg-dark p-6">
          <h2 className="mb-6 text-lg font-semibold text-gray-100">
            ALLOCATED BUDGET
          </h2>
          <div className="mb-4">
            <span className="text-4xl font-bold text-gray-100">$4.4M</span>
            <span className="ml-2 text-gray-400">/ $4.5M total</span>
          </div>
          <div className="h-[60px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetData}
                layout="vertical"
                stackOffset="none"
                barSize={24}
              >
                <XAxis type="number" domain={[0, 4500000]} hide />
                <YAxis type="category" dataKey="name" hide />
                <Bar dataKey="oneYear" stackId="stack" fill="#F97316" />
                <Bar dataKey="twoYears" stackId="stack" fill="#22C55E" />
                <Bar dataKey="notAllocated" stackId="stack" fill="#374151" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[#F97316]" />
              <span className="text-sm text-gray-300">1 year (2.9M)</span>
              <span className="text-sm text-gray-500">0.1M not allocated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[#22C55E]" />
              <span className="text-sm text-gray-300">2 years (1.5M)</span>
              <span className="text-sm text-gray-300">100% allocated</span>
            </div>
          </div>
        </div>

        {/* Projects Overview Chart */}
        <div className="rounded-lg border border-lightDark bg-dark p-6">
          <h2 className="mb-6 text-lg font-semibold text-gray-100">
            PROJECTS OVERVIEW
          </h2>
          <div className="flex items-center justify-center">
            <div className="relative h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectsData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={180}
                    endAngle={0}
                    stroke="none"
                  >
                    {projectsData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-4xl font-bold text-gray-100">6</div>
                <div className="text-sm text-gray-400">projects funded</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            {projectsData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-300">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-lightDark bg-dark lg:col-span-2">
          <table className="w-full">
            <thead>
              <tr className="border-b border-lightDark">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Score
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Support
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Budget
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lightDark">
              {data.map((candidate) => (
                <tr key={candidate.name} className="hover:bg-dark/50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                    {candidate.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                    {candidate.score}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                    {candidate.averageSupport.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                    ${candidate.allocatedBudget.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                    {candidate.streamDuration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
