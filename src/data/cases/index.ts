import type { Case } from "../../types/case";
import { caso001 } from "./001-clientes-bloqueados";
import { caso002 } from "./002-estoque-abaixo-minimo";
import { caso003 } from "./003-motivos-cancelamento";
import { caso004 } from "./004-vendas-nao-efetivadas";
import { caso005 } from "./005-itens-fora-preco-tabela";
import { caso006 } from "./006-caixas-sem-fechamento";
import { caso007 } from "./007-compradores-unicos-alto-valor";
import { caso008 } from "./008-produtos-vendidos-prejuizo";
import { caso009 } from "./009-ranking-vendedores-filial";
import { caso010 } from "./010-icms-desonerado-devolucao";
import { caso011 } from "./011-valor-final-divergente-ipi";
import { caso012 } from "./012-vencimento-parcela-divergente";
import { caso013 } from "./013-caixa-travado-funcionario-inativo";
import { caso014 } from "./014-bug-troco-forma-pagamento";
import { caso015 } from "./015-rejeicao-535-frete";
import { caso016 } from "./016-sped-icms-cst60-entrada";
import { caso017 } from "./017-frete-cobrado-outras-despesas.ts";
import { caso018 } from "./018-data-emissao-futura.ts";

export const CASES: Case[] = [
  caso001,
  caso002,
  caso003,
  caso004,
  caso005,
  caso006,
  caso007,
  caso008,
  caso009,
  caso010,
  caso011,
  caso012,
  caso013,
  caso014,
  caso015,
  caso016,
  caso017,
  caso018,
];