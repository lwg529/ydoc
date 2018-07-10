const utils = require('./utils.js');
const path = require('path');

const projectPath = utils.projectPath;
const assets = {
    js: [],
    css: []
};

const ydoc = {
    version: require('../package.json').version,
    log: utils.log,
    config: {
        root: utils.defaultDocsPath,
        dist: utils.defaultBuildPath,
        title: 'ydoc',
        description: 'ydoc description',
        author: 'ymfe',
        theme: 'default'
    },

    hook: function(name) {
        const { emitTplHook } = require('./plugin.js');
        // 获取第二个及之后的参数
        let args = Array.prototype.slice.call(arguments, 1);
        // 移除部分参数
        args.unshift(utils.defaultTplHookPrefix + name);
        let tpls = emitTplHook.apply(this, args);
        return tpls.join('\n');
    },
    
    relePath: function(srcFilepath, importFilepath) {
        // 判断文件路径是不是url
        if (utils.isUrl(importFilepath)) {
            return importFilepath;
        }
        // 判断路径是不是绝对路径，处理文件路径
        importFilepath = path.isAbsolute(importFilepath)
            ? importFilepath
            : path.resolve(ydoc.config.dist, importFilepath);
        srcFilepath = path.isAbsolute(srcFilepath)
            ? srcFilepath
            : path.resolve(ydoc.config.dist, srcFilepath);
        //path.relative(argS,argE)方法用于获取从argS进入argE的相对路径，
        // 当两个参数都为绝对路径，且不同盘时，返回参数areE
        let rele = path.relative(srcFilepath, importFilepath);
        return rele.substr(3);
    },

    //增加js和css
    addAsset: function(filepath, type) {
        if (type === 'js') {
            assets.js.push(filepath);
        } else if (type === 'css') {
            assets.css.push(filepath);
        }
    },
    //   获取js和css
    getAssets: function(type) {
        return type
            ? [].concat(assets[type])
            : {
                  js: [].concat(assets.js),
                  css: [].concat(assets.css)
              };
    }
};

module.exports = ydoc;
