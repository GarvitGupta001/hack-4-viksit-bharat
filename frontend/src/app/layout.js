import './globals.css';
import PageTransition from '@/components/PageTransition';

export const metadata = {
  title: 'CarbonCoin Marketplace',
  description: 'Carbon Credit Marketplace for Individuals and Corporates',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PageTransition>
        {children}
        </PageTransition>
      </body>
    </html>
  );
}