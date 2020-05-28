#!/usr/bin/env node

const commander = require('commander');
const yaml = require('js-yaml');
const fs = require('fs');
const os = require('os');
const path = require('path');
const process = require('process');
const yamlinc = require('yaml-include');

generate = (def, generatorPath, output) => {
    const generator = require(fs.realpathSync(generatorPath));
    if (!generator) {
        throw 'Could not require() ' + src;
    }

    const content = generator(def);

    const target = output || src.replace(/\.[^.]*$/, ''); // strip final extension

    content = content.replace(/\n/g, os.EOL);

    const existing = fs.readFileSync(target, { encoding: 'utf8' });
    if (existing === content) {
        return 'upToDate';
    }
    else {
        fs.writeFileSync(target, content, { encoding: 'utf8' });
        return existing ? 'updated' : 'created';
    }
}

if (require.main === module) {
    commander
        .usage('[options] <generator source file> ...')
        .option('-d --def [def-file]', 'Definition file, parsed according to extension')
        .option('-o --output [output-file]', 'Output file name; not valid with multiple generator sources')
        .parse(process.argv);

    if (commander.args.length < 1 || !commander.def || (commander.args.length > 1 && commander.output)) {
        commander.outputHelp();
        process.exitCode = 1;
    }
    else {
        let def = fs.readFileSync(commander.def, { encoding: 'utf8' });
        if (/\.json$/i.exec(commander.def)) {
            def = JSON.parse(def);
        }
        else if (/\.ya?ml$/i.exec(commander.def)) {
            const wd = process.cwd();
            try {
                process.chdir(path.dirname(commander.def));
                def = yaml.safeLoad(def, { schema: yamlinc.YAML_INCLUDE_SCHEMA });
            }
            finally {
                process.chdir(wd);
            }
        }

        for (const src of commander.args) {
            const generator = require(fs.realpathSync(src));
            if (!generator) {
                console.error('Could not require() ' + src);
                process.exitCode = 1;
                break;
            }

            let content;
            try {
                content = generator(def);
            }
            catch (err) {
                console.error(err);
                process.exitCode = 1;
                break;
            }

            const target = commander.output || src.replace(/\.[^.]*$/, ''); // strip final extension

            content = content.replace(/\n/g, os.EOL);

            let existing;
            try {
                existing = fs.readFileSync(target, { encoding: 'utf8' });
            }
            catch (err) {
                if (err.code !== 'ENOENT') {
                    console.warn(err);
                }
            }
            if (existing === content) {
                console.log(`${target} is up to date`);
            }
            else {
                if (existing) {
                    console.log(`${target} is out of date, updating`);
                }
                else {
                    console.log(`creating ${target}`);
                }
                try {
                    fs.writeFileSync(target, content, { encoding: 'utf8' });
                }
                catch (err) {
                    console.error(err);
                    process.exitCode = 1;
                    break;
                }
            }
        }
    }
}
