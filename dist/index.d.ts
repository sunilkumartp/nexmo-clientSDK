
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
export  class Application {
    log: Logger;
    session: any;
    conversations: Map<string, Conversation>;
    synced_conversations_count: number;
    start_sync_time: number;
    stop_sync_time: number;
    calls: Map<string, NXMCall>;
    _call_draft_list: Map<string, NXMCall>;
    pageConfig: PageConfig;
    conversations_page_last: ConversationsPage | null;
    me: User;
    synced_conversations_percentage: number;
    sync_progress_buffer: number;
    activeStreams: MediaStream[];
    emit: any;
    constructor(session: any, params?: Object);
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
    updateOrCreateConversation(payload: any): Conversation;
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
    _handleEvent(event: CAPIResponse): Promise<void>;
    /**
     * update user's token
     * @param {string} token - the new token
     * @returns {Promise}
    */
    updateToken(token: string): Promise<void>;
    /**
     * Update the event to map local generated events
     * in case we need a more specific event to pass in the application listener
     * or f/w the event as it comes
     * @private
    */
    _handleApplicationEvent(event: CAPIResponse): void;
    /**
     * Creates a call to specified user/s.
     * @classdesc creates a call between the defined users
     * @param {string[]} usernames - the user names for those we want to call
     * @returns {Promise<NXMCall>} a NXMCall object with all the call properties
    */
    inAppCall(usernames: string[]): Promise<NXMCall>;
    /**
     * Creates a call to phone a number.
     * The call object is created under application.calls when the call has started.
     * listen for it with application.on("call:status:changed")
     *
     * You don't need to start the stream, the SDK will play the audio for you
     *
     * @classdesc creates a call to a phone number
   * @param {string} user the phone number or the username you want to call
   * @param {string} [type="phone"] the type of the call you want to have. possible values "phone" or "app" ( is "phone")
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
    callServer(user: string, type?: string): Promise<NXMCall>;
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
    newConversation(data?: Object): Promise<Conversation>;
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
    newConversationAndJoin(params?: Object): Promise<Conversation>;
    /**
     * Query the service to see if this conversation exists with the
     * logged in user as a member and retrieve the data object
     * Result added (or updated) in this.conversations
     *
     * @param {string} id - the id of the conversation to fetch
     * @returns {Promise<Conversation>} - the requested conversation
    */
    getConversation(id: string): Promise<Conversation>;
    /**
     * Query the service to obtain a complete list of conversations of which the
     * logged-in user is a member with a state of `JOINED` or `INVITED`.
   * @param {object} params configure s for paginated conversations query
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
    getConversations(params?: Object): Promise<ConversationsPage>;
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
    syncConversations(conversations: Conversation[]): void;
    /**
     * Get Details of a user
     * @param {string} [id] - the id of the user to fetch, if skipped, it returns your own user details
     * @returns {Promise<User>}
    */
    getUser(user_id?: string): Promise<User>;
}

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
export  class Conversation {
    log: Logger;
    application: Application;
    id: string;
    name: string;
    display_name: string;
    timestamp: string;
    members: Map<string, Member>;
    events: Map<string, NXMEvent>;
    sequence_number: number;
    pageConfig: PageConfig;
    events_page_last: EventsPage;
    conversationEventHandler: ConversationEventHandler;
    media: Media;
    me: Member;
    emit: any;
    on: any;
    off: any;
    once: any;
    releaseGroup: any;
    constructor(application: Application, params?: Object);
    /** Update Conversation object params
     * @property {object} params the params to update
     * @private
    */
    _updateObjectInstance(params: {
        id?: string;
        name?: string;
        display_name?: string;
        members?: Member[];
        timestamp?: string;
        sequence_number?: number;
        member_id?: string;
        state?: string;
    }): void;
    /**
     * Join the given user to this conversation, will typically use this to join
     * ourselves to a conversation we create.
     * Accept an invitation if our member has state INVITED and no user_id / user_name is given
     *
     * @param {object} [params = this.application.me.id] The user to join (s to this)
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
    join(params?: {
        user_name?: string;
        user_id?: string;
    }): Promise<Member>;
    /**
     * Delete a conversation
     * @returns {Promise}
     * @example <caption>delete the conversation</caption>
     *
     *  conversation.del().then(() => {
     *    console.log("conversation deleted");
     * 	})
    */
    del(): Promise<Object>;
    /**
     * Delete an NXMEvent (e.g. Text)
     * @param {NXMEvent} event
     * @returns {Promise}
     *
    */
    deleteEvent(event: NXMEvent): Promise<void>;
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
    invite(params?: InviteParams): Promise<Member>;
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
    inviteWithAudio(params?: InviteParams): Promise<Member>;
    /**
     * Leave from the conversation
   * @param {object} [reason] the reason for leaving the conversation
   * @param {string} [reason.reason_code] the code of the reason
   * @param {string} [reason.reason_text] the description of the reason
     * @returns {Promise}
    */
    leave(reason?: {
        reason_code?: string;
        reason_text?: string;
    }): Promise<Object>;
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
    sendText(text: string): Promise<TextEvent>;
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
    sendCustomEvent({ type, body }: {
        type: string;
        body: Object;
    }): Promise<NXMEvent>;
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
    sendImage(fileInput: File, params?: {
        quality_ratio: string;
        medium_size_ratio: string;
        thumbnail_size_ratio: string;
    }): Promise<XMLHttpRequest>;
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
    abortSendImage(imageRequest: XMLHttpRequest): void | NexmoClientError;
    _typing(state: string): Promise<string>;
    /**
     * Send start typing indication
     *
     * @returns {Promise} - resolves the promise on successful sent
    */
    startTyping(): Promise<string>;
    /**
     * Send stop typing indication
     *
     * @returns {Promise} - resolves the promise on successful sent
    */
    stopTyping(): Promise<string>;
    /**
      * Query the service to get a list of events in this conversation.
      *
      * @param {object} params configure s for paginated events query
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
    getEvents(params?: Object): Promise<EventsPage>;
    /**
     * Handle and event from the cloud.
     * using conversationEventHandler
     * @param {object} event
     * @private
    */
    _handleEvent(event: CAPIResponse): void;
}


