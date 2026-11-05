// Gera as tabelas do README a partir do plan.json (fonte única do plano).
// Uso: node docs/e2e-purchase-flow/render.mjs
// Só o trecho entre os marcadores do README é reescrito.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const plan = JSON.parse(readFileSync(join(here, "plan.json"), "utf8"));
const readmePath = join(here, "README.md");

const START = "<!-- plan:start -->";
const END = "<!-- plan:end -->";

const V6_LABEL = {
  pronto: "Pronto",
  parcial: "Parcial",
  falta: "Falta",
  backend: "Backend",
  validar: "Validar",
};

const cell = (value) =>
  String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ") || "—";
const code = (value) => (value ? `\`${value}\`` : "—");
const table = (head, rows) =>
  [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n");

function countBy(tasks, key) {
  return tasks.reduce((acc, task) => {
    acc[task[key]] = (acc[task[key]] ?? 0) + 1;
    return acc;
  }, {});
}

const allTasks = plan.phases.flatMap((phase) => phase.tasks);
const totals = countBy(allTasks, "v6");

const out = [];

out.push("## Resumo");
out.push("");
out.push(
  table(
    ["Fase", "Papéis", "Tarefas", "Pronto", "Parcial", "Falta", "Backend", "Validar"],
    plan.phases.map((phase) => {
      const c = countBy(phase.tasks, "v6");
      return [
        `${phase.id} · ${phase.title}`,
        phase.roles.join(", "),
        phase.tasks.length,
        c.pronto ?? 0,
        c.parcial ?? 0,
        c.falta ?? 0,
        c.backend ?? 0,
        c.validar ?? 0,
      ];
    }),
  ),
);
out.push("");
out.push(
  `Total: ${allTasks.length} tarefas, ${plan.matrix.offers.length} casos de oferta e ${plan.matrix.purchases.length} trilhas de compra. ` +
    `No V6 hoje: ${totals.pronto ?? 0} prontas, ${totals.parcial ?? 0} parciais, ${totals.falta ?? 0} faltando, ` +
    `${totals.backend ?? 0} dependendo do backend e ${totals.validar ?? 0} só de execução.`,
);
out.push("");

out.push("## Parâmetros do lote");
out.push("");
out.push(
  "Preencha antes de começar. Os valores reais (e-mails, arquivos, endereços) ficam no registro do lote, nunca no repositório. Senhas e tokens não entram em lugar nenhum.",
);
out.push("");
out.push(
  table(
    ["Chave", "O que é", "Exemplo", "Observação"],
    plan.params.map((p) => [code(p.key), p.label, p.example, p.note]),
  ),
);
out.push("");

out.push("## Fases e tarefas");
out.push("");
out.push(
  "Coluna V6: situação do front hoje. Coluna Demanda: item da lista de demandas (D-) ou dependência de backend (B-) que destrava a tarefa.",
);
out.push("");
for (const phase of plan.phases) {
  out.push(`### ${phase.id} · ${phase.title}`);
  out.push("");
  out.push(`**Papéis:** ${phase.roles.join(", ")}. **Objetivo:** ${phase.goal}`);
  out.push("");
  out.push(
    table(
      ["ID", "Papel", "Tarefa", "Tela V6", "Rotas", "V6", "Demanda", "Critério de aceite"],
      phase.tasks.map((t) => [
        t.id,
        t.role,
        t.title,
        t.screen ? code(t.screen) : "—",
        t.endpoints.length ? t.endpoints.map(code).join("<br>") : "—",
        V6_LABEL[t.v6] ?? t.v6,
        t.demand,
        t.accept,
      ]),
    ),
  );
  out.push("");
}

out.push("## Matriz de ofertas (F3)");
out.push("");
out.push(plan.matrix.rule);
out.push("");
out.push("### Dimensões");
out.push("");
out.push(
  table(
    ["Dimensão", "Valores"],
    plan.matrix.dimensions.map((d) => [d.label, d.values.join(", ")]),
  ),
);
out.push("");
out.push("### Casos");
out.push("");
out.push(
  table(
    ["ID", "Categoria", "Cobertura", "Opções", "Esperado", "Depende de"],
    plan.matrix.offers.map((o) => [
      o.id,
      o.category,
      o.coverage,
      o.options,
      o.expect,
      o.deps.join(", "),
    ]),
  ),
);
out.push("");

out.push("## Trilhas de compra (F4 a F9)");
out.push("");
out.push(
  "CP- são compras que precisam fechar. ALT- são caminhos alternativos e negativos.",
);
out.push("");
out.push(
  table(
    ["ID", "Trilha", "Oferta", "Quem compra", "Caminho", "Esperado", "Depende de"],
    plan.matrix.purchases.map((p) => [
      p.id,
      p.title,
      p.offer,
      code(p.buyer),
      p.path,
      p.expect,
      p.deps.join(", "),
    ]),
  ),
);
out.push("");

out.push("## Demandas de front");
out.push("");
out.push(
  table(
    ["ID", "Demanda", "Papéis", "Escopo", "Tarefas"],
    plan.demands.map((d) => [d.id, d.title, d.roles, d.scope, d.tasks.join(", ")]),
  ),
);
out.push("");

out.push("## Dependências de backend");
out.push("");
out.push(
  table(
    ["ID", "Item", "Impacto", "Situação"],
    plan.backend.map((b) => [b.id, b.title, b.impact, b.state]),
  ),
);

const readme = readFileSync(readmePath, "utf8");
const startAt = readme.indexOf(START);
const endAt = readme.indexOf(END);
if (startAt < 0 || endAt < startAt) {
  throw new Error(`README sem os marcadores ${START} e ${END}.`);
}
const next =
  readme.slice(0, startAt + START.length) +
  "\n\n" +
  out.join("\n") +
  "\n\n" +
  readme.slice(endAt);
writeFileSync(readmePath, next);
console.log(
  `README atualizado: ${plan.phases.length} fases, ${allTasks.length} tarefas, ${plan.matrix.offers.length} ofertas, ${plan.matrix.purchases.length} trilhas.`,
);
