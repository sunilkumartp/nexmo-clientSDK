'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Nexmo Client SDK
 *  Application Object Model
 *
 * Copyright (c) Nexmo Inc.
*/
const WildEmitter = require('wildemitter');
const loglevel_1 = require("loglevel");
const nexmoClientError_1 = require("./nexmoClientError");
const user_1 = __importDefault(require("./user"));
const conversation_1 = __importDefault(require("./conversation"));
const nxmCall_1 = __importDefault(require("./modules/nxmCall"));
const sip_events_1 = __importDefault(require("./handlers/sip_events"));
const rtc_events_1 = __importDefault(require("./handlers/rtc_events"));
const application_events_1 = __importDefault(require("./handlers/application_events"));
const utils_1 = __importDefault(require("./utils"));
const page_config_1 = __importDefault(require("./pages/page_config"));
const conversations_page_1 = __importDefault(require("./pages/conversations_page"));
let sipEventHandler = null;
let rtcEventHandler = null;
let applicationEventsHandler = null;
/**
 * Core application class for the SDK.
 * Application is the parent object holding the list of conversations, the session object.
 * Provides methods to create conversations and retrieve a list of the user's conversations, while it holds the listeners for
 * user's invitations
 * @class Application
 * @param {NexmoClient} SDK session Object
 * @param {object} params
 * @example <caption>Accessing the list of conversations</caption>
 *  rtc.login(token).then((application) => {
 *    console.log(application.conversations);
 *    console.log(application.me.name, application.me.id);
 *  });
 * @emits Application#member:invited
 * @emits Application#member:joined
 * @emits Application#NXM-errors
*/
class Application {
    constructor(session, params) {
        this.log = loglevel_1.getLogger(this.constructor.name);
        this.session = session;
        this.conversations = new Map();
        this.synced_conversations_count = 0;
        this.start_sync_time = 0;
        this.stop_sync_time = 0;
        // conversation_id, nxmCall
        this.calls = new Map();
        // knocking_id, nxmCall
        this._call_draft_list = new Map();
        this.pageConfig = new page_config_1.default((session.config || {}).conversations_page_config);
        this.conversations_page_last = null;
        sipEventHandler = new sip_events_1.default(this);
        rtcEventHandler = new rtc_events_1.default(this);
        applicationEventsHandler = new application_events_1.default(this);
        this.me = null;
        Object.assign(this, params);
        WildEmitter.mixin(Application);
    }
    /**
     * Update Conversation instance or create a new one.
     *
     * Pre-created conversation exist from getConversations
     * like initialised templates. When we explicitly ask to
     * getConversation(), we receive members and other details
     *
     * @param {object} payload Conversation payload
     * @private
    */
    updateOrCreateConversation(payload) {
        const conversation = this.conversations.get(payload.id);
        if (conversation) {
            conversation._updateObjectInstance(payload);
            this.conversations.set(payload.id, conversation);
        }
        else {
            this.conversations.set(payload.id, new conversation_1.default(this, payload));
        }
        return this.conversations.get(payload.id);
    }
    /**
     * Application listening for invites.
     *
     * @event Application#member:invited
     *
     * @property {Member} member - The invited member
     * @property {NXMEvent} event - The invitation event
     *
     * @example <caption>listen for your invites</caption>
     *  application.on("member:invited",(member, event) => {
     *    console.log("Invited to the conversation: " + event.conversation.display_name || event.conversation.name);
     *    // identify the sender.
     *    console.log("Invited by: " + member.invited_by);
     *    //accept an invitation.
     *    application.conversations.get(event.conversation.id).join();
     *    //decline the invitation.
     *     application.conversations.get(event.conversation.id).leave();
    */
    /**
     * Application listening for joins.
     *
     * @event Application#member:joined
     *
     * @property {Member} member - the member that joined the conversation
     * @property {NXMEvent} event - the join event
     *
     * @example <caption>listen join events in Application level</caption>
     *  application.on("member:joined",(member, event) => {
     *    console.log("JOINED", "Joined conversation: " + event.conversation.display_name || event.conversation.name);
     *  });
    */
    /**
     * Entry point for events in Application level
     * @private
    */
    async _handleEvent(event) {
        const isEventFromMe = event.body && event.body.user && event.body.user.user_id === this.me.id;
        if (event.type.startsWith('sip')) {
            sipEventHandler._handleSipCallEvent(event);
            return;
        }
        if (this.conversations.has(event.cid) && event.type !== "rtc:transfer") {
            if (event.type.startsWith('rtc')) {
                rtcEventHandler._handleRtcEvent(event);
            }
            this.conversations.get(event.cid)._handleEvent(event);
            if ((event.type === 'member:joined' || event.type === 'member:invited')
                && isEventFromMe) {
                this._handleApplicationEvent(event);
            }
        }
        else {
            // get the conversation you don't know about (case: joined by another user)
            try {
                const conversation = await this.getConversation(event.cid);
                this.conversations.set(event.cid, conversation);
                conversation._handleEvent(event);
                this._handleApplicationEvent(event);
                if (event.type.startsWith("rtc")) {
                    rtcEventHandler._handleRtcEvent(event);
                }
            }
            catch (error) {
                this.log.error(error);
            }
        }
    }
    /**
     * update user's token
     * @param {string} token - the new token
     * @returns {Promise}
    */
    updateToken(token) {
        // SDK can be disconnected because of expired token
        // this lets us update token for next reconnection attempt
        if (this.session.connection && this.session.connection.disconnected) {
            this.session.config.token = token;
            this.session.connection.io.opts.query.token = token;
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            this.session.sendRequest({
                type: 'session:update-token',
                body: {
                    token
                }
            }, (response) => {
                if (response.type === 'session:update-token:success') {
                    if (this.me) {
                        this.session.config.token = token;
                        this.session.connection.io.opts.query.token = token;
                    }
                    resolve();
                }
                else {
                    reject(new nexmoClientError_1.NexmoApiError(response));
                }
            });
        });
    }
    /**
     * Update the event to map local generated events
     * in case we need a more specific event to pass in the application listener
     * or f/w the event as it comes
     * @private
    */
    _handleApplicationEvent(event) {
        const processed_event = applicationEventsHandler.handleEvent(event);
        this.emit(processed_event.type, this.conversations.get(event.cid).members.get(processed_event.from), processed_event);
    }
    /**
     * Creates a call to specified user/s.
     * @classdesc creates a call between the defined users
     * @param {string[]} usernames - the user names for those we want to call
     * @returns {Promise<NXMCall>} a NXMCall object with all the call properties
    */
    async inAppCall(usernames) {
        if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
            return Promise.reject(new nexmoClientError_1.NexmoClientError('error:application:call:params'));
        }
        try {
            const nxmCall = new nxmCall_1.default(this);
            await nxmCall.createCall(usernames);
            nxmCall.direction = nxmCall.CALL_DIRECTION.OUTBOUND;
            return nxmCall;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Creates a call to phone a number.
     * The call object is created under application.calls when the call has started.
     * listen for it with application.on("call:status:changed")
     *
     * You don't need to start the stream, the SDK will play the audio for you
     *
     * @classdesc creates a call to a phone number
   * @param {string} user the phone number or the username you want to call
   * @param {string} [type="phone"] the type of the call you want to have. possible values "phone" or "app" (default is "phone")
     * @returns {Promise<NXMCall>}
     * @example <caption>Create a call to a phone</caption>
     *  application.on("call:status:changed", (nxmCall) => {
     *    if (nxmCall.status === nxmCall.CALL_STATUS.STARTED) {
     *		  console.log('the call has started');
   *		}
   *  });
   *
     *  application.callServer(phone_number).then(() => {
     *    console.log('Calling phone ' + phone_number);
     *  });
    */
    async callServer(user, type = 'phone') {
        try {
            const nxmCall = new nxmCall_1.default(this);
            nxmCall.direction = nxmCall.CALL_DIRECTION.OUTBOUND;
            const { id } = await nxmCall.createServerCall(user, type);
            nxmCall.knocking_id = id;
            return nxmCall;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Query the service to create a new conversation
     * The conversation name must be unique per application.
     * @param {object} [params] - leave empty to get a GUID as name
     * @param {string} params.name - the name of the conversation. A UID will be assigned if this is skipped
     * @param {string} params.display_name - the display_name of the conversation.
     * @returns {Promise<Conversation>} - the created Conversation
     * @example <caption>Create a conversation and join</caption>
     *  application.newConversation().then((conversation) => {
     *    //join the created conversation
     *    conversation.join().then((member) => {
     *      //Get the user's member belonging in this conversation.
     *      //You can also access it via conversation.me
     *      console.log("Joined as " + member.user.name);
   *    });
     *  }).catch((error) => {
     *    console.log(error);
     *  });
    */
    async newConversation(data = {}) {
        try {
            const response = await this.session.sendNetworkRequest({
                type: 'POST',
                path: 'conversations',
                data
            });
            const conv = new conversation_1.default(this, response);
            this.conversations.set(conv.id, conv);
            // do a get conversation to get the whole model as shaped in the service,
            return this.getConversation(conv.id);
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
     * Query the service to create a new conversation and join it
     * The conversation name must be unique per application.
     * @param {object} [params] - leave empty to get a GUID as name
     * @param {string} params.name - the name of the conversation. A UID will be assigned if this is skipped
     * @param {string} params.display_name - the display_name of the conversation.
     * @returns {Promise<Conversation>} - the created Conversation
     * @example <caption>Create a conversation and join</caption>
     *  application.newConversationAndJoin().then((conversation) => {
     *    //join the created conversation
     *    conversation.join().then((member) => {
     *      //Get the user's member belonging in this conversation.
     *      //You can also access it via conversation.me
     *      console.log("Joined as " + member.user.name);
     *  }).catch((error) => {
     *    console.log(error);
     *  });
    */
    async newConversationAndJoin(params) {
        const conversation = await this.newConversation(params);
        await conversation.join();
        return conversation;
    }
    /**
     * Query the service to see if this conversation exists with the
     * logged in user as a member and retrieve the data object
     * Result added (or updated) in this.conversations
     *
     * @param {string} id - the id of the conversation to fetch
     * @returns {Promise<Conversation>} - the requested conversation
    */
    async getConversation(id) {
        try {
            const response = await this.session.sendNetworkRequest({
                type: 'GET',
                path: `conversations/${id}`
            });
            response['id'] = response['uuid'];
            delete response['uuid'];
            const conversation_object = this.updateOrCreateConversation(response);
            if (this.session.config.sync === 'full') {
                // Populate the events
                const { items } = await conversation_object.getEvents();
                conversation_object.events = items;
                return conversation_object;
            }
            else {
                return conversation_object;
            }
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
     * Query the service to obtain a complete list of conversations of which the
     * logged-in user is a member with a state of `JOINED` or `INVITED`.
   * @param {object} params configure defaults for paginated conversations query
   * @param {string} params.order 'asc' or 'desc' ordering of resources based on creation time
   * @param {number} params.page_size the number of resources returned in a single request list
   * @param {string} [params.cursor] string to access the starting point of a dataset
     *
     * @returns {Promise<Page<Map<Conversation>>>} - Populate Application.conversations.
   * @example <caption>Get Conversations</caption>
   *  application.getConversations({ page_size: 20 }).then((conversations_page) => {
   *    conversations_page.items.forEach(conversation => {
   *      render(conversation)
   *    })
   *  });
   *
    */
    async getConversations(params = {}) {
        const url = `${this.session.config.nexmo_api_url}/beta2/users/${this.me.id}/conversations`;
        // Create pageConfig if some elements given otherwise use default
        let pageConfig = Object.keys(params).length === 0 ? this.pageConfig : new page_config_1.default(params);
        try {
            const response = await utils_1.default.paginationRequest(url, pageConfig, this.session.config.token);
            response.application = this;
            const conversations_page = new conversations_page_1.default(response);
            this.conversations_page_last = conversations_page;
            return conversations_page;
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
    /**
     * Application listening sync status.
     *
     * @event Application#sync:progress
     *
     * @property {number} status.sync_progress - Percentage of fetched conversations
     * @example <caption>listening for changes in the synchronisation progress</caption>
     *  application.on("sync:progress",(status) => {
     *	  console.log(data.sync_progress);
     *  });
    */
    /**
     * Fetching all the conversations and sync progress events
    */
    syncConversations(conversations) {
        const conversation_array = Array.from(conversations.values());
        const conversations_length = conversation_array.length;
        const d = new Date();
        this.start_sync_time = (typeof window !== 'undefined' && window.performance) ? window.performance.now() : d.getTime();
        const fetchConversationForStorage = async () => {
            this.synced_conversations_percentage = Number(((this.synced_conversations_count / conversations_length) * 100).toFixed(2));
            const status_payload = {
                sync_progress: this.synced_conversations_percentage
            };
            this.emit('sync:progress', status_payload);
            this.log.info('Loading sync progress: ' + this.synced_conversations_count + '/' +
                conversations_length + ' - ' + this.synced_conversations_percentage + '%');
            if (this.synced_conversations_percentage >= 100) {
                const d = new Date();
                this.stop_sync_time = (typeof window !== 'undefined' && window.performance) ? window.performance.now() : d.getTime();
                this.log.info('Loaded conversations in ' + (this.stop_sync_time - this.start_sync_time) + 'ms');
            }
            if (this.synced_conversations_count < conversations_length) {
                await this.getConversation(conversation_array[this.synced_conversations_count].id);
                fetchConversationForStorage();
                this.synced_conversations_count++;
                this.sync_progress_buffer++;
            }
        };
        fetchConversationForStorage();
    }
    /**
     * Get Details of a user
     * @param {string} [id] - the id of the user to fetch, if skipped, it returns your own user details
     * @returns {Promise<User>}
    */
    async getUser(user_id = this.me.id) {
        try {
            const response = await this.session.sendNetworkRequest({
                type: 'GET',
                path: `users/${user_id}`
            });
            return new user_1.default(this, response);
        }
        catch (error) {
            throw new nexmoClientError_1.NexmoApiError(error);
        }
    }
}
exports.default = Application;
module.exports = Application;
