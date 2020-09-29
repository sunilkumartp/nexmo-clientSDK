'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Nexmo Client SDK
 *
 * Copyright (c) Nexmo Inc.
*/
const page_1 = __importDefault(require("./page"));
const nxmEvent_1 = __importDefault(require("../events/nxmEvent"));
const text_event_1 = __importDefault(require("../events/text_event"));
const image_event_1 = __importDefault(require("../events/image_event"));
/**
 * A Events Page
 *
 * @class EventsPage
 * @param {Map} items map of events fetched in the paginated query
 * @extends Page
*/
class EventsPage extends page_1.default {
    constructor(params) {
        super(params);
        this.items = new Map();
        this.conversation = params.conversation;
        // Iterate and create the event objects
        params.items.forEach((event) => {
            switch (event.type) {
                // NXMEvent types with corresponding classes
                case 'text':
                    this.items.set(event.id, new text_event_1.default(this.conversation, event));
                    break;
                case 'image':
                    this.items.set(event.id, new image_event_1.default(this.conversation, event));
                    break;
                default:
                    this.items.set(event.id, new nxmEvent_1.default(this.conversation, event));
                    break;
            }
        });
        // update the events Map on the conversation
        this.conversation.events = new Map([...this.conversation.events, ...this.items]);
    }
    /**
      * Fetch the previous page if exists
      * @returns {Promise<Page>}
    */
    getPrev() {
        if (!this.hasPrev())
            return this._getError();
        return this.conversation.getEvents(this._getConfig(this.cursor.prev));
    }
    /**
      * Fetch the next page if exists
      * @returns {Promise<Page>}
    */
    getNext() {
        if (!this.hasNext())
            return this._getError();
        return this.conversation.getEvents(this._getConfig(this.cursor.next));
    }
}
exports.default = EventsPage;
module.exports = EventsPage;
