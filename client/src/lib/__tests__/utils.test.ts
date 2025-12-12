import { cn } from '../utils.js';

describe("Utils", () => {
  describe("cn", () => {
    it("merges class names correctly", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
    });

    it("handles conditional classes", () => {
      expect(cn("class1", false && "class2", "class3")).toBe("class1 class3");
    });

    it("handles undefined and null values", () => {
      expect(cn("class1", undefined, null, "class2")).toBe("class1 class2");
    });

    it("handles empty strings", () => {
      expect(cn("class1", "", "class2")).toBe("class1 class2");
    });

    it("handles object syntax", () => {
      expect(cn({ class1: true, class2: false, class3: true })).toBe(
        "class1 class3",
      );
    });

    it("handles array of classes", () => {
      expect(cn(["class1", "class2"])).toBe("class1 class2");
    });

    it("handles complex combinations", () => {
      expect(
        cn(
          "base-class",
          { "conditional-class": true, "disabled-class": false },
          ["array-class1", "array-class2"],
          null,
          undefined,
          "",
        ),
      ).toBe("base-class conditional-class array-class1 array-class2");
    });

    it("handles Tailwind class conflicts with twMerge", () => {
      expect(cn("p-4", "p-2")).toBe("p-2");
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    });

    it("handles duplicate classes", () => {
      expect(cn("class1", "class2", "class1")).toBe("class1 class2 class1");
    });
  });
});
