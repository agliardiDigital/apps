import type { App, FnContext } from "deco/mod.ts";
import { createHttpClient } from "../utils/http.ts";
import manifest, { Manifest } from "./manifest.gen.ts";
import { API } from "./utils/specs/api.gen.ts";
import { fetchSafe } from "../utils/fetch.ts";

export type AppContext = FnContext<State, Manifest>;

/** @title Wake */
export interface Props {
  /**
   * @title Wake API token
   * @description The token for accessing wake commerce
   * @default deco
   */
  token: string;

  /**
   * @description Use Wake as backend platform
   */
  platform: "wake";
}

export interface State extends Props {
  api: ReturnType<typeof createHttpClient<API>>;
}

/**
 * @title Wake
 */
export default function App(props: Props): App<Manifest, State> {
  const { token } = props;
  const api = createHttpClient<API>({
    base: "https://api.fbits.net",
    headers: new Headers({ "Authentication": `Basic ${token}` }),
    fetcher: fetchSafe,
  });

  return {
    state: { ...props, api },
    manifest,
  };
}
