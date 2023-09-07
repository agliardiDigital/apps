import { gql } from "../../../utils/graphql.ts";
import { HttpError } from "../../../utils/http.ts";
import { AppContext } from "../../mod.ts";
import { getCartCookie, setCartCookie } from "../../utils/cart.ts";
import { fragment } from "../../utils/graphql/fragments/checkout.ts";
import {
  AddItemToCartMutation,
  AddItemToCartMutationVariables,
  CheckoutFragment,
} from "../../utils/graphql/graphql.gen.ts";

export interface Props {
  productVariantId: number;
  quantity: number;
  customization: { customizationId: number; value: string }[];
  subscription: { subscriptionGroupId: number; recurringTypeId: number };
}

const action = async (
  props: Props,
  req: Request,
  ctx: AppContext,
): Promise<Partial<CheckoutFragment>> => {
  const { storefront } = ctx;
  const cartId = getCartCookie(req.headers);

  if (!cartId) {
    throw new HttpError(400, "Missing cart cookie");
  }

  const data = await storefront.query<
    AddItemToCartMutation,
    AddItemToCartMutationVariables
  >({
    variables: { input: { id: cartId, products: [props] } },
    fragments: [fragment],
    query:
      gql`mutation AddItemToCart($input: CheckoutProductInput!) { checkout: checkoutAddProduct(input: $input) { ...Checkout }}`,
  });

  const checkoutId = data.checkout?.checkoutId;
  setCartCookie(ctx.response.headers, checkoutId);

  return data.checkout ?? {};
};

export default action;
