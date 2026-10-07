# Notas de implementação — src/context

Texto que ficava em comentários de várias linhas no código. Cada seção indica o arquivo e o trecho que o comentário acompanhava.

## `src/context/ThemeContext.jsx`

**`const STORAGE_KEY = 'mova:tema-escuro:v2';`**

Mesma chave das versões anteriores: "true" = escuro, "false" = claro.
Ausente = segue o sistema (prefers-color-scheme). O script de index.html
lê esta chave antes da primeira pintura para não piscar.

**`root.setAttribute('data-theme-switching', '');`**

Congela transições durante a troca: sem isso cor e fundo animam em
tempos diferentes e o texto some por um instante.
