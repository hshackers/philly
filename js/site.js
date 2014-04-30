if ( !((navigator.userAgent.indexOf('iOS') != -1) || (navigator.userAgent.indexOf('Android') != -1) || (navigator.userAgent.indexOf('Mobile') != -1) || (navigator.userAgent.indexOf('Phone') != -1)) ) 
   {
    var s = skrollr.init();
   }

$( document ).ready(function() {
  console.log( "Bored? http://www.youtube.com/watch?v=dQw4w9WgXcQ!" );
});
$(function() {
  $('a[href*=#]:not([href=#])').click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top
        }, 1000);
        return false;
      }
    }
  });
});

(function(context) {

if (!site) throw new Error('Configuration not found');

var hshackers = {};

hshackers.githubWatcherProject = function(resp) {
    var watcherProject = $('.follower-project');
    var i = 0;
    var max = 4; // Make a maximum of five requests before giving up.
    var shuffled = _(resp.data).shuffle();

    var getProjects = function(u) {
        $.ajax({
            url: 'https://api.github.com/users/' + u.login + '/repos',
            dataType: 'jsonp',
            success: function(resp) {
                if (!resp.data.length) return getProjects(shuffled[++i]);
                var repo = _(resp.data)
                    .chain()
                    .shuffle()
                    .detect(function(r) {
                        return r.language === site.github_language;
                    })
                    .value();

                if (!repo) {
                    getProjects(shuffled[++i]);
                } else {
                    var template =
                        ""
                        + "<a target='_blank' href='http://github.com/<%=owner.login%>'><%=owner.login%></a>"
                        + " / "
                        + "<a target='_blank' href='<%=html_url%>'>"
                        + "<span class='title'><strong><%=name%></strong></span>"
                        + "</a>"
                        + "<span class='title'> <%=description%></span>"
                        + "";
                    var t = _(template).template(repo);
                    watcherProject.append(t).addClass('loaded');
                }

            }
        });
    };
    getProjects(shuffled[i]);
};

hshackers.githubWatchers = function() {
    var watchers = $('.followers');
    $.ajax({
        // TODO: this endpoint only returns maximum 30 users. Implement random
        // pagination so we see different groups of people.
        url: 'https://api.github.com/repos/' +
            site.github_login + '/' +
            site.github_repo + '/watchers',
        dataType: 'jsonp',
        success: function(resp) {
            if (!resp.data.length) return;
            hshackers.githubWatcherProject(resp);
            var template =
                "<a class='github-user' target='_blank' href='http://github.com/<%=login%>'>" +
                "<span style='background-image:url(<%=avatar_url%>)' class='thumb' /></span>" +
                "<span class='popup'>" +
                "<span class='title'><%=login%></span>" +
                "</span>" +
                "</a>";
            var t = _(resp.data)
                .map(function(i) { return _(template).template(i); })
                .join('');
            watchers.append(t);
        }
    });
};
$(hshackers.githubWatchers);


hshackers.setup = function() {
    var tweets = $('.tweets');

    $('.watch').hover(
        function() { $('.watch-docs').addClass('active'); },
        function() { $('.watch-docs').removeClass('active'); }
    );

    $.ajax({
        url: 'http://search.twitter.com/search.json',
        data: { q: site.twitter_search, rpp:100 },
        dataType: 'jsonp',
        success: function(resp) {
            if (!resp.results.length) return;
            var template =
                "<a target='_blank' href='http://twitter.com/<%=from_user%>/status/<%=id_str%>' class='tweet'>"
                + "<span class='thumb' style='background-image:url(<%=profile_image_url%>)'></span>"
                + "<span class='popup'>"
                + "<span class='title'>@<%=from_user%></span>"
                + "<small><%=text%></small>"
                + "</span>"
                + "</a>";
            var t = _(resp.results.slice(0,30))
                .map(function(i) { return _(template).template(i); })
                .join('');
            tweets.append(t).addClass('loaded');
        }
    });
};
$(hshackers.setup);

context.hshackers = hshackers;
})(window);