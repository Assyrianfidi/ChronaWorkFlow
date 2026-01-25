import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import AdminDashboard from "../page";
import { useAuthStore } from "@/store/auth-store";

// Mock auth store
vi.mock("@/store/auth-store", () => ({
  useAuthStore: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("AdminDashboard", () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    vi.mocked(useAuthStore).mockReturnValue({
      user: { role: "ADMIN" },
      isLoading: false,
    } as any);

    // Mock router
    const pushMock = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: pushMock,
    } as any);
  });

  it("renders the admin dashboard with user management table", async () => {
    render(<AdminDashboard />);

    // Check if the page title is rendered
    expect(screen.getByText("User Management")).toBeInTheDocument();

    // Check if the table headers are rendered
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("redirects to unauthorized if user is not admin", async () => {
    // Mock non-admin user
    vi.mocked(useAuthStore).mockReturnValue({
      user: { role: "USER" },
      isLoading: false,
    } as any);

    const pushMock = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: pushMock } as any);

    render(<AdminDashboard />);

    // Check if redirect was called
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/unauthorized");
    });
  });
});
