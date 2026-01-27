// Company Registration Component Test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CompanyRegistrationPage from '../app/company/register/page';
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

describe('Company Registration Page Integration Tests', () => {
  let mockRouter;

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
    };
    useRouter.mockReturnValue(mockRouter);

    // Reset mocks
    apiClient.uploadCompanyDocuments.mockClear();
    localStorageMock.getItem.mockReturnValue('mock-jwt-token');
  });

  test('should upload company documents successfully', async () => {
    // Arrange
    const mockLogoFile = new File(['logo'], 'logo.png', { type: 'image/png' });
    const mockRegistrationFile = new File(['registration'], 'registration.pdf', { type: 'application/pdf' });

    const mockResponse = {
      success: true,
      message: 'Documents uploaded successfully',
      data: {
        userId: 'mock-company-id',
        logoUrl: 'http://example.com/logo.png',
        registrationDocUrl: 'http://example.com/registration.pdf'
      }
    };

    apiClient.uploadCompanyDocuments.mockResolvedValue(mockResponse);

    // Render the component
    render(<CompanyRegistrationPage />);

    // Upload logo
    const logoInput = screen.getByLabelText(/company logo/i);
    fireEvent.change(logoInput, { target: { files: [mockLogoFile] } });

    // Upload registration document
    const registrationInput = screen.getByLabelText(/registration document/i);
    fireEvent.change(registrationInput, { target: { files: [mockRegistrationFile] } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit documents/i }));

    // Wait for upload to complete
    await waitFor(() => {
      expect(apiClient.uploadCompanyDocuments).toHaveBeenCalledWith({
        logo: mockLogoFile,
        registrationDoc: mockRegistrationFile
      });
    });

    // Check that success message is displayed
    expect(screen.getByText(/documents uploaded successfully/i)).toBeInTheDocument();
  });

  test('should handle document upload validation errors', async () => {
    // Render the component
    render(<CompanyRegistrationPage />);

    // Submit the form without uploading documents
    fireEvent.click(screen.getByRole('button', { name: /submit documents/i }));

    // Check that validation errors are displayed
    expect(screen.getByText(/please upload at least one document/i)).toBeInTheDocument();
  });

  test('should handle document upload errors', async () => {
    // Arrange
    const mockLogoFile = new File(['logo'], 'logo.png', { type: 'image/png' });

    const mockError = new Error('Document upload failed');
    apiClient.uploadCompanyDocuments.mockRejectedValue(mockError);

    // Render the component
    render(<CompanyRegistrationPage />);

    // Upload logo
    const logoInput = screen.getByLabelText(/company logo/i);
    fireEvent.change(logoInput, { target: { files: [mockLogoFile] } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit documents/i }));

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText(/document upload failed/i)).toBeInTheDocument();
    });
  });

  test('should show image previews', async () => {
    // Create a mock file
    const mockLogoFile = new File(['logo'], 'logo.png', { type: 'image/png' });

    // Mock URL.createObjectURL
    const mockCreateObjectURL = jest.fn(() => 'mock-url');
    global.URL.createObjectURL = mockCreateObjectURL;

    // Render the component
    render(<CompanyRegistrationPage />);

    // Upload logo
    const logoInput = screen.getByLabelText(/company logo/i);
    fireEvent.change(logoInput, { target: { files: [mockLogoFile] } });

    // Check that preview is displayed
    expect(screen.getByAltText(/logo preview/i)).toBeInTheDocument();

    // Clean up
    global.URL.revokeObjectURL = jest.fn();
  });
});