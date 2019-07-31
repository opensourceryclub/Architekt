#!/usr/bin/env node

/**
 * docs/src/render.js
 *
 * This script compiles the different assets needed for every documentation
 * webpage. Handlebars templates are read in and compiled with data stored
 * as JSON files.
 *
 * This script also supports partials. Partials must start with a '_'
 * character.
 *
 * @author Donald Isaac
 */

/*
 * ============================================================================
 * ================================= IMPORTS ==================================
 * ============================================================================
 */
const program     = require('commander')
const ulog        = require('ulog')
const commands    = require('../src/commands');
const { Config }  = require('../src/config');

/*
 * ============================================================================
 * ============================== SCRIPT SETUP ================================
 * ============================================================================
 */

// Parse command line arguments
program.version('1.0.0')

program.command('render')
  .description('Builds source files into a static site')
  .usage('ark render [options]')
  .option('-v, --verbose', 'Displays verbose info messages')
  .option('-S, --silent', 'Silent run. Only errors are displayed')
  .option('-D, --debug', 'Debug messages are displayed. Careful, this might flood your screen')
  .option('-f, --config-file [file]', 'Specify the config file to use. Defaults to render.config.json')
  .option('-s, --source [path]', 'Location of source directory relative to the root', null)
  .option('-o, --out-dir [path]', 'Directory where the rendered site should go. Defaults to "build/"', null)
  .option('-t, --template-dir [path]', 'Directory where Handlebars templates are located', null)
  .option('-d, --data-dir [path]', 'Directory where template data files are located', null)
  .option('-p, --partial-dirs [paths]', 'Comma separated list of Handlebars partial directories', null)
  .option('-l, --layout-dir [paths]', 'Location of layouts directory', null)
  .action(function(cmd) {
    setLoggerLevel(cmd);
    let config = new Config(cmd)
    commands.render(config);
  })

program.command('gen [name]')
  .description('Creates a new Architekt project with the specified project name')
  .usage('ark gen [options] <project-name>')
  .option('-v, --verbose', 'Displays verbose info messages')
  .option('-S, --silent', 'Silent run. Only errors are displayed')
  .option('-D, --debug', 'Debug messages are displayed. Careful, this might flood your screen')
  .action(function(name, cmd) {
    setLoggerLevel(cmd);
    commands.gen(name, cmd);
  });

program.parse(process.argv);

function setLoggerLevel(cmd) {
  if (cmd.silent) {
    ulog.level = ulog.ERROR
  } else if (cmd.verbose) {
    ulog.level = ulog.ulog
  } else if (cmd.debug) {
    ulog.level = ulog.DEBUG
  } else {
    ulog.level = ulog.INFO
  }
}
