'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Nexmo Client SDK
 *  Media Object Model
 *
 * Copyright (c) Nexmo Inc.
*/
const TraceWS = require('./rtcstats/trace-ws');
const RTCStats = require('./rtcstats/rtcstats');
const sdptransform = require('sdp-transform');
const loglevel_1 = require("loglevel");
const nexmoClientError_1 = require("../nexmoClientError");
const rtc_helper_1 = __importDefault(require("./rtc_helper"));
const utils_1 = __importDefault(require("../utils"));
const nxmEvent_1 = __importDefault(require("../events/nxmEvent"));
const isIp = require('is-ip');
/**
 * Member listening for audio stream on.
 *
 * @event Member#media:stream:on
 *
 * @property {number} payload.streamIndex the index number of this stream
 * @property {number} [payload.rtc_id] the rtc_id / leg_id
 * @property {string} [payload.remote_member_id] the id of the Member the stream belongs to
 * @property {string} [payload.name] the stream's display name
 * @property {MediaStream} payload.stream the stream that is activated
 * @property {boolean} [payload.audio_mute] if the audio is muted
*/
/**
 * WebRTC Media class
 * @class Media
 * @property {Application} application The parent application object
 * @property {Conversation} parentConversation the conversation object this media instance belongs to
 * @property {number} parentConversation.streamIndex the latest index of the streams, updated in each new peer offer
 * @property {object[]} rtcObjects data related to the rtc connection
 * @property {string} rtcObjects.rtc_id the rtc_id
 * @property {PeerConnection} rtcObjects.pc the current PeerConnection object
 * @property {Stream} rtcObjects.stream the stream of the specific rtc_id
 * @property {string} [rtcObjects.type] audio the type of the stream
 * @property {number} rtcObjects.streamIndex the index number of the stream (e.g. use to mute)
 * @emits Application#rtcstats:report
 * @emits Member#media:stream:on
 */
