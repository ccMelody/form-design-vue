const path = require( 'path' )

function resolve ( dir ) {
  return path.join( __dirname, dir )
}

module.exports = {
  runtimeCompiler: true,
  // publicPath: '/approvalflow/',
  publicPath: './',
  outputDir:'flowPage',
  css: {
    loaderOptions: {
      // 给 stylus-loader 传递选项
      stylus: {
        import: '~@/assets/style/global.styl'
      }
    }
  },
  chainWebpack ( config ) {
    // set svg-sprite-loader
    config.module
      .rule( 'svg' )
      .exclude.add( resolve( 'src/components/DynamicForm/icons' ) )
      .end()
    config.module
      .rule( 'icons' )
      .test( /\.svg$/ )
      .include.add( resolve( 'src/components/DynamicForm/icons' ) )
      .end()
      .use( 'svg-sprite-loader' )
      .loader( 'svg-sprite-loader' )
      .options( {
        symbolId: 'icon-[name]'
      } )
      .end()
  },
  //开发模式反向代理配置，生产模式请使用Nginx部署并配置反向代理
  devServer: {
    port: 8089,
    proxy: {
      '/api': {
        //本地服务接口地址
        target: 'http://192.168.1.67:8080/jeecg_war_exploded/',
        changeOrigin: true,
        ws: true,
        pathRewrite: {
          '^/api': '/'
        }
      }
    }
  },
  
}
