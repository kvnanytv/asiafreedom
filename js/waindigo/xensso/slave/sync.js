XenSSO=new function(){var e=this;var t=null;var n=false;var r=[0,100];this.init=function(){e.events.bind()};this.events={bind:function(){$("#xensso_pause").click(e.events.onPauseClicked)},onPauseClicked:function(){if(n){n=false;$("#xensso_pause").text("pause");e.nextBatch()}else{n=true;clearTimeout(t);$("#xensso_pause").text("resume")}return false}};this.updateProgress=function(t,i){if(t>i)t=i;r=[t,i];$("#xensso_progress_pending").remove();$("#xensso_progress").text(t+"/"+i);if(t==i||n){$("#xensso_pause").parent().text("Progress");$("#xensso_progress").after($("<span>").text(" - All done!"));return}setTimeout(function(){e.nextBatch()},1e3)};this.updateFailed=function(e){$("#xensso_failed_empty").remove();var t=$("#xensso_failed_count").text();t=parseInt(t);t=isNaN(t)?0:t;for(var n in e){t+=e[n].usernames.length;window.parent.$("#xensso_failed_count").text(t);if($(".xensso_failed_error[rel='"+n+"']").length==0){var r=$("<div class=xensso_failed_error>");r.attr("rel",n);r.append($("<a class=title href=#>").text(e[n].error+": "));r.append($("<span class=count>").text(0));r.append($("<span class=usernames>").hide());r.find("a").click(function(){XenForo.alert($(this).parent().find(".usernames").text(),"Usernames");return false});r.appendTo("#xensso_failed")}var i=$(".xensso_failed_error[rel='"+n+"']");i.find(".count").text(parseInt(i.find(".count").text())+e[n].usernames.length);i.find(".usernames").append("'"+e[n].usernames.join("',' ")+"', ")}};this.nextBatch=function(){if(r[0]==r[1])return;$("#xensso_iframe").attr("src","admin.php?xensso-sync/syncProcess&offset="+r[0]+"&limit=100")};$(document).ready(this.init)}