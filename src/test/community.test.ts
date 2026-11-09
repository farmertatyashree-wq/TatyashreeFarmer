import { describe, expect, it } from "vitest";

import {
  parseCropTags,
  validateCommunityImage,
  validateCommunityPost,
  validateCommunityText,
} from "@/lib/community";

describe("community feed validation", () => {
  it("normalizes and deduplicates crop tags", () => {
    expect(parseCropTags("  Wheat, rice, Wheat ,, cotton ")).toEqual(["Wheat", "rice", "cotton"]);
  });

  it("requires a short post and farmer name", () => {
    expect(
      validateCommunityPost({
        body: "   ",
        authorName: "",
        cropTags: [],
      }),
    ).toBe("Write an update before posting.");
    expect(
      validateCommunityPost({
        body: "The wheat is growing well.",
        authorName: "Asha",
        cropTags: ["Wheat"],
      }),
    ).toBeNull();
  });

  it("rejects phone numbers and precise coordinates", () => {
    expect(validateCommunityText("Call me at +91 98765 43210")).toMatch(/phone numbers/i);
    expect(validateCommunityText("My field is at 18.520400, 73.856700")).toMatch(
      /GPS coordinates/i,
    );
    expect(validateCommunityText("Harvest begins next week")).toBeNull();
  });

  it("enforces the crop-tag limit", () => {
    expect(
      validateCommunityPost({
        body: "Sharing today's update.",
        authorName: "Asha",
        cropTags: ["1", "2", "3", "4", "5", "6"],
      }),
    ).toMatch(/no more than 5/i);
  });

  it("accepts only supported image formats and file sizes", () => {
    const makeFile = (name: string, type: string, size: number) =>
      new File([new Uint8Array(size)], name, { type });

    expect(validateCommunityImage(makeFile("crop.jpg", "image/jpeg", 64))).toBeNull();
    expect(validateCommunityImage(makeFile("crop.svg", "image/svg+xml", 64))).toMatch(
      /JPG, PNG, or WebP/,
    );
    expect(validateCommunityImage(makeFile("crop.png", "image/png", 5 * 1024 * 1024 + 1))).toMatch(
      /5 MB/,
    );
  });
});
