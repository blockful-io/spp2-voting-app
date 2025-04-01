"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { type ProjectData } from "@/types/election";
import { useState, useEffect } from "react";

interface ProjectsOverviewProps {
  projectsData: ProjectData[];
}

export function ProjectsOverview({ projectsData }: ProjectsOverviewProps) {
  const [isMounted, setIsMounted] = useState(false);

  const fundedProjects = projectsData
    .filter((project) => project.name !== "Not funded")
    .reduce((sum, project) => sum + project.value, 0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="flex h-full flex-col rounded-lg border border-lightDark bg-dark px-6 py-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-100">
        PROJECTS OVERVIEW
      </h2>
      <div className="flex flex-1 items-center justify-between">
        <div className="relative h-[180px] w-[180px]">
          {isMounted && (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={projectsData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
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
          )}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-[3.5rem] font-bold leading-none text-gray-100">
              {fundedProjects}
            </div>
            <div className="text-sm text-gray-500">
              projects
              <br />
              funded
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {projectsData.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-16"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-lg text-gray-300">{item.name}</span>
              </div>
              <span className="text-lg text-gray-300 tabular-nums">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
