'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Nexmo Client SDK
 *  Conversation Object Model
 *
 * Copyright (c) Nexmo Inc.
 */
const WildEmitter = require('wildemitter');
const loglevel_1 = require("loglevel");
const nexmoClientError_1 = require("./nexmoClientError");
const member_1 = __importDefault(require("./member"));
const nxmEvent_1 = __importDefault(require("./events/nxmEvent"));
const text_event_1 = __importDefault(require("./events/text_event"));
const media_1 = __importDefault(require("./modules/media"));
const conversation_events_1 = __importDefault(require("./handlers/conversation_events"));
const utils_1 = __importDefault(require("./utils"));
const page_config_1 = __importDefault(require("./pages/page_config"));
const events_page_1 = __importDefault(require("./pages/events_page"));
/**
 * A single conversation Object.
 * @class Conversation
 * @property {Member} me - my Member object that belongs to this conversation
 * @property {Application} application - the parent Application
 * @property {string} name - the name of the Conversation (unique)
 * @property {string} [display_name] - the display_name of the Conversation
 * @property {Map<string, Member>} [members] - the members of the Conversation keyed by a member's id
 * @property {Map<string, NXMEvent>} [events] - the events of the Conversation keyed by an event's id
 * @property {number} [sequence_number] - the last event id
*/
class Conversation {
    constructor(application, params) {
        this.log = loglevel_1.getLogger(this.constructor.name);
        this.application = application;
        this.id = null;
        this.name = null;
        this.display_name = null;
        this.timestamp = null;
        this.members = new Map();
        this.events = new Map();
        this.sequence_number = 0;
        this.pageConfig = new page_config_1.default(((this.application.session || {}).config || {}).events_page_config);
        this.events_page_last = null;
        this.conversationEventHandler = new conversation_events_1.default(application, this);
        this.media = new media_1.default(this);
        /**
         * A Member Object representing the current user.
         * Only set if the user is or has been a member of the Conversation,
         * otherwise the value will be `null`.
         * @type Member
        */
        this.me = null; // We are not in the conversation ourselves by default
        // Map the params (which includes the id)
        this._updateObjectInstance(params);
        WildEmitter.mixin(Conversation);
    }
    /** Update Conversation object params
     * @property {object} params the params to update
     * @private
    */
    _updateObjectInstance(params) {
        for (let key in params) {
            switch (key) {
                case 'id':
                    this.id = params.id;
                    break;
                case 'name':
                    this.name = params.name;
                    break;
                case 'display_name':
                    this.display_name = params.display_name;
                    break;
                case 'members':
                    // update the conversation javascript object
                    params.members.forEach((m) => {
                        if (this.members.has(m.member_id)) {
                            this.members.get(m.member_id)._normalise(m);
                            if (m.user_id === this.application.me.id && m.state !== 'LEFT') {
                                this.me = this.members.get(m.member_id);
                                this.members.set(this.me.id, this.me);
                            }
                        }
                        else {
                            const member = new member_1.default(this, m);
                            if (m.user_id === this.application.me.id && m.state !== 'LEFT') {
                                this.me = member;
                            }
                            this.members.set(member.id, member);
                        }
                    });
                    break;
                case 'timestamp':
                    this.timestamp = params.timestamp;
                    break;
                case 'sequence_number':
                    this.sequence_number = params.sequence_number;
                    break;
                case 'member_id':
                    // filter needed params to create the object
                    // the conversation list gives us the member_id to prepare the member/this object
                    const object_params = {
                        id: params.member_id,
                        state: params.state,
                        user: this.application.me
                    };
                    // update the member object or create a new instance
                    if (this.members.has(params.member_id)) {
                        const member_object = this.members.get(params.member_id);
                        Object.assign(member_object, object_params);
                    }
                    else {
                        const member = new member_1.default(this, object_params);
                        this.me = member;
                        this.members.set(member.id, member);
                    }
                    break;
            }
        }
    }
    /**
     * Join the given user to this conversation, will typically use this to join
     * ourselves to a conversation we create.
     * Accept an invitation if our member has state INVITED and no user_id / user_name is given
     *
     * @param {object} [params = this.application.me.id] The user to join (defaults to this)
     * @param {string} params.user_name the user_name of the user to join
     * @param {string} params.user_id the user_id of the user to join
     * @returns {Promise<Member>}
     *
     * @example <caption>join a user to a conversation</caption>
     *
     *  conversation.join().then((member) => {
     *    console.log("joined as member: ", member)
     *  })
    */
    async join(params) {
        try {
            const response = await this.application.session.sendNetworkRequest({
                type: 'POST',
                path: `conversations/${this.id}/members`,
                data: {
                    action: 'join',
                    channel: {
                        type: 'app'
                    },
                    ...(!params && { user_name: this.application.me.name, user_id: this.application.me.id }),
                    ...(!params && this.me && this.me.id && this.me.state === 'INVITED' && { member_id: this.me.id }),
                    ...(params && params.user_name && { user_name: params.user_name }),
                    ...(params && params.user_id && { user_id: params.user_id }),
                }
            });
            const member = new member_1.default(this, response);
            if (response.user_id === this.application.me.id) {
                this.me = member;
            }
            this.members.set(member.id, member);
            // use case where between the time we got the conversation and the time we finished joining
            // the conversation object changed.
            this.application.getConversation(this.id);
            return member;
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
     * Delete a conversation
     * @returns {Promise}
     * @example <caption>delete the conversation</caption>
     *
     *  conversation.del().then(() => {
     *    console.log("conversation deleted");
     * 	})
    */
    async del() {
        try {
            const response = await this.application.session.sendNetworkRequest({
                type: 'DELETE',
                path: `conversations/${this.id}`
            });
            this.application.conversations.delete(this.id);
            return response;
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
     * Delete an NXMEvent (e.g. Text)
     * @param {NXMEvent} event
     * @returns {Promise}
     *
    */
    deleteEvent(event) {
        return event.del();
    }
    /**
      * Invite the given user (id or name) to this conversation
      * @param {Member} params
      * @param {string} [params.id or username] - the id or the username of the user to invite
      *
      * @returns {Promise<Member>}
      *
      * @example <caption>invite a user to a conversation</caption>
      *  const user_id = 'user to invite';
      *  const user_name = 'username to invite';
      *
      *  conversation.invite({
      *   id: user_id,
      *   user_name: user_name
      *  }).then((member) => {
      *   displayMessage(member.state + " user: " + user_id + " " + user_name);
      *  }).catch((error) => {
      *   console.log(error);
      *  });
      *
    */
    async invite(params) {
        if (!params || (!params.id && !params.user_name)) {
            throw new nexmoClientError_1.NexmoClientError('error:invite:missing:params');
        }
        try {
            const response = await this.application.session.sendNetworkRequest({
                type: 'POST',
                path: `conversations/${this.id}/members`,
                data: {
                    action: 'invite',
                    ...(params.id && { user_id: params.id }),
                    ...(params.user_name && { user_name: params.user_name }),
                    member_id_inviting: this.me.id,
                    media: params.media,
                    channel: {
                        from: {
                            type: 'app'
                        },
                        leg_ids: [],
                        leg_settings: {},
                        legs: [],
                        to: {
                            type: 'app'
                        },
                        type: 'app'
                    }
                }
            });
            const member = new member_1.default(this, response);
            this.members.set(member.id, member);
            return member;
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
      * Invite the given user (id or name) to this conversation with media audio
      * @param {Member} params
      * @param {string} [params.id or username] - the id or the username of the user to invite
      *
      * @returns {Promise<Member>}
      *
      * @example <caption>invite a user to a conversation</caption>
      *  const user_id = 'user to invite';
      *  const user_name = 'username to invite';
      *
      *  conversation.inviteWithAudio({
      *   id: user_id,
      *   user_name: user_name
      *  }).then((member) => {
      *   displayMessage(member.state + " user: " + user_id + " " + user_name);
      *  }).catch((error) => {
      *   console.log(error);
      *  });
      *
    */
    inviteWithAudio(params) {
        if (!params || (!params.id && !params.user_name)) {
            return Promise.reject(new nexmoClientError_1.NexmoClientError('error:invite:missing:params'));
        }
        params.media = {
            audio_settings: {
                enabled: true,
                muted: false,
                earmuffed: false
            }
        };
        return this.invite(params);
    }
    /**
     * Leave from the conversation
   * @param {object} [reason] the reason for leaving the conversation
   * @param {string} [reason.reason_code] the code of the reason
   * @param {string} [reason.reason_text] the description of the reason
     * @returns {Promise}
    */
    leave(reason) {
        return this.me.kick(reason);
    }
    /**
      * Send a text message to the conversation, which will be relayed to every other member of the conversation
      * @param {string} text - the text message to be sent
      *
      * @returns {Promise<TextEvent>} - the text message that was sent
      *
      * @example <caption> sending a text </caption>
      * conversation.sendText("Hi Nexmo").then(() => {
      *   console.log('message was sent');
      *	}).catch((error)=>{
      *	  console.log('error sending the message', error);
      *	});
      *
    */
    async sendText(text) {
        try {
            if (this.me === null) {
                throw new nexmoClientError_1.NexmoClientError('error:self');
            }
            const msg = {
                type: 'text',
                cid: this.id,
                from: this.me.id,
                body: {
                    text
                }
            };
            const { id, timestamp } = await this.application.session.sendNetworkRequest({
                type: 'POST',
                path: `conversations/${this.id}/events`,
                data: msg
            });
            msg.id = id;
            msg.body.timestamp = timestamp;
            return new text_event_1.default(this, msg);
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
      * Send a custom event to the conversation
      * @param {object} params - params of the custom event
      * @param {string} type - the name of the custom event. Must not exceed 100 char length and contain only alpha numerics and '-' and '_' characters.
      * @param {object} body - customizable key value pairs
      *
      * @returns {Promise<NXMEvent>} - the custom event that was sent
      *
      * @example <caption> sending a custom event </caption>
      * conversation.sendCustomEvent({ type: 'my-event', body: {}}).then(() => {
      *	  console.log('custom event was sent');
      *	}).catch((error)=>{
      *	  console.log('error sending the custom event', error);
      *	});
      *
    */
    async sendCustomEvent({ type, body }) {
        try {
            if (this.me === null) {
                throw new nexmoClientError_1.NexmoClientError('error:self');
            }
            else if (!type || typeof type !== 'string' || type.length < 1) {
                throw new nexmoClientError_1.NexmoClientError('error:custom-event:invalid');
            }
            const data = {
                type: `custom:${type}`,
                cid: this.id,
                from: this.me.id,
                body
            };
            const { id, timestamp } = await this.application.session.sendNetworkRequest({
                type: 'POST',
                path: `conversations/${this.id}/events`,
                data
            });
            data.id = id;
            data.timestamp = timestamp;
            return new nxmEvent_1.default(this, data);
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
     * Send an Image message to the conversation, which will be relayed to every other member of the conversation.
     * implements xhr (https://xhr.spec.whatwg.org/) - this.imageRequest
     *
     * @param {File} file single input file (jpeg/jpg)
     * @param {string} [params.quality_ratio = 100] a value between 0 and 100. 0 indicates 'maximum compression' and the lowest quality, 100 will result in the highest quality image
     * @param {string} [params.medium_size_ratio = 50] a value between 1 and 100. 1 indicates the new image is 1% of original, 100 - same size as original
     * @param {string} [params.thumbnail_size_ratio = 10] a value between 1 and 100. 1 indicates the new image is 1% of original, 100 - same size as original
     *
     * @returns {Promise<XMLHttpRequest>}
     *
     * @example <caption>sending an image</caption>
     * conversation.sendImage(fileInput.files[0]).then((imageRequest) => {
     *  imageRequest.onabort = (e) => {
     *    console.log(e);
     *    console.log("Image:" + e.type);
     *  };
     *  imageRequest.onloadend = (e) => {
     *    console.log("Image:" + e.type);
     *  };
     * });
    */
    async sendImage(fileInput, params = {
        quality_ratio: '100',
        medium_size_ratio: '50',
        thumbnail_size_ratio: '30'
    }) {
        const formData = new FormData();
        formData.append('file', fileInput);
        formData.append('quality_ratio', params.quality_ratio);
        formData.append('medium_size_ratio', params.medium_size_ratio);
        formData.append('thumbnail_size_ratio', params.thumbnail_size_ratio);
        const imageRequest = await utils_1.default.networkRequest({
            type: 'POST',
            url: this.application.session.config.ips_url,
            data: formData,
            token: this.application.session.config.token
        });
        imageRequest.upload.addEventListener('progress', (evt) => {
            if (evt.lengthComputable) {
                this.log.debug('uploading image ' + evt.loaded + '/' + evt.total);
            }
        }, false);
        imageRequest.onreadystatechange = () => {
            if (imageRequest.readyState === 4 && imageRequest.status === 200) {
                try {
                    this.application.session.sendNetworkRequest({
                        type: 'POST',
                        path: `conversations/${this.id}/events`,
                        data: {
                            type: 'image',
                            from: this.me.id,
                            body: {
                                representations: JSON.parse(imageRequest.responseText)
                            }
                        }
                    });
                    this.log.info(imageRequest);
                }
                catch (error) {
                    this.log.error(new nexmoClientError_1.NexmoApiError(error));
                }
            }
            if (imageRequest.status !== 200) {
                this.log.error(imageRequest);
            }
        };
        return imageRequest;
    }
    /**
     * Cancel sending an Image message to the conversation.
     *
     * @param {XMLHttpRequest} imageRequest
     *
     * @returns void
     *
     * @example <caption>cancel sending an image</caption>
     * conversation.sendImage(fileInput.files[0]).then((imageRequest) => {
     *    conversation.abortSendImage(imageRequest);
     * });
    */
    abortSendImage(imageRequest) {
        if (imageRequest instanceof XMLHttpRequest) {
            return imageRequest.abort();
        }
        else {
            return new nexmoClientError_1.NexmoClientError('error:invalid:param:type');
        }
    }
    async _typing(state) {
        const params = {
            activity: (state === 'on') ? 1 : 0
        };
        const data = {
            type: 'text:typing:' + state,
            cid: this.id,
            from: this.me.id,
            body: params
        };
        try {
            await this.application.session.sendNetworkRequest({
                type: 'POST',
                path: `conversations/${this.id}/events`,
                data
            });
            return `text:typing:${state}:success`;
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
     * Send start typing indication
     *
     * @returns {Promise} - resolves the promise on successful sent
    */
    startTyping() {
        return this._typing('on');
    }
    /**
     * Send stop typing indication
     *
     * @returns {Promise} - resolves the promise on successful sent
    */
    stopTyping() {
        return this._typing('off');
    }
    /**
      * Query the service to get a list of events in this conversation.
      *
      * @param {object} params configure defaults for paginated events query
      * @param {string} params.order 'asc' or 'desc' ordering of resources based on creation time
      * @param {number} params.page_size the number of resources returned in a single request list
      * @param {string} [params.cursor] string to access the starting point of a dataset
      * @param {string} [params.event_type] the type of event used to filter event requests. Supports wildcard options with :* eg. 'members:*'
      *
      * @returns {Promise<EventsPage<Map<Events>>>} - Populate Conversations.events.
      * @example <caption>Get Events</caption>
      * conversation.getEvents({ event_type: 'member:*' ).then((events_page) => {
      *   events_page.items.forEach(event => {
      *     render(event)
      *   })
      * });
    */
    async getEvents(params = {}) {
        const url = `${this.application.session.config.nexmo_api_url}/beta2/conversations/${this.id}/events`;
        // Create pageConfig if given params otherwise use default
        let pageConfig = Object.keys(params).length === 0 ? this.pageConfig : new page_config_1.default(params);
        try {
            const response = await utils_1.default.paginationRequest(url, pageConfig, this.application.session.config.token);
            response.application = this.application;
            response.conversation = this;
            const events_page = new events_page_1.default(response);
            this.events_page_last = events_page;
            return events_page;
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
     * Handle and event from the cloud.
     * using conversationEventHandler
     * @param {object} event
     * @private
    */
    _handleEvent(event) {
        if (event.type.startsWith('rtc')) {
            // keep the rtc events going to the application layer, we use them in media module
            this.emit(event.type, event);
            return;
        }
        this.sequence_number++;
        if (event.from && !this.members.has(event.from)) {
            this.members.set(event.from, new member_1.default(this, event));
        }
        // make sure the event_id is not a string
        if (event.body && event.body.event_id && typeof event.body.event_id === 'string') {
            event.body.event_id = parseInt(event.body.event_id);
        }
        const from = this.members.get(event.from);
        let constructed_event = this.conversationEventHandler.handleEvent(event);
        // Unless they are typing events, add the event to the conversation.events map
        if (!['text:typing:on', 'text:typing:off'].includes(event.type)) {
            this.events.set(constructed_event.id, constructed_event);
        }
        // For custom events remove the custom: prefix before emitting event
        if (event.type.startsWith('custom:')) {
            this.emit(constructed_event.type, from, constructed_event);
            return;
        }
        this.emit(event.type, from, constructed_event);
    }
}
exports.default = Conversation;
module.exports = Conversation;
