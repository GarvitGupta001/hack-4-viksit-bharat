// Carbon Coin Transfer Component Test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CarbonCoinTransferPage from '../app/transfer-coins/page';
import apiClient from '../../services/api';

// Mock the API client
jest.mock('../../services/api');
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

describe('Carbon Coin Transfer Page Integration Tests', () => {
  let mockRouter;

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
    };
    useRouter.mockReturnValue(mockRouter);

    // Reset mocks
    apiClient.getCarbonCoinBalance.mockClear();
    apiClient.transferCarbonCoins.mockClear();
    localStorageMock.getItem.mockReturnValue('mock-jwt-token');
  });

  test('should fetch and display user carbon coin balance', async () => {
    // Arrange
    const mockBalance = {
      ownerId: 'mock-user-id',
      amount: 100,
      history: []
    };

    apiClient.getCarbonCoinBalance.mockResolvedValue({
      success: true,
      data: mockBalance
    });

    // Render the component
    render(<CarbonCoinTransferPage />);

    // Wait for balance to load
    await waitFor(() => {
      expect(apiClient.getCarbonCoinBalance).toHaveBeenCalled();
    });

    // Check that balance is displayed
    expect(screen.getByText(/current balance: 100 coins/i)).toBeInTheDocument();
  });

  test('should transfer carbon coins successfully', async () => {
    // Arrange
    const mockBalance = {
      ownerId: 'mock-user-id',
      amount: 100,
      history: []
    };

    const transferData = {
      toUserId: 'recipient-user-id',
      amount: 25
    };

    const mockTransferResult = {
      message: 'Transfer successful',
      data: {
        senderBalance: 75,
        receiverBalance: 25
      }
    };

    apiClient.getCarbonCoinBalance.mockResolvedValue({
      success: true,
      data: mockBalance
    });

    apiClient.transferCarbonCoins.mockResolvedValue({
      success: true,
      ...mockTransferResult
    });

    // Render the component
    render(<CarbonCoinTransferPage />);

    // Wait for balance to load
    await waitFor(() => {
      expect(apiClient.getCarbonCoinBalance).toHaveBeenCalled();
    });

    // Fill in transfer form
    fireEvent.change(screen.getByLabelText(/recipient user id/i), { target: { value: transferData.toUserId } });
    fireEvent.change(screen.getByLabelText(/amount to transfer/i), { target: { value: transferData.amount } });

    // Submit the transfer
    fireEvent.click(screen.getByRole('button', { name: /transfer coins/i }));

    // Wait for transfer to complete
    await waitFor(() => {
      expect(apiClient.transferCarbonCoins).toHaveBeenCalledWith(transferData);
    });

    // Check that success message is displayed
    expect(screen.getByText(/transfer successful!/i)).toBeInTheDocument();
  });

  test('should handle insufficient balance error', async () => {
    // Arrange
    const mockBalance = {
      ownerId: 'mock-user-id',
      amount: 10,
      history: []
    };

    const transferData = {
      toUserId: 'recipient-user-id',
      amount: 25 // More than available balance
    };

    apiClient.getCarbonCoinBalance.mockResolvedValue({
      success: true,
      data: mockBalance
    });

    const mockError = new Error('Insufficient balance');
    apiClient.transferCarbonCoins.mockRejectedValue(mockError);

    // Render the component
    render(<CarbonCoinTransferPage />);

    // Wait for balance to load
    await waitFor(() => {
      expect(apiClient.getCarbonCoinBalance).toHaveBeenCalled();
    });

    // Fill in transfer form with amount exceeding balance
    fireEvent.change(screen.getByLabelText(/recipient user id/i), { target: { value: transferData.toUserId } });
    fireEvent.change(screen.getByLabelText(/amount to transfer/i), { target: { value: transferData.amount } });

    // Submit the transfer
    fireEvent.click(screen.getByRole('button', { name: /transfer coins/i }));

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument();
    });
  });

  test('should handle transfer validation errors', async () => {
    // Arrange
    const mockBalance = {
      ownerId: 'mock-user-id',
      amount: 100,
      history: []
    };

    apiClient.getCarbonCoinBalance.mockResolvedValue({
      success: true,
      data: mockBalance
    });

    // Render the component
    render(<CarbonCoinTransferPage />);

    // Wait for balance to load
    await waitFor(() => {
      expect(apiClient.getCarbonCoinBalance).toHaveBeenCalled();
    });

    // Submit the transfer without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /transfer coins/i }));

    // Check that validation errors are displayed
    expect(screen.getByText(/recipient user id is required/i)).toBeInTheDocument();
    expect(screen.getByText(/transfer amount is required/i)).toBeInTheDocument();
  });
});