// Signup Page Integration Tests
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import SignupPage from '../app/signup/page';
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

describe('Signup Page Integration Tests', () => {
  let mockRouter;

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
    };
    useRouter.mockReturnValue(mockRouter);

    // Reset mocks
    apiClient.register.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test('should successfully register a user and redirect to login', async () => {
    // Arrange
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      password: 'password123',
      confirmPassword: 'password123'
    };

    const mockApiResponse = {
      success: true,
      message: 'User registered successfully',
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

    apiClient.register.mockResolvedValue(mockApiResponse);

    // Render the component
    render(<SignupPage />);

    // Find form elements
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    // Fill the form
    fireEvent.change(nameInput, { target: { value: mockUserData.name } });
    fireEvent.change(emailInput, { target: { value: mockUserData.email } });
    fireEvent.change(phoneInput, { target: { value: mockUserData.phone } });
    fireEvent.change(passwordInput, { target: { value: mockUserData.password } });
    fireEvent.change(confirmPasswordInput, { target: { value: mockUserData.confirmPassword } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the API call to complete
    await waitFor(() => {
      expect(apiClient.register).toHaveBeenCalledWith(mockUserData);
    });

    // Wait for the redirect
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });

    // Check that user name was stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('userName', mockUserData.name);
  });

  test('should show validation errors for invalid form data', async () => {
    // Render the component
    render(<SignupPage />);

    // Find form elements
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    // Fill the form with invalid data
    fireEvent.change(nameInput, { target: { value: '' } }); // Empty name
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } }); // Invalid email
    fireEvent.change(phoneInput, { target: { value: '123' } }); // Invalid phone
    fireEvent.change(passwordInput, { target: { value: '123' } }); // Short password
    fireEvent.change(confirmPasswordInput, { target: { value: 'different' } }); // Mismatched password

    // Submit the form
    fireEvent.click(submitButton);

    // Check that no API call was made
    expect(apiClient.register).not.toHaveBeenCalled();

    // Wait for error messages to appear
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      expect(screen.getByText(/phone number must be 10 digits/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  test('should handle API registration error', async () => {
    // Arrange
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      password: 'password123',
      confirmPassword: 'password123'
    };

    const mockApiError = new Error('User with this email or phone already exists');
    apiClient.register.mockRejectedValue(mockApiError);

    // Render the component
    render(<SignupPage />);

    // Find form elements
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    // Fill the form
    fireEvent.change(nameInput, { target: { value: mockUserData.name } });
    fireEvent.change(emailInput, { target: { value: mockUserData.email } });
    fireEvent.change(phoneInput, { target: { value: mockUserData.phone } });
    fireEvent.change(passwordInput, { target: { value: mockUserData.password } });
    fireEvent.change(confirmPasswordInput, { target: { value: mockUserData.confirmPassword } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the API call to fail
    await waitFor(() => {
      expect(apiClient.register).toHaveBeenCalledWith(mockUserData);
    });

    // The error should be handled gracefully (no crash)
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});