import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JournalEntriesSample from "../JournalEntriesSample";
import { clearEntries } from "../../storage/journalDb";
import "fake-indexeddb/auto";

describe("JournalEntriesSample", () => {
  beforeEach(async () => {
    await clearEntries();
  });

  it("creates and deletes entries", async () => {
    const user = userEvent.setup();
    render(<JournalEntriesSample />);

    // type and save
    await user.type(screen.getByRole("textbox"), "Hello");
    await user.click(screen.getByRole("button", { name: /save/i }));

    // entry appears in list
    expect(await screen.findByLabelText("Edit entry")).toBeInTheDocument();

    // delete the entry
    await user.click(screen.getByRole("button", { name: /delete entry/i }));
    await waitFor(() => {
      expect(screen.queryByLabelText("Edit entry")).not.toBeInTheDocument();
    });
  });
});
