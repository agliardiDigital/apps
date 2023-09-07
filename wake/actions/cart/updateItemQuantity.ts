import { gql } from "../../../utils/graphql.ts";
import { HttpError } from "../../../utils/http.ts";
import { AppContext } from "../../mod.ts";
import { getCartCookie, setCartCookie } from "../../utils/cart.ts";
import { fragment } from "../../utils/graphql/fragments/checkout.ts";
import {
  CheckoutFragment,
  RemoveItemFromCartMutation,
  RemoveItemFromCartMutationVariables,
  UpdateItemQuantityMutation,
  UpdateItemQuantityMutationVariables,
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

  const data = props.quantity < 1
    ? await storefront.query<
      RemoveItemFromCartMutation,
      RemoveItemFromCartMutationVariables
    >({
      variables: {
        input: { id: cartId, products: [{ ...props, quantity: 1e6 }] },
      },
      fragments: [fragment],
      query:
        gql`mutation RemoveItemFromCart($input: CheckoutProductInput!) { checkout: checkoutRemoveProduct(input: $input) { ...Checkout }}`,
    })
    : await storefront.query<
      UpdateItemQuantityMutation,
      UpdateItemQuantityMutationVariables
    >({
      variables: { input: { id: cartId, products: [props] } },
      fragments: [fragment],
      query:
        gql`mutation UpdateItemQuantity($input: CheckoutProductInput!) { checkout: checkoutAddProduct(input: $input) { ...Checkout }}`,
    });

  const checkoutId = data.checkout?.checkoutId;
  setCartCookie(ctx.response.headers, checkoutId);

  return data.checkout ?? {};
};

export default action;
