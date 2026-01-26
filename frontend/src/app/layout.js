import './globals.css';

export const metadata = {
  title: 'CarbonCoin Marketplace',
  description: 'Carbon Credit Marketplace for Individuals and Corporates',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}