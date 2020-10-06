import { LightningElement, track } from 'lwc';
import ceoContentAsset from '@salesforce/contentAssetUrl/ceo';

export default class ContentAssetCmp extends LightningElement {
	@track image = ceoContentAsset;
}