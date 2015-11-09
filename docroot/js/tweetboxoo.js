$(document).ready(function(){

    var TweetBox = {};

    //TODO:
    //1. make rt urls work
    //2. update how many times we can search for images (make sure id is updated to last id from search)
    //3. make @user work when multiples
    //4. make all hashtags work even russian (for ex)

    //user varables (follow option needs twttr script from https://platform.twitter.com/widgets.js)
    //twitterUser or hastagParam. Not both. Mobilewidth controls some css and load more button
    //lastId is used to fetch new content.
    //multiple hashtag is supported (needs some work though)
    TweetBox.twitterUser         = '',
    TweetBox.hashtagParam        = 'nature',
    TweetBox.lastId              = '',
    TweetBox.numOfTweetsPerCall  = 20,
    TweetBox.mobileWidth         = '767',
    TweetBox.widthForMediumImage = '480',
    TweetBox.widthForLargeImage  = '600',
    TweetBox.imagesOnly          = true,
    TweetBox.textOnly            = false,
    TweetBox.noRetweets          = false,
    TweetBox.followOption        = false,
    TweetBox.followButton        = false,
    TweetBox.hashtagHeadline     = '',
    TweetBox.hashtagHeadlineLink = '';

    //js variables. Don't change these
    TweetBox.firstLoad           = true,
    TweetBox.now                 = new Date().getTime(),
    TweetBox.tweets              = '',
    TweetBox.numOfTweets         = 0;
    TweetBox.storedTweets        = [];

    if (TweetBox.hashtagParam !== '') {

        TweetBox.hashtagArray = TweetBox.hashtagParam.split(',');
        TweetBox.hashtagParam = '';

        for (var i = 0; i < TweetBox.hashtagArray.length; i++) {
            if (TweetBox.hashtagArray[i].trim().length > 0) {
                TweetBox.hashtagParam        += '%23' + TweetBox.hashtagArray[i].trim() + '%20';
                TweetBox.hashtagHeadline     += '#' + TweetBox.hashtagArray[i].trim() + ' ';
                TweetBox.hashtagHeadlineLink += '%23' + TweetBox.hashtagArray[i].trim() + '%2B'
            }
        };

        //remove final space form hashtag param
        TweetBox.hashtagParam = TweetBox.hashtagParam.substring(TweetBox.hashtagParam.length - 3, 0);
        //search does not need the first hashtag and the last plus
        TweetBox.hashtagHeadlineLink = TweetBox.hashtagHeadlineLink.substring(0,TweetBox.hashtagHeadlineLink.length - 3);
        TweetBox.hashtagHeadlineLink = TweetBox.hashtagHeadlineLink.substring(TweetBox.hashtagHeadlineLink.length,3);
    }

    TweetBox.getTweets = function(lastTweetId) {
        var firstKey, firstValue;
        if (TweetBox.twitterUser !== '') {
            firstKey   = 'twitterUser';
            firstValue = TweetBox.twitterUser;
        } else if (TweetBox.hashtagParam !== '') {
            firstKey   = 'hashtag';
            firstValue = TweetBox.hashtagParam;
            TweetBox.followButton = true;
        } else {
            alert('Please enter a hashtag you want to search for or a Twitter username.');
        }

        var request = $.ajax({
            type: "GET",
            dataType: 'json',
            url: "../TwitterAuth.php?"+firstKey+"="+firstValue+"&lastTweetId="+lastTweetId+"&numOfTweetsPerCall="+TweetBox.numOfTweetsPerCall
        });

        request.done(function() {
            //depending on how tweets are returned
            //User Handle responses come back as request.responseJSON
            //Hashtag responses come back as request.responseJSON.statuses
            TweetBox.tweets = (typeof request.responseJSON.length !== 'undefined') ? request.responseJSON : request.responseJSON.statuses;
            //get the number of tweets
            if(typeof TweetBox.tweets.length !== 'undefined') {TweetBox.numOfTweets = TweetBox.tweets.length};
            //retweets need to be handled differently. they may display an extra url

            //because we have the last tweet from the request we might have only 1
            //so we have to check the second position
            if (TweetBox.tweets.length === 1 && TweetBox.firstLoad !== true){
                TweetBox.zeroSearchReturnsMessage();
            //if first load is true and we only get one return on criteria show it
            } else if (TweetBox.tweets.length === 1 && TweetBox.firstLoad === true){
                TweetBox.buildUsernameHeader(TweetBox.tweets);
                TweetBox.lastId = TweetBox.tweets[TweetBox.tweets.length-1].id_str;
                TweetBox.init(TweetBox.tweets);
                TweetBox.firstLoad = false;
            //if we have tweets let's show them
            } else if (typeof TweetBox.tweets[1] !== 'undefined'){
                if (TweetBox.firstLoad === true) {
                    (TweetBox.twitterUser !== '')
                        ? TweetBox.buildUsernameHeader(TweetBox.tweets)
                        : TweetBox.buildHashtagHeader(TweetBox.tweets);
                }
                if (TweetBox.firstLoad === false) {TweetBox.tweets.shift();}
                TweetBox.lastId = TweetBox.tweets[TweetBox.tweets.length-1].id_str;
                TweetBox.init(TweetBox.tweets);
                TweetBox.firstLoad = false;
            //if we don't return any results display a message
            } else if (TweetBox.numOfTweets === 0){
                TweetBox.zeroSearchReturnsMessage();
            }
        });
    };

    TweetBox.zeroSearchReturnsMessage = function(){
        $('#load-div').append('<h1 id="sorry">Sorry, our search shows 0 more results with that criteria :(</h1>');
        if ($('#load-div').length > 0) {
            $('#twitter-box').removeClass('load');
            $('#load-div').find('#load-more, .loading-tweets').remove();
        }
    }

    TweetBox.buildUsernameHeader = function(tweets){
        var headline = 'Tweets by @' + tweets[0].user.screen_name || 'Tweets';
        $('#headline').append('<a target="_blank" href="https://twitter.com/'+tweets[0].user.screen_name+'" class="headline-text">'+headline+'</a>');
    };

    TweetBox.buildHashtagHeader = function(tweets){
        $('#headline').append('<a target="_blank" href="https://twitter.com/hashtag/'+TweetBox.hashtagHeadlineLink+'?src=hash" class="headline-text">'+TweetBox.hashtagHeadline+'</a>');
    };

    TweetBox.removeTweetsWithoutImages = function(tweets){
        if(TweetBox.imagesOnly === true) {
            for (var i = tweets.length - 1; i >= 0; i--) {
                if (tweets[i].extended_entities === undefined && tweets[i].entities.media === undefined){
                    tweets.splice(i,1);
                }
            }
        }
        return tweets;
    }

    TweetBox.removeTweetsWithImages = function(tweets){
        if(TweetBox.textOnly === true && TweetBox.imagesOnly === false) {
            for (var i = tweets.length - 1; i >= 0; i--) {
                if(tweets[i].extended_entities !== undefined || tweets[i].entities.media !== undefined){
                    tweets.splice(i,1);
                }
            }
        }
        return tweets;
    }

    TweetBox.removeRetweets = function(tweets){
        if(TweetBox.noRetweets === true) {
            for (var i = tweets.length - 1; i >= 0; i--) {
                if(typeof tweets[i].retweeted_status !== 'undefined') {
                    tweets.splice(i,1);
                }
            }
        }
        return tweets;
    }

    //convert timestamp to Twitter standard
    TweetBox.convertTime = function(tweets, tweetTime, index) {
        var timeStart = new Date(tweets[index].created_at).getTime(),
            timeEnd   = Date.now(),
            hourDiff  = timeEnd - timeStart, //in ms
            secDiff   = Math.floor(hourDiff / 1000), //in s
            minDiff   = Math.floor(hourDiff / 60 / 1000), //in minutes
            hDiff     = Math.floor(hourDiff / 3600 / 1000), //in hours
            tweetDate = ((tweets[index].created_at.toString()).slice(0, 10)).slice(4);

        if (hDiff === 0 && minDiff === 0) {
            tweetTime = secDiff + 's';
        } else if (hDiff === 0) {
            tweetTime = minDiff + 'm';
        } else if (hDiff < 25) {
            tweetTime = hDiff + 'h';
        } else {
            tweetTime = tweetDate;
        }
        return tweetTime;
    };

    //if image exists for tweet
    TweetBox.addTweetImages = function(tweets, imageContainer, i) {

        if (tweets[i].extended_entities !== undefined) {
            imageContainer +=   '<div class="image-tweet">'+
                                    '<a target="_blank" href="https://'+tweets[i].extended_entities.media[0].display_url+'">'+
                                        '<img alt="Tweet Image" src="'+tweets[i].extended_entities.media[0].media_url_https+':small" />'+
                                    '</a>'+
                                '</div>';
        } else if (tweets[i].entities.media !== undefined) {
            imageContainer +=   '<div class="image-tweet">'+
                                    '<a target="_blank" href="https://'+tweets[i].entities.media[0].display_url+'">'+
                                        '<img alt="Tweet Image" src="'+tweets[i].entities.media[0].media_url_https+':small" />'+
                                    '</a>'+
                                '</div>';
        }
        return imageContainer;
    };

    TweetBox.escapeRegExp = function(string) {
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    };

    //set up hashtags to be links
    TweetBox.convertHashtagsToLinks = function(tweets, tweetText, i) {

        var hashtagsPerTweet = [];
        for (var index = 0; index < tweets[i].entities.hashtags.length; index++) {
            var hashtag     = tweets[i].entities.hashtags[index].text,
                hashtagLink = '<a target="_blank" href="https://twitter.com/hashtag/'+hashtag+'?src=hash" class="hashtag">#'+hashtag+'</a>';

            //if hashtag is in list of hashtags make it a link
            //make sure it's the full word
            if ($.inArray(hashtag, hashtagsPerTweet) === -1){
                hashtag = TweetBox.escapeRegExp('#'+hashtag);
                tweetText = tweetText.replace(new RegExp('(' + hashtag + ')(?=\\b|$)', 'g'), hashtagLink);
            }

            hashtagsPerTweet.push(hashtag);
        };

        return tweetText;
    };

    //set up twitterhandles to be links
    TweetBox.convertUsernamesToLinks = function(tweets, tweetText, i) {
        handles = [];
        for (var userCount = 0; userCount < tweets[i].entities.user_mentions.length; userCount++) {
            var twitterHandle = tweets[i].entities.user_mentions[userCount].screen_name,
                handleLink    = '<a target="_blank" href="https://twitter.com/'+twitterHandle+'" class="twitter-handle-link">@'+twitterHandle+'</a>';

            if ($.inArray(twitterHandle, handles) === -1){
                twitterHandle = TweetBox.escapeRegExp('@'+twitterHandle);
                tweetText = tweetText.replace(new RegExp('(' + twitterHandle + ')(?=\\b|$)', 'g'), handleLink);
            }

            handles.push(twitterHandle);
        };

        return tweetText;
    };

    //set up links in tweet to be links
    TweetBox.convertLinksToLinks = function(tweets, tweetText, i) {
        console.log(i);
        var urlsPerTweet = [];
        for (var urlCount = 0; urlCount < tweets[i].entities.urls.length; urlCount++) {
            console.log(tweets[i]);
            var urlToReplace = tweets[i].entities.urls[urlCount].url,
                vanityUrl    = tweets[i].entities.urls[urlCount].display_url,
                urlLink      = '<a target="_blank" href="'+urlToReplace+'" class="twitter-text-link">'+vanityUrl+'</a>';

            if ($.inArray(vanityUrl, urlsPerTweet) === -1){
                urlToReplace = TweetBox.escapeRegExp(urlToReplace);
                tweetText = tweetText.replace(new RegExp('(' + urlToReplace + ')(?=\\b|$)', 'g'), urlLink);
            }

            urlsPerTweet.push(vanityUrl);
        };

        return tweetText;
    };

    //display url to tweet as link
    TweetBox.convertTweetLinkToLinks = function(tweets, tweetText, i) {
        var urlsPerTweet = [];

        if (tweets[i].entities.media !== undefined) {
            var urlToReplace = tweets[i].entities.media[0].url,
                urlLink      = '<a target="_blank" href="'+urlToReplace+'" class="twitter-text-link">'+urlToReplace+'</a>';

            if (urlToReplace.length > 0){
                urlToReplace = TweetBox.escapeRegExp(urlToReplace);
                tweetText = tweetText.replace(new RegExp('(' + urlToReplace + ')(?=\\b|$)', 'g'), urlLink);
            }
            urlsPerTweet.push(urlToReplace);
        }
        return tweetText;
    };

    //image urls need to be links
    TweetBox.convertImageLinksToLinks = function(tweets, tweetText, i) {
        if (tweets[i].extended_entities !== undefined) {
            var urlsPerImageTweet = [];
            for (var imageUrlCount = 0; imageUrlCount < tweets[i].extended_entities.media.length; imageUrlCount++) {
                var urlToReplace = tweets[i].extended_entities.media[imageUrlCount].url,
                    longUrl      = tweets[i].extended_entities.media[imageUrlCount].expanded_url
                    vanityUrl    = tweets[i].extended_entities.media[imageUrlCount].display_url,
                    urlLink      = '<a target="_blank" href="'+longUrl+'" class="twitter-text-link">'+vanityUrl+'</a>';

                if ($.inArray(vanityUrl, urlsPerImageTweet) === -1){
                    urlToReplace = TweetBox.escapeRegExp(urlToReplace);
                    tweetText = tweetText.replace(new RegExp(urlToReplace, 'g'), urlLink);
                }

                urlsPerImageTweet.push(vanityUrl);
            };
        }

        return tweetText;
    };

    //load follow buttons with options (this really slows down the feed)
    TweetBox.loadFollowButton = function(screen_name, id) {
        if (typeof twttr.widgets !== 'undefined') {
            twttr.widgets.createFollowButton(
                screen_name,
                document.getElementById(id),
                {
                    size: 'medium',
                    dnt:  'true',
                    count: 'none'
                }).then(function (el) {
                    //$(el).css('width', '59px');
                    $('#follow').addClass('loaded');
            });
        } else {
            setTimeout(function(){TweetBox.loadFollowButton(screen_name, id);}, 100);
        }
    };

    TweetBox.buildTweets = function(tweets, i , verifiedUser, tweetText, imageContainer, tweetUrl, tweetTime){

        var followButton = '';

        if (TweetBox.followButton === true) {
            followButton = '<div class="follow" id="'+tweets[i].id_str+'" data-tweet-id="'+tweets[i].id_str+'" data-id"'+tweets[i].user.id_str+'"></div>';
        }

        TweetBox.tweet = '<li class="tweet" data-tweet-id="'+tweets[i].id_str+'">'+
                    '<div class="header">'+
                        '<div class="author">'+
                            '<a class="profile" target="_blank" href="https://twitter.com/'+tweets[i].user.screen_name+'">'+
                                '<img alt="user-avatar" class="avatar" src="'+tweets[i].user.profile_image_url_https+'">'+
                                '<div class="name-handle">'+
                                    '<span class="user-name">'+tweets[i].user.name+'</span>'+
                                    '<span class="verified" title="Verified Account"><i class="verified-user '+verifiedUser+'"></i></span>'+
                                    '<span class="twitter-handle">@'+tweets[i].user.screen_name+'</span>'+
                                '</div>'+
                            '</a>'+
                        '</div>'+
                    '</div>'+
                    followButton +
                    '<div class="text-content">'+
                        '<p class="title">'+tweetText+
                        '</p>'+
                    '</div>'+
                    '<div class="footer">'+
                        '<a class="display_url time-link" target="_blank" href="'+tweetUrl+'" data-datetime="'+tweets[i].created_at+'">'+
                            '<time datetime="'+tweets[i].created_at+'" class="tweet-time" title="Time posted: '+tweets[i].created_at+'">'+tweetTime+'</time>'+
                        '</a>'+
                        '<ul class="tweet-action">'+
                            '<li>'+
                                '<a target="_blank" href="https://twitter.com/intent/tweet?in_reply_to='+tweets[i].id_str+'" class="reply-action" title="Reply"><i class="reply"></i>'+
                                '</a>'+
                            '</li>'+
                            '<li>'+
                                '<a target="_blank" href="https://twitter.com/intent/retweet?tweet_id='+tweets[i].id_str+'" class="retweet-action" title="Retweet"><i class="retweet"></i>'+
                                '</a>'+
                            '</li>'+
                            '<li>'+
                                '<a target="_blank" href="https://twitter.com/intent/favorite?tweet_id='+tweets[i].id_str+'" class="favorite-action" title="Favorite"><i class="favorite"></i>'+
                                '</a>'+
                            '</li>'+
                        '</ul>'+
                    '</div>'+
                    imageContainer+
                '</li>';

        $('#tweets-container').append(TweetBox.tweet);

        if (TweetBox.followButton === true && TweetBox.followOption !== false) {
            TweetBox.loadFollowButton(tweets[i].user.screen_name, tweets[i].id_str);
        }

    };

    //update image size for desktop and mobile
    TweetBox.updateImageSize = function() {
        var imageSrc,
            imageSize = 'small',
            boxWidth  = $('#tweets-container').width();

        if(boxWidth >= +TweetBox.widthForLargeImage) {
            imageSize = 'large'
        } else if(boxWidth >= +TweetBox.widthForMediumImage) {
            imageSize = 'medium'
        }

        $('.image-tweet').find('img').each(function(){
            imageSrc = $(this).attr('src');
            imageSrc = imageSrc.replace(/([a-z]+)$/, imageSize);
            $(this).attr('src', imageSrc);
        });

    };

    //resize function to update images
    TweetBox.window_resize = function(){
        if (new Date().getTime() - TweetBox.now > 500) {
            TweetBox.updateImageSize();
            TweetBox.now = new Date().getTime();
        }
    };

    //load tweets on scroll position
    TweetBox.twitterBoxScrollPos = function(e) {

        var elem           = $(e.currentTarget),
            scrollPosition = elem[0].scrollHeight - elem.scrollTop() - 2,
            totalHeight    = elem.outerHeight();

        //only run it every 1/5th of a second and if we are at the bottom of the scroll (IE needs the ==)
        if (new Date().getTime() - TweetBox.now > 200 && (scrollPosition == totalHeight || scrollPosition < totalHeight)) {
            //desktop-ish loads on scroll
            if ( window.innerWidth > 767) {
                TweetBox.getTweets(TweetBox.lastId);
                $('#load-div').show();
                TweetBox.now = new Date().getTime();
            //mobile loads with button
            } else if (window.innerWidth <= 767) {
                if ($('.twitter-box-body').scrollTop() >= $(document).height() - $('.twitter-box-body').height() - 300) {
                    $('.twitter-box').addClass('load');
                    $('#load-div').show();
                    TweetBox.now = new Date().getTime();
                }
            }
        }

    };

    TweetBox.buildTimeline = function(tweets, tweet, httpPattern){
        //hide until we need it
        $('#load-div').hide();
        $('#load-div').removeClass('on-load');

        for (var i = 0; i < tweets.length; i++) {
            var tweetText      = tweets[i].text,
                imageContainer = '',
                tweetTime      = tweets[i].created_at,
                verifiedUser   = (tweets[i].user.verified === true) ? 'true' : '',
                tweetUrl       = "https://twitter.com/"+tweets[i].user.name+"/status/"+tweets[i].id_str;

            imageContainer = TweetBox.addTweetImages(tweets, imageContainer, i);
            tweetTime      = TweetBox.convertTime(tweets, tweetTime, i);
            tweetText      = TweetBox.convertHashtagsToLinks(tweets, tweetText, i);
            tweetText      = TweetBox.convertUsernamesToLinks(tweets, tweetText, i);
            tweetText      = TweetBox.convertLinksToLinks(tweets, tweetText, i);
            tweetText      = TweetBox.convertImageLinksToLinks(tweets, tweetText, i);
            tweetText      = TweetBox.convertTweetLinkToLinks(tweets, tweetText, i);
            TweetBox.buildTweets(tweets, i , verifiedUser, tweetText, imageContainer, tweetUrl, tweetTime);

            $('.loading-tweets').hide();
            $('.twitter-box').removeClass('load');
        }
    };

    TweetBox.init = function(tweets){
        var tweet,
            httpPattern = /(http.?:\/\/\S+)$/i;

        tweets = TweetBox.removeTweetsWithoutImages(tweets);
        tweets = TweetBox.removeTweetsWithImages(tweets);
        tweets = TweetBox.removeRetweets(tweets);

        if (TweetBox.storedTweets.length > 0) {
            tweets = TweetBox.storedTweets.concat(tweets);
            TweetBox.storedTweets = tweets;
        }

        //make sure we have at least 70% of the originally desired tweets otherwise lets get more
        //unless we get one, which is the last one of the previous call as that is the tweet id used to grab more
        //or if we get less than the number of tweets per call. meaning they ran out of that content.
        if( tweets.length < (TweetBox.numOfTweetsPerCall * 0.7) && tweets.length !== 1 && TweetBox.numOfTweets < TweetBox.numOfTweetsPerCall){
            TweetBox.storedTweets = tweets;
            TweetBox.getTweets(TweetBox.lastId);
        } else {
            TweetBox.storedTweets = '';
            TweetBox.buildTimeline(tweets, tweet, httpPattern);
        }

        TweetBox.updateImageSize();

        window.addEventListener('resize', TweetBox.window_resize);

        TweetBox.window_resize();

        $('.twitter-box-body').bind('scroll',TweetBox.twitterBoxScrollPos);

        $('#load-more').off('click').on('click', function(e){ TweetBox.loadMoreButton(e);});
    };

    TweetBox.getTweets(TweetBox.lastId);

    TweetBox.loadMoreButton = function(e) {
        e.preventDefault();
        $('.loading-tweets').show();
        TweetBox.getTweets(TweetBox.lastId);
    };

    //need to wait until follow name is set
    TweetBox.loadFollowScript = function(){
        if(TweetBox.twitterUser !== '' && TweetBox.followOption !== false) {
            TweetBox.loadFollowButton(TweetBox.twitterUser, 'follow');
        }
    };

    TweetBox.loadFollowScript();
});
