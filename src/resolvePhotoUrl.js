"use strict";

var utils = require("../utils");
var log = require("npmlog");
module.exports = function (http, api, ctx) {
  function getPhotoUrls(photoIDs) {
    var cb;
    var uploads = [];
    var rtPromise = new Promise(function (resolve, reject) {
      cb = (error, photoUrl) => photoUrl ? resolve(photoUrl) : reject(error);
    });
    photoIDs.map(function (id) {
      var httpPromise = http.get("https://www.facebook.com/mercury/attachments/photo", ctx.jar, {
        photo_id: id
      }).then(utils.parseAndCheckLogin(ctx, http)).then(function (res) {
        if (res.error) {
          throw res;
        }
        return res.jsmods.require[0][3][0];
      }).catch(function (error) {
        return cb(error);
      });
      uploads.push(httpPromise);
    });
    Promise.all(uploads).then(function (res) {
      return cb(null, res.reduce(function (form, v, i) {
        form[photoIDs[i]] = v;
        return form;
      }, {}));
    });
    return rtPromise;
  }
  return function resolvePhotoUrl(photoIDs, callback) {
    var cb;
    var rtPromise = new Promise(function (resolve, reject) {
      cb = (error, photoUrl) => photoUrl ? resolve(photoUrl) : reject(error);
    });
    if (Array.isArray(photoIDs) == false) {
      photoIDs = [photoIDs];
    }
    if (typeof callback == "function") {
      cb = callback;
    }
    getPhotoUrls(photoIDs).then(function (photoUrl) {
      if (Object.keys(photoUrl).length == 1) {
        cb(null, photoUrl[photoIDs[0]]);
      } else {
        cb(null, photoUrl);
      }
    }).catch(function (error) {
      log.error("resolvePhotoUrl", error);
      return cb(error);
    });
    return rtPromise;
  };
};