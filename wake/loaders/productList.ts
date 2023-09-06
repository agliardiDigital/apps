import type { Product } from "../../commerce/types.ts";
import type { AppContext } from "../mod.ts";
import { camposAdicionais, stale, toProduct } from "../utils/transform.ts";

export interface Props {
  /**
   * @title Numero de produtos
   * @description Quantidade de produtos que deverão retornar (max: 50)
   */
  quantidadeRegistros?: number;
  /**
   * @description Retorna apenas os produtos que estão marcados como válido
   */
  somenteValidos?: boolean;
  /**
   * @description Lista de categorias que deverão retornar, caso vazio retornará todas as categorias
   */
  categorias?: string[];
  /**
   * @description Lista de fabricantes que deverão retornar, caso vazio retornará todas as situações
   */
  fabricantes?: string[];
  /**
   * @description Lista de centros de distribuição que deverão retornar, caso vazio retornará produtos de todos os cd's
   */
  centrosDistribuicao?: string[];
  /**
   * @description Retorna apenas os produtos que sofreram alguma alteração a partir da data/hora informada. Formato: aaaa-mm-dd hh:mm:ss com no máximo 48 horas de antecedência
   */
  alteradosPartirDe?: string;
  /**
   * @description Página da lista (padrão: 1)
   */
  pagina?: number;
}

/**
 * @title Wake Integration
 * @description Product List loader
 */
const productListLoader = async (
  props: Props,
  req: Request,
  ctx: AppContext,
): Promise<Product[] | null> => {
  const url = new URL(req.url);
  const { api } = ctx;

  const variants = await api["GET /produtos"]({
    ...props,
    categorias: props.categorias?.join(",") || undefined,
    fabricantes: props.fabricantes?.join(",") || undefined,
    centrosDistribuicao: props.centrosDistribuicao?.join(",") || undefined,
    camposAdicionais,
  }, stale)
    .then((res) => res.json());

  return Promise.all(variants.map((v) => toProduct(v, { api, base: url })));
};

export default productListLoader;
