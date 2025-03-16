# Error Handling Patterns

## API Request Error Handling

### Pattern Description
This pattern provides a standardized approach for handling API request errors in the application. It includes:

1. Consistent error structure
2. Context preservation for debugging
3. User-friendly error messages
4. Error logging

### Implementation

```typescript
// Standard error handling for API requests
const makeApiRequest = async <T>(
  url: string, 
  options: RequestInit,
  errorContext: string
): Promise<T> => {
  try {
    // Add request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          message: errorData.message || 'Unknown error occurred',
          context: errorContext
        })
      );
    }
    
    return await response.json() as T;
  } catch (error) {
    // Handle network errors, timeouts, and other exceptions
    if (error.name === 'AbortError') {
      console.error(`API request timeout: ${errorContext}`);
      throw new Error(`Request timed out: ${errorContext}`);
    }
    
    // Log the full error for debugging
    console.error(`API request failed for ${errorContext}:`, error);
    
    // Parse structured errors or create a generic one
    let errorMessage: string;
    try {
      const parsedError = JSON.parse(error.message);
      errorMessage = parsedError.message || 'An unexpected error occurred';
    } catch (parseError) {
      errorMessage = error.message || 'An unexpected error occurred';
    }
    
    // Rethrow with user-friendly message but preserve original error
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.context = errorContext;
    throw enhancedError;
  }
};
```

### Usage Example

```typescript
// Using the pattern in nlpService.ts
import { AnalysisResult } from '@/types';

export const analyzeText = async (text: string): Promise<AnalysisResult> => {
  return makeApiRequest<AnalysisResult>(
    '/api/analyze',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    },
    'Text analysis request'
  );
};
```

### Component Usage

```tsx
// In React component
const TextAnalysisComponent: React.FC = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const analysisResult = await analyzeText(text);
      setResult(analysisResult);
    } catch (err) {
      setError(err.message || 'Failed to analyze text');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      {/* Component UI */}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};
```

## Benefits

- **Consistency**: All API requests use the same error handling pattern
- **Context Preservation**: Error context is maintained for debugging
- **User Experience**: Friendly error messages for users
- **Debuggability**: Original errors are preserved and logged

## Common Pitfalls

- Not handling timeouts properly
- Exposing raw error messages to users
- Losing original error context
- Not logging errors for debugging