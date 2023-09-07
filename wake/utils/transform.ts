import slugify from "npm:slugify";
import {
  BreadcrumbList,
  ListItem,
  Product,
  ProductListingPage,
  PropertyValue,
  UnitPriceSpecification,
} from "../../commerce/types.ts";
import { DEFAULT_IMAGE } from "../../commerce/utils/constants.ts";
import {
  ProductFragment,
  SearchQuery,
  SingleProductFragment,
} from "./graphql/graphql.gen.ts";

export const stale = {
  deco: { cache: "stale-while-revalidate" },
};

export const FILTER_PARAM = "filtro";

export const camposAdicionais = [
  "Atacado",
  "Estoque",
  "Atributo",
  "Informacao",
  "TabelaPreco",
];

export const parseSlug = (slug: string) => {
  const segments = slug.split("-");
  const id = Number(segments.at(-1));

  if (!id) {
    throw new Error("Malformed slug. Expecting {slug}-{id} format");
  }

  return {
    slug: segments.slice(0, -1).join("-"),
    id: Number(segments.at(-1)),
  };
};

export const getProductUrl = (
  { productName, productId }: ProductFragment | SingleProductFragment,
  base: URL | string,
) =>
  new URL(`/produto/${slugify.default(productName ?? "")}-${productId}`, base);

export const getVariantUrl = (
  variant: ProductFragment | SingleProductFragment,
  base: URL | string,
) => {
  const url = getProductUrl(variant, base);

  url.searchParams.set("skuId", variant.productVariantId);

  return url;
};

export const toFilters = (
  aggregations: NonNullable<SearchQuery["search"]>["aggregations"],
  { base }: { base: URL },
): ProductListingPage["filters"] =>
  aggregations?.filters?.map((filter) => ({
    "@type": "FilterToggle",
    key: filter?.origin ?? "",
    label: filter?.field ?? "",
    quantity: 0,
    values: filter?.values?.map((filterValue) => {
      const url = new URL(base);
      const { name, quantity } = filterValue!;
      const index = url.searchParams
        .getAll(FILTER_PARAM)
        .findIndex((f) => f === name);
      const selected = index > -1;

      if (selected) {
        const params = new URLSearchParams();
        url.searchParams.forEach((value, key) => {
          if (key !== FILTER_PARAM || !value.endsWith(name!)) {
            params.append(key, value);
          }
        });
        url.search = `${params}`;
      } else {
        url.searchParams.append(FILTER_PARAM, `${filter.field}:${name}`);
      }

      return {
        value: name!,
        label: name!,
        quantity: quantity!,
        selected,
        url: url.href,
      };
    }) ?? [],
  })) ?? [];

export const toBreadcrumbList = (
  product: Product,
  categories: ProductFragment["productCategories"],
  { base }: { base: URL },
): BreadcrumbList => {
  const category = categories?.find((c) => c?.main);
  const segments = category?.url?.split("/") ?? [];
  const names = category?.hierarchy?.split(" > ") ?? [];
  const itemListElement = segments.length === names.length
    ? [
      ...segments.map((_, i): ListItem<string> => ({
        "@type": "ListItem",
        name: names[i],
        position: i + 1,
        item: new URL(`/${segments.slice(0, i + 1).join("/")}`, base).href,
      })),
      {
        "@type": "ListItem",
        name: product.isVariantOf?.name,
        url: product.isVariantOf?.url,
        position: segments.length + 1,
      } as ListItem<string>,
    ]
    : [];

  return {
    "@type": "BreadcrumbList",
    numberOfItems: itemListElement.length,
    itemListElement,
  };
};

