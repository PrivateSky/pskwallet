const rl = "readline";
const readline = require(rl);
const getPassword = require("./getPassword").readPassword;

const NO_TRIES = 3;
const DEFAULT_PROMPT = "Insert password:";

function insertPassword(options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = {};
    }

    if (!callback) {
        throw new Error("Misuse of function, reason: No callback given.");
    }

    options.prompt = options.prompt || DEFAULT_PROMPT;

    if (typeof options.noTries === "undefined") {
        options.noTries = NO_TRIES;
    }

    if (options.noTries === 0) {
        return callback(new Error(`You have inserted an invalid password ${NO_TRIES} times`));
    } else {
        getPassword(options.prompt,  (err, password)=> {
            if (options.validationFunction) {
                options.validationFunction(password, (err, status) => {
                    if (err) {
                        return callback(err);
                    }

                    if (!status) {
                        if (options.noTries !== 1) {
                            console.log("Validation failed. Maybe you have inserted an invalid character.");
                            console.log("Try again");
                        }
                        options.noTries--;
                        insertPassword(options, callback);
                    }else {
                        callback(undefined, password);
                    }
                });
            } else {
                return callback(undefined, password);
            }
        });
    }
}

function getFeedback(question, callback) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question(question, (answer) => {
        rl.close();
        callback(null, answer);
    });
}


module.exports = {
    insertPassword,
    getFeedback,
};