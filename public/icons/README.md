# Ícones PWA

Esta pasta deve conter os ícones do PWA nos seguintes tamanhos:

- icon-72x72.png
- icon-96x96.png  
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Como gerar os ícones:

1. Crie um ícone base de 512x512px com o logo do Pagaê
2. Use uma ferramenta como:
   - [PWA Icon Generator](https://tools.crawlink.com/tools/pwa-icon-generator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
   - Photoshop/Figma para redimensionar manualmente

## Design sugerido:
- Fundo: Indigo (#6366F1)
- Ícone: Calculadora ou símbolo de divisão em branco
- Formato: Quadrado com bordas arredondadas
- Estilo: Flat design, minimalista

## Exemplo de SVG base:
```svg
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="64" fill="#6366F1"/>
  <rect x="128" y="128" width="256" height="320" rx="16" fill="white"/>
  <rect x="160" y="160" width="64" height="32" rx="4" fill="#6366F1"/>
  <rect x="240" y="160" width="64" height="32" rx="4" fill="#6366F1"/>
  <rect x="320" y="160" width="64" height="32" rx="4" fill="#6366F1"/>
  <text x="256" y="280" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="#6366F1">÷</text>
  <text x="256" y="380" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#6366F1">Pagaê</text>
</svg>
```

Salve este SVG como base e converta para PNG nos tamanhos necessários.