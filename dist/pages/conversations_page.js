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
/**
 * A Conversations Page
 *
 * @class ConversationsPage
 * @param {Map} items map of conversations fetched in the paginated query
 * @extends Page
*/
class ConversationsPage extends page_1.default {
    constructor(params) {
        super(params);
        this.items = new Map();
        // Iterate and create the conversations if not existent
        params.items.forEach((c) => {
            const conversation = this.application.updateOrCreateConversation(c);
            this.items.set(conversation.id, conversation);
        });
    }
    /**
     * Fetch the previous page if exists
     * @returns {Promise<Page>}
    */
    getPrev() {
        if (!this.hasPrev())
            return this._getError();
        return this.application.getConversations(this._getConfig(this.cursor.prev));
    }
    /**
     * Fetch the next page if exists
     * @returns {Promise<Page>}
    */
    getNext() {
        if (!this.hasNext())
            return this._getError();
        return this.application.getConversations(this._getConfig(this.cursor.next));
    }
}
exports.default = ConversationsPage;
module.exports = ConversationsPage;
