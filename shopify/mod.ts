import type { App, FnContext } from "deco/mod.ts";
import { fetchSafe } from "../utils/fetch.ts";
import { createGraphqlClient } from "../utils/graphql.ts";
import manifest, { Manifest } from "./manifest.gen.ts";
import type { SecretString } from "../website/loaders/secretString.ts";

export type AppContext = FnContext<State, Manifest>;

/** @title Shopify */
export interface Props {
  /**
   * @description Shopify store name.
   */
  storeName: string;

  /**
   * @ttile Access Token
   * @description Shopify storefront access token.
   */
  storefrontAccessToken: string;

  /**
   * @ttile Access Token
   * @description Shopify admin access token.
   */
  adminAccessToken: SecretString;

  /**
   * @description Use Shopify as backend platform
   */
  platform: "shopify";
}

export interface State extends Props {
  storefront: ReturnType<typeof createGraphqlClient>;
  admin: ReturnType<typeof createGraphqlClient>;
}

/**
 * @title Shopify
 */
export default function App(props: Props): App<Manifest, State> {
  const { storeName, storefrontAccessToken, adminAccessToken } = props;
  const storefront = createGraphqlClient({
    endpoint: `https://${storeName}.myshopify.com/api/2023-07/graphql.json`,
    fetcher: fetchSafe,
    headers: new Headers({
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
    }),
  });

  const admin = createGraphqlClient({
    endpoint:
      `https://${storeName}.myshopify.com/admin/api/2023-07/graphql.json`,
    fetcher: fetchSafe,
    headers: new Headers({
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminAccessToken || "",
    }),
  });

  return { state: { ...props, storefront, admin }, manifest };
}
