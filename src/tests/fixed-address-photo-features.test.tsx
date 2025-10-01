import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm';

describe('PropertyDetailsForm Address & Photo Features (Clean Tests)', () => {
  let originalEnv: string | undefined;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    originalEnv = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    mockFetch = jest.fn();
    // @ts-ignore
    global.fetch = mockFetch;
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    else process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = originalEnv;
    // cleanup google mock
    // @ts-ignore
    delete window.google;
    jest.resetAllMocks();
  });

  function renderForm() {
    const onUpdate = jest.fn();
    render(<PropertyDetailsForm data={{}} onUpdate={onUpdate} onNext={jest.fn()} />);
    return { onUpdate };
  }

  test('shows unavailable message when API key missing', () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    renderForm();
    expect(screen.getByText('🚫 Address autocomplete unavailable. Enter address manually.')).toBeInTheDocument();
  });

  test('does NOT show unavailable message when API key present', () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'test-key';
    renderForm();
    expect(screen.queryByText('🚫 Address autocomplete unavailable. Enter address manually.')).not.toBeInTheDocument();
  });

  test('fetches and displays property image on valid address blur', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'test-key';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ imageUrl: 'https://example.com/test-image.jpg' })
    });

    const { onUpdate } = renderForm();
    const input = screen.getByLabelText(/Property Address/i);
    fireEvent.change(input, { target: { value: '123 Main Street, City, ST 99999' } });
    fireEvent.blur(input);

    expect(screen.getByText('Loading property image...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByAltText('Property front')).toHaveAttribute('src', 'https://example.com/test-image.jpg');
    });

    // onUpdate should eventually be called with imageUrl
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: 'https://example.com/test-image.jpg' }));
    });
  });

  test('handles image API error gracefully', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'test-key';
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { onUpdate } = renderForm();
    const input = screen.getByLabelText(/Property Address/i);
    fireEvent.change(input, { target: { value: '456 Oak Avenue, Town, ST 12345' } });
    fireEvent.blur(input);

    expect(screen.getByText('Loading property image...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading property image...')).not.toBeInTheDocument();
    });

    // Should not show image
    expect(screen.queryByAltText('Property front')).not.toBeInTheDocument();

    // onUpdate should still be called (with empty or no imageUrl)
    expect(onUpdate).toHaveBeenCalled();
  });

  test('does not trigger image fetch for short address (<5 chars)', () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'test-key';
    const { onUpdate } = renderForm();
    const input = screen.getByLabelText(/Property Address/i);
    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.blur(input);
    // fetch not called
    expect(mockFetch).not.toHaveBeenCalled();
    // onUpdate may not yet include address-related image changes
    expect(onUpdate).toHaveBeenCalled();
    expect(screen.queryByText('Loading property image...')).not.toBeInTheDocument();
  });

  test('trim-only / whitespace address does not fetch image', () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'test-key';
    const { onUpdate } = renderForm();
    const input = screen.getByLabelText(/Property Address/i);
    fireEvent.change(input, { target: { value: '     ' } });
    fireEvent.blur(input);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(onUpdate).toHaveBeenCalled();
    expect(screen.queryByText('Loading property image...')).not.toBeInTheDocument();
  });

  test('image API returns no imageUrl (empty object) handled gracefully', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'test-key';
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const { onUpdate } = renderForm();
    const input = screen.getByLabelText(/Property Address/i);
    fireEvent.change(input, { target: { value: '789 Elm Street, City, ST' } });
    fireEvent.blur(input);
    expect(screen.getByText('Loading property image...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Loading property image...')).not.toBeInTheDocument();
    });
    expect(screen.queryByAltText('Property front')).not.toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalled();
  });
});
