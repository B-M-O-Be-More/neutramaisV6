import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const primaryGradient =
  "linear-gradient(90deg, #1F5AFF 0%, #1E58FB 7.69%, #1C55F7 15.38%, #1B53F3 23.08%, #1950EF 30.77%, #184EEB 38.46%, #164BE7 46.15%, #1549E3 53.85%, #1446DF 61.54%, #1244DB 69.23%, #1141D8 76.92%, #103FD4 84.62%, #0E3CD0 92.31%, #0D3ACC 100%)";

const theme = defineConfig({
  globalCss: {
    "html, body": {
      bg: "bg.page",
      color: "fg.default",
    },
  },

  theme: {
    recipes: {
      button: {
        variants: {
          variant: {
            gradient: {
              borderRadius: "8px",
              color: "white",
              bgImage: primaryGradient,
              _hover: { filter: "brightness(0.94)" },
              _active: { filter: "brightness(0.88)" },
              _disabled: { opacity: 0.5, cursor: "not-allowed" },
            },
          },
        },
        defaultVariants: {
          variant: "gradient",
        },
      },
    },

    tokens: {
      fonts: {
        body: { value: "var(--font-app)" },
        heading: { value: "var(--font-app)" },
      },

      colors: {
        brand: {
          50: { value: "#EAF0FF" },
          100: { value: "#D6E1FF" },
          200: { value: "#ADC3FF" },
          300: { value: "#85A4FF" },
          400: { value: "#5C86FF" },
          500: { value: "#1F5AFF" },
          600: { value: "#1849CC" },
          700: { value: "#123799" },
        },

        gray: {
          50: { value: "#F7F7F7" },
          100: { value: "#EDEDED" },
          200: { value: "#DADADA" },
          300: { value: "#C9D1D9" },
          400: { value: "#98A6B3" },
          500: { value: "#6C757D" },
          700: { value: "#30363D" },
          900: { value: "#010409" },
        },

        success: {
          500: { value: "#26FF67" },
        },

        warning: {
          500: { value: "#D29922" },
        },

        error: {
          500: { value: "#C52222" },
        },
      },
    },

    semanticTokens: {
      colors: {
        white: {
          DEFAULT: { value: "#FFFFFF" },
        },

        bg: {
          page: {
            _light: { value: "#F5F5F7" },
            _dark: { value: "#010409" },
          },
          surface: {
            _light: { value: "#FFFFFF" },
            _dark: { value: "#0D1117" },
          },
          subtle: {
            _light: { value: "#F0F2F5" },
            _dark: { value: "#141921" },
          },
        },

        fg: {
          default: {
            _light: { value: "#121212" },
            _dark: { value: "#C9D1D9" },
          },
          muted: {
            _light: { value: "#6C757D" },
            _dark: { value: "#98A6B3" },
          },
        },

        border: {
          default: {
            _light: { value: "#E5E8EE" },
            _dark: { value: "#30363D" },
          },
        },

        primary: {
          default: {
            _light: { value: "{colors.brand.500}" },
            _dark: { value: "{colors.brand.400}" },
          },
          hover: {
            _light: { value: "{colors.brand.600}" },
            _dark: { value: "{colors.brand.300}" },
          },
        },

        disabled: {
          _light: { value: "#BDBDBD" },
          _dark: { value: "#4A4A4A" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, theme);
