    String msg = 'Lead Conversion complete';
	String userId = '0053h000000IJFeAAO';
    // feedType is UserProfile
    ConnectApi.FeedType feedType = ConnectApi.FeedType.UserProfile;        

    // prepare the message
    ConnectApi.MessageBodyInput mbi = new     ConnectApi.MessageBodyInput();
    mbi.messageSegments = new List<ConnectApi.MessageSegmentInput>();
    // add the text segments           
    ConnectApi.TextSegmentInput textSegment = new ConnectApi.TextSegmentInput();
    textSegment.text = msg;
    mbi.messageSegments.add(textSegment);            

    // assemble feed body
    ConnectApi.FeedItemInput feedItemInput = new ConnectApi.FeedItemInput();
    feedItemInput.body = mbi;    

    // post the msg 
    ConnectApi.ChatterFeeds.postFeedElement(null, userId , ConnectApi.FeedElementType.FeedItem, msg);

