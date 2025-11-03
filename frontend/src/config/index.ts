declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const CONFIG = {
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api",
};

export default CONFIG;
