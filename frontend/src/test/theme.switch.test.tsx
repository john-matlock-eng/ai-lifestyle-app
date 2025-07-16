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
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "light" },
  });
  expect(document.documentElement.dataset.theme).toBe("light");
});
