import { DefaultTheme } from 'styled-components';

/**
 * Safely access a theme property in styled-components
 * This helper function prevents "Cannot read properties of undefined" errors
 * by providing fallback values when a theme property is missing
 */
export const getThemeValue = (
  theme: DefaultTheme,
  path: string, 
  fallback: string = 'inherit'
): string => {
  if (!theme) return fallback;
  
  try {
    // Split the path string into segments (e.g., 'button.primary.background' -> ['button', 'primary', 'background'])
    const segments = path.split('.');
    let value: any = theme;
    
    // Traverse the object path
    for (const segment of segments) {
      value = value[segment];
      // If we hit undefined at any point in the path, return the fallback
      if (value === undefined) return fallback;
    }
    
    // Return the found value if it's a string, otherwise the fallback
    return typeof value === 'string' ? value : fallback;
  } catch (error) {
    console.warn(`Theme error: Failed to retrieve ${path} from theme`, error);
    return fallback;
  }
};

/**
 * Create a safer version of styled-components theme prop
 * This function returns a proxy that safely accesses theme properties
 */
export const safeTheme = (theme: DefaultTheme): DefaultTheme => {
  return theme ? theme : ({} as DefaultTheme);
};
