// Configuración de Ant Design - SOLO espaciado y tipografía
// TODOS LOS COLORES vienen de src/styles/design-tokens.css

export const createTheme = (isDark) => ({
  token: {
    // Tipografía
    fontSize: 13,
    fontSizeHeading1: 32,
    fontSizeHeading2: 28,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    fontSizeHeading6: 14,
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif`,
    fontWeightStrong: 600,

    // Espacios
    margin: 16,
    marginXS: 8,
    marginSM: 12,
    marginLG: 24,
    marginXL: 32,
    padding: 16,
    paddingXS: 8,
    paddingSM: 12,
    paddingLG: 24,
    paddingXL: 32,

    // Bordes
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 4,
    borderRadiusXS: 2,

    // Alturas de control
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
  },

  components: {
    // Solo propiedades de layout, los colores vienen de CSS
    Button: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 12,
    },
    Modal: {
      borderRadius: 12,
    },
    Dropdown: {
      borderRadius: 8,
    },
    Table: {
      borderRadius: 8,
    },
    Tabs: {
      borderRadius: 8,
    },
    Menu: {
      borderRadius: 8,
    },
  },
})
