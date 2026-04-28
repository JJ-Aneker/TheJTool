// Configuración centralizada de Ant Design + Glassmorphism

export const createTheme = (isDark) => ({
  token: {
    // Colores principales
    colorPrimary: isDark ? '#177ddc' : '#1890ff',
    colorSuccess: isDark ? '#95de64' : '#52c41a',
    colorWarning: isDark ? '#ffa940' : '#faad14',
    colorError: isDark ? '#ff7875' : '#ff4d4f',
    colorInfo: isDark ? '#177ddc' : '#1890ff',

    // Fondos
    colorBgBase: isDark ? '#141414' : '#ffffff',
    colorBgContainer: isDark ? '#1f1f1f' : '#fafafa',
    colorBgElevated: isDark ? '#262626' : '#ffffff',
    colorBgLayout: isDark ? '#000000' : '#f5f5f5',

    // Texto
    colorTextBase: isDark ? '#e6e6e6' : 'rgba(0, 0, 0, 0.85)',
    colorTextSecondary: isDark ? '#b3b3b3' : 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: isDark ? '#8c8c8c' : 'rgba(0, 0, 0, 0.45)',
    colorTextQuaternary: isDark ? '#595959' : 'rgba(0, 0, 0, 0.25)',

    // Bordes
    colorBorder: isDark ? '#434343' : '#d9d9d9',
    colorBorderBg: isDark ? '#262626' : '#f5f5f5',

    // Otros
    colorLink: isDark ? '#177ddc' : '#1890ff',
    colorLinkHover: isDark ? '#3c9ae8' : '#40a9ff',
    colorLinkActive: isDark ? '#1765ad' : '#0050b3',

    // Tipografía
    fontSize: 14,
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

    // Sombras (para glassmorphism)
    boxShadow: isDark
      ? '0 2px 8px rgba(0, 0, 0, 0.45)'
      : '0 2px 8px rgba(0, 0, 0, 0.12)',

    // Glassmorphism - translucencia y blur
    colorBgGlass: isDark
      ? 'rgba(31, 31, 31, 0.7)'
      : 'rgba(255, 255, 255, 0.8)',
    colorBgGlassContainer: isDark
      ? 'rgba(38, 38, 38, 0.7)'
      : 'rgba(255, 255, 255, 0.85)',

    // Alturas de control
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
  },

  components: {
    // Customización de componentes específicos
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      primaryColor: '#1890ff',
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
      colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
    },
    Select: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 12,
      boxShadow: isDark
        ? '0 2px 8px rgba(0, 0, 0, 0.45)'
        : '0 2px 8px rgba(0, 0, 0, 0.12)',
    },
    Modal: {
      borderRadius: 12,
    },
    Dropdown: {
      borderRadius: 8,
    },
    Table: {
      borderRadius: 8,
      headerBg: isDark ? '#1f1f1f' : '#fafafa',
    },
    Tabs: {
      borderRadius: 8,
    },
    Menu: {
      borderRadius: 8,
    },
  },
})

// Configuración de glassmorphism puro
export const glassmorphismConfig = {
  light: {
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
  },
  dark: {
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(31, 31, 31, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
  },
}
