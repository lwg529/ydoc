/**
 * build时候先从docs把文件copy到_site，包括theme，css等，然后parse转换
 */
const path = require('path');
const fs = require('fs-extra');
const noox = require('noox'); //后端模板解析
const parse = require('./parse/parse.js');
const utils = require('./utils');

const loadPlugins = require('./plugin.js').loadPlugins;
const ydoc = require('./ydoc.js');
const ydocPath = path.resolve(__dirname, '..');
const loadMarkdownPlugins = require('./parse/markdown').loadMarkdownPlugins;

function initConfig(config) {
    const projectPath = utils.projectPath;
    if (!config) {
        // 项目地址
        const configFilepath = utils.getConfigPath(projectPath);
        // 项目中外层的ydoc.js   ydoc.json
        config = utils.getConfig(configFilepath);
    }
    // console.log('----config', config);
    //合并ydoc.js和项目中的ydoc.js
    utils.extend(ydoc.config, config);
    // console.log('----ydoc.config', ydoc.config);
    ydoc.config.dist = path.resolve(projectPath, ydoc.config.dist);
    ydoc.config.root = path.resolve(projectPath, ydoc.config.root);
}

async function run(config) {
    // init Resources path, 合并ydoc.js和项目中的ydoc.js
    initConfig(config);
    const dist = ydoc.config.dist;
    const root = ydoc.config.root;
    // ydoc下的theme，ydocPath就是项目目录，ydoc
    const themePath = path.resolve(ydocPath, 'theme');
    //docs下的_component,root就是docs目录
    const customerComponentsPath = path.resolve(root, '_components');
    // dist就是_site
    const themeDist = path.resolve(dist, '_theme');
    const componentsDist = path.resolve(themeDist, 'components');

    if (process.env.NODE_ENV === 'production') {
        fs.removeSync(dist);
    }
    // 检查目录是否存在，不存在创建一个
    fs.ensureDirSync(dist);
    fs.ensureDirSync(themeDist);

    // copy docs到_site,theme到_site
    fs.copySync(root, dist);
    fs.copySync(themePath, themeDist);
    // console.log('---themePath', themePath);
    // console.log('----themeDist', themeDist);
    // 自定义主题，合并copy到_site theme
    if (ydoc.config.theme && ydoc.config.theme !== 'default') {
        handleTheme(ydoc.config.theme);
    }

    // 复制文件，从_site的ydoc到theme
    fs.copySync(
        path.resolve(themeDist, 'style.css'),
        path.resolve(dist, 'ydoc/styles', 'style.css')
    );
    fs.copySync(
        path.resolve(themeDist, 'images'),
        path.resolve(dist, 'ydoc/images')
    );
    fs.copySync(
        path.resolve(themeDist, 'scripts'),
        path.resolve(dist, 'ydoc/scripts')
    );

    // 存在自定义的组件
    if (utils.dirExist(customerComponentsPath)) {
        utils.mergeCopyFiles(customerComponentsPath, componentsDist);
    }

    // 加载插件
    loadPlugins();

    utils.noox = new noox(componentsDist, {
        relePath: ydoc.relePath,
        hook: ydoc.hook
    });

    // markdown插件
    loadMarkdownPlugins(ydoc.config.markdownIt);

    // 转换
    await parse.parseSite(dist);
    // 清除_site下的theme文件
    fs.removeSync(themeDist);

    return {
        code: 0 //0 代表成功
    };
    //处理主题
    function handleTheme(theme) {
        let modules = path.resolve(process.cwd(), 'node_modules');
        let themeModuleDir = path.resolve(modules, './ydoc-theme-' + theme);
        try {
            utils.mergeCopyFiles(
                path.resolve(themeModuleDir, './theme'),
                themeDist
            );
        } catch (err) {
            err.message =
                'Load ' +
                path.resolve(modules, './ydoc-theme-' + theme) +
                `theme failed, Please run "npm install ydoc-theme-${theme}" install the theme.`;
            throw err;
        }
    }
}

module.exports = run;
