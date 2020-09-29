'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Nexmo Client SDK
 *  Nexmo Client - API Error wrapper
 *
 * Copyright (c) Nexmo Inc.
*/
const NexmoClientErrorTypes = require('./nexmoClientErrorTypes');
function decorateError(instance, error) {
    if (error && error.code) {
        error.type = error.code;
        delete error['code'];
    }
    Object.assign(instance, error);
    instance.message = 'type: ' + instance.type + ', description: ' + (instance.description ? instance.description : '');
    instance.stack = new Error().stack;
}
/**
 * Error constructor of an NexmoClient-error
 * @param {string} errorInput String client error
*/
class NexmoClientError {
    constructor(errorInput) {
        const error = NexmoClientErrorTypes[errorInput];
        // for other errors (libs/browser APIs) re-use the Client error
        // to forward it but don't throw it away
        if (error) {
            // if error type exists in our list keep consistency
            decorateError(this, error);
        }
        else {
            // if the structure is not as expected, f/w as much as we can get
            this.message = errorInput && errorInput.message ? errorInput.message : errorInput;
            this.stack = errorInput && errorInput.stack ? errorInput.stack : new Error().stack;
        }
        // make sure the error.name matches the class name
        this.name = 'NexmoClientError';
        if (typeof global.NXMbugsnagClient !== 'undefined') {
            global.NXMbugsnagClient.notify(this, {
                severity: 'info'
            });
        }
    }
}
exports.NexmoClientError = NexmoClientError;
/**
 * Error constructor of an API-error
 * @param {object} error API error, always containing {type: <string>}
*/
class NexmoApiError {
    constructor(error) {
        decorateError(this, error);
        // make sure the error.name matches the class name
        this.name = 'NexmoApiError';
        if (typeof global.NXMbugsnagClient !== 'undefined') {
            global.NXMbugsnagClient.notify(this, {
                severity: 'info',
                metaData: {
                    'API trace': error.__metadata,
                    rid: error.rid
                }
            });
        }
    }
}
exports.NexmoApiError = NexmoApiError;
module.exports = {
    NexmoClientError: NexmoClientError,
    NexmoApiError: NexmoApiError
};
