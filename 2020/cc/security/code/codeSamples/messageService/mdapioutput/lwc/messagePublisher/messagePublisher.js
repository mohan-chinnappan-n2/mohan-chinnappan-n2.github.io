import { LightningElement } from 'lwc';
import { publish, createMessageContext, releaseMessageContext } from 'lightning/messageService';
import { MESSAGE_CHANNEL } from 'c/messageChannels';

export default class MessagePublisher extends LightningElement {
    context = createMessageContext();

    handleClick() {
        const text = this.template.querySelector('.messageInput').value;
        const message = { text }
        publish(this.context, MESSAGE_CHANNEL, message);
    }

    disconnectedCallback() {
        releaseMessageContext(this.context);
    }

}