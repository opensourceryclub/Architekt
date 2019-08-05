const Promise = require('bluebird')
const hbs = require('handlebars')
const layouts = require('handlebars-layouts')
const log = require('ulog')('architekt:cmd:render')
const fs = require('fs')
const path = require('path')
const { Config } = require('../config')

// Async functions are neat
const [readdir, readFile, writeFile] = [
    fs.readdir,
    fs.readFile,
    fs.writeFile,
].map(func => Promise.promisify(func))

hbs.registerHelper(layouts(hbs))

/**
 * @param {Config} config The config object to use when rendering
 * 
 * @returns {Promise<void>}
 */
module.exports = function render(config) {

    const OUT_DIR_PATH = config.pathTo('outDir')
    // Location of handlebars templates
    const TEMPLATE_SOURCE_DIR = config.pathTo('templateDir')
    // Location of JSON data
    const TEMPLATE_DATA_DIR = config.pathTo('controllerDir')
    const LAYOUT_DIR = config.pathTo('layoutDir')
    const HELPER_DIR = config.pathTo('helperDir')
    const ASSETS_DIR = config.pathTo('assetsDir')

    // Location of directories containing partials.
    // Elements of this array can be strings or string arrays.
    // When a string array, each element represents a subdirectory.
    const TEMPLATE_PARTIALS_DIRS = config.pathTo('partialDirs')

    log.log(`Template path: ${TEMPLATE_SOURCE_DIR}`)
    log.log(`Data path: ${TEMPLATE_DATA_DIR}`)
    log.log(`Output path: ${OUT_DIR_PATH}\n`)

	/**
	 * Reads and parses handlebars templates from the template directory.
	 *
	 * The promise resolves with the following shape
	 * ```js
	 * {
	 *    index: "<index.html.hbs file contents>",
	 *    about: "<about.html.hbs file contents>",
	 *    // etc
	 * }
	 * ```
	 *
	 * @returns {Promise<any>} Map of parsed handlebars templates
	 */
    const sources_async = () => Promise.try(() => log.log('Loading templates...'))
        .then(() => readdir(TEMPLATE_SOURCE_DIR, 'utf-8'))
        .filter(f => {
            let split_file = f.split('.')
            // templates must end in .hbs. Also, ignore partials, which start with '_'
            return split_file[split_file.length - 1] === 'hbs' && !split_file[0].startsWith('_')
        })
        .map(f => { // Read the template
            return readFile(path.join(TEMPLATE_SOURCE_DIR, f), 'utf-8')
                .then(contents => {
                    return { page: f.split('.')[0], value: contents }
                })

        })
        .reduce((source_map, source) => {
            source_map[source.page] = source.value
            return source_map
        }, Object.create(null))
        .catch(raise('Error thrown while reading templates'));



	/*
	 * {
	 *    "index": {...data...},
	 *    "about": {...data...},
	 * }
	 */
    // Read in the JSON files containing each page's data
    const data_async = () => Promise.try(() => log.log('Loading template data...'))
        .then(() => readdir(TEMPLATE_DATA_DIR, 'utf-8'))
        .filter(filename => {
            let split_name = filename.split('.')
            let filetype = filename.split('.')[split_name.length - 1]
            // data files must end in .json or .js
            let valid = ['json', 'js'].includes(filetype)
            log.debug(`data: controller file ${filename} ends with ${filetype} is ${valid ? 'valid' : 'invalid'}`)
            return valid
        })
        .map(async d => { // get the raw data from the file
            let data_path = path.join(TEMPLATE_DATA_DIR, d)
            if (d.endsWith('.json')) { // Controller is a JSON object, parse it, add it to map.
                return readFile(data_path, 'utf-8')
                    .then(contents => { // parse the data into an object
                        return JSON.parse(contents)
                    }).catch(err => { // error thrown when reading file, default to empty object
                        log.error('Error thrown while reading JSON file; using empty object')
                        log.warn(err)
                        return {}
                    })
                    .then(data_obj => {
                        return { page: d.split('.')[0], value: data_obj }
                    })
            } else if (d.endsWith('.js')) { // data is a script that exports a controller object
                let data_exports = await require(data_path)
                let controller = data_exports.default || data_exports // handle ES6 exports
                return { page: d.split('.')[0], value: controller }
            } else { // should be unreachable, acts as a sanity check
                throw new Error('Invalid data filetype.')
            }
        })
        .reduce((data_map, data) => {
            data_map[data.page] = data.value
            return data_map
        }, Object.create(null))
        .catch(raise('Error thrown while parsing template data'))



	/*
	 * {
	 *    "index": "...html...",
	 *    "about": "...html...",
	 * }
	 */
	/**
	 * Register handlebars partials
	 */
    const partials_async = () => Promise.each(TEMPLATE_PARTIALS_DIRS, dir => {
        return readdir(dir, 'utf-8') // Get the files in one of the partial directories
            // Filter out anything that isn't a handlebars file or doesn't start with '_'
            .filter(partial => partial.startsWith('_') && partial.endsWith('.hbs'))
            .each(partial => {
                return readFile(path.join(dir, partial), 'utf-8')
                    .then(partial_contents => { // Read the contents and register it with handlebars
                        let partial_name = partial.split('.')[0]
                        partial_name = partial_name.substr(1, partial_name.length - 1)
                        log.log(`Registering partial ${partial_name}...`)
                        partial_contents.page_name = partial_contents.page_name || partial_name
                        return hbs.registerPartial(partial_name, partial_contents)
                    })
            })
    })
        .catch(raise('Error thrown while registering partials'))

    const layouts_async = () => Promise.try(() => log.log('Loading layouts...'))
        .then(() => readdir(LAYOUT_DIR, 'utf-8'))
        .filter(layout_file => layout_file.endsWith('.hbs'))
        .each(layout_file => {
            readFile(path.join(LAYOUT_DIR, layout_file), 'utf-8')
                .then(layout_contents => {
                    let layout_name = layout_file.split('.')[0]
                    log.log(`Registering layout ${layout_name}...`)
                    return hbs.registerPartial(layout_name, layout_contents)
                })
        })
        .catch(raise('Error thrown while registering layouts'))

    const helpers_async = () => Promise.try(() => log.log('Registering helpers...'))
        .then(() => readdir(HELPER_DIR, 'utf-8'))
        .filter(helper_file => helper_file.endsWith('.js'))
        .each(async helper_file => {
            let helpers = await require(path.join(HELPER_DIR, helper_file))
            for (let helper in helpers) {
                let fn = helpers[helper]
                if (typeof fn === 'function') {
                    log.log(`Registering helper ${helper}...`)
                    hbs.registerHelper(helper, fn)
                }
            }
        })
        .catch(raise('Error thrown while registering helpers'))

    // TODO: Implement this correctly and add it to the join()
    const styles_async = () => new Promise((resolve, reject) => {
        log.info('Rendering stylesheets...')
        // path to styles directory in source
        let assetDir = config.pathTo('assetDir')
        // path to styles directory in build
        let buildAssetDir = path.join(config.pathTo('outDir'), config.resources.assetDir, 'styles')
        // remove trailing separator character(s)
        if (assetDir.endsWith(path.sep))
            assetDir = assetDir.substr(0, assetDir.length - path.sep.length)

        glob(`${assetDir}/styles/**/*.scss`)
        .pipe(sass())
        .pipe(fs.createWriteStream())
        .on('finish', resolve)
        .on('error', reject)
    })


    // const pages = []
    return Promise.join(sources_async(), data_async(), partials_async(), layouts_async(), helpers_async(),
        async (sources, data) => {
            log.log('Rendering templates...')
            log.debug(`Partials: ${JSON.stringify(Object.keys(hbs.partials))}`)
            log.debug(`Pages: ${Object.keys(sources)}`)
            log.debug(`Helpers: ${JSON.stringify(hbs.helpers)}`)
            for (let page_name in sources) {
                let template = hbs.compile(sources[page_name])
                let page;
                try { // Error thrown if template contains a syntax error
                    page = template(data[page_name] || {})
                } catch (err) {
                    log.error(`Syntax error in page ${page_name}:\n${err.message}`)
                    log.debug(err.stack)
                    process.exit(1)
                }
                let page_path = path.join(OUT_DIR_PATH, page_name + '.html')
                log.log(`Rendering ${page_name}...`)
                // pages.push(await writeFile(page_path, page))
                await writeFile(page_path, page).then(() => log.log('Finished'))

            }
        })
        .then(() => log.info('Finished rendering.'))
};

function raise(msg) {
    return err => {
        log.error(msg)
        log.error(err)
    }
}
