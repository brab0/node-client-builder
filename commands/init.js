const path = require('path');
const cwd = process.cwd();
var mkdirp = require('mkdirp');
var fs = require('fs');
var getDirName = require('path').dirname;
var remoteOriginUrl = require('remote-origin-url');
var defaultFolder = cwd + '/';
var defaultName = "";
var defaultBin = "";
let pkg = `${defaultFolder}/package.json`.replace('//','/', 'g');

try{
    defaultName = cwd.split('/')[cwd.split('/').length - 1];
} catch(ex){
    defaultName = cwd;
}

let defaults = {
    name : defaultName,
    version : "0.0.1",
    description : "",
    main : "./bin/" + defaultName + '.js',
    bin : {},
    scripts : {
        test: "echo \"Error: no test specified\" && exit 1"
    },
    repository: {
        type: "git",
        url: ""
    },
    keywords : [],
    author : "",
    license: "ISC",    
    homepage: "",
    bugs: {
        url: ""
    },
    dependencies: {
        "crafter-api": "^0.0.5"
    },
    crafter: {
        commands: {
            path: "commands/*.js"
        }
    }
};

defaults.bin[defaultName] = defaults.main;

function main() {
    prompt()        
}

function prompt() {
    const readline = require('readline');
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });        

    console.log("This utility will walk you through creating a Crafter's project.");        
    console.log("Press ^C at any time to quit.");
    console.log("");

    rl.question(`root path: (${defaultFolder}) `, folder => {

        folder = folder.trim().split(" ").join("-").toLowerCase()

        if(folder !== ""){
            try{
                defaultName = folder.split('/')[folder.split('/').length - 1];
                
                if(defaultName === ""){
                    defaultName = folder.split('/')[folder.split('/').length - 2];
                }
            } catch(ex){                
                defaultName = folder;
            }
            
            defaults.name = defaultName;            
            defaultFolder += folder;
            defaults.bin = {};
            defaults.bin[defaultName] = './bin/' + defaultName + '.js';
            defaultBin = defaultName;
            defaults.main = './bin/' + defaultName + '.js';

            pkg = `${defaultFolder}/package.json`.replace('//','/', 'g');
        }
        
        fs.stat(pkg, function(err, stat) {
            if(err == null) {                
                rl.question(`\nThe path already exists and contains a package.json.\nIf you decide to move on, the existent file will be overwritten.\nContinue anyway? (yes) `, confirm => {
                    console.log("")
                    if(confirm === "" || confirm === "y" || confirm === "yes"){                        
                        setGitConf(rl, () => {
                            createPackageJson(rl)
                        })
                    } else {
                        console.log("Aborted!");

                        rl.close();
                    }
                });
            } else if(err.code == 'ENOENT') {
                setGitConf(rl, () => {
                    createPackageJson(rl)
                })
            } else {
                console.log(err.code);
            }
        });      
    });
    

    rl.on('close', () => {
        console.log();
        process.exit(0);        
    });
}

function setGitConf(rl, cb){
    
    remoteOriginUrl(`${defaultFolder}.git/config`, (err, url) => {
        if(url){            
            defaults.repository.url = `git+${url}`;
            defaults.homepage = `${url.split('.git').shift()}#readme`;            
            defaults.bugs.url = `${url.split('.git').shift()}/issues`;

            cb();
        } else {
            rl.question(`git url: `, git => {
                defaults.repository.url = `git+${git}`;
                defaults.homepage = `${git}#readme`;            
                defaults.bugs.url = `${git}/issues`;

                cb();
            });
        }
    });
}

function createPackageJson(rl){
    rl.question(`package name: (${defaults.name}) `, name => {
            
        defaults.name = defaultBin = defaultName = name || defaults.name;
        defaults.bin = {};
        defaults.bin[defaultBin] = './bin/' + defaultBin + '.js';
        defaults.main = './bin/' + defaultName + '.js';

        rl.question(`bin: (${defaultBin}) `, bin => {
            
            if(bin){
                defaultBin = bin;
                defaults.bin = {};
                defaults.bin[bin] = './bin/' + defaultBin + '.js';
            }                      
                    
            rl.question(`version: (${defaults.version}) `, version => {
            
                defaults.version = version || defaults.version;
            
                rl.question(`description: `, description => {
                                
                    defaults.description = description;
                
                    rl.question(`test command: `, test => {

                        defaults.scripts.test = test || defaults.scripts.test;                           

                        rl.question(`keywords: `, keywords => {
                        
                            defaults.keywords = keywords.split(' ');

                            rl.question(`author: `, author => {
                            
                                defaults.author = author;                                

                                rl.question(`license: (${defaults.license}) `, license => {
                            
                                    defaults.license = license || defaults.license;                                                                                                                           

                                    console.log(`About to write to ${pkg}`)
                                    console.log(JSON.stringify(defaults, null, 4))

                                    rl.question(`Is this ok? (yes)  `, confirm => {                                        

                                        if(confirm === "" || confirm === "y" || confirm === "yes"){

                                            //package.json
                                            writeAnyway(pkg, JSON.stringify(defaults, null, 4), function(err) {
                                                if(err) return console.log(err);                                                

                                                fs.readFile(path.resolve(__dirname, '../templates/bin.tpl'), function(oErr, binTpl) {
                                                    if(oErr) return console.log(oErr);

                                                    //./bin/file.js
                                                    writeAnyway(path.resolve(defaultFolder,defaults.bin[defaultBin]), binTpl, function(err) {
                                                        if(err) return console.log(err);
                                                        
                                                        fs.readFile(path.resolve(__dirname, '../templates/command.tpl'), function(oErr, cmdTpl) {
                                                        
                                                            //./bin/file.js
                                                            writeAnyway(path.resolve(defaultFolder,'commands/print.js'), cmdTpl, function(err) {
                                                                if(err) return console.log(err);                                                    

                                                                console.log("Installing Dependencies...");
                                                                
                                                                require('child_process').exec('npm install', {cwd : defaultFolder}, (error, stdout, stderr) => {
                                                                    if (error) {
                                                                        console.error(`exec error: ${error}`);
                                                                        return;
                                                                    }
                                                                    
                                                                    process.stdout.write(stdout)
                                                                    console.log("Your project is ready!");
                                                                    
                                                                    rl.close();
                                                                });                                                                                                                                                          
                                                            });
                                                        });
                                                    });
                                                });                                                
                                            });
                                        } else {
                                            console.log("Aborted!");

                                            rl.close();
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

function writeAnyway(path, contents, cb) {
    mkdirp(getDirName(path), function (err) {
        if (err) return cb(err);

        fs.writeFile(path, contents, cb);
    });
} 

require('crafter-api').command({
    name: 'init',
    abbrev: 'i',
    main : main,
    description : "Create a new CLI project"
});
