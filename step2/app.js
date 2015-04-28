(function() {
'use strict';

var AppController = function (GAuth, $router) {
  this.GAuth = GAuth;
  this.$router = $router;
};

AppController.prototype.login = function () {
  var self = this;
  this.GAuth.login()
    .then(function () {
      self.$router.navigate('/');
    });
};

AppController.prototype.logout = function () {
  var self = this;
  this.GAuth.logout()
    .then(function () {
      self.$router.navigate('/');
    });
};

AppController.$routeConfig = [
  {
    path: '/',
    redirectTo: '/list'
  },
  {
    path: '/list',
    components: {
      navigation: 'publicNavigation',
      content: 'list'
    },
    as: 'list'
  },
  {
    path: '/post',
    components: {
      navigation: 'memberNavigation',
      content: 'post'
    },
    as: 'post'
  },
  {
    path: '/user',
    components: {
      navigation: 'memberNavigation',
      content: 'user'
    },
    as: 'user'
  }
];


var PublicNavigationController = function () {
};


var MemberNavigationController = function () {
};


var ListController = function (GApi) {
  this.GApi = GApi;
};

ListController.prototype.activate = function () {
  var self = this;
  return self.GApi.execute('gdgkobe20150429', 'articles.query')
    .then(function (response) {
      self.articles = response.items;
    });
};


var PostController = function () {
};


var UserController = function () {
};


angular.module('app', ['angular-google-gapi', 'ngNewRouter']);

angular.module('app')
  .factory('authorized', function ($rootScope, $q, GAuth, clientId) {
    GAuth.setClient(clientId);
    var auth = GAuth.checkAuth();
    return function () {
      var deferred = $q.defer();
      auth
        .finally(function () {
          if ($rootScope.gapi.user) {
            deferred.resolve();
          } else {
            deferred.reject();
          }
        });
      return deferred.promise;
    };
  });

angular.module('app')
  .factory('clientId', function ($location) {
    var origin = $location.protocol() + '://' + $location.host();
    if ($location.port() !== 80) {
      origin += ':' + $location.port();
    }
    if (origin === 'http://localhost') {
      return '737232045163-22rv82eod96bv46vphb63pde23cm5t8m.apps.googleusercontent.com';
    } else if (origin === 'http://localhost:8080') {
      return '737232045163-5dmfng17mjmg32p01p35restig325orb.apps.googleusercontent.com';
    } else if (origin === 'http://likr.github.io') {
      return '737232045163-ogsideqcfucvriqhifau8ngvis377pd3.apps.googleusercontent.com';
    }
    return null;
  });

angular.module('app').controller('AppController', AppController);
angular.module('app').controller('PublicNavigationController', PublicNavigationController);
angular.module('app').controller('MemberNavigationController', MemberNavigationController);
angular.module('app').controller('ListController', ListController);
angular.module('app').controller('PostController', PostController);
angular.module('app').controller('UserController', UserController);

angular.module('app')
  .run(function (GApi, authorized) {
    GApi.load('gdgkobe20150429', 'v1', 'https://gdgkobe20150429.appspot.com/_ah/api');
  });
})();
