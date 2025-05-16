import { DefaultTheme } from 'styled-components';

// Define the theme interface
export interface TerraFluxTheme extends DefaultTheme {
  name: string;
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverted: string;
    accent: string;
  };
  border: {
    default: string;
    light: string;
    focus: string;
    divider: string;
  };
  icon: {
    primary: string;
    secondary: string;
    accent: string;
    danger: string;
    success: string;
  };
  button: {
    primary: {
      background: string;
      text: string;
      hover: string;
      active: string;
      disabled: string;
    };
    secondary: {
      background: string;
      text: string;
      hover: string;
      active: string;
      disabled: string;
    };
    danger: {
      background: string;
      text: string;
      hover: string;
      active: string;
      disabled: string;
    };
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
  };
  resources: {
    food: string;
    water: string;
    energy: string;
    materials: string;
  };
  status: {
    health: string;
    happiness: string;
    danger: string;
    warning: string;
    success: string;
    info: string;
  };
}

// Light theme
export const lightTheme: TerraFluxTheme = {
  name: 'light',
  borderRadius: '4px',
  shadows: {
    small: '0 1px 2px rgba(0, 0, 0, 0.075)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px rgba(0, 0, 0, 0.1)'
  },
  colors: {
    primary: {
      main: '#0D6EFD',
      light: '#84BDFF',
      dark: '#0A58CA',
      text: '#FFFFFF'
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F5F5F5',
      tertiary: '#E9ECEF',
      hover: '#F5F5F5'
    },
    text: {
      primary: '#212529',
      secondary: '#495057'
    },
    border: {
      main: '#DEE2E6',
      light: '#E9ECEF'
    },
    button: {
      primary: '#0D6EFD',
      hover: '#0B5ED7',
      disabled: '#84BDFF',
      text: '#FFFFFF'
    },
    input: {
      background: '#FFFFFF',
      text: '#212529',
      placeholder: '#6C757D',
      border: '#DEE2E6',
      focus: '#0D6EFD'
    },
    switch: {
      active: '#0D6EFD',
      inactive: '#ADB5BD'
    },
    slider: {
      track: '#DEE2E6',
      thumb: '#0D6EFD'
    }
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    tertiary: '#E9ECEF',
    elevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: '#212529',
    secondary: '#495057',
    tertiary: '#6C757D',
    inverted: '#FFFFFF',
    accent: '#0D6EFD',
  },
  border: {
    default: '#DEE2E6',
    light: '#E9ECEF',
    focus: '#0D6EFD',
    divider: '#E9ECEF',
  },
  icon: {
    primary: '#212529',
    secondary: '#6C757D',
    accent: '#0D6EFD',
    danger: '#DC3545',
    success: '#198754',
  },
  button: {
    primary: {
      background: '#0D6EFD',
      text: '#FFFFFF',
      hover: '#0B5ED7',
      active: '#0A58CA',
      disabled: '#84BDFF',
    },
    secondary: {
      background: '#6C757D',
      text: '#FFFFFF',
      hover: '#5C636A',
      active: '#565E64',
      disabled: '#A7ACB1',
    },
    danger: {
      background: '#DC3545',
      text: '#FFFFFF',
      hover: '#BB2D3B',
      active: '#B02A37',
      disabled: '#F1AEB5',
    },
  },
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.075)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
  resources: {
    food: '#198754',
    water: '#0DCAF0',
    energy: '#FFC107',
    materials: '#6C757D',
  },
  status: {
    health: '#DC3545',
    happiness: '#0D6EFD',
    danger: '#DC3545',
    warning: '#FFC107',
    success: '#198754',
    info: '#0DCAF0',
  },
};

// Dark theme
export const darkTheme: TerraFluxTheme = {
  name: 'dark',
  borderRadius: '4px',
  shadows: {
    small: '0 1px 2px rgba(0, 0, 0, 0.3)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.4)',
    large: '0 10px 15px rgba(0, 0, 0, 0.4)'
  },
  colors: {
    primary: {
      main: '#0D6EFD',
      light: '#84BDFF',
      dark: '#0A58CA',
      text: '#FFFFFF'
    },
    background: {
      primary: '#212529',
      secondary: '#343A40',
      tertiary: '#495057',
      hover: '#2C3034'
    },
    text: {
      primary: '#F8F9FA',
      secondary: '#E9ECEF'
    },
    border: {
      main: '#495057',
      light: '#343A40'
    },
    button: {
      primary: '#0D6EFD',
      hover: '#0B5ED7',
      disabled: '#0D6EFD80',
      text: '#FFFFFF'
    },
    input: {
      background: '#343A40',
      text: '#F8F9FA',
      placeholder: '#ADB5BD',
      border: '#495057',
      focus: '#0D6EFD'
    },
    switch: {
      active: '#0D6EFD',
      inactive: '#495057'
    },
    slider: {
      track: '#495057',
      thumb: '#0D6EFD'
    }
  },
  background: {
    primary: '#212529',
    secondary: '#343A40',
    tertiary: '#495057',
    elevated: '#2C3034',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  text: {
    primary: '#F8F9FA',
    secondary: '#E9ECEF',
    tertiary: '#DEE2E6',
    inverted: '#212529',
    accent: '#0D6EFD',
  },
  border: {
    default: '#495057',
    light: '#343A40',
    focus: '#0D6EFD',
    divider: '#343A40',
  },
  icon: {
    primary: '#F8F9FA',
    secondary: '#ADB5BD',
    accent: '#0D6EFD',
    danger: '#DC3545',
    success: '#198754',
  },
  button: {
    primary: {
      background: '#0D6EFD',
      text: '#FFFFFF',
      hover: '#0B5ED7',
      active: '#0A58CA',
      disabled: '#0D6EFD80',
    },
    secondary: {
      background: '#6C757D',
      text: '#FFFFFF',
      hover: '#5C636A',
      active: '#565E64',
      disabled: '#6C757D80',
    },
    danger: {
      background: '#DC3545',
      text: '#FFFFFF',
      hover: '#BB2D3B',
      active: '#B02A37',
      disabled: '#DC354580',
    },
  },
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.4)',
  },
  resources: {
    food: '#39C577',
    water: '#54E3F5',
    energy: '#FFDA6A',
    materials: '#ADB5BD',
  },
  status: {
    health: '#FF6B78',
    happiness: '#0D6EFD',
    danger: '#FF6B78',
    warning: '#FFDA6A',
    success: '#39C577',
    info: '#54E3F5',
  },
};
