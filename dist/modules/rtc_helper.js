'use strict';
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Nexmo Client SDK
 *
 * Copyright (c) Nexmo Inc.
 */
require('webrtc-adapter');
const loglevel_1 = require("loglevel");
const browserDetect = __importStar(require("detect-browser"));
/**
 * RTC helper object for accessing webRTC API.
 * @class RtcHelper
 * @private
*/
class RtcHelper {
    constructor() {
        this.log = loglevel_1.getLogger(this.constructor.name);
    }
    getUserAudio(audioConstraints = true) {
        let constraintsToUse = {
            video: false,
            audio: audioConstraints
        };
        return navigator.mediaDevices.getUserMedia(constraintsToUse);
    }
    createRTCPeerConnection(config) {
        const pc = new RTCPeerConnection(config);
        // attaching the .trace to make easier the stats reporting implementation
        pc.trace = () => {
            return;
        };
        return pc;
    }
    _playAudioStream(stream) {
        const audio = new Audio();
        audio.srcObject = stream;
        audio.autoplay = true;
        return audio;
    }
    _getWindowLocationProtocol() {
        return window.location.protocol;
    }
    _getBrowserName() {
        return browserDetect.detect().name;
    }
    isNode() {
        return this._getBrowserName() === 'node';
    }
    /**
      * Check if the keys in an object are found in another object
    */
    checkValidKeys(object, defaultObject) {
        let valid = true;
        Object.keys(object).forEach((key) => {
            if (!defaultObject.hasOwnProperty(key)) {
                valid = false;
            }
            ;
        });
        return valid;
    }
    ;
}
exports.default = RtcHelper;
module.exports = RtcHelper;
