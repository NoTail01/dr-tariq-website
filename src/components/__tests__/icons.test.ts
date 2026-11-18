import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ArrowRightIcon,
  BulletIcon,
  CheckIcon,
  CloseIcon,
  PlusIcon,
  WarningIcon,
} from "@/components/Icons";

const icons = {
  CheckIcon,
  ArrowRightIcon,
  PlusIcon,
  BulletIcon,
  WarningIcon,
  CloseIcon,
};

function render(icon: (typeof icons)[keyof typeof icons], className?: string) {
  return renderToStaticMarkup(createElement(icon, className === undefined ? {} : { className }));
}

function sizeAttributes(markup: string) {
  const width = markup.match(/width="(\d+)"/);
  const height = markup.match(/height="(\d+)"/);
  return {
    width: width ? Number(width[1]) : null,
    height: height ? Number(height[1]) : null,
  };
}

describe("shared icons", () => {
  // Regression: BulletIcon used to rely only on its default className for
  // sizing. A caller that passed just colour classes (the About memberships
  // list) removed the size, and the SVG grew to the width of the flex row,
  // squeezing the adjacent text into a one-character column.
  it("keeps a bounded intrinsic size when a caller passes only colour classes", () => {
    for (const [name, icon] of Object.entries(icons)) {
      const { width, height } = sizeAttributes(render(icon, "mt-2 text-brand-600"));
      expect(width, name + " width attribute").not.toBeNull();
      expect(height, name + " height attribute").not.toBeNull();
      expect(width, name + " width is bounded").toBeLessThanOrEqual(24);
      expect(height, name + " height is bounded").toBeLessThanOrEqual(24);
      expect(width, name + " is square").toBe(height);
    }
  });

  it("renders the bullet marker at 8px even without size classes", () => {
    const markup = render(BulletIcon, "text-brand-600");
    expect(sizeAttributes(markup)).toEqual({ width: 8, height: 8 });
    expect(markup).toContain("shrink-0");
  });

  it("keeps caller size utilities so existing layouts are unchanged", () => {
    expect(render(CheckIcon, "h-4 w-4 text-brand-600")).toContain("h-4 w-4");
    expect(render(ArrowRightIcon, "h-4 w-4 rtl:rotate-180")).toContain("h-4 w-4");
    expect(render(BulletIcon, "h-2 w-2 text-brand-600")).toContain("h-2 w-2");
  });

  it("keeps the documented default size classes when none are passed", () => {
    expect(render(CheckIcon)).toContain("h-5 w-5");
    expect(render(BulletIcon)).toContain("h-2 w-2");
    expect(render(ArrowRightIcon)).toContain("h-4 w-4");
  });
});
