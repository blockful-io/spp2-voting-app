import { CalendarDays } from "lucide-react";
import React, { useState, useEffect } from "react";

// Enum for election status
enum ElectionState {
  NOT_STARTED, // Election hasn't started yet
  ONGOING, // Election is currently active
  ENDED, // Election has ended
}

interface ElectionStatusProps {
  startDate: Date;
  endDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const ElectionStatus: React.FC<ElectionStatusProps> = ({
  startDate,
  endDate,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [electionState, setElectionState] = useState<ElectionState>(
    ElectionState.NOT_STARTED
  );

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();

      // Determine current election state
      if (now >= endDate) {
        setElectionState(ElectionState.ENDED);
      } else if (now >= startDate) {
        setElectionState(ElectionState.ONGOING);
      } else {
        setElectionState(ElectionState.NOT_STARTED);
      }

      // Calculate time left based on current state
      const targetDate =
        electionState === ElectionState.NOT_STARTED ? startDate : endDate;
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();

    return () => clearInterval(timer);
  }, [startDate, endDate, electionState]);

  const renderStatusContent = () => {
    switch (electionState) {
      case ElectionState.ENDED:
        return (
          <div className="flex items-center bg-[#1E2532] py-4 px-6 rounded-md">
            <span className="text-[#60A5FA] mr-3">✓</span>
            <span className="text-gray-400">Election ended on </span>
            <span className="text-white pl-2">
              {endDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              at{" "}
              {endDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              })}
            </span>
          </div>
        );

      case ElectionState.ONGOING:
        return (
          <div className="flex items-center bg-[#1E2532] py-4 px-6 rounded-md">
            <span className="text-[#60A5FA] mr-3">•</span>
            <span className="text-gray-400">Election ends in: </span>
            <span className="text-white pl-2">
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{" "}
              {timeLeft.seconds}s
            </span>
          </div>
        );

      default: // NOT_STARTED
        return (
          <div className="flex items-center bg-[#1E2532] py-4 px-6 rounded-md">
            <span className="text-[#60A5FA] mr-3">
              <CalendarDays className="w-4 h-4" />
            </span>
            <span className="text-gray-400">Election starts on </span>
            <span className="text-white pl-2">
            {startDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              at{" "}
              {startDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              })}
            </span>
          </div>
        );
    }
  };

  return <div>{renderStatusContent()}</div>;
};
