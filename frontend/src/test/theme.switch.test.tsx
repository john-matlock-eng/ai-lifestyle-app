import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "../contexts";
import ThemeSwitcher from "../components/common/ThemeSwitcher";
import { test, expect } from "vitest";

test("toggles theme without crash", () => {
  render(
    <ThemeProvider>
      <ThemeSwitcher />
    </ThemeProvider>,
  );
  
  // Click the dropdown button to open the menu
  const dropdownButton = screen.getByRole("button", { name: /balloon/i });
  fireEvent.click(dropdownButton);
  
  // Click the light theme option
  const lightOption = screen.getByRole("option", { name: /light/i });
  fireEvent.click(lightOption);
  
  expect(document.documentElement.dataset.theme).toBe("light");
});
