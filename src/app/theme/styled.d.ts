import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    name: string;
    // Basic layout properties
    borderRadius: string;
    shadows: {
      small: string;
      medium: string;
      large: string;
    };
    // Combined structure for direct color access
    colors: {
      primary: {
        main: string;
        light: string;
        dark: string;
        text: string;
      };
      background: {
        primary: string;
        secondary: string;
        tertiary: string;
        hover: string;
      };
      text: {
        primary: string;
        secondary: string;
      };
      border: {
        main: string;
        light: string;
      };
      button: {
        primary: string;
        hover: string;
        disabled: string;
        text: string;
      };
      input: {
        background: string;
        text: string;
        placeholder: string;
        border: string;
        focus: string;
      };
      switch: {
        active: string;
        inactive: string;
      };
      slider: {
        track: string;
        thumb: string;
      };
    };
    // Original theme structure
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
}
