// @ts-check
const fs        = require('fs');
const path      = require('path');
const log       = require('ulog')('architekt:cmd:gen');
// @ts-ignore
const Promise   = require('bluebird')

const [access, writeFile, mkdir] = [
    fs.access,
    fs.writeFile,
    fs.mkdir
].map(func => Promise.promisify(func))

const { DEFAULT_CONFIG, DEFAULT_CONFIG_FILE_NAME } = require('../config');

module.exports = async function init(name, cmd) {
    const projFolder = path.join(process.cwd(), name)
    try {
        await access(projFolder, fs.constants.F_OK);
        log.error(`ERROR: Folder ${name} already exists. Aborting.`);
        process.exit(1);
    } catch (err) {
        // Doesn't exist, keep going
    }

    // Generate project root
    log.info(`Creating new project "${name}"...`);
    await mkdir(projFolder, { recursive: true });

    // Generate config file
    log.info('Creating config file...');
    const createConfig = writeFile(path.join(projFolder, DEFAULT_CONFIG_FILE_NAME), JSON.stringify(DEFAULT_CONFIG, null, 4));

    // Generate source subdirectories
    await Promise.join(createConfig, genDirectories(projFolder, DEFAULT_CONFIG));
    let genResources = genDirectories(path.join(projFolder, DEFAULT_CONFIG.source), DEFAULT_CONFIG.resources);
    let genPartials = genDirectories(path.join(projFolder, DEFAULT_CONFIG.source), DEFAULT_CONFIG.resources.partialDirs);
    await Promise.join(genResources, genPartials);

    // Create asset subdirectories
    await genDirectories(path.join(projFolder, DEFAULT_CONFIG.source, DEFAULT_CONFIG.resources.assetDir), DEFAULT_CONFIG.assetDirs);
}

/**
 * Generates subdirectories specified in an object in some root directory.
 *
 * @param {string} root Absolute path of directory to generate subdirectories
 * @param {object | Array<String>} structure Object whos keys will be the names of the directories being generated
 *
 * @returns {Promise<void>[]} An array of promises that resolve when the subdirectories are created
 */
async function genDirectories(root, structure) {
    const createdDirs = [];

    if (structure instanceof Array) { // handle arrays
        for (const dir of structure) {

            log.debug(`Processing directory "${dir}"...`)
            if (typeof dir !== 'string') {
                log.debug(`Directory "${dir}" is not a string; skipping...`);
                continue;
            }
            let dirPath = path.join(root, dir);
            log.info(`Creating "${dirPath}"...`);
            createdDirs.push(mkdir(dirPath, { recursive: true }));

        }
    }
    else for (const dirName in structure) { // handle objects
        if (structure.hasOwnProperty(dirName)) {

            const dir = structure[dirName];
            log.debug(`Processing directory "${dir}"...`)
            if (typeof dir !== 'string') {
                log.debug(`Directory "${dir}" is not a string; skipping...`);
                continue;
            }
            let dirPath = path.join(root, dir);
            log.info(`Creating "${dirPath}"...`);
            createdDirs.push(mkdir(dirPath, { recursive: true }));

        }
    }

    return createdDirs;
}
