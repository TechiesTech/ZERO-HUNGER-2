import React from "react";

export type MapFilterMode = "DUAL_PATHS" | "SPONSORED_ONLY" | "ALL_NETWORK";

interface MapModeSwitcherProps {
  mapMode: MapFilterMode;
  onChange: (mode: MapFilterMode) => void;
}

export const MapModeSwitcher: React.FC<MapModeSwitcherProps> = ({
  mapMode,
  onChange,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <button
      type="button"
      onClick={() => onChange("DUAL_PATHS")}
      className={`px-3 sm:px-3.5 py-2 rounded-[8px] font-mono-tabular text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
        mapMode === "DUAL_PATHS"
          ? "bg-[#49E619] text-[#080808] border-[#49E619]"
          : "bg-[#122023] text-white border-white/15 hover:border-[#49E619]"
      }`}
    >
      Dual Path (Yours + Child’s)
    </button>
    <button
      type="button"
      onClick={() => onChange("SPONSORED_ONLY")}
      className={`px-3 sm:px-3.5 py-2 rounded-[8px] font-mono-tabular text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
        mapMode === "SPONSORED_ONLY"
          ? "bg-[#B9FF2C] text-[#080808] border-[#B9FF2C]"
          : "bg-[#122023] text-white border-white/15 hover:border-[#B9FF2C]"
      }`}
    >
      Sponsored Child Route
    </button>
    <button
      type="button"
      onClick={() => onChange("ALL_NETWORK")}
      className={`px-3 sm:px-3.5 py-2 rounded-[8px] font-mono-tabular text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
        mapMode === "ALL_NETWORK"
          ? "bg-[#4EDBE2] text-[#080808] border-[#4EDBE2]"
          : "bg-[#122023] text-white border-white/15 hover:border-[#4EDBE2]"
      }`}
    >
      All Kitchens & Hubs (5)
    </button>
  </div>
);
