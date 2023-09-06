import { gql } from "../../../../utils/graphql.ts";

export const fragment = gql`
fragment Product on SingleProduct {
  mainVariant
  productName
  alias
  attributes {
    value
    name
  }
  available
  averageRating
  breadcrumbs {
    text
    link
  }
  condition
  createdAt
  ean
  id
  images {
    url
    fileName
    print
  }
  minimumOrderQuantity
  prices {
    bestInstallment {
      discount
      displayName
      fees
      name
      number
      value
    }
    discountPercentage
    discounted
    installmentPlans {
      displayName
      installments {
        discount
        fees
        number
        value
      }
      name
    }
    listPrice
    multiplicationFactor
    price
    priceTables {
      discountPercentage
      id
      listPrice
      price
    }
    wholesalePrices {
      price
      quantity
    }
  }
  productBrand {
    fullUrlLogo
    logoUrl
    name
    alias
  }
  productVariantId
  reviews {
    rating
    review
    reviewDate
    email
    customer
  }
  seller {
    name
  }
  seo {
    name
    scheme
    type
    httpEquiv
    content
  }
  sku
  stock
  variantName
}
`;