/**
 * An image event
 *
 * @class ImageEvent
 * @extends NXMEvent
*/
export  class ImageEvent extends NXMEvent {
    log: Logger;
    constructor(conversation: Conversation, params?: {
        body?: {
            timestamp?: string;
            representations?: ImageRepresentations;
        };
    });
    /**
     * Set the message status to 'seen'
     */
    seen(): Promise<void>;
    /**
     * Set the message status to 'delivered'
     */
    delivered(): Promise<void>;
    /**
     * Delete the image event, all 3 representations of it
     * passing only the one of the three URLs
     * @returns {Promise}
     */
    del(): Promise<void>;
    /**
     * Download an Image from Media service //3 representations
     * @param {string} [type="thumbnail"] original, medium, thumbnail,
     * @param {string} [representations=this.body.representations]  the ImageEvent.body for the image to download
     * @returns {string} the dataUrl "data:image/jpeg;base64..."
     * @example <caption>Downloading an image from the imageEvent</caption>
     *  imageEvent.fetchImage().then((imagedata) => {
     *    var img = new Image();
     *    img.onload = () => {};
     *    img.src = imagedata;
     *
     *    // to cancel the request:
     *    // conversation.abortSendImage(imageRequest);
     *  });
    */
    fetchImage(type?: string, imageRepresentations?: ImageRepresentations): Promise<string>;
}

/**
 * Conversation NXMEvent Object.
 * The super class that holds the base events that apply to
 * common event objects.
 * @class NXMEvent
 */
export  class NXMEvent {
    conversation: Conversation;
    type: string;
    cid: string;
    from: string;
    timestamp: Object;
    id: string;
    state: {
        delivered_to?: {
            [key: string]: string;
        };
        seen_by?: {
            [key: string]: string;
        };
    };
    index: number;
    streamIndex: number;
    body?: {
        user?: {
            user_id?: string;
            id?: string;
            media?: {
                audio_settings?: {
                    enabled?: boolean;
                };
            };
        };
        digit?: number;
        digits?: number;
        representations?: any;
        timestamp?: Object;
        text?: string;
        channel?: Channel;
        invited_by?: string | null;
    };
    digit: number;
    constructor(conversation: Conversation, params?: {
        type?: string;
        cid?: string;
        from?: string;
        timestamp?: string;
        id?: string;
        state?: {
            delivered_to?: {
                [key: string]: string;
            };
            seen_by?: {
                [key: string]: string;
            };
        };
        index?: number;
        streamIndex?: number;
        body?: Object;
    });
    /**
     * Delete the event
     * @param {number} [event_id=this.event_id] if the event id param is not present, "this" event will be 
     * @returns {Promise}
     * @private
    */
    del(event_id?: string): Promise<void>;
    /**
     * Mark as Delivered the event
     * @param {number} [event_id=this.event_id] if the event id is not provided, the this event will be used
     * @returns {Promise}
     * @private
     */
    delivered(event_id?: string): Promise<void>;
    /**
     * Mark as Seen the event
     * @param {number} [event_id=this.event_id] if the event id is not provided, the this event will be used
     * @returns {Promise}
     * @private
    */
    seen(event_id?: string): Promise<void>;
}

/**
 * A text event
 *
 * @class TextEvent
 * @extends NXMEvent
*/
export  class TextEvent extends NXMEvent {
    constructor(conversation: Conversation, params?: {
        body?: {
            timestamp?: string;
        };
    });
    /**
     * Set the message status to 'seen'
     * @returns {Promise}
     */
    seen(): Promise<void>;
    /**
     * Set the message status to 'delivered'.
     * handled by the SDK
     * @returns {Promise}
     */
    delivered(): Promise<void>;
    /**
     * Delete the event
     * @returns {Promise}
     */
    del(): Promise<void>;
}


/**
 * Handle Application Events
 *
 * @class ApplicationEventsHandler
 * @param {Application} application
 * @param {Conversation} conversation
 * @private
*/
export  class ApplicationEventsHandler {
    log: Logger;
    application: Application;
    _handleApplicationEventMap: {
        [key: string]: Function;
    };
    constructor(application: Application);
    /**
      * Handle and event.
      *
      * Update the event to map local generated events
      * in case we need a more specific event to pass in the application listener
      * or f/w the event as it comes
      * @param {object} event
      * @private
    */
    handleEvent(event: CAPIResponse): any;
    /**
      * case: call to PSTN, after knocking event we receive joined
      * @private
    */
    private _processMemberJoined;
    private _processMemberInvited;
}

/**
 * Handle Conversation Events
 *
 * @class ConversationEventsHandler
 * @param {Application} application
 * @param {Conversation} conversation
 * @private
*/
export  class ConversationEventHandler {
    log: Logger;
    application: Application;
    conversation: Conversation;
    constructed_event: NXMEvent;
    _handleEventMap: {
        [key: string]: Function;
    };
    constructor(application: Application, conversation: Conversation);
    /**
      * Handle and event.
      *
      * Identify the type of the event,
      * create the corresponding Class instance
      * emit to the corresponding Objects
      * @param {object} event
      * @private
    */
    handleEvent(event: CAPIResponse): NXMEvent;
    /**
      * Mark the requested event as delivered
      * use that event as constructed to update the local events' map
        * @param {object} event
      * @returns the NXMEvent that is marked as delivered
      * @private
    */
    private _processDelivered;
    /**
      * Delete the requested event
      * empty the payload of the event (text or image)
      * use that event as constructed to update the local events' map
      * @param {object} event
      * @returns the deleted events
      * @private
    */
    private _processDelete;
    /**
      * Return an ImageEvent with the corresponding image data
      * @param {object} event
      * @returns {ImageEvent}
    */
    private _processImage;
    /**
      * Handle events for member state changes (joined, invited, left)
      * in conversation level.
      * Other members are going through here too.
      * For .me member initial event (join, invite) use the application listener
        * @param {object} event
      * @returns {NXMEvent}
      * @private
    */
    private _processMember;
    /**
     * Handle events for leg status updates in conversation level.
     * Other member's legs are going through here too.
     * @param {object} event
     * @returns {NXMEvent}
     * @private
    */
    private _processLegStatus;
    /**
      * Handle member:media events
      * use a call object if and the member object
        * @param {object} event
      * @private
    */
    private _processMedia;
    /**
      * Handle *:mute:* events
        * @param {object} event
      * @private
    */
    private _processMuteForMedia;
    /**
      * Mark the requested event as seen
      * use that event as constructed to update the local Events' map
        * @param {object} event
      * @private
    */
    private _processSeen;
    /**
      * Create the TextEvent object and trigger .delivered()
        * @param {object} event
      * @private
    */
    private _processText;
}

/**
 * Handle rtc Events
 *
 * @class RtcEventHandler
 * @private
 */
