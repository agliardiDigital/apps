const app = (name: string) => ({ dir: name, name });

const config = {
  apps: [
    app("vtex"),
    app("vnda"),
    app("shopify"),
    app("website"),
    app("commerce"),
    app("workflows"),
    app("algolia"),
  ],
};

export default config;
