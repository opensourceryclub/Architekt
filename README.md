# Architekt

Architekt is a dead-simple static site generator powered by handlebars. It lets
you dynamically run code to build page templates into static pages for you to 
use as documentation sites, static landing pages, etc.

## Installation

Install Architekt globally from NPM

```sh
npm install -g architekt
```

### Usage

Start by creating a new project

```sh
ark gen MyProject
cd MyProject
```

Once you write your templates (See features), render the source code into a 
static site by running

```sh
ark render
# See ark render -h for command options
```
