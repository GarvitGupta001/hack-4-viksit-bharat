// Property Verification Page Integration Tests
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import PropertyVerificationPage from '../app/property-verification/page';
import apiClient from '../services/api';

// Mock the API client
jest.mock('../services/api');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  
  return {
    getItem: jest.fn((key) => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Property Verification Page Integration Tests', () => {
  let mockRouter;

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
    };
    useRouter.mockReturnValue(mockRouter);

    // Reset mocks
    apiClient.createProperty.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test('should render property verification steps', () => {
    // Render the component
    render(<PropertyVerificationPage />);

    // Check that all steps are present
    expect(screen.getByText(/step 1: asset information/i)).toBeInTheDocument();
    expect(screen.getByText(/step 2: documentation/i)).toBeInTheDocument();
    expect(screen.getByText(/step 3: ai verification/i)).toBeInTheDocument();
    expect(screen.getByText(/step 4: carbon credit generation/i)).toBeInTheDocument();
  });

  test('should navigate back to dashboard', () => {
    // Render the component
    render(<PropertyVerificationPage />);

    // Find and click the back button
    const backButton = screen.getByRole('link', { name: /back to dashboard/i });
    fireEvent.click(backButton);

    // Check that router was called with correct path
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });
});