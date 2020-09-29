'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Nexmo Client SDK
 *  Utility functions
 *
 * Copyright (c) Nexmo Inc.
 */
const uuid_1 = __importDefault(require("uuid"));
/**
 * Utilities class for the SDK.
 *
 * @class Utils
 * @private
 */
class Utils {
    /**
     * Get the Member from the username of a conversation
     *
     * @param {string} username the username of the member to get
     * @param {Conversation} conversation the Conversation to search in
     * @returns {Member} the requested Member
     * @static
     */
    static getMemberFromNameOrNull(conversation, username) {
        if (!conversation || !username)
            return null;
        for (let member of conversation.members.values()) {
            if (member.user.name === username) {
                return member;
            }
        }
        return null;
    }
    /**
     * Get the Member's number or uri from the event's channel field
     *
     * @param {object} channel the event's channel field
     * @returns {string} the requested Member number or uri
     * @static
     */
    static getMemberNumberFromEventOrNull(channel) {
        const from = channel && channel.from;
        if (from && (from.number || from.uri)) {
            return from.number || from.uri;
        }
        return null;
    }
    /**
     * Perform a network request to the given url
     *
     * @param {object} reqObject the object that has all the information for the request
     * @param {string} url the request url
     * @param {string} type=GET|POST|PUT|DELETE the types of the network request
     * @param {object} [data] the data that are going to be sent
     * @param {string} [responseType] the response type of the request
     * @param {string} token the jwt token for the network request
     * @returns {Promise<XMLHttpRequest>} the XMLHttpRequest
     * @static
     */
    static networkRequest(reqObject) {
        return new Promise((resolve, reject) => {
            if (!reqObject.token) {
                // eslint-disable-next-line prefer-promise-reject-errors
                reject({
                    response: {
                        type: 'error:user:token',
                        description: 'network error on request. Please re-login'
                    }
                });
            }
            const xhr = new XMLHttpRequest();
            let data;
            xhr.open(reqObject.type, reqObject.url, true);
            xhr.setRequestHeader('Authorization', 'Bearer ' + reqObject.token);
            if (reqObject && reqObject.url.includes('image')) {
                xhr.responseType = '';
                data = reqObject.data;
                xhr.onloadstart = () => {
                    resolve(xhr);
                };
            }
            else {
                xhr.responseType = reqObject.responseType || 'json';
                data = JSON.stringify(reqObject.data) || null;
                xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            }
            xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 204) {
                    resolve(xhr);
                }
                else {
                    reject(xhr);
                }
            };
            xhr.onerror = (error) => {
                reject(error);
            };
            xhr.send(data);
        });
    }
    /**
     * Perform a GET network request for fetching paginated conversations and events
     *
     * @param {string} url the request url
     * @param {object} [params] network request params
     * @param {string} [params.cursor] cursor parameter to access the next or previous page of a data set
     * @param {number} [params.page_size] the number of resources returned in a single request list
     * @param {string} [params.order] 'asc' or 'desc' ordering of resources (usually based on creation time)
     * @param {string} [params.event_type] the type of event used to filter event requests ('member:joined', 'audio:dtmf', etc)
     * @param {string} token the jwt token for the network request
     *
     * @returns {Promise<XMLHttpRequest.response>} the XMLHttpRequest
     * @static
     * @example <caption>Sending a nexmo GET request</caption>
     *    paginationRequest(url, params).then((response) => {
     *      response.items: {},
     *      response.cursor: {
     *          prev: '',
     *          next: '',
     *          self: ''
     *      },
     *      response.page_size: 10,
     *      response.order: 'asc',
     *   });
     */
    static async paginationRequest(url, params, token) {
        try {
            const xhr = await Utils.networkRequest({
                type: 'GET',
                url: Utils.addUrlSearchParams(url, params),
                token
            });
            const { page_size, _embedded, _links } = xhr.response;
            const resource = url.split('/').pop().trim();
            return {
                items: _embedded.data[resource],
                cursor: {
                    prev: _links.prev ? new URLSearchParams(_links.prev.href).get('cursor') : '',
                    next: _links.next ? new URLSearchParams(_links.next.href).get('cursor') : '',
                    self: _links.self ? new URLSearchParams(_links.self.href).get('cursor') : ''
                },
                page_size: page_size,
                order: params.order || 'asc',
                event_type: params.event_type || null
            };
        }
        catch ({ response }) {
            const parsed_error = response ?
                response : { type: 'error:network:get-request', description: 'network error on nexmo get request' };
            if (parsed_error.validation) {
                parsed_error.description = parsed_error.validation[Object.keys(parsed_error.validation)[0]];
            }
            throw parsed_error;
        }
    }
    /**
     * Update the Search Params of a url
     * @returns {string} the appended url
     * @static
     */
    static addUrlSearchParams(url, params = {}) {
        let appended_url = new URL(url);
        Object.keys(params).forEach((key) => {
            if (params[key] && !(typeof params[key] === 'string' && params[key].length < 1) && params[key] !== null) {
                appended_url.searchParams.set(key, params[key]);
            }
        });
        return appended_url.href;
    }
    /**
     * Deep merges two objects
     * @returns {Object} the new merged object
     * @static
     */
    static deepMergeObj(obj1, obj2) {
        const mergedObj = JSON.parse(JSON.stringify(obj1));
        // Merge the object into the new mergedObject
        for (let prop in obj2) {
            // If the property is an object then merge properties
            if (Object.prototype.toString.call(obj2[prop]) === '[object Object]') {
                mergedObj[prop] = Utils.deepMergeObj(mergedObj[prop], obj2[prop]);
            }
            else {
                mergedObj[prop] = obj2[prop];
            }
        }
        return mergedObj;
    }
    /**
     * Inject a script into the document
     *
     * @param {string} s script being executed
     * @param {requestCallback} c the callback fired after script executed
     * @static
     */
    static injectScript(u, c) {
        if (typeof document !== 'undefined') {
            let h = document.getElementsByTagName('head')[0];
            let s = document.createElement('script');
            s.async = true;
            s.src = u;
            s.onload = s.onreadystatechange = () => {
                if (!s.readyState || /loaded|complete/.test(s.readyState)) {
                    s.onload = s.onreadystatechange = null;
                    s = null;
                    if (c) {
                        c();
                    }
                }
            };
            h.insertBefore(s, h.firstChild);
        }
    }
    static allocateUUID() {
        return uuid_1.default.v4();
    }
    /**
     * Validate dtmf digit
     * @static
     */
    static validateDTMF(digit) {
        return typeof digit === 'string' ? /^[\da-dA-D#*pP]{1,45}$$/.test(digit) : false;
    }
    /**
     * Get the nexmo bugsnag api key
     * @private
     */
    static _getBugsnagKey() {
        return '76498fc1ca8d9b0a173a44e2b873d7ed';
    }
    /**
     * Update the member legs array with the new one received in the event
     *
     * @param {Array} legs the member legs array
     * @param {NXMEvent} event the member event holding the new legs array
     * @static
     */
    static updateMemberLegs(legs, event) {
        if (legs) {
            // find the leg in the legs array if exists
            const leg = legs.find((leg) => leg.leg_id === event.body.leg_id);
            if (!leg) {
                legs.push({
                    leg_id: event.body.leg_id,
                    status: event.body.status
                });
            }
            else if (leg.status !== event.body.status) {
                // if the status of the leg is different from the event status
                // update the leg object with the new leg status
                let index = legs.indexOf(leg);
                legs.fill(leg.status = event.body.status, index, index++);
            }
        }
        else {
            legs = [{
                    leg_id: event.body.leg_id,
                    status: event.body.status
                }];
        }
        return legs;
    }
}
exports.default = Utils;
module.exports = Utils;
