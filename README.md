# Architekt

Architekt is a dead-simple static site generator powered by Handlebars. It lets
you dynamically run code to build page templates into static pages for you to
use as documentation sites, static landing pages, etc.

Architekt is heavily inspired by Ruby on Rail's [ActionView](https://guides.rubyonrails.org/layouts_and_rendering.html)

## Installation

Install Architekt globally from NPM

```sh
npm install -g architekt
```

Architekt will now be available as the `ark` command.

---

### Getting Started

Start by creating a new project

```sh
ark init MyProject # run ark gen -h for more options
cd MyProject
```

This will create a project skeleton for you to get started with. In the project
root, you'll notice the following folders and directories:

- `build/` - Directory where the static pages will be put after rendering
- `src/` - Contains source code for pages
- `architekt.json` - Configuration file

You can change where Architekt looks for resources, puts static pages, etc. in
the `architekt.json` config file.

Now, navigate into the `src/` directory and take a look at the folders that exist
there. Each folder represents a resource that can be used to build your site.

#### Views

Views contains handlebars templates that will be rendered into web pages. Every
template must follow the `<page-name>.html.hbs` naming convention. The resulting
web page will be named `<page-name>.html`.

#### Controllers

Controllers contain the logic/data that will be plugged into each view. Controllers
may be JSON or JavaScript files and must follow the naming convention
`<page-name>.[js,json]`. When a JavaScript file is used, the `module.exports` object
will be plugged into the page template. Files that start with an
underscore will be ignored.

#### Assets and Stylesheets

Assets should be put in the `assets/` folder in your source directory. Architekt
will copy over your assets into the output directory.


Architect renders [SASS](https://sass-lang.com/) stylesheets for you. All
stylesheets must end in `.scss` or `.sass`, according to SASS conventions.
Stylesheets must be in the `stylesheets/` subdirectory within your assets
directory. Partial stylesheets must start with an underscore, such as
`_stylesheet.scss`. Partials are not outputted as css stylesheets, but may be
imported into other stylesheets. The `@import` statement resolves stylesheets
within the `stylesheets/` directory or in `node_modules`.

#### Partials

Partials simply contain [handlebars partials](https://handlebarsjs.com/partials.html),
and must follow the naming convention `_<partial-name>.html.hbs`. When using a partial
in your pages, omit the leading underscore from the name. Partials *must* have a
leading underscore in their name, otherwise they will be ignored!

#### Layouts

Layouts are simply advanced partials and are powered by [handlebars-layouts](https://www.npmjs.com/package/handlebars-layouts). They follow the naming convention `<layout-name>.html.hbs`.
For more information on how to use layouts, see the handlebars-layouts README.

#### Helpers

Helpers are JavaScript files that export Handlebars helper functions. The name
of the file does not matter, as long as it ends in `.js`. You may export more
that one helper function per file.

### Rendering Your Site

Once you have written your templates, render the source code into a
static site by running

```sh
ark render # See ark render -h for command options
```

---

### Contributing

Have some features you would like to see added? Feel free to submit an issue or
a pull request.

---

### Features TODO

The following are features we are planning on adding to Architekt:

- Allowing subdirectories in resource/views/controllers directories

### Authors

- [Donald Isaac](https://github.com/DonIsaac)

### License

Copyright (c) 2019-2020 Donald Isaac. Licensed under the GNU GPLv3 license.
