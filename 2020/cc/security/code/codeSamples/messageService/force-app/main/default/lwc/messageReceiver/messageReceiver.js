import { LightningElement, track } from 'lwc';
import { createMessageContext, releaseMessageContext, subscribe, unsubscribe } from 'lightning/messageService';
import { MESSAGE_CHANNEL } from 'c/messageChannels';

export default class MessageReceiver extends LightningElement {

    @track buttonLabel;
    @track receivedMessage; 
    _isSubscribed;
    subscription;
    context = createMessageContext();
    
    constructor() {
        super();
        this.isSubscribed = true;
    }

    get isSubscribed() {
        return this._isSubscribed;
    }

    set isSubscribed(value) {
        this.buttonLabel = value ? 'unsubscribe' : 'subscribe';
        if (value) {
            this.subscription = subscribe(this.context, MESSAGE_CHANNEL, this.onMessageReceived.bind(this));
        } else {
            unsubscribe(this.subscription);
            this.subscription = null;
        }
        this._isSubscribed = value;
    }

    handleClick() {
        this.isSubscribed = !this.isSubscribed;
    }

    onMessageReceived(receivedMessage) {
        this.receivedMessage = receivedMessage.text; 
    }

    disconnectedCallback() {
        releaseMessageContext(this.context);
    }

}