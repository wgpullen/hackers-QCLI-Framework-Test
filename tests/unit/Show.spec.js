import { render, screen } from "@testing-library/vue";
import Show from "@/views/Show.vue";
import axios from "axios";

// Mock axios
jest.mock("axios");

// Mock the ListItem component with a render function
jest.mock("@/components/ListItem.vue", () => ({
  name: "ListItem",
  props: {
    title: String,
    link: String,
    score: Number,
    user: String,
    comment_link: String,
    comment_count: Number,
  },
  render(h) {
    return h(
      "div",
      {
        attrs: {
          "data-testid": "list-item",
        },
      },
      [
        h("h2", this.title),
        h("span", `by ${this.user}`),
        h("a", { attrs: { href: this.link } }, "link"),
      ],
    );
  },
}));

describe("Show.vue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockShowStories = [1, 2, 3];
  const mockStoryDetails = [
    {
      id: 1,
      title: "Show HN: First Project",
      url: "https://github.com/user1/project1",
      score: 100,
      by: "user1",
      descendants: 50,
    },
    {
      id: 2,
      title: "Show HN: Second Project",
      url: "https://github.com/user2/project2",
      score: 200,
      by: "user2",
      descendants: 75,
    },
    {
      id: 3,
      title: "Show HN: Third Project",
      url: "https://github.com/user3/project3",
      score: 300,
      by: "user3",
      descendants: 25,
    },
  ];

  it("renders the page title correctly", async () => {
    // Mock successful responses
    axios.get.mockImplementation((url) => {
      if (url.includes("showstories")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: {} });
    });

    const { getByText } = render(Show);
    expect(getByText("Show HN")).toBeTruthy();
  });

  it("fetches and displays show posts correctly", async () => {
    // Mock the API calls
    axios.get.mockImplementation((url) => {
      if (url.includes("showstories")) {
        return Promise.resolve({ data: mockShowStories });
      }
      const storyId = parseInt(url.split("/").pop().split(".")[0]);
      const story = mockStoryDetails.find((s) => s.id === storyId);
      return Promise.resolve({ data: story });
    });

    const { findAllByTestId, findByText } = render(Show);

    // Wait for all list items to be rendered
    const listItems = await findAllByTestId("list-item");
    expect(listItems).toHaveLength(3);

    // Verify some content is rendered
    expect(await findByText("Show HN: First Project")).toBeTruthy();
    expect(await findByText("by user1")).toBeTruthy();

    // Verify that API was called correctly
    expect(axios.get).toHaveBeenCalledWith(
      "https://hacker-news.firebaseio.com/v0/showstories.json",
    );
    mockShowStories.forEach((id) => {
      expect(axios.get).toHaveBeenCalledWith(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      );
    });
  });

  it("renders empty state when API fails", async () => {
    // Mock failed API call
    axios.get.mockRejectedValueOnce(new Error("API Error"));

    const { container } = render(Show);
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify only the container and title are rendered
    expect(
      container.querySelectorAll('[data-testid="list-item"]'),
    ).toHaveLength(0);
  });

  it("limits the number of posts to 20", async () => {
    // Create array of 30 story IDs
    const manyStories = Array.from({ length: 30 }, (_, i) => i + 1);

    // Mock the API calls
    axios.get
      .mockImplementationOnce(() => Promise.resolve({ data: manyStories }))
      .mockImplementation((url) => {
        const storyId = parseInt(url.split("/").pop().split(".")[0]);
        return Promise.resolve({
          data: {
            id: storyId,
            title: `Show HN: Project ${storyId}`,
            url: `https://example.com/project${storyId}`,
            score: 100,
            by: `user${storyId}`,
            descendants: 50,
          },
        });
      });

    const { findAllByTestId } = render(Show);

    // Wait for all list items and verify max 20 are displayed
    const items = await findAllByTestId("list-item");
    expect(items.length).toBeLessThanOrEqual(20);

    // Verify API calls
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(axios.get).toHaveBeenCalledTimes(21); // 1 for showstories + 20 for individual stories
  });

  it("properly passes URLs to list items", async () => {
    const story = {
      id: 1,
      title: "Show HN: Test Project",
      url: "https://example.com/project",
      score: 100,
      by: "user1",
      descendants: 50,
    };

    axios.get
      .mockImplementationOnce(() => Promise.resolve({ data: [1] }))
      .mockImplementationOnce(() => Promise.resolve({ data: story }));

    const { findByTestId } = render(Show);

    // Wait for the component to render
    const listItem = await findByTestId("list-item");
    const link = listItem.querySelector("a");
    expect(link.getAttribute("href")).toBe(story.url);
  });
});
