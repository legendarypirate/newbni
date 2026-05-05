"use strict";

function statusFromError(e) {
  if (e instanceof Error && typeof e.status === "number") return e.status;
  return 400;
}

module.exports = { statusFromError };
