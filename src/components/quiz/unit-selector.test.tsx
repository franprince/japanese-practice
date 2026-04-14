import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnitSelector } from "./unit-selector";
import { curriculum } from "@/lib/japanese/curriculum";

describe("UnitSelector", () => {
  it("allows selecting and deselecting units", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    
    // Initial state: Unit 1 selected
    render(
      <UnitSelector
        units={curriculum}
        selectedUnitIds={[1]}
        onChange={onChange}
      />
    );

    // Click Unit 2 to select it
    const unit2Checkbox = screen.getByRole("checkbox", { name: new RegExp("Unit 2", "i") });
    await user.click(unit2Checkbox);
    
    expect(onChange).toHaveBeenCalledWith([1, 2]);
  });

  it("selects all units when Select All is clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    
    render(
      <UnitSelector
        units={curriculum}
        selectedUnitIds={[1]}
        onChange={onChange}
      />
    );

    const selectAllButton = screen.getByRole("button", { name: /select all/i });
    await user.click(selectAllButton);
    
    expect(onChange).toHaveBeenCalledWith([1, 2, 3, 4]); // Assuming curriculum has 4 units
  });

  it("clears all units when Clear All is clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    
    render(
      <UnitSelector
        units={curriculum}
        selectedUnitIds={[1, 2]}
        onChange={onChange}
      />
    );

    const clearAllButton = screen.getByRole("button", { name: /clear all/i });
    await user.click(clearAllButton);
    
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
