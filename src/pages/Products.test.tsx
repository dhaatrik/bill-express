import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest';
import Products from './Products';
import * as apiModule from '../utils/api.js';

vi.mock('../utils/api.js', () => ({
  apiFetch: vi.fn(),
}));

describe('Products Component', () => {
  let alertMock: Mock;
  let consoleErrorMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {}) as Mock;
    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {}) as Mock;

    // Mock initial fetch
    vi.mocked(apiModule.apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);
  });

  afterEach(() => {
    alertMock.mockRestore();
    consoleErrorMock.mockRestore();
  });

  it('should handle API error when saving a product (non-ok response)', async () => {
    const user = userEvent.setup();
    render(<Products />);

    // Wait for initial fetch
    await waitFor(() => {
      expect(apiModule.apiFetch).toHaveBeenCalledWith('/api/products?page=1&limit=50&search=&category=All&sort=name_asc');
    });

    // Open add product modal
    await user.click(screen.getByText('Add Product'));

    // Fill the required fields
    await user.type(screen.getByText(/Code\/SKU/i).nextElementSibling as HTMLElement, 'P001');
    await user.type(screen.getByText(/HSN Code/i).nextElementSibling as HTMLElement, '1234');
    await user.type(screen.getAllByText(/^Name$/i)[1].nextElementSibling as HTMLElement, 'Test Product');
    await user.type(screen.getAllByText(/Price \(ex GST\)/i)[1].nextElementSibling as HTMLElement, '100');
    // Stock is prefilled to 0, which is fine

    // Mock the POST request to return an error response
    vi.mocked(apiModule.apiFetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Duplicate code' }),
    } as Response);

    // Submit the form
    await user.click(screen.getByText('Save'));

    // Verify alert was called with the correct message
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Error: Duplicate code');
    });
  });

  it('should handle generic error when saving a product (network failure)', async () => {
    const user = userEvent.setup();
    render(<Products />);

    // Wait for initial fetch
    await waitFor(() => {
      expect(apiModule.apiFetch).toHaveBeenCalledWith('/api/products?page=1&limit=50&search=&category=All&sort=name_asc');
    });

    // Open add product modal
    await user.click(screen.getByText('Add Product'));

    // Fill the required fields
    await user.type(screen.getByText(/Code\/SKU/i).nextElementSibling as HTMLElement, 'P002');
    await user.type(screen.getByText(/HSN Code/i).nextElementSibling as HTMLElement, '5678');
    await user.type(screen.getAllByText(/^Name$/i)[1].nextElementSibling as HTMLElement, 'Test Product 2');
    await user.type(screen.getAllByText(/Price \(ex GST\)/i)[1].nextElementSibling as HTMLElement, '200');

    // Mock the POST request to throw a network error
    vi.mocked(apiModule.apiFetch).mockRejectedValueOnce(new Error('Network error'));

    // Submit the form
    await user.click(screen.getByText('Save'));

    // Verify console.error and alert were called
    await waitFor(() => {
      expect(consoleErrorMock).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith('An error occurred while saving the product.');
    });
  });
});
