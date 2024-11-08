import { render, screen } from "@testing-library/vue";
import ListItem from "@/components/ListItem.vue";
import { Flags } from "../../src/utils/flag";

jest.mock("../../src/utils/flag", () => ({
  Flags: {
    score: {
      isEnabled: jest.fn(),
    },
  },
}));

describe("ListItem.vue", () => {
  const defaultProps = {
    title: "Test Article",
    user: "testuser",
    link: "https://example.com/article",
    comment_link: "https://example.com/comments",
    score: 42,
    comment_count: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all props correctly when score flag is enabled", () => {
    // Mock the flag to be enabled
    Flags.score.isEnabled.mockReturnValue(true);

    const { container } = render(ListItem, {
      props: defaultProps,
    });

    // Check title and link
    const titleLink = screen.getByText(defaultProps.title).closest("a");
    expect(titleLink.getAttribute("href")).toBe(defaultProps.link);

    // Check user link
    const userLink = screen.getByText(defaultProps.user).closest("a");
    expect(userLink.getAttribute("href")).toBe(
      `https://news.ycombinator.com/user?id=${defaultProps.user}`,
    );

    // Check comments link
    const commentsLink = screen
      .getByText(`${defaultProps.comment_count} comments`)
      .closest("a");
    expect(commentsLink.getAttribute("href")).toBe(defaultProps.comment_link);
  });

  it("hides score when flag is disabled", () => {
    // Mock the flag to be disabled
    Flags.score.isEnabled.mockReturnValue(false);

    const { container } = render(ListItem, {
      props: defaultProps,
    });

    // Score should not be visible
    expect(screen.queryByText(defaultProps.score.toString())).toBe(null);
    expect(container.querySelector(".score-box")).toBe(null);
  });

  // it("shows error alert when score flag is enabled", () => {
  //   // Mock the flag to be enabled
  //   Flags.score.isEnabled.mockReturnValue(true);
  //
  //   const { container } = render(ListItem, {
  //     props: defaultProps,
  //   });
  //
  //   // Check if error alert is present
  //   expect(screen.getByText("ERROR!")).toBeTruthy();
  // });

  it("handles missing optional props gracefully", () => {
    // Mock the flag to be enabled
    Flags.score.isEnabled.mockReturnValue(true);

    const { container } = render(ListItem, {
      props: {
        title: "Test Article",
        user: "testuser",
      },
    });

    // Basic content should still render
    expect(screen.getByText("Test Article")).toBeTruthy();
    expect(screen.getByText("testuser")).toBeTruthy();

    // Optional elements should not cause errors
    expect(screen.queryByText("undefined")).toBe(null);
  });

  describe("prop validation", () => {
    const testCases = [
      {
        prop: "score",
        value: "not a number",
        expectedConsoleError: true,
      },
      {
        prop: "comment_count",
        value: "not a number",
        expectedConsoleError: true,
      },
      {
        prop: "title",
        value: 42,
        expectedConsoleError: true,
      },
      {
        prop: "user",
        value: {},
        expectedConsoleError: true,
      },
    ];

    testCases.forEach(({ prop, value, expectedConsoleError }) => {
      it(`validates ${prop} prop type`, () => {
        // Mock console.error to track validation warnings
        const originalConsoleError = console.error;
        console.error = jest.fn();

        const props = {
          ...defaultProps,
          [prop]: value,
        };

        render(ListItem, { props });

        if (expectedConsoleError) {
          expect(console.error).toHaveBeenCalled();
        } else {
          expect(console.error).not.toHaveBeenCalled();
        }

        // Restore console.error
        console.error = originalConsoleError;
      });
    });
  });
});
