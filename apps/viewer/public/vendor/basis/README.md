# Basis Universal transcoder (WebAssembly)

Transcodes KTX2 textures (Basis Universal: ETC1S and UASTC) into a GPU format, e.g. the textures of the glTF models on
the nw-buddy CDN. Loaded by the KTX worker of `@gglib/loaders` (`KTX.Loader`, set up in `src/viewer.ts`).

- Source: the gglib repository (`assets/basis_transcoder.wasm`), the build that matches the `basis_transcoder.js` glue
  code bundled in `@gglib/loaders` (`packages/loaders/src/ktx/transcoder/`)
- License: Basis Universal is Apache 2.0 licensed, see https://github.com/BinomialLLC/basis_universal/blob/master/LICENSE

To update, replace it together with the glue code in gglib: the wasm and the js must come from the same build.
