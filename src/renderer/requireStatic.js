// https://github.com/loopmode/electron-webpack-static-examples
// https://github.com/loopmode/electron-webpack-quick-start/blob/react/src/renderer/requireStatic.js
import path from 'path'
import * as url from 'url'

/**
 * Takes a file path and returns either a local filesystem path in production, or a localhost url in development.
 *
 * @see https://github.com/electron-userland/electron-webpack/issues/99#issuecomment-459251702
 * @param {string} resourcePath - filepath relative to `/static`
 * @return {string} - filepath that can be required
 */
// export default function requireStatic(resourcePath) {
//   if (process.env.NODE_ENV === 'production') {
//     return path.resolve(__static, resourcePath)
//   }
//   return url.resolve(window.location.origin, resourcePath)
// }
export default function requireStatic(resourcePath) {
  if (process.env.NODE_ENV === 'development') {
    return url.resolve(window.location.origin, resourcePath)
  }
  return path.resolve(__static, resourcePath)
}
