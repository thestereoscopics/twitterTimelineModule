<?php
$oldestTweetId = "";
$hashtag       = "";
$twitteruser   = "";

if (isset($_GET['lastTweetId']))        { $oldestTweetId = $_GET['lastTweetId']; }
if (isset($_GET['hashtag']))            { $hashtag       = $_GET['hashtag']; }
if (isset($_GET['twitterUser']))        { $twitteruser   = $_GET['twitterUser']; }
if (isset($_GET['numOfTweetsPerCall'])) { $numtweets     = $_GET['numOfTweetsPerCall']; }

require_once(__DIR__."/../library/twitteroauth/src/Config.php");
require_once(__DIR__."/../library/twitteroauth/src/Response.php");
require_once(__DIR__."/../library/twitteroauth/src/Consumer.php");
require_once(__DIR__."/../library/twitteroauth/src/SignatureMethod.php");
require_once(__DIR__."/../library/twitteroauth/src/Util/JsonDecoder.php");
require_once(__DIR__."/../library/twitteroauth/src/HmacSha1.php");
require_once(__DIR__."/../library/twitteroauth/src/Request.php");
require_once(__DIR__."/../library/twitteroauth/src/Token.php");
require_once(__DIR__."/../library/twitteroauth/src/TwitterOAuthException.php");
require_once(__DIR__."/../library/twitteroauth/src/Util.php");
require_once(__DIR__."/../library/twitteroauth/src/TwitterOAuth.php"); //Path to twitteroauth library
use Abraham\TwitterOAuth\TwitterOAuth;

$oauth_access_token         ="GetYourTwitterKeysAtTwitter";
$oauth_access_token_secret  ="GetYourTwitterKeysAtTwitter";
$consumer_key               ="GetYourTwitterKeysAtTwitter";
$consumer_secret            ="GetYourTwitterKeysAtTwitter";

function getConnectionWithAccessToken($cons_key, $cons_secret, $oauth_token, $oauth_token_secret) {
  $connection = new TwitterOAuth($cons_key, $cons_secret, $oauth_token, $oauth_token_secret);
  return $connection;
}

$connection = getConnectionWithAccessToken($consumer_key, $consumer_secret, $oauth_access_token, $oauth_access_token_secret);

if ($oldestTweetId == ""){
    if ($hashtag != "") {
        $tweets = $connection->get("search/tweets", array("q" => $hashtag, "count" => $numtweets, "include_rts" => false));
    } else if ($twitteruser != "") {
        $tweets = $connection->get("statuses/user_timeline", array("screen_name" => $twitteruser, "count" => $numtweets, "include_rts" => false));
    }
}else{
    if ($hashtag != "") {
        $tweets = $connection->get("search/tweets", array("q" => $hashtag, "count" => $numtweets, "include_rts" => false, "max_id" => $oldestTweetId));
    } else if ($twitteruser != "") {
        $tweets = $connection->get("statuses/user_timeline", array("screen_name" => $twitteruser, "count" => $numtweets, "include_rts" => false, "max_id" => $oldestTweetId));
    }
}

//Check twitter response for errors.
if ( isset( $tweets->errors[0]->code )) {
    // If errors exist, print the first error for a simple notification.
    echo "Error encountered: ".$tweets->errors[0]->message." Response code:" .$tweets->errors[0]->code;
}

print(json_encode($tweets));
?>