"use client";

import React from "react";
import { CurriculumUnit } from "@/lib/japanese/curriculum";

interface UnitSelectorProps {
  units: CurriculumUnit[];
  selectedUnitIds: number[];
  onChange: (selectedIds: number[]) => void;
  disabled?: boolean;
}

export function UnitSelector({ units, selectedUnitIds, onChange, disabled = false }: UnitSelectorProps) {
  const toggleUnit = (id: number) => {
    if (selectedUnitIds.includes(id)) {
      onChange(selectedUnitIds.filter((uId) => uId !== id));
    } else {
      onChange([...selectedUnitIds, id]);
    }
  };

  const selectAll = () => {
    onChange(units.map(u => u.id));
  };
  
  const clearSelection = () => {
    onChange([]);
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Select Units to Practice</h2>
        <div className="flex gap-2">
           <button
            type="button"
            onClick={selectAll}
            disabled={disabled}
            className="text-xs text-primary hover:underline disabled:opacity-50"
          >
            Select All
          </button>
          <span className="text-muted-foreground text-xs">|</span>
          <button
            type="button"
            onClick={clearSelection}
            disabled={disabled}
            className="text-xs text-primary hover:underline disabled:opacity-50"
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {units.map((unit) => {
          const isSelected = selectedUnitIds.includes(unit.id);
          return (
            <label
              key={unit.id}
              className={`
                relative flex cursor-pointer rounded-lg border p-4 shadow-sm hover:bg-accent hover:text-accent-foreground
                transition-colors 
                ${isSelected ? "border-primary bg-primary/5" : "border-border bg-background"}
                ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
              `}
            >
              <div className="flex items-start gap-3 w-full">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-primary text-primary focus:ring-primary"
                  checked={isSelected}
                  onChange={() => toggleUnit(unit.id)}
                  disabled={disabled}
                />
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium leading-none">
                    Unit {unit.id}: {unit.title}
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-2" title={unit.summary}>
                    {unit.summary}
                  </span>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
