
import { render, screen, fireEvent } from '@testing-library/react';
import AuthHeader from '@/components/AuthHeader';

// Mock useSession from next-auth/react
jest.mock('next-auth/react', () => {
  const actual = jest.requireActual('next-auth/react');
  return {
    ...actual,
    useSession: jest.fn(),
  };
});

import { useSession } from 'next-auth/react';

describe('AuthHeader (Mobile Hamburger)', () => {
  beforeAll(() => {
    // Set window size to mobile
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));
  });
  afterAll(() => {
    window.innerWidth = 1024;
    window.dispatchEvent(new Event('resize'));
  });

  it('shows hamburger menu on mobile', () => {
    (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });
    render(<AuthHeader />);
    expect(screen.getByTestId('hamburger-btn')).toBeInTheDocument();
  });

  it('toggles menu when hamburger is clicked', () => {
    (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });
    render(<AuthHeader />);
    const btn = screen.getByTestId('hamburger-btn');
    fireEvent.click(btn);
    // Only check for Home link in the open mobile menu
    const homeLinks = screen.getAllByText('Home');
    // The mobile menu Home link has class px-4 (desktop is text-indigo-700)
    const mobileHome = homeLinks.find((el) => el.className.includes('px-4'));
    expect(mobileHome).toBeInTheDocument();
    fireEvent.click(btn);
    // After closing, the mobile menu Home link should not be visible
    expect(mobileHome).not.toBeVisible();
  });

  it('shows My Properties and user email for authenticated user', () => {
    const session = {
      user: { email: 'test@example.com', role: 'USER' },
      expires: '2099-01-01T00:00:00.000Z',
    };
    (useSession as jest.Mock).mockReturnValue({ data: session, status: 'authenticated' });
    render(<AuthHeader />);
    const btn = screen.getByTestId('hamburger-btn');
    fireEvent.click(btn);
    // Only check for My Properties link in the open mobile menu
    const myPropsLinks = screen.getAllByText('My Properties');
    const mobileMyProps = myPropsLinks.find((el) => el.className.includes('px-4'));
    expect(mobileMyProps).toBeInTheDocument();
    // Only check for email in the mobile menu (span with px-4)
    const emailSpans = screen.getAllByText('test@example.com');
    const mobileEmail = emailSpans.find((el) => el.className.includes('px-4'));
    expect(mobileEmail).toBeInTheDocument();
  });

  it('shows All Properties and Admin for admin user', () => {
    const session = {
      user: { email: 'admin@example.com', role: 'ADMIN' },
      expires: '2099-01-01T00:00:00.000Z',
    };
    (useSession as jest.Mock).mockReturnValue({ data: session, status: 'authenticated' });
    render(<AuthHeader />);
    const btn = screen.getByTestId('hamburger-btn');
    fireEvent.click(btn);
    // Check for All Properties link in the open mobile menu by data-testid
    const mobileAllProps = screen.getByTestId('mobile-all-properties');
    expect(mobileAllProps).toBeInTheDocument();
    // Check for Admin link in the open mobile menu by data-testid
    const mobileAdmin = screen.getByTestId('mobile-admin-link');
    expect(mobileAdmin).toBeInTheDocument();
  });
});
