// import { transpileTypescript } from './transpile-typescript'

// export async function executeTypescript<T>(script: string): Promise<T> {
//   const js = await transpileTypescript(script, {
//     module: 99, // ESNext
//     target: 99, // ESNext
//   })
//   const url = URL.createObjectURL(new Blob([String.raw({ raw: js })], { type: 'text/javascript' }))
//   return await import(/* webpackIgnore: true */ url)
// }
