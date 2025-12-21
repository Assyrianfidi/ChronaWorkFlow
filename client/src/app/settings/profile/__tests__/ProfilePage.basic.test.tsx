import { render, screen } from "@testing-library/react";
import ProfilePage from '../page';

describe("ProfilePage - Basic Tests", () => {
  it("renders the profile form with all sections", () => {
    render(<ProfilePage />);

    // Check that all main sections are rendered
    expect(
      screen.getByRole("heading", { name: /profile information/i }),
    ).toBeInTheDocument();

    // Check form sections
    expect(screen.getByText("Full name")).toBeInTheDocument();
    expect(screen.getByText("Email address")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(screen.getByText("Profile photo")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();

    // Check buttons
    expect(
      screen.getByRole("button", { name: /change password/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("has form inputs with correct default values", () => {
    render(<ProfilePage />);

    // Check default values using getByDisplayValue
    const nameInput = screen.getByDisplayValue("John Doe");
    const emailInput = screen.getByDisplayValue("john@example.com");
    const phoneInput = screen.getByDisplayValue("+1 (555) 123-4567");

    expect(nameInput).toHaveAttribute("type", "text");
    expect(emailInput).toHaveAttribute("type", "email");
    expect(phoneInput).toHaveAttribute("type", "tel");
  });

  it("has a profile photo placeholder", () => {
    render(<ProfilePage />);

    // Check profile photo section using test ID
    const profilePhoto = screen.getByTestId("profile-photo-placeholder");
    expect(profilePhoto).toBeInTheDocument();

    // Find the parent container of the profile photo and then find the change button within it
    const profilePhotoSection = profilePhoto.closest("div.flex.items-center");
    const changeButton = profilePhotoSection?.querySelector("button");
    expect(changeButton).toHaveTextContent("Change");
  });

  it("has an about section with a textarea", () => {
    render(<ProfilePage />);

    // Get the about textarea by its parent's text content
    const aboutLabel = screen.getByText("About").closest("div");
    const aboutTextarea = aboutLabel?.querySelector("textarea");

    expect(aboutTextarea).toBeInTheDocument();
    expect(aboutTextarea).toHaveAttribute("rows", "3");
  });
});