export const toProduct = (
  variant: ProductFragment | SingleProductFragment,
  { base }: { base: URL | string },
): Product => {
  const images = variant.images?.map((image) => ({
    "@type": "ImageObject" as const,
    url: image?.url ?? "",
    alternateName: image?.fileName ?? "",
  }));
  const additionalProperty: PropertyValue[] = [];
  variant.informations?.forEach((info) =>
    additionalProperty.push({
      "@type": "PropertyValue",
      name: info?.title ?? undefined,
      value: info?.value ?? undefined,
      valueReference: "INFORMATION",
    })
  );
  variant.attributes?.forEach((attr) =>
    additionalProperty.push({
      "@type": "PropertyValue",
      name: attr?.name ?? undefined,
      value: attr?.value ?? undefined,
      valueReference: "SPECIFICATION",
    })
  );

  const priceSpecification: UnitPriceSpecification[] = [];
  if (variant.prices?.listPrice) {
    priceSpecification.push({
      "@type": "UnitPriceSpecification",
      priceType: "https://schema.org/ListPrice",
      price: variant.prices.listPrice,
    });
  }
  if (variant.prices?.price) {
    priceSpecification.push({
      "@type": "UnitPriceSpecification",
      priceType: "https://schema.org/SalePrice",
      price: variant.prices.price,
    });
  }

  return {
    "@type": "Product",
    url: getVariantUrl(variant, base).href,
    gtin: variant.ean ?? undefined,
    sku: variant.sku!,
    description:
      variant.informations?.find((info) => info?.type === "Descrição")?.value ??
        undefined,
    productID: variant.productVariantId,
    name: variant.variantName ?? undefined,
    inProductGroupWithID: variant.productId,
    image: !images?.length ? [DEFAULT_IMAGE] : images,
    brand: {
      "@type": "Brand",
      name: variant.productBrand?.name ?? "",
      url: variant.productBrand?.logoUrl ?? variant.productBrand?.fullUrlLogo ??
        "",
    },
    isSimilarTo: [],
    isVariantOf: {
      "@type": "ProductGroup",
      url: getProductUrl(variant, base).href,
      name: variant.productName ?? undefined,
      productGroupID: variant.productId,
      hasVariant: [],
      additionalProperty: [],
    },
    additionalProperty,
    offers: {
      "@type": "AggregateOffer",
      highPrice: variant.prices?.price,
      lowPrice: variant.prices?.price,
      offerCount: 1,
      offers: [{
        "@type": "Offer",
        seller: variant.seller?.name ?? undefined,
        price: variant.prices?.price,
        priceSpecification,
        availability: variant.available
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        inventoryLevel: { value: variant.stock },
      }],
    },
  };
};

// const pickVariant = (product: ProductGroup, variantId: string | null) => {
//   const variants = normalizeVariants(product.variants);
//   const [head] = variants;

//   let [target, main, available]: Array<
//     ProductVariant | null
//   > = [null, head, null];

//   for (const variant of variants) {
//     if (variant.sku === variantId) target = variant;
//     else if (variant.main) main = variant;
//     else if (variant.available && !available) available = variant;
//   }

//   const fallback = !available || main!.available ? main : available;

//   return target || fallback || head;
// };

// const normalizeInstallments = (installments: Installment[] | number[] = []) => {
//   if (typeof installments[0] === "number") {
//     const total = (installments as number[]).reduce((acc, curr) => acc + curr);

//     return [{
//       number: installments.length,
//       price: installments[0],
//       total,
//     }];
//   }

//   return (installments as Installment[]).map(({ number, price, total }) => ({
//     number,
//     price,
//     total,
//   }));
// };

// const toURL = (src: string) => src.startsWith("//") ? `https:${src}` : src;

// const toOffer = ({
//   price,
//   sale_price,
//   available_quantity,
//   available,
//   installments = [],
// }: ProductVariant): Offer | null => {
//   if (!price || !sale_price) {
//     return null;
//   }

//   const priceSpecification: UnitPriceSpecification[] = [{
//     "@type": "UnitPriceSpecification",
//     priceType: "https://schema.org/SalePrice",
//     price: sale_price,
//   }];

//   if (price > sale_price) {
//     priceSpecification.push({
//       "@type": "UnitPriceSpecification",
//       priceType: "https://schema.org/ListPrice",
//       price,
//     });
//   }

//   for (const installment of normalizeInstallments(installments)) {
//     priceSpecification.push({
//       "@type": "UnitPriceSpecification",
//       priceType: "https://schema.org/SalePrice",
//       priceComponentType: "https://schema.org/Installment",
//       name: "INSTALLMENT",
//       description: "INSTALLMENT",
//       billingDuration: installment.number,
//       billingIncrement: installment.price,
//       price: installment.total,
//     });
//   }

//   return {
//     "@type": "Offer",
//     seller: "VNDA",
//     price,
//     priceSpecification,
//     inventoryLevel: {
//       value: available_quantity,
//     },
//     availability: available
//       ? "https://schema.org/InStock"
//       : "https://schema.org/OutOfStock",
//   };
// };

// const toPropertyValue = (variant: ProductVariant): PropertyValue[] =>
//   Object.values(variant.properties ?? {})
//     .filter(Boolean)
//     .map(({ value, name }) =>
//       value && ({
//         "@type": "PropertyValue",
//         name,
//         value,
//         valueReference: "SPECIFICATION",
//       } as PropertyValue)
//     ).filter((x): x is PropertyValue => Boolean(x));

// // deno-lint-ignore no-explicit-any
// const isProductVariant = (p: any): p is ProductVariant =>
//   typeof p.id === "number";

// const normalizeVariants = (
//   variants: ProductGroup["variants"] = [],
// ): ProductVariant[] =>
//   variants.flatMap((v) => isProductVariant(v) ? [v] : Object.values(v));

