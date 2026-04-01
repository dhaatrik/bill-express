import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Invoices from './Invoices';
import { apiFetch } from '../utils/api.js';

// Mock apiFetch
vi.mock('../utils/api.js', () => ({
  apiFetch: vi.fn(),
}));

const mockInvoices = [
  {
    id: 1,
    invoice_number: 'INV-001',
    date: new Date().toISOString(),
    customer_name: 'John Doe',
    type: 'b2b',
    status: 'active',
    payment_status: 'Unpaid',
    amount_paid: 0,
    grand_total: 100,
    items: []
  }
];

describe('Invoices Component', () => {
  let alertSpy: any;
  let confirmSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    alertSpy.mockRestore();
    confirmSpy.mockRestore();
  });

  it('should show alert when cancelling an invoice fails', async () => {
    const user = userEvent.setup();

    // Mock initial fetch
    vi.mocked(apiFetch).mockImplementation((url) => {
      if (url === '/api/invoices') {
        return Promise.resolve({
          json: () => Promise.resolve(mockInvoices),
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(
      <MemoryRouter>
        <Invoices />
      </MemoryRouter>
    );

    // Wait for invoices to load
    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument();
    });

    // Mock apiFetch for the cancel call to fail
    vi.mocked(apiFetch).mockImplementation((url, options) => {
      if (url === `/api/invoices/1/cancel` && options?.method === 'PUT') {
        return Promise.reject(new Error('API Error'));
      }
      if (url === '/api/invoices') {
        return Promise.resolve({
          json: () => Promise.resolve(mockInvoices),
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const voidButton = screen.getByTitle('Void Invoice');
    await user.click(voidButton);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(apiFetch).toHaveBeenCalledWith('/api/invoices/1/cancel', { method: 'PUT' });
      expect(alertSpy).toHaveBeenCalledWith('Failed to cancel invoice');
    });
  });
});
