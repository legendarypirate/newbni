"use strict";

const { resolveLangFromReq } = require("../lib/content-translations");

/** Sets `req.bniLang` from query, `X-BNI-Lang`, or `bni_lang` cookie. */
module.exports = function resolveLang(req, _res, next) {
  req.bniLang = resolveLangFromReq(req);
  next();
};
