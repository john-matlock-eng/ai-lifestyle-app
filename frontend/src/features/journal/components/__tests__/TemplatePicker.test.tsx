import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TemplatePicker from "../TemplatePicker";
import type { JournalTemplate } from "../../types/template.types";

vi.mock("../../hooks/useTemplateRegistry", () => ({
  useTemplateRegistry: () => ({
    templates: [
      {
        id: "t1",
        name: "Template 1",
        description: "Desc",
        version: 1,
        sections: [],
      } as JournalTemplate,
    ],
    loading: false,
    error: null,
  }),
}));

describe("TemplatePicker", () => {
  it("calls onSelect when template clicked", async () => {
    const user = userEvent.setup();
    const handle = vi.fn();
    render(<TemplatePicker onSelect={handle} />);
    await user.click(screen.getByText("Template 1"));
    expect(handle).toHaveBeenCalled();
  });

  it("shows loader when loading", async () => {
    vi.resetModules();
    vi.doMock("../../hooks/useTemplateRegistry", () => ({
      useTemplateRegistry: () => ({ templates: [], loading: true }),
    }));
    const { default: TemplatePickerLoaded } = await import("../TemplatePicker");
    render(<TemplatePickerLoaded onSelect={vi.fn()} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows error when registry fails", async () => {
    vi.resetModules();
    vi.doMock("../../hooks/useTemplateRegistry", () => ({
      useTemplateRegistry: () => ({
        templates: [],
        loading: false,
        error: "err",
      }),
    }));
    const { default: PickerError } = await import("../TemplatePicker");
    render(<PickerError onSelect={vi.fn()} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
