import { render, fireEvent } from "@testing-library/vue";
import Vue from "vue";
import Vuex from "vuex";
import Buefy from "buefy";
import Nav from "@/components/Nav.vue";
import { Flags } from "../../src/utils/flag";
import { betaAccess } from "../../src/utils/users";
import Router from "vue-router";

// Set up Vue with required plugins
Vue.use(Vuex);
Vue.use(Buefy);
Vue.use(Router);

// Mock the feature flags
jest.mock("../../src/utils/flag", () => ({
  Flags: {
    headerColor: {
      getValue: jest.fn(),
    },
    ask: {
      isEnabled: jest.fn(),
    },
    show: {
      isEnabled: jest.fn(),
    },
  },
}));

// Mock the beta access utility
jest.mock("../../src/utils/users", () => ({
  betaAccess: jest.fn(),
}));

// Mock Rox browser
jest.mock("rox-browser", () => ({
  showOverrides: jest.fn(),
  dynamicApi: {
    isEnabled: jest.fn(),
  },
}));

describe("Nav.vue", () => {
  let store;
  let actions;
  let state;
  let mutations;
  let router;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set up store pieces to match your actual store
    actions = {
      logout: jest.fn(),
    };

    mutations = {
      logout: jest.fn(),
    };

    state = {
      user: null,
      loggedIn: false,
    };

    // Create a fresh Vuex store before each test
    store = new Vuex.Store({
      state,
      actions,
      mutations,
    });

    // Create router instance
    router = new Router({
      mode: "history",
      routes: [
        { path: "/", name: "home" },
        { path: "/login", name: "login" },
        { path: "/ask", name: "ask" },
        { path: "/show", name: "show" },
      ],
    });

    // Set default mock returns
    Flags.headerColor.getValue.mockReturnValue("is-white");
    Flags.ask.isEnabled.mockReturnValue(false);
    Flags.show.isEnabled.mockReturnValue(false);
    betaAccess.mockReturnValue(false);
  });

  const renderNav = () => {
    return render(Nav, {
      store,
      router,
    });
  };

  it("renders basic navbar elements", () => {
    const { getByText } = renderNav();

    expect(getByText("HN")).toBeTruthy();
    expect(getByText("Hot")).toBeTruthy();
    expect(getByText("Log in")).toBeTruthy();
  });

  it("shows beta tester badge when user is beta", () => {
    betaAccess.mockReturnValue(true);

    const { getByText } = renderNav();
    expect(getByText("Beta tester")).toBeTruthy();
  });

  it("shows DEV button in development environment", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const { getByText } = renderNav();
    expect(getByText("DEV")).toBeTruthy();

    // Clean up
    process.env.NODE_ENV = originalEnv;
  });

  it("shows Ask link when flag is enabled", () => {
    Flags.ask.isEnabled.mockReturnValue(true);

    const { getByText } = renderNav();
    expect(getByText("Ask")).toBeTruthy();
  });

  it("shows Show link when flag is enabled", () => {
    Flags.show.isEnabled.mockReturnValue(true);

    const { getByText } = renderNav();
    expect(getByText("Show")).toBeTruthy();
  });

  it("shows logout button when user is logged in", () => {
    store.state.loggedIn = true;

    const { getByText, queryByText } = renderNav();
    expect(getByText("Log out")).toBeTruthy();
    expect(queryByText("Log in")).toBeNull();
  });

  it("calls logout action when logout button is clicked", async () => {
    store.state.loggedIn = true;

    const { getByText } = renderNav();
    await fireEvent.click(getByText("Log out"));
    expect(actions.logout).toHaveBeenCalled();
  });

  it("shows rollout overrides when DEV button is clicked", async () => {
    process.env.NODE_ENV = "development";

    const { getByText } = renderNav();
    await fireEvent.click(getByText("DEV"));
    expect(require("rox-browser").showOverrides).toHaveBeenCalled();
  });

  it("applies correct header color from flag", () => {
    Flags.headerColor.getValue.mockReturnValue("is-primary");

    const { container } = renderNav();
    const navbar = container.querySelector(".navbar");
    expect(navbar.classList.contains("is-primary")).toBe(true);
  });
});