// export const toProduct = (
//   product: ProductGroup,
//   variantId: string | null,
//   options: ProductOptions,
//   level = 0,
// ): Product => {
//   const { url, priceCurrency } = options;
//   const variant = pickVariant(product, variantId);
//   const variants = normalizeVariants(product.variants);
//   const variantUrl = new URL(
//     `/produto/${product.slug}-${product.id}?skuId=${variant.sku}`,
//     url.origin,
//   ).href;
//   const productUrl = new URL(
//     `/produto/${product.slug}-${product.id}`,
//     url.origin,
//   ).href;
//   const productID = `${variant.sku}`;
//   const productGroupID = `${product.id}`;
//   const offer = toOffer(variant);
//   const offers = offer ? [offer] : [];

//   return {
//     "@type": "Product",
//     productID,
//     sku: productID,
//     url: variantUrl,
//     name: product.name,
//     description: product.description,
//     additionalProperty: toPropertyValue(variant),
//     inProductGroupWithID: productGroupID,
//     gtin: product.reference,
//     isVariantOf: {
//       "@type": "ProductGroup",
//       productGroupID,
//       url: productUrl,
//       name: product.name,
//       model: product.reference,
//       additionalProperty: variants.flatMap(toPropertyValue),
//       hasVariant: level === 0
//         ? variants.map((v) => toProduct(product, v.sku!, options, 1))
//         : [],
//     },
//     image: product.images?.length ?? 0 > 1
//       ? product.images?.map((img) => ({
//         "@type": "ImageObject" as const,
//         alternateName: img.id?.toString() ?? "",
//         url: toURL(img.url),
//       }))
//       : [
//         {
//           "@type": "ImageObject",
//           alternateName: product.name ?? "",
//           url: toURL(product.image_url ?? ""),
//         },
//       ],
//     // images:
//     offers: {
//       "@type": "AggregateOffer",
//       priceCurrency: priceCurrency,
//       highPrice: product.price!,
//       lowPrice: product.sale_price!,
//       offerCount: offers.length,
//       offers: offers,
//     },
//   };
// };

// const isFilterSelected = (
//   typeTagsInUse: { key: string; value: string }[],
//   filter: { key: string; value: string },
// ) =>
//   Boolean(typeTagsInUse.find((inUse) =>
//     inUse.key === filter.key &&
//     inUse.value === filter.value
//   ));

// const addFilter = (
//   typeTagsInUse: { key: string; value: string }[],
//   filter: { key: string; value: string },
// ) => [...typeTagsInUse, filter];

// const removeFilter = (
//   typeTagsInUse: { key: string; value: string }[],
//   filter: { key: string; value: string },
// ) =>
//   typeTagsInUse.filter((inUse) =>
//     inUse.key !== filter.key &&
//     inUse.value !== filter.value
//   );

// export const toFilters = (
//   aggregations: ProductSearchResult["aggregations"],
//   typeTagsInUse: { key: string; value: string }[],
//   cleanUrl: URL,
// ): Filter[] => {
//   const priceRange = {
//     "@type": "FilterRange" as const,
//     label: "Valor",
//     key: "price_range",
//     values: {
//       min: aggregations.min_price,
//       max: aggregations.max_price,
//     },
//   };

//   const types = Object.keys(aggregations.types).map((typeKey) => {
//     const typeValues = aggregations.types[typeKey];

//     return {
//       "@type": "FilterToggle" as const,
//       key: "type",
//       label: typeKey,
//       quantity: 0,
//       values: typeValues.map((value) => {
//         const filter = { key: `type_tags[${typeKey}][]`, value: value.name };
//         const isSelected = isFilterSelected(typeTagsInUse, filter);

//         const nextFilters = isSelected
//           ? removeFilter(typeTagsInUse, filter)
//           : addFilter(typeTagsInUse, filter);

//         const filterUrl = new URL(cleanUrl);
//         nextFilters.forEach(({ key, value }) =>
//           filterUrl.searchParams.append(key, value)
//         );

//         return {
//           value: value.name,
//           label: value.title,
//           selected: isSelected,
//           quantity: value.count,
//           url: filterUrl.toString(),
//         };
//       }),
//     };
//   });

//   return [
//     priceRange,
//     ...types,
//   ];
// };

// export const typeTagExtractor = (url: URL) => {
//   const keysToDestroy: string[] = [];
//   const typeTags: { key: string; value: string }[] = [];
//   const typeTagRegex = /\btype_tags\[(\S+)\]\[\]/;

//   url.searchParams.forEach((value, key) => {
//     const match = typeTagRegex.exec(key);

//     if (match) {
//       keysToDestroy.push(key);
//       typeTags.push({ key, value });
//     }
//   });

//   // it can't be done inside the forEach instruction above
//   typeTags.forEach((tag) => url.searchParams.delete(tag.key));

//   return {
//     typeTags,
//     cleanUrl: url,
//   };
// };
