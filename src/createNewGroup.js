"use strict";

var utils = require("../utils");
var log = require("npmlog");
module.exports = function (http, api, ctx) {
  function handleUpload(image) {
    var cb;
    var nextURL = "https://www.facebook.com/profile/picture/upload/";
    var rtPromise = new Promise(function (resolve, reject) {
      cb = function (error, data) {
        if (data) {
          resolve(data);
        } else {
          reject(error);
        }
      };
    });
    if (!image) {
      cb(null, true);
    }
    http.postFormData(nextURL, ctx.jar, {
      profile_id: ctx.userID,
      photo_source: 57,
      av: ctx.userID,
      file: image
    }).then(utils.parseAndCheckLogin(ctx, http)).then(function (res) {
      if (res.error) {
        throw res;
      }
      return cb(null, res);
    }).catch(cb);
    return rtPromise;
  }
  return function createNewGroup(userIDs, title = null, image = null, callback) {
    var cb;
    var rtPromise = new Promise(function (resolve, reject) {
      cb = function (error, res) {
        if (res) {
          resolve(res);
        } else {
          reject(error);
        }
      };
    });
    if (typeof title == "function") {
      callback = title;
      title = null;
    }
    if (!!utils.isReadableStream(title)) {
      image = title;
      title = null;
    }
    if (typeof image == "function") {
      callback = image;
      image = null;
    }
    if (typeof callback == "function") {
      cb = callback;
    }
    if (Array.isArray(userIDs) == false) {
      log.error("createNewGroup", "userIDs should be an array.");
      return cb("userIDs should be an array.");
    }
    if (userIDs.length < 2) {
      log.error("createNewGroup", "userIDs should have at least 2 IDs.");
      return cb("userIDs should have at least 2 IDs.");
    }
    var pids = [{
      fbid: ctx.userID
    }];
    for (var n in userIDs) {
      pids.push({
        fbid: userIDs[n]
      });
    }
    handleUpload(image).then(function (res) {
      var form = {
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "MessengerGroupCreateMutation",
        //This doc_id is valid as of January 11th, 2020
        doc_id: "577041672419534",
        variables: JSON.stringify({
          input: {
            entry_point: "jewel_new_group",
            actor_id: ctx.userID,
            participants: pids,
            client_mutation_id: Math.round(Math.random() * 1024).toString(),
            thread_settings: {
              name: title,
              joinable_mode: "PRIVATE",
              thread_image_fbid: image != null ? res.payload.fbid : null
            }
          }
        })
      };
      return http.post("https://www.facebook.com/api/graphql/", ctx.jar, form).then(utils.parseAndCheckLogin(ctx, http));
    }).then(function (res) {
      return cb(null, res.data.messenger_group_thread_create.thread.thread_key.thread_fbid);
    }).catch(function (err) {
      log.error("createNewGroup", err);
      return cb(err);
    });
    return rtPromise;
  };
};