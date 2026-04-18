// Устанавливаем theme-color только для поддерживающих браузеров
if (
  navigator.userAgent.includes('Chrome') ||
  navigator.userAgent.includes('Edge') ||
  navigator.userAgent.includes('Safari')
) {
  const themeColor = document.createElement('meta');
  themeColor.name = 'theme-color';
  themeColor.content = '#0b0b0b';
  document.head.appendChild(themeColor);

  const themeColorDark = document.createElement('meta');
  themeColorDark.name = 'theme-color';
  themeColorDark.setAttribute('media', '(prefers-color-scheme: dark)');
  themeColorDark.content = '#222831';
  document.head.appendChild(themeColorDark);

  const themeColorLight = document.createElement('meta');
  themeColorLight.name = 'theme-color';
  themeColorLight.setAttribute('media', '(prefers-color-scheme: light)');
  themeColorLight.content = '#222831';
  document.head.appendChild(themeColorLight);
}
