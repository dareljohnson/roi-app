import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm';

// These tests exercise the early-abort + placeholder key logic. We raise the timeout
// slightly because the internal polling loop for Places readiness can run up to ~5s.
jest.setTimeout(10000);

describe('Google Places placeholder key handling', () => {
  const ORIGINAL = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    else process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = ORIGINAL;
  });

  function setup() {
    const onUpdate = jest.fn();
    render(<PropertyDetailsForm data={{}} onUpdate={onUpdate} onNext={jest.fn()} />);
    return { onUpdate };
  }

  test('shows unavailable message when placeholder key is used', () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
    setup();
    expect(screen.getByText('🚫 Address autocomplete unavailable. Enter address manually.')).toBeInTheDocument();
  });

  test('continues to work when valid key supplied', () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'real-key-123';
    setup();
    expect(screen.queryByText('🚫 Address autocomplete unavailable. Enter address manually.')).not.toBeInTheDocument();
  });

  test('does not spin forever when script load would fail (simulated)', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'real-key-123';
    // In the test environment the Google script is never actually injected (guard rails in component),
    // so the polling loop should terminate gracefully and remove the spinner by the 5s cap.
    setup();
    const input = screen.getByLabelText(/Property Address/i);
    fireEvent.change(input, { target: { value: '500 Market Street' } });
    await waitFor(
      () => expect(screen.queryByText('Searching addresses...')).not.toBeInTheDocument(),
      { timeout: 7000 }
    );
    // We purposely DO NOT assert on onUpdate() invocation here because address selection
    // only occurs after Places API returns predictions, which we intentionally never mock
    // in this failure simulation; the concern is solely spinner termination.
  });
});
