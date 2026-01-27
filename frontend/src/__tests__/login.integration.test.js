// Login Page Integration Tests
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '../app/login/page';
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

describe('Login Page Integration Tests', () => {
  let mockRouter;

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
    };
    useRouter.mockReturnValue(mockRouter);

    // Reset mocks
    apiClient.login.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test('should successfully login a user and redirect to identity verification', async () => {
    // Arrange
    const mockCredentials = {
      emailOrPhone: 'test@example.com',
      password: 'password123'
    };

    const mockApiResponse = {
      success: true,
      message: 'Login successful',
      data: {
        token: 'mock-jwt-token',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          name: 'Test User',
          phone: '1234567890',
          type: 'seller',
          verified: false
        }
      }
    };

    apiClient.login.mockResolvedValue(mockApiResponse);

    // Render the component
    render(<LoginPage />);

    // Find form elements
    const emailOrPhoneInput = screen.getByLabelText(/email or phone/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Fill the form
    fireEvent.change(emailOrPhoneInput, { target: { value: mockCredentials.emailOrPhone } });
    fireEvent.change(passwordInput, { target: { value: mockCredentials.password } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the API call to complete
    await waitFor(() => {
      expect(apiClient.login).toHaveBeenCalledWith(mockCredentials);
    });

    // Check that token was stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mock-jwt-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('isLoggedIn', 'true');

    // Wait for the redirect to identity verification
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/verify-identity');
    });
  });

  test('should show validation errors for invalid login data', async () => {
    // Render the component
    render(<LoginPage />);

    // Find form elements
    const emailOrPhoneInput = screen.getByLabelText(/email or phone/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Fill the form with invalid data
    fireEvent.change(emailOrPhoneInput, { target: { value: '' } }); // Empty email/phone
    fireEvent.change(passwordInput, { target: { value: '123' } }); // Short password

    // Submit the form
    fireEvent.click(submitButton);

    // Check that no API call was made
    expect(apiClient.login).not.toHaveBeenCalled();

    // Wait for error messages to appear
    await waitFor(() => {
      expect(screen.getByText(/email or phone is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  test('should handle API login error', async () => {
    // Arrange
    const mockCredentials = {
      emailOrPhone: 'test@example.com',
      password: 'password123'
    };

    const mockApiError = new Error('Invalid credentials');
    apiClient.login.mockRejectedValue(mockApiError);

    // Render the component
    render(<LoginPage />);

    // Find form elements
    const emailOrPhoneInput = screen.getByLabelText(/email or phone/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Fill the form
    fireEvent.change(emailOrPhoneInput, { target: { value: mockCredentials.emailOrPhone } });
    fireEvent.change(passwordInput, { target: { value: mockCredentials.password } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the API call to fail
    await waitFor(() => {
      expect(apiClient.login).toHaveBeenCalledWith(mockCredentials);
    });

    // The error should be handled gracefully (no crash)
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});