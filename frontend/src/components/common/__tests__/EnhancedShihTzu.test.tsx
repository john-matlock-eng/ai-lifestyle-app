import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EnhancedShihTzu from "../EnhancedShihTzu";

// Mock window dimensions
const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: height,
  });
};

describe("EnhancedShihTzu", () => {
  beforeEach(() => {
    // Reset window dimensions
    mockWindowDimensions(1024, 768);
  });

  describe("Rendering", () => {
    it("renders the companion at the specified position", () => {
      const { container } = render(
        <EnhancedShihTzu position={{ x: 100, y: 200 }} />,
      );

      const companion = container.firstChild as HTMLElement;
      expect(companion.style.left).toBe("100px");
      expect(companion.style.top).toBe("200px");
    });

    it("applies the correct size classes", () => {
      const { container: smallContainer } = render(
        <EnhancedShihTzu size="sm" />,
      );
      const { container: largeContainer } = render(
        <EnhancedShihTzu size="lg" />,
      );

      const smallSvg = smallContainer.querySelector("svg");
      const largeSvg = largeContainer.querySelector("svg");

      expect(smallSvg?.getAttribute("width")).toBe("60");
      expect(largeSvg?.getAttribute("width")).toBe("100");
    });

    it("renders thought bubble when shown", () => {
      render(
        <EnhancedShihTzu showThoughtBubble={true} thoughtText="Hello there!" />,
      );

      expect(screen.getByText("Hello there!")).toBeInTheDocument();
    });

    it("does not render thought bubble when hidden", () => {
      render(
        <EnhancedShihTzu
          showThoughtBubble={false}
          thoughtText="Hello there!"
        />,
      );

      expect(screen.queryByText("Hello there!")).not.toBeInTheDocument();
    });
  });

  describe("Thought Bubble Positioning", () => {
    it("positions thought bubble above companion", () => {
      const { container } = render(
        <EnhancedShihTzu
          position={{ x: 500, y: 400 }}
          showThoughtBubble={true}
          thoughtText="Test thought"
          size="md"
        />,
      );

      const thoughtBubble = container.querySelector(".animate-float-subtle")
        ?.parentElement as HTMLElement;
      expect(thoughtBubble).toBeTruthy();

      // Thought bubble should be positioned with bottom offset from companion height
      const bottomStyle = thoughtBubble.style.bottom;
      expect(bottomStyle).toMatch(/\d+px/); // Should have a pixel value
      expect(parseInt(bottomStyle)).toBeGreaterThan(80); // Above the companion
    });

    it("adjusts thought bubble size on mobile", () => {
      mockWindowDimensions(375, 667); // iPhone size

      const { container } = render(
        <EnhancedShihTzu showThoughtBubble={true} thoughtText="Mobile test" />,
      );

      const thoughtBubble = container.querySelector(
        ".absolute.left-1\\/2.transform.-translate-x-1\\/2",
      ) as HTMLElement;
      expect(thoughtBubble).toBeTruthy();
      expect(thoughtBubble.style.maxWidth).toBe("250px");
    });
  });

  describe("Interactions", () => {
    it("calls onPet when clicked with onPet handler", () => {
      const onPet = vi.fn();
      const { container } = render(<EnhancedShihTzu onPet={onPet} />);

      const companion = container.firstChild as HTMLElement;
      fireEvent.mouseDown(companion);

      expect(onPet).toHaveBeenCalled();
    });

    it("shows petting feedback when configured", async () => {
      const onPet = vi.fn();
      const { container, rerender } = render(<EnhancedShihTzu onPet={onPet} />);

      const companion = container.firstChild as HTMLElement;
      fireEvent.mouseDown(companion);

      expect(onPet).toHaveBeenCalled();

      // Simulate the parent component showing thought bubble after pet
      rerender(
        <EnhancedShihTzu
          onPet={onPet}
          showThoughtBubble={true}
          thoughtText="Good dog! 🥰"
        />,
      );

      await waitFor(() => {
        const elements = screen.getAllByText("Good dog! 🥰");
        expect(elements.length).toBeGreaterThan(0);
        expect(elements[0]).toBeInTheDocument();
      });
    });

    it("handles touch events on mobile", () => {
      const onPet = vi.fn();
      const { container } = render(<EnhancedShihTzu onPet={onPet} />);

      const companion = container.firstChild as HTMLElement;
      fireEvent.touchStart(companion);

      expect(onPet).toHaveBeenCalled();
    });
  });

  describe("Particle Effects", () => {
    it("renders particle effects when specified", async () => {
      const { container } = render(<EnhancedShihTzu particleEffect="hearts" />);

      // Wait for particles to be created
      await waitFor(() => {
        const hearts = container.querySelectorAll(".animate-float-up");
        expect(hearts.length).toBeGreaterThan(0);
        expect(hearts[0].textContent).toBe("❤️");
      });
    });

    it("renders different particle types correctly", async () => {
      const particleTypes = [
        { type: "hearts" as const, emoji: "❤️" },
        { type: "sparkles" as const, emoji: "✨" },
        { type: "treats" as const, emoji: "🦴" },
        { type: "zzz" as const, emoji: "Z" },
      ];

      for (const { type, emoji } of particleTypes) {
        const { container, unmount } = render(
          <EnhancedShihTzu particleEffect={type} />,
        );

        await waitFor(() => {
          const particles = container.querySelectorAll(".animate-float-up");
          expect(particles.length).toBeGreaterThan(0);
          expect(particles[0].textContent).toBe(emoji);
        });

        unmount(); // Clean up between renders
      }
    });
  });

  describe("Mood Animations", () => {
    it("applies bounce animation for happy mood", () => {
      const { container } = render(<EnhancedShihTzu mood="happy" />);

      const svg = container.querySelector("svg");
      expect(svg?.classList.contains("animate-bounce-subtle")).toBe(true);
    });

    it("applies wiggle animation for excited mood", () => {
      const { container } = render(<EnhancedShihTzu mood="excited" />);

      const svg = container.querySelector("svg");
      expect(svg?.classList.contains("animate-wiggle-subtle")).toBe(true);
    });

    it("shows sleeping eyes for sleeping mood", () => {
      const { container } = render(<EnhancedShihTzu mood="sleeping" />);

      // Should have curved lines instead of circles for eyes
      const paths = container.querySelectorAll("path");
      const eyePaths = Array.from(paths).filter((path) => {
        const d = path.getAttribute("d") || "";
        return d.includes("M 39 35 Q") || d.includes("M 55 35 Q");
      });
      expect(eyePaths.length).toBe(2); // Two closed eyes
    });
  });

  describe("Responsive Behavior", () => {
    it("adjusts companion size on mobile", () => {
      mockWindowDimensions(375, 667);

      const { container } = render(<EnhancedShihTzu size="md" />);

      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("width")).toBe("60"); // Smaller on mobile
    });

    it("maintains high z-index for visibility", () => {
      const { container } = render(<EnhancedShihTzu />);

      const companion = container.firstChild as HTMLElement;
      expect(parseInt(companion.style.zIndex)).toBeGreaterThanOrEqual(9999);
    });

    it("allows z-index override through style prop", () => {
      const { container } = render(
        <EnhancedShihTzu style={{ zIndex: 5000 }} />,
      );

      const companion = container.firstChild as HTMLElement;
      expect(companion.style.zIndex).toBe("5000");
    });
  });

  describe("Variant Rendering", () => {
    it("renders balloon variant decorations", () => {
      const { container } = render(<EnhancedShihTzu variant="balloon" />);

      // Should have balloon circles
      const circles = container.querySelectorAll("circle");
      const balloons = Array.from(circles).filter((circle) => {
        const fill = circle.getAttribute("fill") || "";
        return fill.includes("url(#balloonGradient");
      });
      expect(balloons.length).toBeGreaterThan(0);
    });

    it("applies correct colors for different variants", () => {
      const variants = [
        "default",
        "winter",
        "party",
        "workout",
        "balloon",
      ] as const;

      variants.forEach((variant) => {
        const { container } = render(<EnhancedShihTzu variant={variant} />);

        const gradientStops = container.querySelectorAll("radialGradient stop");
        expect(gradientStops.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Accessibility", () => {
    it("prevents text selection on companion", () => {
      const { container } = render(<EnhancedShihTzu />);

      const companion = container.firstChild as HTMLElement;
      expect(companion.classList.contains("select-none")).toBe(true);
    });

    it("maintains cursor pointer for interactivity", () => {
      const { container } = render(<EnhancedShihTzu />);

      const companion = container.firstChild as HTMLElement;
      expect(companion.classList.contains("cursor-pointer")).toBe(true);
    });
  });
});
