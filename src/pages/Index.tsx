
import InvoiceForm from '@/components/InvoiceForm';
import React, { useEffect, useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

const Index = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
  }, [theme]);
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-center items-center">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <h1 className="text-3xl font-bold text-gray-900 text-center">SPINVOICE</h1>
        </div>
      </header>
      <main className="py-6">
        <InvoiceForm />
      </main>
    </div>
  );
};

export default Index;
