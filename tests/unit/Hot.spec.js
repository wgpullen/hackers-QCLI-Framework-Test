import { render, screen } from "@testing-library/vue";
import Hot from "@/views/Hot.vue";
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
      [h("h2", this.title), h("span", `by ${this.user}`)],
    );
  },
}));

describe("Hot.vue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTopStories = [1, 2, 3];
  const mockStoryDetails = [
    {
      id: 1,
      title: "First Story",
      url: "https://example.com/1",
      score: 100,
      by: "user1",
      descendants: 50,
    },
    {
      id: 2,
      title: "Second Story",
      url: "https://example.com/2",
      score: 200,
      by: "user2",
      descendants: 75,
    },
    {
      id: 3,
      title: "Third Story",
      url: "https://example.com/3",
      score: 300,
      by: "user3",
      descendants: 25,
    },
  ];

  it("renders the page title correctly", async () => {
    // Mock successful responses
    axios.get.mockImplementation((url) => {
      if (url.includes("topstories")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: {} });
    });

    const { getByText } = render(Hot);
    expect(getByText("Hot posts")).toBeTruthy();
  });

  it("fetches and displays posts correctly", async () => {
    // Mock the API calls
    axios.get.mockImplementation((url) => {
      if (url.includes("topstories")) {
        return Promise.resolve({ data: mockTopStories });
      }
      const storyId = parseInt(url.split("/").pop().split(".")[0]);
      const story = mockStoryDetails.find((s) => s.id === storyId);
      return Promise.resolve({ data: story });
    });

    const { findAllByTestId, findByText } = render(Hot);

    // Wait for all list items to be rendered
    const listItems = await findAllByTestId("list-item");
    expect(listItems).toHaveLength(3);

    // Verify some content is rendered
    expect(await findByText("First Story")).toBeTruthy();
    expect(await findByText("by user1")).toBeTruthy();

    // Verify that API was called correctly
    expect(axios.get).toHaveBeenCalledWith(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
    );
    mockTopStories.forEach((id) => {
      expect(axios.get).toHaveBeenCalledWith(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      );
    });
  });

  it("renders empty state when API fails", async () => {
    // Mock failed API call
    axios.get.mockRejectedValueOnce(new Error("API Error"));

    const { container } = render(Hot);
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
            title: `Story ${storyId}`,
            url: `https://example.com/${storyId}`,
            score: 100,
            by: `user${storyId}`,
            descendants: 50,
          },
        });
      });

    const { findAllByTestId } = render(Hot);

    // Wait for all list items and verify max 20 are displayed
    const items = await findAllByTestId("list-item");
    expect(items.length).toBeLessThanOrEqual(20);

    // Verify API calls
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(axios.get).toHaveBeenCalledTimes(21); // 1 for topstories + 20 for individual stories
  });

  it("handles posts without URLs gracefully", async () => {
    const storyWithoutUrl = {
      id: 1,
      title: "Story without URL",
      score: 100,
      by: "user1",
      descendants: 50,
      // url is intentionally missing
    };

    axios.get
      .mockImplementationOnce(() => Promise.resolve({ data: [1] }))
      .mockImplementationOnce(() => Promise.resolve({ data: storyWithoutUrl }));

    const { findByText } = render(Hot);

    // Verify the story is still rendered
    const storyTitle = await findByText("Story without URL");
    expect(storyTitle).toBeTruthy();
  });
});