export  class RtcEventHandler {
    log: Logger;
    application: Application;
    _handleRtcEventMap: {
        [key: string]: Function;
    };
    constructor(application: Application);
    /**
     * Entry point for rtc events
     * @param {object} event
     * @private
     */
    _handleRtcEvent(event: CAPIResponse): void;
    /**
      * on transfer event
      * update the conversation object in the NXMCall,
      * update the media object in the new conversation
      * set `transferred_to` <Conversation> on the member that is transferred
      * @param {object} event
      * @private
    */
    private _processRtcTransfer;
    /**
     * Handle rtc:answer event
     *
     * @param {object} event
     * @private
     */
    private _processRtcAnswer;
    /**
     * Handle rtc:hangup event
     *
     * @param {object} event
     * @private
     */
    private _processRtcHangup;
}

/**
 * Handle sip Events
 *
 * @class SipEventHandler
 * @private
  */
export  class SipEventHandler {
    log: Logger;
    application: Application;
    _handleSipCallEventMap: {
        [key: string]: Function;
    };
    constructor(application: Application);
    /**
     * Entry point for sip events
     * The event belongs to a call Object
     * @private
    */
    _handleSipCallEvent(event: CAPIResponse): any;
    /**
     * Handle sip:hangup event
     *
     * @param {object} event_call
     * @private
     */
    private _processSipHangup;
    /**
     * Handle sip:ringing event
     *
     * @param {object} event_call
     * @private
     */
    private _processSipRinging;
}

/**
 * An individual user (i.e. conversation member).
 * @class Member
 * @param {Conversation} conversation
 * @param {object} params
*/
export  class Member {
    conversation: Conversation;
    callStatus: string | null;
    id: string;
    user?: any;
    channel: any;
    timestamp: {
        invited?: string;
        joined?: string;
        left?: string;
    };
    state: string;
    display_name: string;
    invited_by: string;
    user_id: string;
    name: string;
    media?: Media;
    stream?: MediaStream;
    pc?: RTCPeerConnection;
    emit: any;
    transferred_to?: Conversation;
    transferred_from?: Conversation;
    [key: string]: any;
    constructor(conversation: Conversation, params?: Object);
    /**
     * Update object instance and align attribute names
     *
     * Handle params input to keep consistent the member object
     * @param {object} params member attributes
     * @private
    */
    _normalise(params?: any): void;
    /**
     * Play the given stream only to this member within the conversation
     *
     * @param {string} [params]
     *
     * @returns {Promise<NXMEvent>}
     * @private
    */
    playStream(params: Object): Promise<NXMEvent>;
    /**
     * Speak the given text only to this member within the conversation
     *
     * @param {string} [params]
     *
     * @returns {Promise<NXMEvent>}
     * @private
    */
    sayText(params: {
        text: string;
        voice_name?: string;
        level?: number;
        queue?: boolean;
        loop?: number;
        ssml?: boolean;
    }): Promise<NXMEvent>;
    /**
     * Kick this member from the conversation
     *
   * @param {object} [reason] the reason for kicking out a member
   * @param {string} [reason.reason_code] the code of the reason
   * @param {string} [reason.reason_text] the description of the reason
     * @returns {Promise}
    */
    kick(reason?: {
        [key: string]: string;
    }): Promise<Object>;
    /**
     * Mute a stream
     *
     * @param {boolean} [mute] true for mute, false for unmute
     * @param {number} [streamIndex] stream index of the stream
     * @example <caption>Mute audio stream</caption>
     * media.mute(true)
     *
     * @returns {Promise}
    */
    mute(mute: boolean, streamIndex?: number): Promise<Object>;
    /**
     * Earmuff this member
     *
     * @param {boolean} earmuff true or false
     *
     * @returns {Promise}
     *
    */
    earmuff(earmuff: boolean): Promise<Object>;
    /**
     * Handle member object events
     *
     * Handle events that are modifying this member instance
     * @param {NXMEvent} event invited, joined, left, media events
     * @private
    */
    _handleEvent(event: CAPIResponse): void;
    /**
       * Set the member.callStatus and emit a member:call:status event
       *
       * @param {Member.callStatus} this.callStatus the call status to set
       * @private
      */
    private _setCallStatusAndEmit;
}


