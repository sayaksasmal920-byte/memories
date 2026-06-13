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
    if (count === 0) return "bg-[#FAF3E0] border-dashed border-[#CBD5E1]"; // Empty Vintage Cream
    if (count <= 3) return "bg-[#C4B5FD] text-[#1E293B]"; // Light Purple Accent
    if (count <= 10) return "bg-[#8B5CF6] text-white"; // Violet
    if (count <= 25) return "bg-[#EC4899] text-white"; // Hot Pink
    return "bg-[#FBBF24] text-[#1E293B]"; // Amber Golden (Peak memory upload!)
  };

  return (
    <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)]">
      <div className="flex items-center justify-between mb-4 border-b-2 border-[#1E293B] pb-2">
        <h3 className="font-black text-sm uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
          📅 Life Timeline Activity
        </h3>
        <span className="text-xs font-extrabold uppercase text-[#5C6F84]">Monthly Heatmap</span>
      </div>

      <div className="space-y-6">
        {years.map((year) => {
          const monthlyCounts = data[year] || Array(12).fill(0);
          const totalYearUploads = monthlyCounts.reduce((a, b) => a + b, 0);

          return (
            <div key={year} className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-[#1E293B]">
                <span className="text-base font-black px-2 py-0.5 bg-[#FBBF24] border-2 border-[#1E293B] rounded shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]">
                  {year}
                </span>
                <span className="text-xs uppercase text-[#5C6F84]">
                  {totalYearUploads} uploads this year
                </span>
              </div>

              {/* Responsive Monthly Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
                {months.map((month, index) => {
                  const count = monthlyCounts[index] || 0;
                  return (
                    <div
                      key={month}
                      className={`flex flex-col items-center justify-between py-2 border-2 border-[#1E293B] rounded-lg shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] transition-all hover:scale-105 ${getColorDensity(count)}`}
                    >
                      <span className="text-xs font-black uppercase tracking-wider opacity-90">
                        {month}
                      </span>
                      <span className="text-lg font-black mt-1">
                        {count}
                      </span>
                      <span className="text-[9px] font-bold uppercase opacity-80 mt-0.5">
                        {count === 1 ? "memory" : "memories"}
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
      <div className="mt-6 flex flex-wrap gap-4 items-center text-[10px] font-bold text-[#5C6F84] border-t-2 border-dashed border-[#CBD5E1] pt-4">
        <span className="uppercase">Legend / Activity level:</span>
        <div className="flex gap-2 items-center">
          <div className="w-4 h-4 border-2 border-dashed border-[#CBD5E1] bg-[#FAF3E0] rounded"></div>
          <span>None</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-4 h-4 border-2 border-[#1E293B] bg-[#C4B5FD] rounded shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]"></div>
          <span>1-3</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-4 h-4 border-2 border-[#1E293B] bg-[#8B5CF6] rounded shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]"></div>
          <span>4-10</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-4 h-4 border-2 border-[#1E293B] bg-[#EC4899] rounded shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]"></div>
          <span>11-25</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-4 h-4 border-2 border-[#1E293B] bg-[#FBBF24] rounded shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]"></div>
          <span>25+ uploads</span>
        </div>
      </div>
    </div>
  );
}
