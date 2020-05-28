# Introduction

A loader for JS code generators that passes them the contents of another file (the definition file). Code generators must be modules that export a single function, as in:
```
module.exports = (def) => {
    // do stuff and return a string
}
```
It rewrites output files only when they change, to minimize the work done by build systems like `make` that use file modification time to determine the need for rebuilding. Generators should output text using newlines; `defcode` will convert them to the local system's EOL.

# Usage

`defcode [options] <generator source file> ...`

Multiple generator sources can be passed on one command line. Note that this does not make sense with the `-o`,`--output` option, so all generator sources need to be named `<output file name>.js` to pass multiple sources on one command line.

YAML files containing [`yaml-include`](https://www.npmjs.com/package/yaml-include)-style tags are supported. It is not necessary to run `defcode` from the same directory as the input YAML file; it will temporarily change to that directory while loading.

## Options

### `-d`, `--def`
Specifies the definition file to load. This option is required.
| File extension | Parsing | Parameter type passed to generator |
| --- | --- | --- |
| `.json` | JSON | Object |
| `.yaml` | YAML | Object |
| `.yml` | YAML | Object |
| Other/none | None | String |

### `-o`, `--output`
Specifies the output file to be written. The default is the name of the generator source file with the `.js` stripped from the end.

## Examples

* `defcode -d def.yaml MySource.cpp.js`: reads `def.yaml`, parses it as YAML, loads `MySource.cpp.js` and executes its exported function with the parsed YAML as an object, and writes the returned string to `MySource.cpp`.