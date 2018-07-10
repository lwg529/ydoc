/**
 * ydoc init 命令
 * 把源文件中的init文件夹复制到项目目录下的docs
 */
const path = require('path');
const fs = require('fs-extra');
const projectPath = process.cwd();
const utils = require('../utils');
const initPath = path.resolve(__dirname, '../init');
const docsPath = path.resolve(projectPath, 'docs');

module.exports = {
    setOptions: function() {},
    run: function() {
        // 获取project的路径
        let configFilepath = utils.getConfigPath(projectPath);
        // 如果是否存在ydoc.js或者ydoc.json，然后判断是不是存在docs的目录
        if (configFilepath) {
            return utils.log.error(
                'The current directory already exists ydoc config.'
            );
            // 然后判断是不是存在docs的目录
        } else if (utils.dirExist(docsPath)) {
            return utils.log.error(
                'The current directory already exists directory "docs".'
            );
        }
        // 检查目录是否存在，不存在创建一个
        fs.ensureDirSync(docsPath);
        // 把init文件夹下的内容copy到docsPath
        fs.copySync(initPath, docsPath);
        utils.log.ok(
            'Initialization successful, please use the following command to generate the documents site.'
        );
        utils.log.info('Execute: "ydoc build"');
    },
    desc: 'Initialize a document site'
};
