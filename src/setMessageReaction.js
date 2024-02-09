"use strict";

var utils = require("../utils");
var log = require("npmlog");
module.exports = function (defaultFuncs, api, ctx) {
  return function setMessageReaction(reaction, messageID, callback, forceCustomReaction) {
    function resolveFunc() {}
    function rejectFunc() {}
    var returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });
    if (!callback) {
      callback = function (err, friendList) {
        if (err) {
          return rejectFunc(err);
        }
        resolveFunc(friendList);
      };
    }
    switch (reaction) {
      case "😍": //:heart_eyes:
      case "😆": //:laughing:
      case "😮": //:open_mouth:
      case "😢": //:cry:
      case "😠": //:angry:
      case "👍": //:thumbsup:
      case "👎": //:thumbsdown:
      case "❤": //:heart:
      case "💗": //:glowingheart:
      case "":
        //valid
        break;
      case ":heart_eyes:":
      case ":love:":
        reaction = "😍";
        break;
      case ":laughing:":
      case ":haha:":
        reaction = "😆";
        break;
      case ":open_mouth:":
      case ":wow:":
        reaction = "😮";
        break;
      case ":cry:":
      case ":sad:":
        reaction = "😢";
        break;
      case ":angry:":
        reaction = "😠";
        break;
      case ":thumbsup:":
      case ":like:":
        reaction = "👍";
        break;
      case ":thumbsdown:":
      case ":dislike:":
        reaction = "👎";
        break;
      case ":heart:":
        reaction = "❤";
        break;
      case ":glowingheart:":
        reaction = "💗";
        break;
      default:
        if (forceCustomReaction) {
          break;
        }
        return callback({
          error: "Reaction is not a valid emoji."
        });
    }
    var variables = {
      data: {
        client_mutation_id: ctx.clientMutationId++,
        actor_id: ctx.userID,
        action: reaction == "" ? "REMOVE_REACTION" : "ADD_REACTION",
        message_id: messageID,
        reaction: reaction
      }
    };
    var qs = {
      doc_id: "1491398900900362",
      variables: JSON.stringify(variables),
      dpr: 1
    };
    defaultFuncs.postFormData("https://www.facebook.com/webgraphql/mutation/", ctx.jar, {}, qs).then(utils.parseAndCheckLogin(ctx.jar, defaultFuncs)).then(function (resData) {
      if (!resData) {
        throw {
          error: "setReaction returned empty object."
        };
      }
      if (resData.error) {
        throw resData;
      }
      callback(null);
    }).catch(function (err) {
      log.error("setReaction", err);
      return callback(err);
    });
    return returnPromise;
  };
};