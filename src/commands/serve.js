/**
 * ydoc在本地启动一个服务，可以实时更新
 */
const chokidar = require('chokidar');
const path = require('path');
const child_process = require('child_process');
const utils = require('../utils');
const ora = require('ora');
let port = 9999;
// ora 主要用来实现node.js命令行环境的loading效果，和显示各种状态的图标等
function runner() {
    const spinner = ora('').start();

    const ydocPath = path.resolve(path.dirname(__dirname), '../bin/ydoc');
    //执行bin/ydoc的命令
    child_process.exec(`node ${ydocPath} build --mode=dev`, function(
        error,
        stdout,
        stderr
    ) {
        spinner.stop();
        if (error) throw error;
        if (stdout) process.stdout.write(stdout);
        if (stderr) process.stdout.write(stderr);
        utils.log.ok('Starting up http-server: http://127.0.0.1:' + port);
    });
}

// 防止频繁执行runner类似防抖节流
function preventDuplication(time = 500) {
    let sign = true;
    return function(fn, ...arg) {
        if (sign === false) return;
        sign = false;
        setTimeout(function() {
            sign = true;
            fn.apply(this, arg);
        }, time);
    };
}

function init() {
    //初始化路径和参数
    const ydocPath = path.resolve(__dirname, '../..');
    const paths = [
        path.resolve(ydocPath, './src'),
        path.resolve(ydocPath, './theme')
    ];

    const projectPath = utils.projectPath;
    const configFilepath = utils.getConfigPath(projectPath);
    const config = utils.getConfig(configFilepath);
    config.root = config.root || utils.defaultDocsPath;
    config.root = path.resolve(projectPath, config.root);
    const buildPath = config.dist || utils.defaultBuildPath;
    paths.push(config.root);
    if (configFilepath) paths.push(configFilepath);
    return {
        paths: paths,
        buildPath: path.resolve(projectPath, buildPath)
    };
}

function server(buildPath) {
    const Koa = require('koa');
    var liveload = require('../live-reload');
    const app = new Koa();
    app.use(liveload(buildPath));
    app.use(require('koa-static')(buildPath));
    app.listen(port);
}

module.exports = {
    // yargs 定制参数的
    setOptions: function(yargs) {
        yargs.option('port', {
            describe: 'Port of server',
            default: 9999
        });
    },
    run: function(argv) {
        let preventDuplicationRunner = preventDuplication();
        port = argv.port;

        let config = init();
        runner();
        server(config.buildPath);

        // chokidar 可以用于监控文件、文件夹变化
        chokidar
            .watch(config.paths, {
                ignoreInitial: true
            })
            .on('all', () => {
                config = init();
                preventDuplicationRunner(runner);
            });
    },
    desc:
        'Starts a local server. By default, this is at http://127.0.0.1:' + port
};
