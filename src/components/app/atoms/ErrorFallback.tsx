'use client';

import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { FallbackProps } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const router = useRouter();

  return (
    <Box height="100vh" width="100%" display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={3} px={3}>
      <Typography fontSize={80} fontWeight={800} color="#721c24">
        Oops!
      </Typography>
      <Typography fontSize={20} fontWeight={500}>
        Something went wrong
      </Typography>
      <Box maxWidth="600px" width="100%" bgcolor="#f8d7da" p={2} borderRadius={1} overflow="auto" maxHeight="200px">
        <Typography fontSize={14} color="#721c24" sx={{ wordBreak: 'break-word' }}>
          {(error as Error)?.message || 'An unknown error occurred'}
        </Typography>
      </Box>
      <Box display="flex" gap={2}>
        <Button variant="contained" onClick={resetErrorBoundary} sx={{ background: '#cd1b78' }}>
          Try Again
        </Button>
        <Button variant="outlined" onClick={() => router.push('/social-media')}>
          Go to Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default ErrorFallback;
