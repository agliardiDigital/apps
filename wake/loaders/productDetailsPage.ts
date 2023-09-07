import type { ProductDetailsPage } from "../../commerce/types.ts";
import { gql } from "../../utils/graphql.ts";
import type { RequestURLParam } from "../../website/functions/requestToParam.ts";
import { AppContext } from "../mod.ts";
import {
  GetProductQuery,
  GetProductQueryVariables,
} from "../utils/graphql/graphql.gen.ts";
import { parseSlug, toBreadcrumbList, toProduct } from "../utils/transform.ts";
import { fragment } from "../utils/graphql/fragments/singleProduct.ts";

export interface Props {
  slug: RequestURLParam;
}

/**
 * @title Wake Integration
 * @description Product Details Page loader
 */
async function loader(
  props: Props,
  req: Request,
  ctx: AppContext,
): Promise<ProductDetailsPage | null> {
  const url = new URL(req.url);
  const { slug } = props;
  const { api, storefront } = ctx;

  if (!slug) return null;

  const variantId = Number(url.searchParams.get("skuId")) || null;
  const { id: productId } = parseSlug(slug);

  if (!productId) {
    throw new Error("Missing product id");
  }

  const { product: wakeProduct } = await storefront.query<
    GetProductQuery,
    GetProductQueryVariables
  >({
    fragments: [fragment],
    query:
      gql`query GetProduct($productId: Long!) { product(productId: $productId) { ...SingleProduct } }`,
    variables: { productId },
  });

  if (!wakeProduct) {
    return null;
  }

  const product = toProduct(wakeProduct, { base: url });

  return {
    "@type": "ProductDetailsPage",
    breadcrumbList: toBreadcrumbList(product, wakeProduct.productCategories, {
      base: url,
    }),
    product,
    seo: {
      canonical: product.isVariantOf?.url ?? "",
      title: wakeProduct.productName ?? "",
      description:
        wakeProduct.seo?.find((m) => m?.name === "description")?.content ?? "",
    },
  };

  // const current = relatedVariants.find((rel) =>
  //   rel
  //     ? variantId
  //       ? rel.produtoVarianteId === variantId
  //       : rel.produtoId === productId
  //     : false
  // );

  // // 404: product not found
  // if (!current) return null;

  // const isVariantOf = relatedVariants.filter((
  //   rel,
  // ): rel is API["GET /produtos/:identificador"]["response"] =>
  //   Boolean(rel && rel.exibirSite && rel.produtoId === current.produtoId)
  // );

  // const isSimilarTo = relatedVariants.filter((
  //   rel,
  // ): rel is API["GET /produtos/:identificador"]["response"] =>
  //   Boolean(rel && rel.exibirSite && rel.produtoId !== current.produtoId)
  // );

  // const currentParams = {
  //   identificador: current.produtoVarianteId!,
  //   tipoIdentificador: "ProdutoVarianteId",
  // } as const;

  // const [partial, variants, similars, categories, seo] = await Promise.all([
  //   toProduct(current, { api, base: url }),
  //   Promise.all(isVariantOf.map((v) => toProduct(v, { api, base: url }))),
  //   Promise.all(isSimilarTo.map((v) => toProduct(v, { api, base: url }))),
  //   api["GET /produtos/:identificador/categorias"](currentParams, stale)
  //     .then((res) => res.json()),
  //   api["GET /produtos/:identificador/seo"](currentParams, stale)
  //     .then((res) => res.json()),
  // ]);

  // const product = {
  //   ...partial,
  //   isSimilarTo: similars,
  //   isVariantOf: { ...partial.isVariantOf!, hasVariant: variants },
  // };

  // return {
  //   "@type": "ProductDetailsPage",
  //   breadcrumbList: toBreadcrumbList(product, categories, { base: url }),
  //   product,
  //   seo: {
  //     canonical: product.isVariantOf.url ?? "",
  //     title: seo.title ?? "",
  //     description:
  //       seo.metatags?.find((m) => m.name === "description")?.content ?? "",
  //   },
  // };
}

export default loader;
