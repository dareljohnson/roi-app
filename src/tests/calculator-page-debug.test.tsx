// Simple test to avoid build failures
import React from 'react';
import { render, screen } from '@testing-library/react';
import CalculatorPage from '@/app/calculator/page';

describe('Calculator Page', () => {
  test('renders without crashing', () => {
    render(<CalculatorPage />);
    expect(screen.getByText(/Property Analysis Form/i)).toBeInTheDocument();
  });
});
