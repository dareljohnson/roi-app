import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm';

/**
 * Concurrency & Debounce Stress Test
 * Ensures rapid sequential address changes do not leave the spinner stuck and only
 * the final debounced request produces suggestions. Locks in protection against the
 * prior UX issue where overlapping polling loops created a persistent spinner state.
 */
describe('Address Autocomplete Concurrency & Debounce', () => {
  const originalEnv = { ...process.env };
  const REAL_KEY = 'TEST_REAL_KEY_123';

  beforeEach(() => {
    jest.useFakeTimers();
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = REAL_KEY;

    // Minimal stub for Google Places API used by component
    (global as any).window.google = {
      maps: {
        places: {
          PlacesServiceStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' },
          AutocompleteService: function thisCtor(this: any) {
            const self: any = this;
            self.getPlacePredictions = (opts: any, cb: Function) => {
              cb([
                {
                  description: `${opts.input} Result Ave`,
                  place_id: 'place-id-' + opts.input,
                },
              ], 'OK');
            };
          },
        },
      },
    } as any;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    process.env = { ...originalEnv };
    delete (global as any).window.google;
  });

  test('rapid input changes cancel stale requests and clear spinner', async () => {
    const onUpdate = jest.fn();
    render(<PropertyDetailsForm data={{}} onUpdate={onUpdate} onNext={() => {}} />);

    const addressInput = screen.getByLabelText(/Property Address/i);

    fireEvent.change(addressInput, { target: { value: '123 M' } });
    fireEvent.change(addressInput, { target: { value: '123 Ma' } });
    fireEvent.change(addressInput, { target: { value: '123 Main' } });

    expect(screen.getByText(/Searching addresses/i)).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(305); // pass debounce window
    });

    await act(async () => {
      jest.advanceTimersByTime(30); // allow finalize delay
    });

    expect(await screen.findByText('123 Main Result Ave')).toBeInTheDocument();
    expect(screen.queryByText(/Searching addresses/i)).toBeNull();

    const addressUpdates = onUpdate.mock.calls.filter(c => c[0]?.address);
    expect(addressUpdates.length).toBeGreaterThan(0);
  });
});