/**
 * Class that can emit errors via any emitter passed to it.
 * @class ErrorsEmitter
 * @param {Emitter} emitter - Any event emitter that implements "emit" and "releaseGroup". Basically object that is mixed with Wildemitter.
 * @property {string} LISTENER_GROUP='NXM-errors' - the group this emitter will register
 * @emits Emitter#NXM-errors
 * @private
*/
/**
 * Application listening for joins.
 *
 * @event Application#NXM-errors
 *
 * @property {NexmoClientError} error
 *
 * @example <caption>listen for errors</caption>
 * application.on('*', 'NXM-errors', (error) => {
 *    console.log('Error thrown with type ' + error.type);
 *  });
 * @example <caption>Update the token on expired-token error</caption>
 * application.on('system:error:expired-token', 'NXM-errors', (error) => {
 * 	console.log('token expired');
 * 	application.updateToken(<token>);
 * });
*/
export  class ErrorsEmitter {
    log: Logger;
    emitter: any;
    LISTENER_GROUP: string;
    constructor(emitter: any);
    /**
     * Detect if the param.type includes error and emit that payload in the LISTENER_GROUP
     * @param param - the payload to forward in the LISTENER_GROUP
     * @param param.type - the type of the event to check if it's an error
    */
    emitResponseIfError(param: {
        type: string;
    }): null;
    /**
     * Release Group on the registered emitter (using the namespace LISTENER_GROUP that is set)
    */
    cleanup(): any;
    /**
     * Returns true if the param includes 'error'
     * @param {string} type - the error type to check
    */
    _isTypeError(param: {
        indexOf: (arg0: string) => number;
    }): boolean;
}

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
export  class Media {
    log: Logger;
    rtcHelper: RtcHelper;
    application: Application;
    parentConversation: Conversation;
    rtcObjects: {
        [key: string]: {
            rtc_id: string;
            pc: RTCPeerConnection;
            stream: MediaStream;
            type: string;
            streamIndex: number;
        };
    };
    streamIndex: number;
    rtcstats_conf: any;
    rtcStats: any;
    rtcStats_wsConnection: any;
    pc: any;
    listeningToRtcEvent: boolean;
    me: Member;
    conversation: Conversation;
    constructor(conversation: Conversation);
    _attachEndingEventHandlers(): void;
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
    _enableCallStats(pc: RTCPeerConnection): void;
    /**
     * Switch on the rtcStat reporting to the websocket connection and events
     * @param ws_url
     * @private
    */
    _enableStatsReporting(ws_url: string): void;
    /**
     * Switch on the rtc stats emit events
     * @private
    */
    _enableStatsEvents(): void;
    _initStatsReporting(): void;
    _initStatsEvents(): void;
    /**
     * Switch off the rtcStat reporting
     * @private
    */
    _disableStatsReporting(): void;
    /**
     * Switch off the rtcStat events
     * @private
    */
    _disableStatsEvents(): void;
    /**
     * Handles the enabling of audio only stream with rtc:new
     * @private
    */
    private _handleAudio;
    private _findRtcObjectByType;
    private _closeStream;
    private _cleanConversationProperties;
    /**
     * Cleans up the user's media before leaving the conversation
    */
    private _cleanMediaProperties;
    private _disableLeg;
    _enableMediaTracks(tracks: MediaStreamTrack[], enabled: boolean): void;
    /**
     * Send a mute request with the rtc_id and enable/disable the tracks
     * If the mute request fails revert the changes in the tracks
     * @private
    */
    private _setMediaTracksAndMute;
    /**
     * Replaces the stream's audio tracks currently being used as the sender's sources with a new one
     * @param {object} constraints - audio constraints
     * @param {string} type - rtc object type
     * @param {object} [constraints.audio] - set audio constraints - { deviceId: { exact: microphoneId } }
     * @returns {Promise<MediaStream>} - Returns the new stream.
     * @example <caption>Update the stream currently being used with a new one</caption>
    */
    updateAudioConstraints(constraints?: Object): Promise<MediaStream | Object | NexmoApiError>;
    /**
     * Mute our member
     *
     * @param {boolean} [mute=false] true for mute, false for unmute
     * @param {number} [streamIndex] stream id to set - if it's not set all streams will be muted
     * @example <caption>Mute audio stream in conversation</caption>
     * media.mute(true)
    */
    mute(mute?: boolean, streamIndex?: number): Promise<Object>;
    /**
     * Earmuff our member
     *
     * @param {boolean} [params]
     *
     * @returns {Promise}
     * @private
    */
    earmuff(earmuff: boolean): Promise<Object>;
    /**
      * Enable media participation in the conversation for this application (requires WebRTC)
      * @param {object} params - rtc params
      * @param {string} params.label - Label is an application defined tag, eg. ‘fullscreen’
      * @param {object} [params.audio=true] - audio enablement mode. possible values "both", "send_only", "receive_only", "none", true or false
      * @param {object} [params.autoPlayAudio=false] - attach the audio stream automatically to start playing after enable media ( false)
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
    enable(params?: {
        label?: string;
        audio?: {
            muted?: boolean;
            earmuffed?: boolean;
            enabled?: boolean;
        };
        autoPlayAudio?: boolean;
    }): Promise<MediaStream>;
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
    disable(): Promise<(string | void)[]>;
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
    sayText(params: {
        text: string;
        voice_name?: string;
        level?: number;
        queue?: boolean;
        loop?: number;
        ssml?: boolean;
    }): Promise<NXMEvent>;
    /**
      * Send DTMF in a conversation
      * @param {string} digit - the DTMF digit(s) to send
      *
      * @returns {Promise<NXMEvent>}
      * @example
      * conversation.media.sendDTMF('digit');
    **/
    sendDTMF(digit: string): Promise<NXMEvent>;
    /**
     * Play an audio stream in a conversation
     * @returns {Promise<NXMEvent>}
    */
    playStream(params: Object): Promise<NXMEvent>;
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
    startRinging(): Promise<NXMEvent>;
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
    stopRinging(): Promise<NXMEvent>;
}

