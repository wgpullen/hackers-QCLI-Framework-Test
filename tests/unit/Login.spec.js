import { render, fireEvent } from "@testing-library/vue";
import Login from "@/views/Login.vue";
import Vuex from "vuex";
import Vue from "vue";

// Set up Vue to use Vuex
Vue.use(Vuex);

describe("Login.vue", () => {
  let store;
  let actions;

  beforeEach(() => {
    // Set up Vuex store with mock login action
    actions = {
      login: jest.fn(),
    };

    store = new Vuex.Store({
      actions,
    });
  });

  const renderLogin = () => {
    return render(Login, {
      store,
    });
  };

  it("renders login form correctly", () => {
    const { getByText, getByLabelText, getByRole } = renderLogin();

    // Check title and form elements
    expect(getByRole("heading", { name: "Login" })).toBeTruthy();
    expect(getByLabelText("Username")).toBeTruthy();
    expect(getByLabelText("Password")).toBeTruthy();
    expect(getByRole("button", { name: "Login" })).toBeTruthy();
  });

  it("shows helper links for test accounts", () => {
    const { getByText } = renderLogin();

    expect(getByText("Normal user: normaluser/normaluser")).toBeTruthy();
    expect(getByText("Beta user: betauser/betauser")).toBeTruthy();
  });

  it("allows user input in form fields", async () => {
    const { getByLabelText } = renderLogin();

    const usernameInput = getByLabelText("Username");
    const passwordInput = getByLabelText("Password");

    await fireEvent.update(usernameInput, "testuser");
    await fireEvent.update(passwordInput, "testpass");

    expect(usernameInput.value).toBe("testuser");
    expect(passwordInput.value).toBe("testpass");
  });

  it("calls login action with form data when submitted", async () => {
    const { getByLabelText, getByRole } = renderLogin();

    // Fill in the form
    await fireEvent.update(getByLabelText("Username"), "testuser");
    await fireEvent.update(getByLabelText("Password"), "testpass");

    // Submit the form
    await fireEvent.click(getByRole("button", { name: "Login" }));

    // Verify login action was called with correct data
    expect(actions.login).toHaveBeenCalledWith(expect.anything(), {
      username: "testuser",
      password: "testpass",
    });
  });

  it("fills in normal user credentials when helper link is clicked", async () => {
    const { getByText, getByLabelText } = renderLogin();

    await fireEvent.click(getByText("Normal user: normaluser/normaluser"));

    expect(getByLabelText("Username").value).toBe("normaluser");
    expect(getByLabelText("Password").value).toBe("normaluser");
  });

  it("fills in beta user credentials when helper link is clicked", async () => {
    const { getByText, getByLabelText } = renderLogin();

    await fireEvent.click(getByText("Beta user: betauser/betauser"));

    expect(getByLabelText("Username").value).toBe("betauser");
    expect(getByLabelText("Password").value).toBe("betauser");
  });

  it("requires username and password fields", () => {
    const { getByLabelText } = renderLogin();

    const usernameInput = getByLabelText("Username");
    const passwordInput = getByLabelText("Password");

    expect(usernameInput.hasAttribute("required")).toBe(true);
    expect(passwordInput.hasAttribute("required")).toBe(true);
  });

  it("uses password type for password field", () => {
    const { getByLabelText } = renderLogin();

    const passwordInput = getByLabelText("Password");
    expect(passwordInput.getAttribute("type")).toBe("password");
  });

  it("prevents default form submission", async () => {
    const { container, getByRole } = renderLogin();
    const form = container.querySelector("form");
    const submitEvent = new Event("submit");
    const preventDefault = jest.fn();
    submitEvent.preventDefault = preventDefault;

    form.dispatchEvent(submitEvent);

    expect(preventDefault).toHaveBeenCalled();
  });
});
