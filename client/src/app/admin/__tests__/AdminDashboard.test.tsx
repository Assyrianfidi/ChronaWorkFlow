import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { useRouter, redirect } from "next/navigation";
import AdminDashboard from '../page.js';
import { UserRole } from '../types/next-auth.js';

// Mock next-auth/react
vi.mock("next-auth/react");

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  redirect: vi.fn(),
}));

// Mock prisma
vi.mock("../lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock the server actions
const mockUpdateUserRole = vi.fn();
vi.mock("../actions", () => ({
  updateUserRole: mockUpdateUserRole,
}));

describe("AdminDashboard", () => {
  const mockUsers = [
    {
      id: "1",
      name: "Admin User",
      email: "admin@example.com",
      role: "ADMIN",
      emailVerified: new Date(),
      image: null,
      accounts: [],
    },
    {
      id: "2",
      name: "Regular User",
      email: "user@example.com",
      role: "USER",
      emailVerified: new Date(),
      image: null,
      accounts: [],
    },
  ];

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock session
// @ts-ignore
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          role: "ADMIN",
        },
      },
      status: "authenticated",
    });

    // Mock router
    const pushMock = vi.fn();
// @ts-ignore
    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock,
    });

    // Mock prisma response
    const { prisma } = require("../lib/prisma");
    prisma.user.findMany.mockResolvedValue(mockUsers);
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

    // Check if user data is rendered
    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
      expect(screen.getByText("Regular User")).toBeInTheDocument();
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });
  });

  it("shows loading state while fetching data", async () => {
    // Mock a delayed response
    const { prisma } = require("../lib/prisma");
    prisma.user.findMany.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(mockUsers), 1000)),
    );

    render(<AdminDashboard />);

    // Check if loading state is shown
    expect(screen.getByText("Loading users...")).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });
  });

  it("redirects to unauthorized if user is not admin", async () => {
    // Mock non-admin user
// @ts-ignore
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          role: "USER",
        },
      },
      status: "authenticated",
    });

    const pushMock = vi.fn();
// @ts-ignore
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });

    render(<AdminDashboard />);

    // Check if redirect was called
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/unauthorized");
    });
  });

  it("allows changing user roles", async () => {
    render(<AdminDashboard />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("Regular User")).toBeInTheDocument();
    });

    // Find and click the role select for the regular user
    const roleSelects = screen.getAllByRole("combobox");
    const regularUserSelect = roleSelects[1]; // Second user in the list
    fireEvent.change(regularUserSelect, { target: { value: "ADMIN" } });

    // Check if the update function was called with the correct parameters
    await waitFor(() => {
      expect(mockUpdateUserRole).toHaveBeenCalledWith("2", "ADMIN");
    });
  });
});
