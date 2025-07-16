import { describe, it, expect, beforeEach } from "vitest";
import { purgeOldDrafts } from "../drafts";

describe("purgeOldDrafts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes drafts older than threshold", () => {
    const oldKey = "journal-draft-temp-1000-section";
    const recentKey = `journal-draft-temp-${Date.now()}-section`;
    localStorage.setItem(oldKey, "a");
    localStorage.setItem(recentKey, "b");
    purgeOldDrafts(0); // remove all with ts < now
    expect(localStorage.getItem(oldKey)).toBeNull();
    expect(localStorage.getItem(recentKey)).toBe("b");
  });
});
