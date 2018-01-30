const es = require('event-stream')
const gulp = require('gulp')
const minimist = require('minimist')
const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const mergeStream = require('merge-stream')
const stripAnsi = require('strip-ansi')
const plugins = require('gulp-load-plugins')()
const {
    concat,
    uglify,
    zip,
    plumber,
    babel,
    notify,
    stripComments: strip
} = plugins
const gulpif = plugins.if
const adminScripts = require('./public/app.scripts.json')
const source = {
    admin: {
        src: [
            // bootstrap angular
            'public/modules/main.js',
            // main module
            'public/modules/app.js',
            // module files
            'public/modules/phoodie.module.js',
            'public/modules/**/module.js',
            // other js files [controllers, services, etc.]
            'public/modules/**/!(module)*.js'
        ]
    }
}
const destinations = {
    admin: {
        js: 'www/build'
    }
}
const appWasBroken = {
    admin: false
}
gulp.task('admin-js', buildApp('admin'))
// creates task to concat angular files
function buildApp(fileset) {
    return function () {
        let isBroken = false
        gulp.src(source[fileset].src)
            .pipe(plumber({
                errorHandler: error => {
                    isBroken = true
                    appWasBroken[fileset] = true
                    const strippedError = Object.create(error)
                    strippedError.stack = stripAnsi(error.stack)
                    return notify.onError("<%= error.stack %>")(strippedError)
                }
            }))
            .pipe(babel({
                presets: ['es2015']
            }))
            // .pipe(uglify())
            .pipe(concat('app.js'))
            .pipe(gulp.dest(destinations[fileset].js))
            .pipe(gulpif(
                file => {
                    if (!appWasBroken[fileset] || isBroken) return false
                    appWasBroken[fileset] = false
                    return true
                },
                notify(`${fileset} app fixed!`)
            ))
    }
}
gulp.task('watch', ['admin-js'], function () {
    gulp.watch(source.admin.src, ['admin-js'])
})
// builds vendor files listed in app.scripts.json
gulp.task('vendor-admin', buildAdminVendor)

function buildAdminVendor(scripts, dest) {
    return buildVendor(adminScripts, destinations.admin.js)
}

function buildVendor(scripts, dest) {
    let tasks = []
    _.forIn(scripts.chunks, function (chunkScripts, chunkName) {
        let paths = []
        chunkScripts.forEach(function (script) {
            let scriptFileName = scripts.paths[script]
            let scriptPath = path.join(__dirname, scriptFileName)
            if (!fs.existsSync(scriptPath)) {
                throw console.error(`Required path doesn't exist: ${scriptPath}`, script)
            }
            paths.push(scriptFileName)
        })
        tasks.push(gulp.src(paths)
            .pipe(concat(chunkName + '.js'))
            .on('error', swallowError)
            .pipe(strip())
            .pipe(uglify())
            .pipe(gulp.dest(dest)))
    })
    return mergeStream(tasks)
}
gulp.task('default', ['dev'])
gulp.task('dev', ['vendor-admin', 'admin-js', 'watch'])
const knownOptions = {
    string: 'packageName',
    string: 'packagePath',
    default: {
        packageName: 'Package.zip',
        packagePath: path.join(__dirname, '_package')
    }
}
const options = minimist(process.argv.slice(2), knownOptions)
// This task is specifically setup for deploying to AZURE.
gulp.task('prod', ['vendor-admin', 'admin-js'])

function buildProdPackage() {
    let packagePaths = ['**',
        '!**/_package/**',
        '!**/typings/**',
        '!typings',
        '!_package',
        '!gulpfile.js',
        '!**/client/libs/**'
    ]
    // add exclusion patterns for all dev dependencies
    let packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
    let devDeps = packageJSON.devDependencies
    for (let propName in devDeps) {
        let excludePattern1 = '!**/node_modules/' + propName + '/**'
        let excludePattern2 = '!**/node_modules/' + propName
        packagePaths.push(excludePattern1)
        packagePaths.push(excludePattern2)
    }
    return gulp.src(packagePaths)
        .pipe(zip(options.packageName))
        .pipe(gulp.dest(options.packagePath))
}
const swallowError = function (src, task, error) {
    console.log(error.toString())
    this.emit('end')
}