import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { ApiKeyProvider } from './contexts/ApiKeyContext';
import { ModelsProvider } from './contexts/ModelsContext';
import TranscriptionPage from './components/TranscriptionPage';

// Define theme customizations
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#bae3ff',
      200: '#8dceff',
      300: '#5fb9ff',
      400: '#35a5ff',
      500: '#0990ff',
      600: '#0072cc',
      700: '#005499',
      800: '#003766',
      900: '#001933',
    },
  },
  fonts: {
    body: 'Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <ApiKeyProvider>
        <ModelsProvider>
          <TranscriptionPage />
        </ModelsProvider>
      </ApiKeyProvider>
    </ChakraProvider>
  );
}

export default App;
