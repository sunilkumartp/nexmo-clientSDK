'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Nexmo Client SDK
 *  Application Events Handler
 *
 * Copyright (c) Nexmo Inc.
 */
const loglevel_1 = require("loglevel");
const nxmEvent_1 = __importDefault(require("../events/nxmEvent"));
const nxmCall_1 = __importDefault(require("../modules/nxmCall"));
const utils_1 = __importDefault(require("../utils"));
/**
 * Handle Application Events
 *
 * @class ApplicationEventsHandler
 * @param {Application} application
 * @param {Conversation} conversation
 * @private
*/
class ApplicationEventsHandler {
    constructor(application) {
        this.log = loglevel_1.getLogger(this.constructor.name);
        this.application = application;
        this._handleApplicationEventMap = {
            'member:joined': this._processMemberJoined,
            'member:invited': this._processMemberInvited
        };
    }
    /**
      * Handle and event.
      *
      * Update the event to map local generated events
      * in case we need a more specific event to pass in the application listener
      * or f/w the event as it comes
      * @param {object} event
      * @private
    */
    handleEvent(event) {
        const conversation = this.application.conversations.get(event.cid);
        const copied_event = Object.assign({}, event);
        if (this._handleApplicationEventMap.hasOwnProperty(event.type)) {
            return this._handleApplicationEventMap[event.type].call(this, conversation, new nxmEvent_1.default(conversation, copied_event), event);
        }
        return new nxmEvent_1.default(conversation, copied_event);
    }
    /**
      * case: call to PSTN, after knocking event we receive joined
      * @private
    */
    _processMemberJoined(conversation, event, raw_event) {
        if (event.body.channel && raw_event.client_ref && this.application._call_draft_list.has(raw_event.client_ref)) {
            const nxmCall = this.application._call_draft_list.get(raw_event.client_ref);
            nxmCall._setFrom(conversation.me);
            nxmCall._setupConversationObject(conversation);
            // remove the client_ref for the call_draft_list
            // needs to be part of the call_draft_list for nxmCall.hangup to perform knocking:delete
            this.application._call_draft_list.delete(raw_event.client_ref);
            // remove the client_ref and knocking_id from the call object
            delete nxmCall.client_ref;
            delete nxmCall.knocking_id;
            this.application.calls.set(conversation.id, nxmCall);
            nxmCall._handleStatusChange(event);
            this.application.emit('member:call', this.application.conversations.get(event.cid).members.get(event.from), nxmCall);
        }
        return event;
    }
    _processMemberInvited(conversation, event) {
        if (!conversation) {
            this.log.warn(`no conversation object for ${event.type}`);
            return event;
        }
        // no need to process the event if it's not media related invite, or the member is us
        if ((conversation.me && (conversation.me.user.id === event.body.invited_by))
            || (!event.body.user.media || !event.body.user.media.audio_settings
                || !event.body.user.media.audio_settings.enabled)) {
            return event;
        }
        const caller = utils_1.default.getMemberNumberFromEventOrNull(event.body.channel) ||
            utils_1.default.getMemberFromNameOrNull(conversation, event.body.invited_by) || 'unknown';
        // (IP - IP call)
        if (conversation.display_name && conversation.display_name.startsWith('CALL_')) {
            const nxmCall = new nxmCall_1.default(this.application, conversation, caller);
            this.application.calls.set(conversation.id, nxmCall);
            this.application.emit('member:call', this.application.conversations.get(event.cid).members.get(event.from), nxmCall);
            // VAPI invites (PHONE - IP)
        }
        else if (!event.body.invited_by) {
            const nxmCall = new nxmCall_1.default(this.application, conversation, caller);
            this.application.calls.set(conversation.id, nxmCall);
            nxmCall._handleStatusChange(event);
            this.application.emit('member:call', this.application.conversations.get(event.cid).members.get(event.from), nxmCall);
        }
        return event;
    }
}
exports.default = ApplicationEventsHandler;
module.exports = ApplicationEventsHandler;
