/*
 * XenForo discussion.min.js
 * Copyright 2010-2014 XenForo Ltd.
 * Released under the XenForo License Agreement: http://xenforo.com/license-agreement
 */
(function(b,g,h){XenForo.QuickReply=function(a){if(b("#messageList").length==0)return console.error("Quick Reply not possible for %o, no #messageList found.",a);var e=XenForo.MultiSubmitFix(a);this.scrollAndFocus=function(){b(h).scrollTop(a.offset().top);var c=XenForo.getEditorInForm(a);if(!c)return!1;c.$editor?c.focus(!0):c.focus();return this};a.data("QuickReply",this).bind({AutoValidationBeforeSubmit:function(a){if(b(a.clickedSubmitButton).is('input[name="more_options"]'))a.preventDefault(),a.returnValue=
!0},AutoValidationComplete:function(c){if(c.ajaxData._redirectTarget)g.location=c.ajaxData._redirectTarget;b('input[name="last_date"]',a).val(c.ajaxData.lastDate);e&&e();a.find("input:submit").blur();new XenForo.ExtLoader(c.ajaxData,function(){b("#messageList").find(".messagesSinceReplyingNotice").remove();b(c.ajaxData.templateHtml).each(function(){this.tagName&&b(this).xfInsert("appendTo",b("#messageList"))})});var d=b("#QuickReply").find("textarea");d.val("");(d=d.data("XenForo.BbCodeWysiwygEditor"))&&
d.resetEditor();a.trigger("QuickReplyComplete");return!1},BbCodeWysiwygEditorAutoSaveComplete:function(a){var d=b("#messageList"),e=d.find(".messagesSinceReplyingNotice");a.ajaxData.newPostCount&&a.ajaxData.templateHtml?e.length?(e.remove(),b(a.ajaxData.templateHtml).appendTo(d).show().xfActivate()):b(a.ajaxData.templateHtml).xfInsert("appendTo",d):e.remove()}})};XenForo.QuickReplyTrigger=function(a){a.click(function(){console.info("Quick Reply Trigger Click");var e=null,c=null,d=null;a.is(".MultiQuote")?
(e=b(a.data("form")),d={postIds:b(a.data("inputs")).map(function(){return this.value}).get()}):(e=b("#QuickReply"),e.data("QuickReply").scrollAndFocus());c||(c=XenForo.ajax(a.data("posturl")||a.attr("href"),d,function(d){if(XenForo.hasResponseError(d))return!1;delete c;var b=XenForo.getEditorInForm(e);if(!b)return!1;b.$editor?(b.insertHtml(d.quoteHtml),b.$editor.data("xenForoElastic")&&b.$editor.data("xenForoElastic")()):b.val(b.val()+d.quote);a.is(".MultiQuote")&&e.trigger("MultiQuoteComplete")}));
return!1})};XenForo.InlineMessageEditor=function(a){new XenForo.MultiSubmitFix(a);a.bind({AutoValidationBeforeSubmit:function(a){if(b(a.clickedSubmitButton).is('input[name="more_options"]'))a.preventDefault(),a.returnValue=!0},AutoValidationComplete:function(b){var c=a.closest("div.xenOverlay").data("overlay");c.getTrigger().data("target");XenForo.hasTemplateHtml(b.ajaxData,"messagesTemplateHtml")||XenForo.hasTemplateHtml(b.ajaxData)?(b.preventDefault(),c.close().getTrigger().data("XenForo.OverlayTrigger").deCache(),
XenForo.showMessages(b.ajaxData,c.getTrigger(),"instant")):console.warn("No template HTML!")}})};XenForo.NewMessageLoader=function(a){a.click(function(e){e.preventDefault();XenForo.ajax(a.data("href")||a.attr("href"),{},function(a){if(XenForo.hasResponseError(a))return!1;var d=b("#QuickReply"),e=b("#messageList");b('input[name="last_date"]',d).val(a.lastDate);new XenForo.ExtLoader(a,function(){e.find(".messagesSinceReplyingNotice").remove();b(a.templateHtml).each(function(){this.tagName&&b(this).xfInsert("appendTo",
e)})})})})};XenForo.MessageLoader=function(a){a.click(function(e){e.preventDefault();var c=[];b(a.data("messageselector")).each(function(a,b){c.push(b.id)});c.length?XenForo.ajax(a.attr("href"),{messageIds:c},function(b){XenForo.showMessages(b,a,"fadeDown")}):console.warn("No messages found to load.")})};XenForo.showMessages=function(a,e,c){var d=function(a,d){switch(c){case "instant":c={show:"xfShow",hide:"xfHide",speed:0};break;case "fadeIn":c={show:"xfFadeIn",hide:"xfFadeOut",speed:XenForo.speed.fast};
break;default:c={show:"xfFadeDown",hide:"xfFadeUp",speed:XenForo.speed.normal}}b(a)[c.hide](c.speed/2,function(){b(d).xfInsert("replaceAll",a,c.show,c.speed)})};if(XenForo.hasResponseError(a))return!1;XenForo.hasTemplateHtml(a,"messagesTemplateHtml")?new XenForo.ExtLoader(a,function(){b.each(a.messagesTemplateHtml,d)}):XenForo.hasTemplateHtml(a)&&new XenForo.ExtLoader(a,function(){d(e.data("messageselector"),a.templateHtml)})};XenForo.PollVoteForm=function(a){a.bind("AutoValidationComplete",function(e){e.preventDefault();
if(XenForo.hasTemplateHtml(e.ajaxData)){var c=b(a.data("container"));a.xfFadeUp(XenForo.speed.normal,function(){a.empty().remove();var d=b(e.ajaxData.templateHtml);d.is(a.data("container"))?d=d.children():d.find(a.data("container")).length&&(d=d.find(a.data("container")));d.xfInsert("appendTo",c)},XenForo.speed.normal,"swing")}})};XenForo.MultiQuote=function(a){this.__construct(a)};XenForo.MultiQuote.prototype={__construct:function(a){this.$button=a;this.$form=a.closest("form");this.cookieName=a.data("mq-cookie")||
"MultiQuote";this.cookieValue=[];this.submitUrl=a.data("submiturl");this.$controls=new jQuery;this.getCookieValue();this.setButtonState();var e=this;this.$form.bind("MultiQuoteComplete",b.context(this,"reset"));this.$form.bind("MultiQuoteRemove MultiQuoteAdd",function(a,b){b&&b.messageId&&e.toggleControl(b.messageId,a.type=="MultiQuoteAdd")})},getCookieValue:function(){var a=b.getCookie(this.cookieName);this.cookieValue=a==null?[]:a.split(",")},setButtonState:function(){this.getCookieValue();this.cookieValue.length?
this.$button.show():this.$button.hide()},addControl:function(a){a.click(b.context(this,"clickControl"));this.getCookieValue();this.setControlState(a,b.inArray(a.data("messageid")+"",this.cookieValue)>=0,!0);this.$controls=this.$controls.add(a)},setControls:function(){var a=this;a.getCookieValue();this.$controls.each(function(){a.setControlState(b(this),b.inArray(b(this).data("messageid")+"",a.cookieValue)>=0)})},setControlState:function(a,b,c){var d;d=this.$button;var f;b?(d=d.data("remove")||"-",
f=!0):(d=d.data("add")||"+",f=!1);(!c||a.hasClass("active")!==f)&&a.toggleClass("active",b).find("span.symbol").text(d)},clickControl:function(a){a.preventDefault();var a=b(a.target).closest("a.MultiQuoteControl"),e=!a.is(".active"),c=this.$button.data(e?"add-message":"remove-message");this.toggleControl(a.data("messageid"),e);c&&XenForo.alert(c,"",2E3)},toggleControl:function(a,e){this.getCookieValue();a+="";var c=b.inArray(a,this.cookieValue),d;d=this.$controls.filter(function(){return b(this).data("messageid")==
a}).first();e?(d.length&&this.setControlState(d,!0),c<0&&this.cookieValue.push(a)):(d.length&&this.setControlState(d,!1),c>=0&&this.cookieValue.splice(c,1));this.cookieValue.length>0?b.setCookie(this.cookieName,this.cookieValue.join(",")):b.deleteCookie(this.cookieName);this.setButtonState()},reset:function(){b.deleteCookie(this.cookieName);this.cookieValue=[];this.setControls();this.setButtonState()}};XenForo.MultiQuoteControl=function(a){var e=a.data("mq-target")||"#MultiQuote";(e=b(e).data("XenForo.MultiQuote"))&&
e.addControl(a)};XenForo.MultiQuoteRemove=function(a){a.click(function(){var e=a.closest(".MultiQuoteItem"),c=e.find(".MultiQuoteId").val(),d=b(b("#MultiQuoteForm").data("form")),f=a.closest(".xenOverlay");c&&d.trigger("MultiQuoteRemove",{messageId:c});e.remove();f.length&&!f.find(".MultiQuoteItem").length&&f.overlay().close()})};XenForo.MultiQuoteInsert=function(a){a.click(function(){var e=b(a.data("form")),c=null,c=XenForo.ajax(a.attr("href"),{postIds:b(a.data("inputs")).map(function(){return this.value}).get()},
function(b){if(XenForo.hasResponseError(b))return!1;delete c;var f=XenForo.getEditorInForm(e);if(!f)return!1;f.$editor?(f.insertHtml(b.quoteHtml),f.$editor.data("xenForoElastic")&&f.$editor.data("xenForoElastic")()):f.val(f.val()+b.quote);a.is(".MultiQuote")&&e.trigger("MultiQuoteComplete")});return!1})};XenForo.Sortable=function(a){a.sortable({forcePlaceholderSize:!0}).bind({sortupdate:function(){},dragstart:function(a){console.log("drag start, %o",a.target)},dragend:function(){console.log("drag end")}})};
XenForo.register("#QuickReply","XenForo.QuickReply");XenForo.register("a.ReplyQuote, a.MultiQuote","XenForo.QuickReplyTrigger");XenForo.register("form.InlineMessageEditor","XenForo.InlineMessageEditor");XenForo.register("a.MessageLoader","XenForo.MessageLoader");XenForo.register("a.NewMessageLoader","XenForo.NewMessageLoader");XenForo.register("form.PollVoteForm","XenForo.PollVoteForm");XenForo.register(".MultiQuoteWatcher","XenForo.MultiQuote");XenForo.register("a.MultiQuoteControl","XenForo.MultiQuoteControl");
XenForo.register("a.MultiQuoteRemove","XenForo.MultiQuoteRemove");XenForo.register(".Sortable","XenForo.Sortable")})(jQuery,this,document);