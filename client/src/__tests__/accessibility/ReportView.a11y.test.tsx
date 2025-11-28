import { jsxDEV } from 'react/jsx-dev-runtime';
import { axe } from 'jest-axe';
import { ReportView } from '../../components/reports/ReportView';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../../test-utils';

const mockReport = {
  id: '1',
  title: 'Test Report',
  status: 'active',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  content: '<p>Test report content</p>',
  attachments: [],
  notes: 'Test notes',
  author: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
  },
};

describe('ReportView Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <MemoryRouter initialEntries={['/reports/1']}>
        <Routes>
          <Route path="/reports/:id" element={<ReportView />} />
        </Routes>
      </MemoryRouter>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be keyboard navigable', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/reports/1']}>
        <Routes>
          <Route path="/reports/:id" element={<ReportView />} />
        </Routes>
      </MemoryRouter>
    );

    // Test tab navigation
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveFocus();

    // Add more keyboard navigation tests as needed
  });
});
