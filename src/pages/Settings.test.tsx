import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Settings from './Settings';
import { apiFetch } from '../utils/api.js';

// Mock apiFetch
vi.mock('../utils/api.js', () => ({
  apiFetch: vi.fn()
}));

const mockSettings = {
  store_name: 'My Store',
  address: '123 Main St',
  phone: '1234567890',
  gstin: '22AAAAA0000A1Z5',
  state_code: '22',
  logo_url: 'http://example.com/logo.png'
};

describe('Settings Component', () => {
  let consoleErrorSpy: any;
  let alertSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('should fetch and display settings on mount', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockSettings)
    } as Response);

    render(<Settings />);

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/api/settings');
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('My Store')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('22AAAAA0000A1Z5')).toBeInTheDocument();
      expect(screen.getByDisplayValue('22')).toBeInTheDocument();
      expect(screen.getByDisplayValue('http://example.com/logo.png')).toBeInTheDocument();
    });
  });

  it('should save settings successfully and alert', async () => {
    const user = userEvent.setup();

    // Initial fetch
    vi.mocked(apiFetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockSettings)
    } as Response);

    render(<Settings />);

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/api/settings');
    });

    // Setup for save
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response);

    const saveBtn = screen.getByRole('button', { name: /save settings/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/api/settings', expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockSettings)
      }));
    });

    expect(alertSpy).toHaveBeenCalledWith('Settings saved successfully!');
  });

  it('should catch error when saving settings fails and alert', async () => {
    const user = userEvent.setup();

    // Initial fetch
    vi.mocked(apiFetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockSettings)
    } as Response);

    render(<Settings />);

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/api/settings');
    });

    // Mock API to reject for the save call
    const testError = new Error('Network error');
    vi.mocked(apiFetch).mockRejectedValueOnce(testError);

    const saveBtn = screen.getByRole('button', { name: /save settings/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/api/settings', expect.objectContaining({
        method: 'PUT'
      }));
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(testError);
    expect(alertSpy).toHaveBeenCalledWith('Failed to save settings');
  });
});
