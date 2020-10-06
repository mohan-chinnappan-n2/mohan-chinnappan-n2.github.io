import { LightningElement, track } from 'lwc';
import unFrozenAsset from '@salesforce/contentAssetUrl/ceo';

export default class ContentAssetCmp extends LightningElement {
	@track image = unFrozenAsset;
}