/**
 * Conversation NXMCall Object.
 * @class NXMCall
 * @param {Application} application - The Application object.
 * @param {Conversation} conversation - The Conversation object that belongs to this nxmCall.
 * @param {Member} from - The member that initiated the nxmCall.
 * @property {Application} application -  The Application object that the nxmCall belongs to.
 * @property {Conversation} conversation -  The Conversation object that belongs to this nxmCall.
 * @property {Member} from - The caller. The member object of the caller (not a reference to the one in conversation.members)
 * @property {Map<string, Member>} to - The callees keyed by a member's id. The members that receive the nxmCall (not a reference to conversation.members)
 * @property {String} id - The nxmCall id (our member's leg_id, comes from rtc:answer event, or member:media)
 * @property {NXMCall.CALL_STATUS} CALL_STATUS="started" - the available nxmCall statuses
 * @property {NXMCall.CALL_DIRECTION} direction - the Direction of the nxmCall, Outbound, Inbound
 * @property {NXMCall.STATUS_PERMITTED_FLOW} STATUS_PERMITTED_FLOW - the permitted nxmCall status transition map, describes the "from" and allowed "to" transitions
 * @emits Application#member:call
 * @emits Application#call:status:changed
*/
/**
 * Application listening for calls.
 *
 * @event Application#member:call
 *
 * @property {Member} member - the member that initiated the nxmCall
 * @property {NXMCall} nxmCall -  resolves the nxmCall object
 *
 * @example <caption>listen for calls in Application level</caption>
 *  application.on("member:call", (member, nxmCall) => {
 *    console.log("NXMCall ", nxmCall);
 *  });
*/
/**
 * NXMCall listening for nxmCall status changed events.
 *
 * @event Application#call:status:changed
 * @property {NXMCall} nxmCall -  the actual event
 * @example <caption>listen for nxmCall status events</caption>
 *  application.on("call:status:changed",(nxmCall) => {
 *    console.log("call: " + nxmCall.status);
 *  });
*/
export  class NXMCall {
    application: Application;
    log: Logger;
    from: Member | any;
    conversation: Conversation;
    status: string;
    direction: string;
    to: Map<string, Member>;
    id: string;
    successful_invited_members: Map<string, Member>;
    client_ref: string;
    knocking_id: string;
    CALL_STATUS: {
        [key: string]: string;
    };
    CALL_DIRECTION: {
        [key: string]: string;
    };
    STATUS_PERMITTED_FLOW: Map<string, Set<string>>;
    _handleStatusChangeMap: Map<string, Function>;
    transferred?: boolean;
    constructor(application: Application, conversation?: Conversation, from?: string | Member);
    /**
     * Enable NXMCall stats to be emitted in application.inAppCall.on('call:stats:report');
     * @private
    */
    _enableStatsEvents(): void;
    /**
     * Attach member event listeners from the conversation
     * @private
    */
    private _attachCallListeners;
    /**
     * Validate the current nxmCall status transition
     * If a transition is not defined, return false
     * @param {string} status the status to validate
     * @returns {boolean} false if the transition is not permitted
     * @private
    */
    private _isValidStatusTransition;
    /**
     * Go through the members of the conversation and if .me is the only one (JOINED or INVITED)
     * nxmCall nxmCall.hangUp().
     * @returns {Promise} - empty promise or the nxmCall.hangUp promise chain
    */
    hangUpIfAllLeft(): Promise<Object | void>;
    /**
     * Set the conversation object of the NXMCall
     * update nxmCall.from, and nxmCall.to attributes based on the conversation members
     * @private
    */
    _setupConversationObject(conversation: Conversation): void;
    /**
     * Set the from object of the NXMCall
     * @private
    */
    _setFrom(from: Member): void;
    /**
     * Process raw events to figure out the nxmCall status
     * @private
    */
    _handleStatusChange(event: NXMEvent | CAPIResponse): any;
    /**
     * Set the nxmCall.status and emit a call:status:changed event
     *
     * @param {NXMCall.CALL_STATUS} this.CALL_STATUS the canxmCallll status to set
     * @emits Application#call:status:changed
     * @private
    */
    private _setStatusAndEmit;
    /**
     * Answers an incoming nxmCall
     * Join the conversation that you are invited
     * Create autoplay Audio object
     *
   * @param {boolean} [autoPlayAudio=true] attach the audio stream automatically to start playing ( true)
     * @returns {Promise<Audio>}
    */
    answer(autoPlayAudio?: boolean): Promise<MediaStream>;
    /**
     * Trigger the nxmCall flow for the input users.
     * Create a conversation with prefix name "CALL_"
     * and invite all the users.
     * If at least one user is successfully invited, enable the audio.
     *
     * @param {string[]} usernames the usernames of the users to call
   * @param {boolean} [autoPlayAudio=true] attach the audio stream automatically to start playing ( true)
     * @returns {Promise[]} an array of the invite promises for the provided usernames
     * @private
    */
    createCall(usernames: string[], autoPlayAudio?: boolean): Promise<Promise<Member>[]>;
    /**
     * Trigger the nxmCall flow for the phone call.
     * Create a knocking event
     *
     * @param {string} user the phone number or the username to call
   * @param {string} type the type of the call you want to have. possible values "phone" or "app" ( is "phone")
     * @returns {Promise}
     * @private
    */
    createServerCall(user: string, type?: string): Promise<Object>;
    /**
     * Hangs up the nxmCall
     *
     * If there is a knocking active, do a knocking:delete
     * otherwise
     * Leave from the conversation
     * Disable the audio
     *
   * @param {object} [reason] the reason for hanging up the nxmCall
   * @param {string} [reason.reason_code] the code of the reason
   * @param {string} [reason.reason_text] the description of the reason
     * @returns {Promise}
    */
    hangUp(reason?: {
        [key: string]: string;
    }): Promise<Object>;
    /**
     * Rejects an incoming nxmCall
     * Leave from the conversation that you are invited
     *
   * @param {object} [reason] the reason for rejecting the nxmCall
   * @param {string} [reason.reason_code] the code of the reason
   * @param {string} [reason.reason_text] the description of the reason
     * @returns {Promise}
    */
    reject(reason?: {
        [key: string]: string;
    }): Promise<Object>;
}

/**
 * RTC helper object for accessing webRTC API.
 * @class RtcHelper
 * @private
*/
export  class RtcHelper {
    log: Logger;
    constructor();
    getUserAudio(audioConstraints?: Object | boolean): Promise<MediaStream>;
    createRTCPeerConnection(config: Object): RTCPeerConnection;
    _playAudioStream(stream: MediaStream): HTMLAudioElement;
    _getWindowLocationProtocol(): string;
    _getBrowserName(): string;
    isNode(): boolean;
    /**
      * Check if the keys in an object are found in another object
    */
    checkValidKeys(object: Object, Object: Object): boolean;
}



declare const rtcStatsReporter: any;
/**
 * Collect WebRTC Report data
 * Removes credential information from the STUN.TURN server configuration.
 * performs Delta compression
 *
 * if isCallback is true the report includes a MOS score : trace('mos', mos, report);
 *
 * @param {object} trace the function will be attached to the RTCPeerConnection object and will be used as a callback
 * @param {boolean} isCallback this set to true the reports will be passed uncompressed to the trace function: trace('mos', mos, res);
 * @param {number} getStatsInterval
 * @property {number} mos_report the final mos report to be sent when the stream is closed
 * @property {number} _reportsCount the number of reports taken for mos average
 * @property {number} _mosSum the summary of mos scores
 * @private
 */
declare class RTCStats {
    mos_report: {
        min: any;
        max: any;
        last?: any;
        average?: any;
    };
    _reportsCount: number;
    _mosSum: number;
    stats_interval: any;
    constructor(trace: any, isCallback: any, getStatsInterval: any, prefixesToWrap: any);
    disable(): void;
    getMos(report: any): any;
    /**
     * Update the mos_report object
     * @param {number} mos the MOS score
     * @returns {object} the report object
     */
    updateMOSReport(mos: number): Object;
    /**
     * Update the MOS report object
     * mos_report.min - the minimum MOS value during the stream
     * mos_report.max - the maximum MOS value during the stream
     * mos_report.last - the last MOS value during the stream
     * mos_report.average - the average MOS value during the stream
     * @returns {Object} mos_report - a report for the MOS values
     *
     */
    getMOSReport(): Object;
    static normaliseFloat(value: any): any;
}

declare const PROTOCOL_VERSION: string;

/**
 * Error constructor of an NexmoClient-error
 * @param {string} errorInput String client error
*/
export declare class NexmoClientError {
    message: string;
    stack: any;
    name: string;
    constructor(errorInput: any);
}
/**
 * Error constructor of an API-error
 * @param {object} error API error, always containing {type: <string>}
*/
export declare class NexmoApiError {
    name: string;
    constructor(error: any);
}



