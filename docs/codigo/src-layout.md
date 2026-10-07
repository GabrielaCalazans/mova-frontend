# Notas de implementação — src/layout

Texto que ficava em comentários de várias linhas no código. Cada seção indica o arquivo e o trecho que o comentário acompanhava.

## `src/layout/AuthLayout.jsx`

**`function AuthLayout({`**

Moldura das telas de formulário. Fora do AppShell (login, cadastro,
recuperação) mostra a marca oficial no topo; dentro do shell vira só o
conteúdo da página, sem duplicar cabeçalho nem menu inferior.
`logoSrc`/`wordmark`/`tagline` legados apenas sinalizam "mostrar a marca":
o asset oficial (com o slogan) substitui a imagem antiga.
