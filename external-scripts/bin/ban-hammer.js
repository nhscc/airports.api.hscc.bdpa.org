!function(e){var t={};function o(n){if(t[n])return t[n].exports;var $=t[n]={i:n,l:!1,exports:{}};return e[n].call($.exports,$,$.exports,o),$.l=!0,$.exports}o.m=e,o.c=t,o.d=function(e,t,n){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,t){if(1&t&&(e=o(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(o.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var $ in e)o.d(n,$,function(t){return e[t]}.bind(null,$));return n},o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="",o(o.s=131)}({131:function(e,t){const o=[{$limit:1},{$project:{_id:1}},{$project:{_id:0}},{$lookup:{from:"request-log",as:"keyBased",pipeline:[{$match:{key:{$ne:null},$expr:{$gte:["$time",{$subtract:[{$toLong:"$$NOW"},6e4]}]}}},{$group:{_id:{key:"$key",interval:{$subtract:["$time",{$mod:["$time",1e3]}]}},count:{$sum:1}}},{$match:{count:{$gt:10}}},{$project:{key:"$_id.key",until:{$add:[{$toLong:"$$NOW"},9e5]}}},{$project:{_id:0,count:0}}]}},{$lookup:{from:"request-log",as:"ipBased",pipeline:[{$match:{$expr:{$gte:["$time",{$subtract:[{$toLong:"$$NOW"},6e4]}]}}},{$group:{_id:{ip:"$ip",interval:{$subtract:["$time",{$mod:["$time",1e3]}]}},count:{$sum:1}}},{$match:{count:{$gt:10}}},{$project:{ip:"$_id.ip",until:{$add:[{$toLong:"$$NOW"},9e5]}}},{$project:{_id:0,count:0}}]}},{$lookup:{from:"limited-log-mview",as:"previous",pipeline:[{$match:{$expr:{$gte:["$until",{$subtract:[{$toLong:"$$NOW"},18e5]}]}}},{$project:{_id:0}}]}},{$project:{union:{$concatArrays:["$keyBased","$ipBased","$previous"]}}},{$unwind:{path:"$union"}},{$replaceRoot:{newRoot:"$union"}},{$group:{_id:{ip:"$ip",key:"$key"},count:{$sum:1},until:{$first:"$until"}}},{$set:{until:{$cond:{if:{$ne:["$count",1]},then:{$add:[{$toLong:"$$NOW"},36e5]},else:"$until"}},ip:"$_id.ip",key:"$_id.key"}},{$project:{count:0,_id:0}},{$out:"limited-log-mview"}]}});