/**
 * A Conversations Page
 *
 * @class ConversationsPage
 * @param {Map} items map of conversations fetched in the paginated query
 * @extends Page
*/
export  class ConversationsPage extends Page {
    items: Map<string, Conversation>;
    constructor(params: {
        items: Object[];
    });
    /**
     * Fetch the previous page if exists
     * @returns {Promise<Page>}
    */
    getPrev(): Promise<Page> | Promise<NexmoClientError>;
    /**
     * Fetch the next page if exists
     * @returns {Promise<Page>}
    */
    getNext(): Promise<Page> | Promise<NexmoClientError>;
}

/**
 * A Events Page
 *
 * @class EventsPage
 * @param {Map} items map of events fetched in the paginated query
 * @extends Page
*/
export  class EventsPage extends Page {
    items: Map<string, NXMEvent | TextEvent | ImageEvent>;
    conversation: Conversation;
    constructor(params: {
        items: Object[];
        conversation: Conversation;
    });
    /**
      * Fetch the previous page if exists
      * @returns {Promise<Page>}
    */
    getPrev(): Promise<Page> | Promise<NexmoClientError>;
    /**
      * Fetch the next page if exists
      * @returns {Promise<Page>}
    */
    getNext(): Promise<Page> | Promise<NexmoClientError>;
}

/** Config Class for Paginated Requests
 *
 * @class PageConfig
 * @param {number} page_size=10 the number of resources returned in a single request list
 * @param {string} order=asc the asc' or 'desc' ordering of resources (usually based on creation time)
 * @param {string} cursor='' cursor parameter to access the next or previous page of a data set
 * @param {string} [event_type] the type of event used to filter event requests
 * @private
*/
export  class PageConfig {
    page_size: number;
    order: string;
    cursor: Object;
    event_type: string;
    constructor(params?: {
        page_size?: number;
        order?: 'string';
        cursor?: Object;
        event_type?: string;
    });
}

/** Page Class for Paginated Results
 *
 * @class Page
 * @param {number} page_size the number of resources returned in a single request list
 * @param {string} order 'asc' or 'desc' ordering of resources (usually based on creation time)
 * @param {string} cursor cursor parameter to access the next or previous page of a data set
 * @param {Application} application - the parent Application
 * @param {string} [event_type] the type of event used to filter event requests
 *
 * @private
*/
export  class Page {
    page_size: number;
    order: string;
    cursor: {
        prev: string;
        next: string;
    };
    application: Application;
    event_type: string;
    constructor(params?: {
        page_size?: number;
        order?: string;
        cursor?: {
            prev: string;
            next: string;
        };
        event_type?: string;
        application?: Application;
        conversation?: Conversation;
        items?: Object[];
    });
    /**
      * Check if previous page exists
      * @returns {Boolean}
    */
    hasPrev(): boolean;
    /**
      * Check if next page exists
      * @returns {Boolean}
    */
    hasNext(): boolean;
    /**
      * Create config params for paginationRequest
      * @param {string} cursor cursor parameter to access the next or previous page of a data set
      * @returns {Object}
    */
    _getConfig(cursor: string): Object;
    /**
      * Create a nexmoClientError when page does not exist
    */
    _getError(): Promise<NexmoClientError>;
}

