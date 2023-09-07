import type { InvocationFuncFor } from "deco/clients/withManifest.ts";
import type { AnalyticsItem } from "../../commerce/types.ts";
import type { Manifest } from "../manifest.gen.ts";
import { invoke } from "../runtime.ts";
import { state as storeState } from "./context.ts";
import { CheckoutFragment } from "../utils/graphql/graphql.gen.ts";

const { cart, loading } = storeState;

export const itemToAnalyticsItem = (
  item: NonNullable<NonNullable<CheckoutFragment["products"]>[number]> & {
    coupon?: string;
  },
  index: number,
): AnalyticsItem => ({
  item_id: `${item.productId}_${item.productVariantId}`,
  item_name: item.name!,
  discount: item.price - item.ajustedPrice,
  item_variant: item.productVariantId,
  // TODO: check
  price: item.price,
  coupon: item.coupon,
  item_brand: item.brand!,
  index,
  quantity: item.quantity,
});

type PropsOf<T> = T extends (props: infer P, r: any, ctx: any) => any ? P
  : T extends (props: infer P, r: any) => any ? P
  : T extends (props: infer P) => any ? P
  : never;

type Actions =
  | "wake/actions/cart/addItem.ts"
  | "wake/actions/cart/updateItemQuantity.ts"
  | "wake/actions/cart/addCoupon.ts"
  | "wake/actions/cart/removeCoupon.ts";

const action =
  (key: Actions) => (props: PropsOf<InvocationFuncFor<Manifest, typeof key>>) =>
    storeState.enqueue((signal) =>
      invoke({ cart: { key, props } }, { signal }) satisfies Promise<
        { cart: Partial<CheckoutFragment> }
      >
    );

const state = {
  cart,
  loading,
  addItem: action("wake/actions/cart/addItem.ts"),
  updateItem: action("wake/actions/cart/updateItemQuantity.ts"),
  addCoupon: action("wake/actions/cart/addCoupon.ts"),
  removeCoupon: action("wake/actions/cart/removeCoupon.ts"),
};

export const useCart = () => state;
