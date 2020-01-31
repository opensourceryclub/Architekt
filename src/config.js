/**
 * config.js - subroutines and data structures for configuration information.
 *
 *
 *
 *                  Copyright (C) 2019-2020 Donald Isaac 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 *  @author Donald Isaac
 */
const commander = require('commander');
const fs = require('fs');
const log = require('ulog')('architekt:config');
const path = require('path');
const os = require('os');

const DEFAULT_CONFIG_FILE_NAME = 'architekt.json';
const DEFAULT_CONFIG = {
    source: 'src/',
    outDir: 'build/',
    resources: { // relative to source directory
        templateDir: 'views/',
        controllerDir: 'data/',
        partialDirs: ['partials'],
        layoutDir: 'layouts/',
        helperDir: 'helpers/',
        assetDir: 'assets/'
    },
    assetDirs: [
        'stylesheets/',
        'scripts/',
        'images'
    ]
};
class Config {

	/**
	 * Creates a new configuration object.
	 *
	 * The object is initially populated
	 * with a set of default values for each setting. User settings are specified
	 * first by a config file. The constructor searches for a config file from the
	 * directory where the command was called, reads in the file, and overwrites
	 * the default settings with user-defined settings. These in turn can be
	 * overwritten by command line arguments.
	 *
	 * @param {commander.CommanderStatic} cmd The commander object containing command line arguments
	 */
    constructor(cmd) {
        this.root = null;
        this.source = 'src/';
        this.outDir = 'build/';
        this.resources = { // relative to source directory
            templateDir: 'views/',
            controllerDir: 'data/',
            partialDirs: ['partials'],
            layoutDir: 'layouts/',
            helperDir: 'helpers/',
            assetDir: 'assets/'
        };

        let config_file_name = cmd.configFile ? path.basename(cmd.configFile) : DEFAULT_CONFIG_FILE_NAME
        let config_file_dir = cmd.configFile ? path.dirname(cmd.configFile) : undefined
        log.debug(`Config file name: ${config_file_name}`);
        log.debug(`Config file directory: ${config_file_dir}`);

        this.root = this._resolveRoot(config_file_dir, config_file_name)
        // Read user config file; store it as an object
        let user_config = JSON.parse(fs.readFileSync(path.join(this.root, config_file_name), 'utf-8'))
        // Override defaults with user config data
        this._setConfig(user_config);
        log.debug(`Project root: ${this.root}`)
        // Command line arguments override both system defaults and user config data
        log.debug(cmd);
        [
            'source',
            'outDir'
        ].forEach(option => {
            this[option] = (cmd && cmd[option]) || this[option]
        });

        [
            'templateDir',
            'controllerDir',
            'layoutDir',
            'helperDir',
            'assetDir'
        ].forEach(resource => {
            this.resources[resource] = cmd[resource] || this.resources[resource]
        })

        if (cmd.partialDirs) {
            this.resources.partialDirs = cmd.partialDirs.split(',')
        }

        log.debug(`Resource dirs: ${this.resources}`)
    }

	/**
	 * Gets the absolute path to a subdirectory in the source code.
	 *
	 * @param {string} res The name of the subdirectory
	 *
	 * @returns {string | string[]} The path to the specified subdirectory
	 *
	 * @throws If the subdirectory name is invalid or if the subdirectory doesn't exist
	 */
    pathTo(res) {
        if (!res || typeof res !== 'string')
            throw new Error(`Invalid resource name: ${res}`);

        if (this.hasOwnProperty(res)) {
            if (typeof this[res] === 'string')
                return path.join(this.root, this[res]);
            else if (this[res] instanceof Array) {
                return this[res].map(r => path.join(this.root, r));
            }
        }

        if (this.resources.hasOwnProperty(res)) {
            let resource = this.resources[res];

            if (typeof resource === 'string')
                return path.join(this.root, this.source, resource);
            else if (resource instanceof Array) {
                return resource.map(r => path.join(this.root, this.source, r));
            }
        }

        throw new Error(`Resource "${res}" does not exist in the config`)
    }

	/**
	 * Finds the root directory of the website. A directory is the root directory
	 * if and only if it contains a `render.config.json` file.
	 *
	 * @returns {string} The path to the root directory
	 *
	 * @throws If the root directory could not be resolved
	 */
    _resolveRoot(root = process.cwd(), configName = DEFAULT_CONFIG_FILE_NAME) {
        // @ts-ignore
        const systemRoot = (os.platform === 'win32') ? process.cwd().split(path.sep)[0] : '/'

        let found = false

        for (
            ;   // start at specified root
            !found && root !== systemRoot;  // Stop searching if config file is found or we reach the root dir
            root = path.resolve(root, '..') // Go to parent directory, search again
        ) {
            log.debug(`Resolving config ${configName} at ${root}...`)
            /** @type {String[]} */
            let filesInDir = fs.readdirSync(root)

            if (filesInDir.includes(configName))
                return root
        }

        throw new Error('"render" must be called within a project directory or subdirectory.')
    }

	/**
	 * Sets new values to the Config's settings. Only settings that already exist
	 * in the config will be set.
	 *
	 * @param {Object} config New values to populate the config object with
	 *
	 * @returns {void}
	 */
    _setConfig(config = {}) {
        for (const setting in config) {
            if (config.hasOwnProperty(setting) && this.hasOwnProperty(setting)) {
                const settingVal = config[setting];
                // Make sure the new setting is of the expected type
                if (typeof settingVal === typeof this[setting])
                    this[setting] = settingVal;
                else
                    log.warn(`WARNING: Tried to set config setting to incompatible type: expected ${typeof this[setting]}, got ${typeof settingVal}`);
            }
        }
    }
}

module.exports.Config                       = Config;
module.exports.default                      = Config;
module.exports.DEFAULT_CONFIG               = DEFAULT_CONFIG
module.exports.DEFAULT_CONFIG_FILE_NAME     = DEFAULT_CONFIG_FILE_NAME