/// <reference types="socket.io-client" />
/**
 * The parent NexmoClient class.
 *
 * @class NexmoClient
 *
 * @param {object} params the settings to initialise the SDK
 * @param {Boolean} params.debug='silent' set mode to 'debug', 'info', 'warn', or 'error' for customized logging levels in the console
 * @param {string} params.url='nexmo_ws_url' Nexmo Conversation Websocket url, default is wss://ws.nexmo.com (wss://ws-us-1.nexmo.com for WDC, wss://ws-us-2.nexmo.com for DAL, wss://ws-eu-1.nexmo.com for LON, wss://ws-sg-1.nexmo.com for SNG)
 * @param {string} params.nexmo_api_url=Nexmo Conversation Api url, default is https://api.nexmo.com (https://api-us-1.nexmo.com for WDC, https://api-us-2.nexmo.com for DAL, https://api-eu-1.nexmo.com for LON, https://api-sg-1.nexmo.com for SNG)
 * @param {string} params.ips_url='ips_url' Nexmo IPS url for image upload, default is https://api.nexmo.com/v1/image (https://api-us-1.nexmo.com/v1/image for WDC, https://api-us-2.nexmo.com/v1/image for DAL, https://api-eu-1.nexmo.com/v1/image for LON, https://api-sg-1.nexmo.com/v1/image for SNG)
 * @param {string} params.path='/rtc' Nexmo Conversation Websocket url path suffix
 * @param {object} params.rtcstats set reporting for stream statistics (Websocket or internal event emit)
 * @param {string} params.rtcstats.ws_url endpoint (websocket) to send rtc stats.
 * @param {Boolean} params.rtcstats.emit_events=false receive rtcstats:report event
 * @param {object} params.socket_io configure socket.io
 * @param {Boolean} params.socket_io.forceNew=true configure socket.io forceNew attribute
 * @param {Boolean} params.socket_io.autoConnect=true socket.io autoConnect attribute
 * @param {Boolean} params.socket_io.reconnection=true socket.io reconnection attribute
 * @param {number} params.socket_io.reconnectionAttempts=5 socket.io reconnectionAttempts attribute
 * @param {string[]} params.socket_io.transports='websocket' socket.io transports protocols
 * @param {string[]} params.sync='lite' {'lite' || 'full' || 'none'} after a successful login, synchronise conversations, include events or nothing
 * @param {string} params.environment='production' development / production environment
 * @param {object} params.iceServers=[{'stun:stun.l.google.com:19302'}] iceServers for RTCPeerConnection
 * @param {object} params.callstats configure callstats.io integration
 * @param {Boolean} params.callstats.enabled=false
 * @param {string} params.callstats.AppID your callstats AppID
 * @param {string} params.callstats.AppSecret your callstats AppSecret
 * @param {object} params.log_reporter configure log reports for bugsnag tool
 * @param {Boolean} params.log_reporter.enabled=true
 * @param {string} params.log_reporter.bugsnag_key your bugsnag api key / defaults to Nexmo api key
 * @param {object} params.conversations_page_config configure paginated requests for conversations
 * @param {number} params.conversations_page_config.page_size=10 the number of resources returned in a single request list
 * @param {string} params.conversations_page_config.order=asc 'asc' or 'desc' ordering of resources (usually based on creation time)
 * @param {string} params.conversations_page_config.cursor cursor parameter to access the next or previous page of a data set
 * @param {object} params.events_page_config configure paginated requests for events
 * @param {number} params.events_page_config.page_size=10 the number of resources returned in a single request list
 * @param {string} params.events_page_config.order=asc 'asc' or 'desc' ordering of resources (usually based on creation time)
 * @param {string} params.events_page_config.event_type the type of event used to filter event requests. Supports wildcard options with :* eg. 'members:*'
 * @param {string} params.token the jwt token for network requests
 *
 * @emits NexmoClient#connecting
 * @emits NexmoClient#disconnect
 * @emits NexmoClient#error
 * @emits NexmoClient#ready
 * @emits NexmoClient#reconnect
 * @emits NexmoClient#reconnecting
*/
export default class NexmoClient {
    sessionReady: boolean;
    session_id: string | null;
    requests: {
        [key: string]: {
            type: string;
            request: CAPIRequest;
            callback: Function;
        };
    };
    application: Application;
    log: Logger;
    config: Configuration;
    callstats: any;
    connection: SocketIOClient.Socket;
    errorsEmitter: ErrorsEmitter;
    emit: any;
    /**
     * Enum for NexmoClient disconnection reason.
     * @readonly
     * @enum {string}
     * @alias NexmoClient.DISCONNECT_REASON
    */
    static DISCONNECT_REASON: {
        TokenExpired: string;
        ConnectionError: string;
    };
    constructor(params?: Configuration);
    /**
     * Creates and sets the socket_io connection
     *
     * @private
    */
    _createAndSetConnection(): SocketIOClient.Socket;
    /**
     * Revert any invalid params to our default
     *
     * @param {object} config the object to sanitize
     * @private
    */
    _sanitizeConfig(incomingConfig: Configuration): Configuration;
    /**
     * Conversation listening for text events.
     *
     * @event Conversation#text
     *
     * @property {Member} sender - The sender of the text
     * @property {TextEvent} text - The text message received
     * @example <caption>listen for text events</caption>
     *  conversation.on("text",(sender, message) => {
     *    console.log(sender,message);
     *    // Identify your own message.
     *    if (message.from !== conversation.me.id)
     *    // Identify if the event corresponds to the currently open conversation.
     *    if (message.cid === conversation.id)
     *  });
     */
    /**
     *
     * Conversation listening for image events.
     *
     * @event Conversation#image
     *
     * @property {Member} sender - The sender of the image
     * @property {ImageEvent} image - The image message received
     * @example <caption>listen for image events</caption>
     *  conversation.on("image", (sender, image) => {
     *    console.log(sender,image);
     *    // Identify your own imageEvent.
     *    if (image.from !== conversation.me.id)
     *    // Identify if the event corresponds to the currently open conversation.
     *    if (image.cid === conversation.id)
     *  });
     */
    /**
     * Conversation listening for deleted events.
     *
     * @event Conversation#event:delete
     *
     * @property {Member} member - the member who deleted an event
     * @property {NXMEvent} event - deleted event: event.id
     * @example <caption>get details about the deleted event</caption>
     * conversation.on("event:delete", (member, event) => {
     *  console.log(event.id);
     *  console.log(event.body.timestamp.deleted);
     * });
     */
    /**
     * Conversation listening for new members.
     *
     * @event Conversation#member:joined
     *
     * @property {Member} member - the member that joined
     * @property {NXMEvent} event - the join event
     * @example <caption>get the name of the new member</caption>
     * conversation.on("member:joined", (member, event) => {
     *  console.log(event.id)
     *  console.log(member.user.name+ " joined the conversation");
     * });
     */
    /**
     * Conversation listening for members being invited.
     *
     * @event Conversation#member:invited
     *
     * @property {Member} member - the member that is invited
     * @property {NXMEvent} event - data regarding the receiver of the invitation
     * @example <caption>get the name of the invited member</caption>
     * conversation.on("member:invited", (member, event) => {
     *  console.log(member.user.name + " invited to the conversation");
     * });
     */
    /**
     * Conversation listening for members callStatus changes.
     *
     * @event Conversation#member:call:status
     *
     * @property {Member} member - the member that has left
     * @example <caption>get the callStatus of the member that changed call status</caption>
     * conversation.on("member:call:status", (member) => {
   *  console.log(member.callStatus);
     * });
     */
    /**
     * Conversation listening for members leaving (kicked or left).
     *
     * @event Conversation#member:left
     *
     * @property {Member} member - the member that has left
     * @property {NXMEvent} event - data regarding the receiver of the invitation
     * @example <caption>get the username of the member that left</caption>
     * conversation.on("member:left", (member , event) => {
     *  console.log(member.user.name + " left");
     *  console.log(event.body.reason);
     * });
     */
    /**
     * Conversation listening for members typing.
     *
     * @event Conversation#text:typing:on
     *
     * @property {Member} member - the member that started typing
     * @property {NXMEvent} event - the start typing event
     * @example <caption>get the username of the member that is typing</caption>
     * conversation.on("text:typing:on", (data) => {
     *  console.log(data.name + " is typing...");
     * });
     */
    /**
     * Conversation listening for members stopped typing.
     *
     * @event Conversation#text:typing:off
     *
     * @property {Member} member - the member that stopped typing
     * @property {NXMEvent} event - the stop typing event
     * @example <caption>get the username of the member that stopped typing</caption>
     * conversation.on("text:typing:off", (data) => {
     *  console.log(data.name + " stopped typing...");
     * });
     */
    /**
     * Conversation listening for members' seen texts.
     *
     * @event Conversation#text:seen
     *
     * @property {Member} member - the member that saw the text
     * @property {TextEvent} text - the text that was seen
     * @example <caption>listen for seen text events</caption>
     * conversation.on("text:seen", (data, text) => {
     *  console.log(text);
     *  // Check if the event belongs to this conversation
     *  if (text.cid === conversation.id)
     *  // Get the list of members that have seen this event
     *  for (let member_id in text.state.seen_by) {
     *    if (conversation.me.id !== member_id) {
     *      console.log(conversation.members.get(member_id).name);
     *    }
     *  }
     * });
     */
    /**
     * Conversation listening for members' seen images.
     * @event Conversation#image:seen
     *
     * @property {Member} member - the member that saw the image
     * @property {ImageEvent} image - the image that was seen
     * @example <caption>listen for seen image events</caption>
     * conversation.on("image:seen", (data, image) => {
     *  console.log(image);
     *  // Check if the event belongs to this conversation
     *  if (image.cid === conversation.id)
     *  // Get the list of members that have seen this event
     *  for (let member_id in image.state.seen_by) {
     *    if (conversation.me.id !== member_id) {
     *      console.log(conversation.members.get(member_id).name);
     *    }
     *  }
     * });
     */
    /**
     * Conversation listening for members media changes (audio,text)
     *
     * Change in media presence state. They are in the conversation with text or audio.
     *
     * @event Conversation#member:media
     *
     * @property {Member} member - the member object linked to this event
     * @property {NXMEvent} event - information about media presence state
     * @property {boolean} event.body.audio  - is audio enabled
     * @example <caption>get every member's media change events </caption>
     * conversation.on("member:media", (from, event) => {
     *  console.log(from.media.audio_settings.enabled); //true
     * 	console.log(event.body.media); //{"audio_settings": {"enabled": true, "muted": false, "earmuffed": false}}
     * });
     */
    /**
     * Conversation listening for mute on events
     * A member has muted their audio
     *
     * @event Conversation#audio:mute:on
     *
     * @property {Member} member - the member object linked to this event
     * @property {NXMEvent} event - information about the mute event
     */
    /**
     * Conversation listening for mute off events
     * A member has unmuted their audio
     *
     * @event Conversation#audio:mute:off
     *
     * @property {Member} member - the member object linked to this event
     * @property {NXMEvent} event - information about the mute event
     */
    sendRequest(request: CAPIRequest, callback: Function): void;
    sendNetworkRequest(params: NetworkRequestParams): Promise<Object>;
    /**
     * Login to the cloud.
     * @param {string} token - the login token
     * @returns  {Promise<Application>} - the application we logged in
    */
    login(token: string): Promise<Application>;
    /**
     * logout from the cloud.
    */
    logout(): Promise<CAPIResponse>;
    /**
     * Disconnect from the cloud.
     *
    */
    disconnect(): SocketIOClient.Socket;
    /**
     * Connect from the cloud.
     *
    */
    connect(): SocketIOClient.Socket;
}

