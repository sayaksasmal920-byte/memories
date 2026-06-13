import React from "react";

export default function Heatmap({ data }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  
  // Ensure we display at least the current year and the previous year if data exists
  const years = Object.keys(data).length > 0 
    ? Object.keys(data).map(Number).sort((a, b) => b - a)
    : [currentYear];

  // Helper to color density of uploads
  const getColorDensity = (count) => {
    if (count === 0) return "bg-[var(--bg-primary)] border-dashed border-[var(--border)]"; // Empty soft rose
    if (count <= 3) return "bg-[var(--color-warning)] text-[var(--text-primary)]"; // Light peach rose
    if (count <= 10) return "bg-[var(--color-secondary)] text-white"; // Soft red pink
    if (count <= 25) return "bg-[var(--color-accent)] text-white"; // Bright rose coral
    return "bg-[var(--color-primary)] text-white heartbeat"; // Peak memory crimson heartbeat!
  };

  return (
    <div className="bg-[var(--bg-card)] border-3 border-[var(--border)] rounded-xl p-6 shadow-[5px_5px_0px_0px_var(--shadow-color)]">
      <div className="flex items-center justify-between mb-4 border-b-2 border-[var(--border)] pb-2">
        <h3 className="font-black text-sm uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
          📅 Bakchodi Timeline
        </h3>
        <span className="text-xs font-extrabold uppercase text-[var(--text-secondary)]"></span>
      </div>

      <div className="space-y-6">
        {years.map((year) => {
          const monthlyCounts = data[year] || Array(12).fill(0);
          const totalYearUploads = monthlyCounts.reduce((a, b) => a + b, 0);

          return (
            <div key={year} className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-[var(--text-primary)]">
                <span className="text-base font-black px-2 py-0.5 bg-[var(--color-accent)] border-2 border-[var(--border)] rounded shadow-[1.5px_1.5px_0px_0px_var(--shadow-color)]">
                  {year}
                </span>
                <span className="text-xs uppercase text-[var(--text-secondary)]">
                  {totalYearUploads} bakchodis this year
                </span>
              </div>

              {/* Responsive Monthly Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
                {months.map((month, index) => {
                  const count = monthlyCounts[index] || 0;
                  return (
                    <div
                      key={month}
                      className={`flex flex-col items-center justify-between py-2 border-2 border-[var(--border)] rounded-lg shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all hover:scale-105 ${getColorDensity(count)}`}
                    >
                      <span className="text-xs font-black uppercase tracking-wider opacity-90">
                        {month}
                      </span>
                      <span className="text-lg font-black mt-1">
                        {count}
                      </span>
                      <span className="text-[9px] font-bold uppercase opacity-80 mt-0.5">
                        {count === 1 ? "moment" : "moments"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Heatmap Legend */}
      <div className="mt-6 flex flex-wrap gap-4 items-center text-[10px] font-bold text-[var(--text-secondary)] border-t-2 border-dashed border-[var(--border)] pt-4">
        <span className="uppercase">Bakchodi Level:</span>
        <div className="flex gap-2 items-center">
          <div className="w-4 h-4 border-2 border-dashed border-[var(--border)] bg-[var(--bg-primary)] rounded"></div>
          <span>No bakchodis yet</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-4 h-4 border-2 border-[var(--border)] bg-[var(--color-warning)] rounded shadow-[1px_1px_0px_0px_var(--shadow-color)]"></div>
          <span>1-3 bakchodis</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-4 h-4 border-2 border-[var(--border)] bg-[var(--color-secondary)] rounded shadow-[1px_1px_0px_0px_var(--shadow-color)]"></div>
          <span>4-10 bakchodis</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-4 h-4 border-2 border-[var(--border)] bg-[var(--color-accent)] rounded shadow-[1px_1px_0px_0px_var(--shadow-color)]"></div>
          <span>11-25 bakchodis</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-4 h-4 border-2 border-[var(--border)] bg-[var(--color-primary)] rounded shadow-[1px_1px_0px_0px_var(--shadow-color)]"></div>
          <span>25+ bakchodis (So much love!)</span>
        </div>
      </div>
    </div>
  );
}