class Media {
    constructor(conversation) {
        this.log = loglevel_1.getLogger(this.constructor.name);
        if (conversation) {
            this.rtcHelper = new rtc_helper_1.default();
            this.application = conversation.application;
            this.application.activeStreams = this.application.activeStreams || [];
            this.parentConversation = conversation;
            this.rtcObjects = {};
            this.streamIndex = 0;
            this.rtcstats_conf = {};
            this.rtcStats = null;
            if (this.application.session.config && this.application.session.config.rtcstats) {
                this.rtcstats_conf = {
                    emit_events: this.application.session.config.rtcstats.emit_events,
                    ws_url: this.application.session.config.rtcstats.ws_url
                };
            }
            if (this.rtcstats_conf.emit_events) {
                this._initStatsReporting();
            }
        }
        else {
            this.log.warn('No conversation object in Media');
        }
    }
    _attachEndingEventHandlers() {
        this.log.debug('attaching leave listeners in media for ' + this.parentConversation.id);
        this.parentConversation.on('rtc:hangup', (event) => {
            const member = this.parentConversation.members.get(event.from);
            if (member.user.id === this.application.me.id && (this.application.activeStreams.length)) {
                this._cleanMediaProperties();
            }
            // terminate peer connection stream in case of a transfer
            if (member.user.id === this.application.me.id && member.transferred_from) {
                member.transferred_from.media._cleanMediaProperties();
            }
        });
    }
    /**
     * Application listening for RTC stats.
     *
     * @event Application#rtcstats:report
     *
     * @property {number} MOS - the calculated MOS score
     * @property {Object} report - the stats report from WebRTC | when the call has ended this is null, see the mos_report for final MOS summary
     * @property {Conversation} Conversation - the conversation the report belongs to
     * @property {Object} mos_report - a report for the MOS values
     * @property {string} mos_report.min - the minimum MOS value during the stream
     * @property {string} mos_report.max - the maximum MOS value during the stream
     * @property {string} mos_report.last - the last MOS value during the stream
     * @property {string} mos_report.average - the average MOS value during the stream
     *
     * @example <caption>listening for quality mos score</caption>
     *  application.on("rtcstats:report",(mos, report, conversation, mos_report) => {
     *    console.log("call quality (MOS)", mos);
     *    if (mos_report) {
     *      console.log('mos_report', mos_report);
     *    }
     *  });
    */
    _enableCallStats(pc) {
        this.application.session.callstats.addNewFabric(pc, this.parentConversation.me.id, 'audio', this.parentConversation.id);
    }
    /**
     * Switch on the rtcStat reporting to the websocket connection and events
     * @param ws_url
     * @private
    */
    _enableStatsReporting(ws_url) {
        this.application.session.config.rtcstats.ws_url = ws_url;
        this.rtcstats_conf.ws_url = ws_url;
        this._initStatsReporting();
    }
    /**
     * Switch on the rtc stats emit events
     * @private
    */
    _enableStatsEvents() {
        this.application.session.config.rtcstats.emit_events = true;
        this.rtcstats_conf.emit_events = true;
        this._initStatsEvents();
    }
    _initStatsReporting() {
        if (!this.rtcHelper.isNode() && !this.rtcStats && this.application.session.config.rtcstats.ws_url) {
            this.rtcStats_wsConnection = new TraceWS();
            this.rtcStats = new RTCStats(this.rtcStats_wsConnection.trace, false, // isCallback
            1000, // interval at which getStats will be polled,
            [''] // RTCPeerConnection prefixes to wrap.
            );
            this.rtcStats_wsConnection.init({
                rtcstatsUri: this.application.session.config.rtcstats.ws_url
            });
        }
    }
    _initStatsEvents() {
        if (!this.rtcHelper.isNode() && !this.rtcStats) {
            const emit_event = (type, mos, report, mos_report) => {
                if (type === 'mos') {
                    if (mos) {
                        this.application.emit('rtcstats:report', mos, report, this.parentConversation);
                    }
                }
                else if (type === 'mos_report') {
                    this.application.emit('rtcstats:report', mos, null, this.parentConversation, mos_report);
                }
            };
            this.rtcStats = new RTCStats(emit_event, true, // isCallback
            1000, // interval at which getStats will be polled,
            [''] // RTCPeerConnection prefixes to wrap.
            );
        }
    }
    /**
     * Switch off the rtcStat reporting
     * @private
    */
    _disableStatsReporting() {
        this.application.session.config.rtcstats.ws_url = '';
        this.rtcstats_conf.ws_url = '';
        this.rtcStats_wsConnection.disable();
        delete this.rtcStats;
    }
    /**
     * Switch off the rtcStat events
     * @private
    */
    _disableStatsEvents() {
        this.application.session.config.rtcstats.emit_events = false;
        this.rtcstats_conf.emit_events = false;
        this.rtcStats.disable();
        delete this.rtcStats;
    }
    /**
     * Handles the enabling of audio only stream with rtc:new
     * @private
    */
    _handleAudio(params = {}) {
        return new Promise((resolve, reject) => {
            const onClientError = (error) => {
                reject(new nexmoClientError_1.NexmoClientError(error));
            };
            const streamIndex = this.streamIndex;
            this.streamIndex++;
            this.rtcHelper.getUserAudio(params.audioConstraints).then((localStream) => {
                const pc_config = {
                    iceTransportPolicy: 'all',
                    bundlePolicy: 'balanced',
                    rtcpMuxPolicy: 'require',
                    iceCandidatePoolSize: '0',
                    ...(this.application.session.config &&
                        this.application.session.config.iceServers && {
                        iceServers: this.application.session.config.iceServers
                    })
                };
                const pc = this.rtcHelper.createRTCPeerConnection(pc_config);
                pc.trace('conversation_id', this.parentConversation.id);
                pc.trace('member_id', this.parentConversation.me.id);
                if (this.application.session.config.callstats && this.application.session.config.callstats.enabled) {
                    this._enableCallStats(pc);
                }
                let stream;
                this.pc = pc;
                pc.ontrack = (evt) => {
                    stream = evt.streams[0];
                    this.application.activeStreams.push(stream);
                    this.parentConversation.me.emit('media:stream:on', {
                        pc: this.pc,
                        stream,
                        type: 'audio',
                        streamIndex
                    });
                };
                pc.onconnectionstatechange = (event) => {
                    switch (pc.connectionState) {
                        case "connected":
                            this.log.info("The connection has become fully connected");
                            resolve(stream);
                            break;
                        case "disconnected":
                        case "failed":
                            reject();
                            this.log.info("One or more transports has terminated unexpectedly or in an error");
                            break;
                        case "closed":
                            this.log.info("The connection has been closed");
                            break;
                    }
                };
                localStream.getTracks().forEach((track) => {
                    pc.addTrack(track);
                });
                pc.onnegotiationneeded = async () => {
                    try {
                        const offer = await pc.createOffer();
                        return pc.setLocalDescription(offer);
                    }
                    catch (error) {
                        onClientError(error);
                    }
                };
                pc.oniceconnectionstatechange = (connection_event) => {
                    switch (pc.iceConnectionState) {
                        // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState
                        case 'disconnected':
                            this.log.warn('One or more transports is disconnected', pc.iceConnectionState);
                            break;
                        case 'failed':
                            onClientError(connection_event);
                            this.log.warn('One or more transports has terminated unexpectedly or in an error', connection_event);
                            break;
                        default:
                            this.log.info('The ice connection status changed', pc.iceConnectionState);
                            break;
                    }
                };
                //Set up flag for checking rtc offer sent
                let rtc_sent = false;
                const do_gatherDone = async () => {
                    // Check if no pc or if rtc offer already sent
                    if (!this.pc || rtc_sent) {
                        return;
                    }
                    rtc_sent = true;
                    const candidate = {
                        foundation: 1176891032,
                        component: 1,
                        transport: 'udp',
                        priority: 2122260223,
                        ip: '0.0.0.0',
                        port: 9,
                        type: 'host',
                        generation: 0,
                        'network-id': 1,
                        'network-cost': 50
                    };
                    const sdpOfferNewObj = sdptransform.parse(pc.localDescription.sdp);
                    sdpOfferNewObj.media[0].candidates = [candidate];
                    const sdpOfferNew = sdptransform.write(sdpOfferNewObj);
                    const offer = { sdp: sdpOfferNew, type: "offer" };
                    try {
                        const { rtc_id } = await this.application.session.sendNetworkRequest({
                            type: 'POST',
                            path: `conversations/${this.parentConversation.id}/rtc`,
                            data: {
                                from: this.parentConversation.me.id,
                                body: {
                                    offer
                                }
                            }
                        });
                        pc.trace('rtc_id', rtc_id);
                        this.rtcObjects[rtc_id] = {
                            rtc_id,
                            pc,
                            stream: localStream,
                            type: 'audio',
                            streamIndex
                        };
                    }
                    catch (error) {
                        throw new nexmoClientError_1.NexmoApiError(error);
                    }
                };
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        return do_gatherDone();
                    }
                };
            })
                .then(() => {
                // We want to be able to handle these events, for this  member, before they get propagated out
                this.parentConversation.once('rtc:answer', (event) => {
                    if (!this.pc) {
                        this.log.warn('RTC: received an answer too late');
                        return;
                    }
                    this.pc.setRemoteDescription(new RTCSessionDescription({
                        type: 'answer',
                        sdp: event.body.answer
                    }), () => {
                        this.log.info('remote description is set');
                    }, onClientError);
                });
                this._attachEndingEventHandlers();
            })
                .catch((error) => {
                reject(new nexmoClientError_1.NexmoClientError(error));
            });
        });
    }
    _findRtcObjectByType(type) {
        return Object.values(this.rtcObjects).find((rtcObject) => rtcObject.type === type);
    }
    _closeStream(stream) {
        stream.getTracks().forEach((track) => {
            track.stop();
        });
    }
    async _cleanConversationProperties() {
        if (this.pc) {
            this.pc.close();
        }
        // stop active stream
        delete this.pc;
        this.rtcStats = null;
        this.application.activeStreams = [];
        this.listeningToRtcEvent = false;
        await Promise.resolve();
    }
    /**
     * Cleans up the user's media before leaving the conversation
    */
    _cleanMediaProperties() {
        if (this.pc) {
            this.pc.close();
        }
        if (this.rtcObjects) {
            for (const leg_id in this.rtcObjects) {
                this._closeStream(this.rtcObjects[leg_id].stream);
            }
        }
        delete this.pc;
        this.rtcStats = null;
        this.application.activeStreams = [];
        this.rtcObjects = {};
        this.listeningToRtcEvent = false;
    }
    async _disableLeg(leg_id) {
        const csRequestPromise = new Promise(async (resolve, reject) => {
            try {
                await this.application.session.sendNetworkRequest({
                    type: 'DELETE',
                    path: `conversations/${this.parentConversation.id}/rtc/${leg_id}?from=${this.parentConversation.me.id}&originating_session=${this.application.session.session_id}`,
                    version: "beta2"
                });
                resolve('rtc:terminate:success');
            }
            catch (error) {
                reject(new nexmoClientError_1.NexmoApiError(error));
            }
        });
        const closeResourcesPromise = new Promise((resolve) => {
            if (this.rtcObjects[leg_id].pc) {
                this.rtcObjects[leg_id].pc.close();
            }
            if (this.rtcObjects[leg_id].stream) {
                this._closeStream(this.rtcObjects[leg_id].stream);
            }
            resolve();
        });
        try {
            await Promise.all([csRequestPromise, closeResourcesPromise]);
            this.parentConversation.me.emit('media:stream:off', this.rtcObjects[leg_id].streamIndex);
            delete this.rtcObjects[leg_id];
            return 'rtc:terminate:success';
        }
        catch (error) {
            throw error;
        }
    }
    _enableMediaTracks(tracks, enabled) {
        tracks.forEach((mediaTrack) => {
            mediaTrack.enabled = enabled;
        });
    }
    /**
     * Send a mute request with the rtc_id and enable/disable the tracks
     * If the mute request fails revert the changes in the tracks
     * @private
    */
    async _setMediaTracksAndMute(rtc_id, tracks, mute, mediaType) {
        this._enableMediaTracks(tracks, !mute);
        try {
            return await this.application.session.sendNetworkRequest({
                type: 'POST',
                path: `conversations/${this.parentConversation.id}/events`,
                data: {
                    type: mediaType,
                    to: this.parentConversation.me.id,
                    from: this.parentConversation.me.id,
                    body: {
                        rtc_id
                    }
                }
            });
        }
        catch (error) {
            this._enableMediaTracks(tracks, mute);
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
     * Replaces the stream's audio tracks currently being used as the sender's sources with a new one
     * @param {object} constraints - audio constraints
     * @param {string} type - rtc object type
     * @param {object} [constraints.audio] - set audio constraints - { deviceId: { exact: microphoneId } }
     * @returns {Promise<MediaStream>} - Returns the new stream.
     * @example <caption>Update the stream currently being used with a new one</caption>
    */
    async updateAudioConstraints(constraints = {}) {
        let rtcObjectByType = this._findRtcObjectByType('audio');
        if (rtcObjectByType && rtcObjectByType.pc) {
            try {
                const localStream = await this.rtcHelper.getUserAudio(constraints);
                localStream.getTracks().forEach((track) => {
                    const sender = rtcObjectByType.pc.getSenders().find((s) => s.track.kind === track.kind);
                    if (sender) {
                        track.enabled = sender.track.enabled;
                        sender.replaceTrack(track);
                    }
                });
                this._closeStream(rtcObjectByType.stream);
                rtcObjectByType.stream = localStream;
                return localStream;
            }
            catch (error) {
                return error;
            }
        }
        else {
            throw new nexmoClientError_1.NexmoApiError('error:media:stream:not-found');
        }
    }
    /**
     * Mute our member
     *
     * @param {boolean} [mute=false] true for mute, false for unmute
     * @param {number} [streamIndex] stream id to set - if it's not set all streams will be muted
     * @example <caption>Mute audio stream in conversation</caption>
     * media.mute(true)
    */
    mute(mute = false, streamIndex = null) {
        const state = mute ? 'on' : 'off';
        const audioType = 'audio:mute:' + state;
        let promises = [];
        let muteObjects = {};
        if (streamIndex !== null) {
            muteObjects[0] = Object.values(this.rtcObjects).find(((rtcObj) => rtcObj.streamIndex === streamIndex));
            if (!muteObjects[0]) {
                throw new nexmoClientError_1.NexmoClientError('error:media:stream:not-found');
            }
        }
        else {
            muteObjects = this.rtcObjects;
        }
        Object.values(muteObjects).forEach((rtcObject) => {
            const audioTracks = rtcObject.stream.getAudioTracks();
            const audioPromise = this._setMediaTracksAndMute(rtcObject.rtc_id, audioTracks, mute, audioType);
            promises.push(audioPromise);
        });
        return Promise.all(promises);
    }
    /**
     * Earmuff our member
     *
     * @param {boolean} [params]
     *
     * @returns {Promise}
     * @private
    */
    async earmuff(earmuff) {
        try {
            if (this.me === null) {
                throw new nexmoClientError_1.NexmoClientError('error:self');
            }
            else {
                let type = 'audio:earmuff:off';
                if (earmuff) {
                    type = 'audio:earmuff:on';
                }
                const { response } = await this.application.session.sendNetworkRequest({
                    type: 'POST',
                    path: `conversations/${this.parentConversation.id}/events`,
                    data: {
                        type,
                        to: this.parentConversation.me.id
                    }
                });
                return response;
            }
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
      * Enable media participation in the conversation for this application (requires WebRTC)
      * @param {object} params - rtc params
      * @param {string} params.label - Label is an application defined tag, eg. ‘fullscreen’
      * @param {object} [params.audio=true] - audio enablement mode. possible values "both", "send_only", "receive_only", "none", true or false
      * @param {object} [params.autoPlayAudio=false] - attach the audio stream automatically to start playing after enable media (default false)
      * @returns {Promise<MediaStream>}
      * @example <caption>Enable media in this conversation</caption>
      * function enable() {
      *   conversation.media.enable()
      *      .then((stream) => {
      *          const media = document.createElement("audio");
      *          const source = document.createElement("source");
      *          const media_div = document.createElement("div");
      *          media.appendChild(source);
      *          media_div.appendChild(media);
      *          document.insertBefore(media_div);
      *          // Older browsers may not have srcObject
      *          if ("srcObject" in media) {
      *            media.srcObject = stream;
      *          } else {
      *            // Avoid using this in new browsers, as it is going away.
      *            media.src = window.URL.createObjectURL(stream);
      *          }
      *          media.onloadedmetadata = (e) => {
      *            media.play();
      *          };
      *
      * 		 }).catch((error) => {
      *           console.log(error);
      *      });
      * }
      *
      *
      *
    **/
    async enable(params) {
        try {
            if (this.parentConversation.me === null) {
                throw new nexmoClientError_1.NexmoClientError('error:self');
            }
            else {
                // this needs to happen soon before we use pc.trace
                // ps.trace is injected in rtcstats module
                if (this.rtcstats_conf.emit_events) {
                    this._initStatsEvents();
                }
                const stream = await this._handleAudio(params);
                // attach the audio stream automatically to start playing
                let autoPlayAudio = (params && (params.autoPlayAudio || params.autoPlayAudio === undefined)) ? true : false;
                if (!params || autoPlayAudio) {
                    this.rtcHelper._playAudioStream(stream);
                }
                return stream;
            }
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Disable media participation in the conversation for this application
     * if RtcStats MOS is enabled, a final report will be available in
     * NexmoClient#rtcstats:report
     * @returns {Promise}
     * @example
     *
     * function disable() {
     *   conversation.media.disable()
     *      .then((response) => {
     *       }).catch((error) => {
     *           console.log(error);
     *       });
     * }
     *
    **/
    disable() {
        let promises = [];
        promises.push(this._cleanConversationProperties());
        for (const leg_id in this.rtcObjects) {
            promises.push(this._disableLeg(leg_id));
        }
        return Promise.all(promises);
    }
    /**
     * Play a voice text in a conversation
     * @param {object} params
     * @param {string} params.text - the text to say in the conversation
     * @param {string} params.voice_name -
     * @param {number} params.level - [0] -
     * @param {boolean} params.queue -
     * @param {boolean} params.loop -
     *
     * @returns {Promise<NXMEvent>}
     * @example
     *   conversation.media.sayText({text:'hi'});
    **/
    async sayText(params) {
        try {
            const response = await this.application.session.sendNetworkRequest({
                type: 'POST',
                path: `conversations/${this.parentConversation.id}/events`,
                data: {
                    type: 'audio:say',
                    cid: this.parentConversation.id,
                    from: this.parentConversation.me.id,
                    body: {
                        text: params.text,
                        voice_name: params.voice_name || 'Amy',
                        level: params.level || 1,
                        queue: params.queue || true,
                        loop: params.loop || 1,
                        ssml: params.ssml || false
                    }
                }
            });
            return new nxmEvent_1.default(this.conversation, response);
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
      * Send DTMF in a conversation
      * @param {string} digit - the DTMF digit(s) to send
      *
      * @returns {Promise<NXMEvent>}
      * @example
      * conversation.media.sendDTMF('digit');
    **/
    async sendDTMF(digit) {
        try {
            if (!utils_1.default.validateDTMF(digit)) {
                throw new nexmoClientError_1.NexmoClientError('error:audio:dtmf:invalid-digit');
            }
            const { id, timestamp } = await this.application.session.sendNetworkRequest({
                type: 'POST',
                path: `conversations/${this.parentConversation.id}/events`,
                data: {
                    type: 'audio:dtmf',
                    from: this.parentConversation.me.id,
                    body: {
                        digit
                    }
                }
            });
            const placeholder_event = {
                body: {
                    digit,
                    dtmf_id: ''
                },
                cid: this.parentConversation.id,
                from: this.parentConversation.me.id,
                id,
                timestamp,
                type: 'audio:dtmf'
            };
            const dtmfEvent = new nxmEvent_1.default(this.parentConversation, placeholder_event);
            this.parentConversation.events.set(placeholder_event.id, dtmfEvent);
            return dtmfEvent;
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
     * Play an audio stream in a conversation
     * @returns {Promise<NXMEvent>}
    */
    async playStream(params) {
        try {
            const response = await this.application.session.sendNetworkRequest({
                type: 'POST',
                path: `conversations/${this.parentConversation.id}/events`,
                data: {
                    type: 'audio:play',
                    body: params
                }
            });
            return new nxmEvent_1.default(this.parentConversation, response);
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
     * Send start ringing event
     * @returns {Promise<NXMEvent>}
     * @example
     * Send ringing event
     * function startRinging() {
     *   conversation.media.startRinging()
     *      .then((response) => {
     *       }).catch((error) => {
     *           console.log(error);
     *       });
     * }
     *
     * conversation.on('audio:ringing:start', (data) => {
     * console.log("ringing");
     * });
    */
    async startRinging() {
        try {
            const response = await this.application.session.sendNetworkRequest({
                type: 'POST',
                path: `conversations/${this.parentConversation.id}/events`,
                data: {
                    type: 'audio:ringing:start',
                    from: this.parentConversation.me.id,
                    body: {}
                }
            });
            return new nxmEvent_1.default(this.parentConversation, response);
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
     * Send stop ringing event
     * @returns {Promise<NXMEvent>}
     * @example
     * Send ringing event
     * function stopRinging() {
     *   conversation.media.stopRinging()
     *    .then((response) => {
     *    }).catch((error) => {
     *      console.log(error);
     *    });
     * }
     *
     * conversation.on('audio:ringing:stop', (data) => {
     *  console.log("ringing stopped");
     * }
    */
    async stopRinging() {
        try {
            const response = await this.application.session.sendNetworkRequest({
                type: 'POST',
                path: `conversations/${this.parentConversation.id}/events`,
                data: {
                    type: 'audio:ringing:stop',
                    from: this.parentConversation.me.id,
                    body: {}
                }
            });
            return new nxmEvent_1.default(this.parentConversation, response);
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
}
exports.default = Media;
module.exports = Media;
