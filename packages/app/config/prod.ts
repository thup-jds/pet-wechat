import type { UserConfigExport } from '@tarojs/cli'

export default {
  logger: {
    quiet: true,
    stats: false,
  },
  mini: {},
  h5: {
    /**
     * If h5Side webpackConfig.devServer is set, it will start a web server to preview H5 output.
     * You can customize it according to project requirements.
     * https://webpack.js.org/configuration/dev-server/
     */
    // webpackConfig: {
    //   devServer: {
    //     port: 10086
    //   }
    // }
  },
} satisfies UserConfigExport
