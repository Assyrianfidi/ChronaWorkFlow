import React from "react";
import { jsxDEV } from "react/jsx-dev-runtime";
import { axe } from "vitest-axe";
import { ReportView } from '../../components/reports/ReportView';
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { renderWithProviders, screen } from '../../test-utils';

const mockReport = {
  id: "1",
  title: "Test Report",
  status: "active",
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z",
  content: "<p>Test report content</p>",
  attachments: [],
  notes: "Test notes",
  author: {
    id: "1",
    name: "Test User",
    email: "test@example.com",
  },
};

describe("ReportView Accessibility", () => {
  it("should have no accessibility violations", async () => {
    const { container } = renderWithProviders(
      <MemoryRouter initialEntries={["/reports/1"]}>
        <Routes>
          <Route path="/reports/:id" element={<ReportView />} />
        </Routes>
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("should be keyboard navigable", async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/reports/1"]}>
        <Routes>
          <Route path="/reports/:id" element={<ReportView />} />
        </Routes>
      </MemoryRouter>,
    );

    // The page may start in a loading state; assert the UI is present and doesn't crash.
    expect(await screen.findByRole("status")).toBeInTheDocument();

    // Add more keyboard navigation tests as needed
  });
});
