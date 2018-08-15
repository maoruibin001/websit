'use strict'
const path = require('path')
const config = require('../config')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const packageConfig = require('../package.json')
const fs = require('fs-extra')
const EntryDir = path.join(__dirname, '../src/entry')

const HtmlWebpackPlugin = require('html-webpack-plugin');
const templatePath = path.join(__dirname, '../src/template')
const defaultTemplate = path.resolve(templatePath, './index.html')
let isTest = /test/.test(process.env.NODE_ENV)

exports.assetsPath = function (_path) {
  const assetsSubDirectory = process.env.NODE_ENV === 'production'
    ? config.build.assetsSubDirectory
    : config.dev.assetsSubDirectory

  return path.posix.join(assetsSubDirectory, _path)
}

exports.cssLoaders = function (options) {
  options = options || {}

  const cssLoader = {
    loader: 'css-loader',
    options: {
      sourceMap: options.sourceMap
    }
  }

  const postcssLoader = {
    loader: 'postcss-loader',
    options: {
      sourceMap: options.sourceMap
    }
  }

  // generate loader string to be used with extract text plugin
  function generateLoaders (loader, loaderOptions) {
    const loaders = options.usePostCSS ? [cssLoader, postcssLoader] : [cssLoader]

    if (loader) {
      loaders.push({
        loader: loader + '-loader',
        options: Object.assign({}, loaderOptions, {
          sourceMap: options.sourceMap
        })
      })
    }

    // Extract CSS when that option is specified
    // (which is the case during production build)
    if (options.extract) {
      return ExtractTextPlugin.extract({
        use: loaders,
        fallback: 'vue-style-loader'
      })
    } else {
      return ['vue-style-loader'].concat(loaders)
    }
  }

  // https://vue-loader.vuejs.org/en/configurations/extract-css.html
  return {
    css: generateLoaders(),
    postcss: generateLoaders(),
    less: generateLoaders('less'),
    sass: generateLoaders('sass', { indentedSyntax: true }),
    scss: generateLoaders('sass'),
    stylus: generateLoaders('stylus'),
    styl: generateLoaders('stylus')
  }
}

// Generate loaders for standalone style files (outside of .vue)
exports.styleLoaders = function (options) {
  const output = []
  const loaders = exports.cssLoaders(options)

  for (const extension in loaders) {
    const loader = loaders[extension]
    output.push({
      test: new RegExp('\\.' + extension + '$'),
      use: loader
    })
  }

  return output
}

exports.createNotifierCallback = () => {
  const notifier = require('node-notifier')

  return (severity, errors) => {
    if (severity !== 'error') return

    const error = errors[0]
    const filename = error.file && error.file.split('!').pop()

    notifier.notify({
      title: packageConfig.name,
      message: severity + ': ' + error.name,
      subtitle: filename || '',
      icon: path.join(__dirname, 'logo.png')
    })
  }
}

exports.getEntry = (dir, test) => {
  let entry = {}
  dir = dir || '.'
  test = test || '.*'
  let testExp = new RegExp(test)
  function walk(dir) {
      let directory = path.join(EntryDir, dir)
      fs.readdirSync(directory).forEach(file => {
          let fullpath = path.join(directory, file)
          let stat = fs.statSync(fullpath)
          let extname = path.extname(fullpath)
          if (stat.isFile() && testExp.test(file)) {
              let entryFile = path.join(EntryDir, dir, path.basename(file, extname) + '.js')
              let name = dir
              entry[name] = entryFile //+ '?entry=true'
          } else if (stat.isDirectory()) {
              let subdir = path.join(dir, file)
              walk(subdir)
          }
      })
  }
  if (typeof dir === 'string') {
      walk(dir)
      return entry
  } else if(dir instanceof Array) {
      //为arr
      dir.forEach(e => walk(e));
      return entry;
  } 
}
exports.getHtmlWebpackPlugin = (entries, template) => {
  entries = entries || {};
  let pages = entries;
  let rtnA = [];
  for (let pathname in pages) {
      // 配置生成的html文件，定义路径等
      let customTpl = path.resolve(templatePath, pathname, 'app.html')
      !fs.existsSync(customTpl) && (customTpl = null)
      let conf = {
          filename: 'page/' + pathname + '.html',
          template: customTpl || template ||  defaultTemplate,   // 模板路径
          inject: true,              // js插入位置
          // necessary to consistently work with multiple chunks via CommonsChunkPlugin
          chunksSortMode: 'dependency'
      };
      if(!isTest){
          conf.minify = {
              removeComments: true,
              collapseWhitespace: true,
              removeAttributeQuotes: true
          }
      }

      if (pathname in entries) {
          conf.chunks = ['manifest', 'vendor', pathname];
          conf.hash = true;
      }

      rtnA.push(new HtmlWebpackPlugin(conf));
  }
  return rtnA;
}