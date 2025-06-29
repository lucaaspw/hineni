# Configuração PWA - Hineni

## 📱 Ícones Necessários

Para que o PWA funcione corretamente, você precisa criar os seguintes ícones:

### 1. Ícone 192x192 pixels

- **Arquivo**: `public/icon-192.png`
- **Tamanho**: 192x192 pixels
- **Formato**: PNG
- **Uso**: Ícone padrão para dispositivos Android

### 2. Ícone 512x512 pixels

- **Arquivo**: `public/icon-512.png`
- **Tamanho**: 512x512 pixels
- **Formato**: PNG
- **Uso**: Ícone de alta resolução para dispositivos iOS

## 🎨 Sugestões de Design

### Opção 1: Ícone Simples

- Letra "H" em fonte sans-serif
- Fundo sólido (azul, verde ou roxo)
- Bordas arredondadas

### Opção 2: Ícone Musical

- Símbolo de nota musical
- Fundo gradiente
- Cores da igreja

### Opção 3: Ícone Composto

- "H" + símbolo musical
- Design minimalista
- Cores neutras

## 🛠️ Como Criar os Ícones

### Usando Figma (Gratuito)

1. Crie um novo projeto
2. Configure o canvas para 512x512px
3. Designe o ícone
4. Exporte em 512x512px
5. Redimensione para 192x192px
6. Exporte ambos os tamanhos

### Usando Canva (Gratuito)

1. Crie um novo design
2. Configure o tamanho para 512x512px
3. Use templates de ícones
4. Personalize com as cores da igreja
5. Exporte nos dois tamanhos

### Usando Photoshop/Illustrator

1. Crie um arquivo 512x512px
2. Designe o ícone em alta resolução
3. Exporte em PNG
4. Redimensione para 192x192px

## 📋 Checklist PWA

- [ ] Criar `public/icon-192.png` (192x192px)
- [ ] Criar `public/icon-512.png` (512x512px)
- [ ] Testar instalação no Android
- [ ] Testar instalação no iOS
- [ ] Verificar funcionamento offline
- [ ] Testar em diferentes navegadores

## 🔧 Testando o PWA

### Chrome DevTools

1. Abra o DevTools (F12)
2. Vá para a aba "Application"
3. Verifique "Manifest" e "Service Workers"
4. Teste "Install" na aba "Application"

### Dispositivo Móvel

1. Acesse o site no celular
2. Procure por "Adicionar à tela inicial"
3. Teste o app instalado

## 🚀 Deploy em Produção

### HTTPS Obrigatório

- PWA só funciona com HTTPS
- Vercel fornece HTTPS automaticamente
- Outras plataformas podem requerer configuração manual

### Variáveis de Ambiente

```env
NEXTAUTH_URL="https://seu-dominio.com"
```

## 📱 Funcionalidades PWA

- ✅ Instalável como app
- ✅ Funciona offline
- ✅ Splash screen personalizada
- ✅ Ícones adaptativos
- ✅ Tema escuro/claro
- ✅ Orientação portrait

## 🆘 Problemas Comuns

### Ícone não aparece

- Verifique se os arquivos existem
- Confirme os nomes dos arquivos
- Limpe o cache do navegador

### PWA não instala

- Verifique se está usando HTTPS
- Confirme se o manifest.json está correto
- Teste em modo incógnito

### App não funciona offline

- Verifique se o service worker está registrado
- Confirme se os recursos estão sendo cacheados
- Teste a conectividade

---

**Nota**: Após criar os ícones, reinicie o servidor de desenvolvimento para que as mudanças sejam aplicadas.
