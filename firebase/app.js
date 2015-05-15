(function() {
var AppController = function ($router, auth) {
  this.$router = $router;
  this.auth = auth;
  this.authData = this.auth.$getAuth();

  var self = this;
  this.auth.$onAuth(function (authData) {
    self.authData = authData;
    self.$router.navigate('/');
  });
};

AppController.prototype.login = function () {
  this.auth.$authAnonymously();
};

AppController.prototype.logout = function () {
  this.auth.$unauth();
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


var ListController = function () {
};

ListController.prototype.activate = function (articles) {
  this.articles = articles;
};


var PostController = function ($router, auth, articles) {
  this.$router = $router;
  this.auth = auth;
  this.articles = articles;
};

PostController.prototype.canActivate = function () {
  var promise = this.auth.$requireAuth();
  promise.catch(function () {
    alert('Login required');
  });
  return promise;
};

PostController.prototype.canDeactivate = function () {
  if (this.title || this.text) {
    return confirm('Do you really want to quit without saving ?');
  }
  return true;
};

PostController.prototype.submit = function () {
  var self = this;
  this.articles
    .$add({
      title: this.title,
      text: this.text
    })
    .then(function (ref) {
      self.title = '';
      self.text = '';
      self.$router.parent.navigate('/list');
    });
};


var UserController = function (auth) {
  this.auth = auth;
};

UserController.prototype.canActivate = function () {
  var promise = this.auth.$requireAuth();
  promise.catch(function () {
    alert('Login required');
  });
  return promise;
};


angular.module('app', ['firebase', 'ngNewRouter']);

angular.module('app')
  .factory('ref', function () {
    return new Firebase('https://gdgkobe20150429-fb.firebaseio.com/');
  });

angular.module('app')
  .factory('auth', function ($firebaseAuth, ref) {
    return $firebaseAuth(ref);
  });

angular.module('app')
  .factory('articles', function ($firebaseArray, ref) {
    return $firebaseArray(ref);
  });

angular.module('app').controller('AppController', AppController);
angular.module('app').controller('PublicNavigationController', PublicNavigationController);
angular.module('app').controller('MemberNavigationController', MemberNavigationController);
angular.module('app').controller('ListController', ListController);
angular.module('app').controller('PostController', PostController);
angular.module('app').controller('UserController', UserController);
})();
