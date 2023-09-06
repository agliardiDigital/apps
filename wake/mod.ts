import type { App, FnContext } from "deco/mod.ts";
import { createHttpClient } from "../utils/http.ts";
import manifest, { Manifest } from "./manifest.gen.ts";
import { API } from "./utils/openapi/openapi.gen.ts";
import { fetchSafe } from "../utils/fetch.ts";
import { createGraphqlClient } from "../utils/graphql.ts";

export type AppContext = FnContext<State, Manifest>;

/** @title Wake */
export interface Props {
  /**
   * @title Wake Storefront Token
   * @description https://wakecommerce.readme.io/docs/storefront-api-criacao-e-autenticacao-do-token
   */
  storefrontToken: string;

  /**
   * @title Wake API token
   * @description The token for accessing wake commerce
   * @default deco
   */
  token?: string;

  /**
   * @description Use Wake as backend platform
   */
  platform: "wake";
}

export interface State extends Props {
  api: ReturnType<typeof createHttpClient<API>>;
  storefront: ReturnType<typeof createGraphqlClient>;
}

/**
 * @title Wake
 */
export default function App(props: Props): App<Manifest, State> {
  const { token, storefrontToken } = props;
  const api = createHttpClient<API>({
    base: "https://api.fbits.net",
    headers: new Headers({ "Authorization": `Basic ${token}` }),
    fetcher: fetchSafe,
  });

  const storefront = createGraphqlClient({
    endpoint: "https://storefront-api.fbits.net/graphql",
    headers: new Headers({ "TCS-Access-Token": storefrontToken }),
    fetcher: fetchSafe,
  });

  console.info(storefrontToken);

  return {
    state: { ...props, api, storefront },
    manifest,
  };
}
