'use client';

import { Toaster as Toast } from 'react-hot-toast';

const Toaster = () => (
  <Toast
    position="top-center"
    toastOptions={{
      style: {
        borderRadius: '10px',
        paddingInline: '1rem',
      },
    }}
  />
);

export default Toaster;
