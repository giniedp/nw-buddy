/// <reference types="vite/client" />
/// <reference types="@gglib/vite-plugin/client" />

declare module '*.svg?raw' {
  const content: string
  export default content
}
