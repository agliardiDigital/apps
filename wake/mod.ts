import type { App, FnContext } from "deco/mod.ts";
import { createHttpClient } from "../utils/http.ts";
import manifest, { Manifest } from "./manifest.gen.ts";
import { API } from "./utils/specs/api.gen.ts";

export type AppContext = FnContext<State, Manifest>;

/** @title Wake */
export interface Props {
  /**
   * @title Wake Account name
   * @description The name that comes before the cdn.Wake, deco on deco.cdn.Wake.com.br
   * @default deco
   */
  account: string;

  /**
   * @description Use Wake as backend platform
   */
  platform: "wakes";
}

export interface State extends Props {
  api: ReturnType<typeof createHttpClient<API>>;
}

/**
 * @title Wake
 */
export default function App(props: Props): App<Manifest, State> {
  const { authToken, publicUrl, sandbox } = props;
  const api = createHttpClient<API>({
    headers: new Headers({}),
    base: sandbox
      ? "https://api.sandbox.Wake.com.br"
      : "https://api.Wake.com.br",
  });

  return {
    state: { ...props, api },
    manifest,
  };
}