export  class User {
    application: Application;
    id: string;
    name: string;
    constructor(application: Application, params?: Object);
}

/**
 * Utilities class for the SDK.
 *
 * @class Utils
 * @private
 */
export  class Utils {
    /**
     * Get the Member from the username of a conversation
     *
     * @param {string} username the username of the member to get
     * @param {Conversation} conversation the Conversation to search in
     * @returns {Member} the requested Member
     * @static
     */
    static getMemberFromNameOrNull(conversation: Conversation, username: string): Member | null;
    /**
     * Get the Member's number or uri from the event's channel field
     *
     * @param {object} channel the event's channel field
     * @returns {string} the requested Member number or uri
     * @static
     */
    static getMemberNumberFromEventOrNull(channel: Channel): string | null;
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
    static networkRequest(reqObject: ReqObject): Promise<XMLHttpRequest>;
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
    static paginationRequest(url: string, params: any, token: string): Promise<Object>;
    /**
     * Update the Search Params of a url
     * @returns {string} the appended url
     * @static
     */
    static addUrlSearchParams(url: string, params?: {
        [key: string]: string;
    }): string;
    /**
     * Deep merges two objects
     * @returns {Object} the new merged object
     * @static
     */
    static deepMergeObj(obj1: Configuration, obj2: Configuration): Configuration;
    /**
     * Inject a script into the document
     *
     * @param {string} s script being executed
     * @param {requestCallback} c the callback fired after script executed
     * @static
     */
    static injectScript(u: any, c: any): void;
    static allocateUUID(): string;
    /**
     * Validate dtmf digit
     * @static
     */
    static validateDTMF(digit: string): boolean;
    /**
     * Get the nexmo bugsnag api key
     * @private
     */
    static _getBugsnagKey(): string;
    /**
     * Update the member legs array with the new one received in the event
     *
     * @param {Array} legs the member legs array
     * @param {NXMEvent} event the member event holding the new legs array
     * @static
     */
    static updateMemberLegs(legs: Leg[], event: CAPIResponse): Leg[];
}


export interface CAPIRequest {
    type: string;
    body: any;
    tid?: string
}

export interface CAPIResponse {
    type: string;
    body: any;
    rid: string;
    delay?: string;
    from?: string;
    cid?: string;
    client_ref?: string;
    timestamp?: string;
    streamIndex?: number;
    id?: string;
    conversation? : any;
}

export interface NetworkRequestParams {
    version?: string;
    type: string;
    path: string;
    data?: any
}

export interface User {
    name: string;
    display_name: string;
}

export interface From {
    type: string;
    user: string;
    uri: string;
    number: string;
}

export interface To {
    number: string;
    type: string;
}

export interface Channel {
    type: string;
    leg_ids: Array<string>;
    leg_settings: Array<string>;
    legs: Array<string>;
    from: From;
    to: To;
}

export interface ReqObject {
    url: string;
    type: string;
    data?: any;
    responseType?: '' | 'json' | 'arraybuffer' | 'blob' | 'document' | 'text';
    token: string;
}

export interface Response {
    event_type?: string;
    page_size: number;
    _embedded: any;
    _links: any;
}

export interface Leg {
    leg_id: string;
    status: string;
}

export interface ImageRepresentations {
  id: string;
  medium: {
    id: string;
    size: number;
    type: string;
    url: string;
  };
  original: {
    id: string;
    size: number;
    type: string;
    url: string;
  };
  thumbnail: {
    id: string;
    size: number;
    type: string;
    url: string;
  };
  [key: string]: any;
}

export interface Configuration {
  debug?: any;
  callstats?: {
    enabled?: boolean;
    AppID?: string;
    AppSecret?: string;
  };
  log_reporter?: {
    enabled?: boolean;
    bugsnag_key?: string | null;
  };
  environment?: string;
  ips_url?: string;
  nexmo_api_url?: string;
  path?: string;
  repository?: string;
  socket_io?: {
    reconnection?: boolean;
    reconnectionAttempts?: number;
    forceNew?: boolean;
    autoConnect?: boolean;
    transports?: string[];
  };
  SDK_version?: string;
  sync?: string;
  url?: string;
  iceServers?: [{
    urls?: string;
  }];
  rtcstats?: {
    ws_url?: string;
    emit_events?: boolean;
  };
  conversations_page_config?: {
    page_size: number;
    order: string;
    cursor: string;
  };
  events_page_config?: {
    page_size: number;
    order: string;
    event_type: string;
  };
  token?: string | null;
  [key: string]: any;
}

export interface InviteParams {
  id?: string;
  user_name?: string;
  media?: {
    audio_settings: {
      enabled?: boolean;
      earmuffed?: boolean;
      muted?: boolean;
    };
  };
}
