import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { grupoDoArquivo, organizarSuites } from "./allureSuites";

// No jsdom o URL global não aceita file://; o vitest roda na raiz do projeto.
const RAIZ = `${globalThis.process.cwd()}/`;

describe("Allure — agrupamento das suítes", () => {
  it("todo arquivo de teste tem grupo (ator, entidade ou segmento)", () => {
    const arquivos = ["src", "tests"].flatMap((pasta) =>
      readdirSync(`${RAIZ}${pasta}`, { recursive: true })
        .map((p) => `${pasta}/${String(p).replaceAll("\\", "/")}`)
        .filter((p) => /\.(test|spec)\.jsx?$/.test(p)),
    );

    expect(arquivos.length).toBeGreaterThan(70);
    expect(arquivos.filter((a) => !grupoDoArquivo(a))).toEqual([]);
  });

  it("nome do arquivo vence a pasta e o .spec do Playwright também tem grupo", () => {
    expect(grupoDoArquivo("src/i18n/catalog.test.js")).toBe("Segmento: Internacionalização");
    expect(grupoDoArquivo("src/pages/OwnerReports.i18n.test.jsx")).toBe("Segmento: Internacionalização");
    expect(grupoDoArquivo("src/pages/CheckoutReserva.test.jsx")).toBe("Entidade: Reserva");
    expect(grupoDoArquivo("public-home.spec.js")).toBe("Segmento: Jornadas ponta a ponta");
  });

  it("grupo vira parentSuite e os describes descem um nível", () => {
    const resultado = {
      titlePath: ["mova-frontend", "src", "pages", "CheckoutReserva.test.jsx", "CheckoutReserva — RF10", "seguro"],
      labels: [
        { name: "parentSuite", value: "CheckoutReserva — RF10" },
        { name: "suite", value: "seguro" },
        { name: "package", value: "mova-frontend.src.pages.CheckoutReserva.test.jsx" },
      ],
    };

    organizarSuites(resultado);

    expect(resultado.labels).toEqual([
      { name: "package", value: "mova-frontend.src.pages.CheckoutReserva.test.jsx" },
      { name: "parentSuite", value: "Entidade: Reserva" },
      { name: "suite", value: "CheckoutReserva — RF10" },
      { name: "subSuite", value: "seguro" },
    ]);
  });
});
