import type { Case } from "../../types/case";
import { caso101 } from "./101-clientes-bloqueados";
import { caso102 } from "./102-estoque-abaixo-minimo";
import { caso103 } from "./103-motivos-cancelamento";
import { caso104 } from "./104-rejeicao-535-frete";
import { caso201 } from "./201-vendas-nao-efetivadas";
import { caso202 } from "./202-itens-fora-preco-tabela";
import { caso203 } from "./203-caixas-sem-fechamento";
import { caso204 } from "./204-frete-cobrado-outras-despesas";
import { caso205 } from "./205-data-emissao-futura";
import { caso301 } from "./301-compradores-unicos-alto-valor";
import { caso302 } from "./302-produtos-vendidos-prejuizo";
import { caso303 } from "./303-ranking-vendedores-filial";
import { caso304 } from "./304-icms-desonerado-devolucao";
import { caso305 } from "./305-valor-final-divergente-ipi";
import { caso306 } from "./306-vencimento-parcela-divergente";
import { caso307 } from "./307-caixa-travado-funcionario-inativo";
import { caso308 } from "./308-bug-troco-forma-pagamento";
import { caso309 } from "./309-sped-icms-cst60-entrada";

export const CASES: Case[] = [
  // Iniciante
  caso101,
  caso102,
  caso103,
  caso104,
  // Intermediário
  caso201,
  caso202,
  caso203,
  caso204,
  caso205,
  // Avançado
  caso301,
  caso302,
  caso303,
  caso304,
  caso305,
  caso306,
  caso307,
  caso308,
  caso309,
];