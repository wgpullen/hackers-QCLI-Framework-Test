import { render, screen } from "@testing-library/vue";
import Ask from "@/views/Ask.vue";
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

describe("Ask.vue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAskStories = [1, 2, 3];
  const mockStoryDetails = [
    {
      id: 1,
      title: "Ask HN: First Question",
      score: 100,
      by: "user1",
      descendants: 50,
    },
    {
      id: 2,
      title: "Ask HN: Second Question",
      score: 200,
      by: "user2",
      descendants: 75,
    },
    {
      id: 3,
      title: "Ask HN: Third Question",
      score: 300,
      by: "user3",
      descendants: 25,
    },
  ];

  it("renders the page title correctly", async () => {
    // Mock successful responses
    axios.get.mockImplementation((url) => {
      if (url.includes("askstories")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: {} });
    });

    const { getByText } = render(Ask);
    expect(getByText("Ask HN")).toBeTruthy();
  });

  it("fetches and displays ask posts correctly", async () => {
    // Mock the API calls
    axios.get.mockImplementation((url) => {
      if (url.includes("askstories")) {
        return Promise.resolve({ data: mockAskStories });
      }
      const storyId = parseInt(url.split("/").pop().split(".")[0]);
      const story = mockStoryDetails.find((s) => s.id === storyId);
      return Promise.resolve({ data: story });
    });

    const { findAllByTestId, findByText } = render(Ask);

    // Wait for all list items to be rendered
    const listItems = await findAllByTestId("list-item");
    expect(listItems).toHaveLength(3);

    // Verify some content is rendered
    expect(await findByText("Ask HN: First Question")).toBeTruthy();
    expect(await findByText("by user1")).toBeTruthy();

    // Verify that API was called correctly
    expect(axios.get).toHaveBeenCalledWith(
      "https://hacker-news.firebaseio.com/v0/askstories.json",
    );
    mockAskStories.forEach((id) => {
      expect(axios.get).toHaveBeenCalledWith(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      );
    });
  });

  it("renders empty state when API fails", async () => {
    // Mock failed API call
    axios.get.mockRejectedValueOnce(new Error("API Error"));

    const { container } = render(Ask);
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
            title: `Ask HN: Question ${storyId}`,
            score: 100,
            by: `user${storyId}`,
            descendants: 50,
          },
        });
      });

    const { findAllByTestId } = render(Ask);

    // Wait for all list items and verify max 20 are displayed
    const items = await findAllByTestId("list-item");
    expect(items.length).toBeLessThanOrEqual(20);

    // Verify API calls
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(axios.get).toHaveBeenCalledTimes(21); // 1 for askstories + 20 for individual stories
  });
});
