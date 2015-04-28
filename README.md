# 20150429 GDG Kobe Component Router (New Router) ハンズオン

# はじめに

New Routerと呼ばれていたAngularJS 1系2系両対応を目指した新しいルーターに関するハンズオンです。

* https://github.com/angular/router

New Routerという名称が各方面に不評だったのでComponent Routerに名前が変更になりそうです。
なので本稿でもComponent Routerと呼ぶことにします。

* https://github.com/angular/router/issues/159


REST APIアクセス、ログインフロー等を通じてComponent Routerの以下の概念をサラッと学習します。

* `$routeConfig`と`$router.config`
* `ngViewport` (`ngOutlet`に変更予定)
* Component Lifecycle Hooks
* `ngLink`と`$router.navigate`によるページ遷移

ライブラリのバージョンは以下の通りです。
Component Routerの開発中のバージョンで既にAPI名の変更が予定されているものもあります。
本稿でも注意書きはしますが、最新の情報には注意してください。

* AngularJS 1.3.15
* angular-google-gapi 0.1.2
* ComponentRouter 0.5.3

# 設計

動作例はここです。

* https://likr.github.io/gdgkobe20150429


# Step 0 インストール

## ディレクトリ構成

初期ソースを開発ディレクトリに配置してください。

```
┬ index.html
└ app.js
```

```html:index.html
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Component Router ハンズオン</title>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css">
</head>
<body ng-app="app" ng-controller="AppController as app">
<nav class="navbar navbar-default">
  <div class="container">
    <div class="navbar-header">
      <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar-collapse">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
      </button>
      <a class="navbar-brand">GDG Kobe</a>
    </div>

    <div class="collapse navbar-collapse" id="navbar-collapse">
      <ul class="nav navbar-nav navbar-right" ng-if="gapi.user">
        <li class="dropdown">
          <a class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">{{gapi.user.name}}<span class="caret"></span></a>
          <ul class="dropdown-menu" role="menu">
            <li><a>Logout</a></li>
          </ul>
        </li>
      </ul>
      <ul class="nav navbar-nav navbar-right" ng-if="!gapi.user">
        <li><a>Login</a></li>
      </ul>
    </div>
  </div>
</nav>
<div class="container">
  <ul class="nav nav-pills">
    <li role="presentation"><a>Public</a></li>
    <li role="presentation"><a>Member</a></li>
  </ul>
  <div class="row">
    <div class="col-xs-9"></div>
    <div class="col-xs-3"></div>
  </div>
</div>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.min.js"></script>
<script src="https://raw.githubusercontent.com/maximepvrt/angular-google-gapi/v0.1.2/angular-google-gapi.js"></script>
<script src="app.js"></script>
</body>
</html>
```

```javascript:app.js
(function() {
'use strict';

var AppController = function () {
};


angular.module('app', ['angular-google-gapi']);

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
    }
    return null;
  });

angular.module('app')
  .controller('AppController', AppController);

angular.module('app')
  .run(function (GApi, authorized) {
    GApi.load('gdgkobe20150429', 'v1', 'https://gdgkobe20150429.appspot.com/_ah/api');
  });
})();
```

## Webサーバーの準備

APIアクセスの都合上`http://localhost`または`http://localhost:8080`のオリジンで開発してください。

### node.js

```bash
$ npm install -g http-server
$ http-server -p 8080
```

### Python2

```bash
$ python -m SimpleHTTPServer 8080
```

### Python3

```bash
$ python -m http.server 8080
```

### その他

Apacheでもなんでも

# Step 1 Component Routerの導入と最初のComponent

## ngNewRouterの読み込み

`router.es5.js`を読み込みます。
配布の手間を省くためにGitHubから直接読んでいますが、あまりお行儀が良くないので適宜ダウンロードを行なってください。

```html:index.html
<script src="https://raw.githubusercontent.com/angular/router/v0.5.3/dist/router.es5.js"></script>
```

moduleの初期化部分でngNewRouterをDIします。

```javascript:app.js
angular.module('app', ['angular-google-gapi', 'ngNewRouter']);
```

## ngViewport (ngOutlet)

名前付きViewportを二つ定義します。

```html:index.html
<div class="container">
  <ul class="nav nav-pills">
    <li role="presentation"><a>Public</a></li>
    <li role="presentation"><a>Member</a></li>
  </ul>
  <div class="row">
    <div class="col-xs-9" ng-viewport="content"></div>
    <div class="col-xs-3" ng-viewport="navigation"></div>
  </div>
</div>
```

## Controller.$routeConfigと$router.config

ルートの設定方法は二種類あります。
本稿の以降の例ではController.$routeConfigを採用しますが、両方の例を記載しておきます。
この例では二つの名前付きViewportへのcomponentの割り当てを行うので、各ルートは`path`と`components`プロパティを持たせます。
また、リンクを行うために`as`プロパティで別名を与えます。
デフォルトのルート(`/`)は`redirectTo`プロパティで`/list`へと遷移させます。

### Controller.$routeConfig

Controllerに$routeConfigという名前でルート設定を代入します。

```javascript:app.js
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
```


### $router.config

Controllerに`$router`をDIし、`config`メソッドでルート設定を行います。

```javascript:app.js
var AppController = function ($router) {
  $router.config([
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
  ]);
};
```

## Componentの追加

Angular 1では、ControllerとTemplateの組がComponentと呼ばれます。
まずは空のListComponentとPublicNavigationComponentを追加してみます。
ControllerとTemplateのデフォルトの命名規則についてですが、Component名が`spamHam`のとき、Controller名は`SpamHamController`、controller as syntaxでViewからアクセスする名前が`spamHam`、Templateのパスは`components/spam-ham/spam-ham.html`になります。

```javascript:app.js
var PublicNavigationController = function () {
};

angular.module('app').controller('PublicNavigationController', PublicNavigationController);

var ListController = function () {
}

angular.module('app').controller('ListController', ListController);
```

```html:components/public-navigation/public-navigation.html
public-navigation
```

```html:components/list/list.html
list
```

`/list`にアクセスして、左側にlist、右側にpublic-navigationと表示されていたら成功です。

同様にして残り3つのComponentを追加します。

## ngLinkによるページ遷移

`ngLink`でViewでのページ遷移を記述します。
ここでは、引数は`$routeConfig`の`as`で指定した別名になります。

```html:index.html
<div class="container">
  <ul class="nav nav-pills">
    <li role="presentation"><a ng-link="list">Public</a></li>
    <li role="presentation"><a ng-link="post">Member</a></li>
  </ul>
  <div class="row">
    <div class="col-xs-9" ng-viewport="content"></div>
    <div class="col-xs-3" ng-viewport="navigation"></div>
  </div>
</div>
```

```html:components/public-navigation/public-navigation.html
<ul class="nav nav-pills nav-stacked">
  <li role="presentation"><a ng-link="list">List</a></li>
</ul>
```

```html:components/member-navigation/member-navigation.html
<ul class="nav nav-pills nav-stacked">
  <li role="presentation"><a ng-link="post">Post</a></li>
  <li role="presentation"><a ng-link="user">User</a></li>
</ul>
```

追加したリンクで正常にページ遷移ができることを確認してください。

# Step 2 非同期データ取得とComponent Lifecycle Hooks

ページ遷移の条件やデータ読み込みをComponent Lifecycle Hooksで制御することができます。
`canActivate`、`activate`、`canDeactivate`、`deactivate`の4種類のフック関数があり、これらはControllerのメソッドとして実装します。
フック関数ではPromiseを返すことができ、非同期処理が終わったら状態遷移をするということができます。
`activate`ではngRouteやui-routerでのresolveと同等の処理ができます。

実際にListComponentでREST Apiからのデータ取得と表示を行ってみます。
`Gapi.execute`はPromiseを返すので、取得が終わったらControllerのプロパティに結果を代入しています。
本稿ではAltJSを使用していないので`ListController.prototype.activate = function () {};`という形でメソッドを定義しています。
本格的に導入するときにはBabelやTypeScriptの`class`を使う方が幸せになれると思います。

```javascript:app.js
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
```

```html:components/list/list.html
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
```

# Step 3 ログインフロー

Component Lifecycle Hooksの`canActivate`はログインフローを実現するにも適しています。
Memberページをログインしないとアクセスできないように作りこんでいきます。

## $router.navigate

ログイン/ログアウト機能を実装します。
これについてはComponent Routerとあまり関係がないので深くは説明しませんが、ログイン/ログアウトに成功したら`/`にページ遷移させることにします。
Controller内からページ遷移を行うには、`$router.navigate`を使います。
`$router.navigate`の引数は、`ngLink`の場合と異なり`path`を指定します。
`$router.navigate($router.generate(name, params))`で`ngLink`と同じインタフェースにすることができます。
`$router.navigate`と`ngLink`の引数の整合性については議論中なので将来的に変更される可能性があります。

* https://github.com/angular/router/issues/239

```javascript:app.js
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
```

```html:index.html
    <div class="collapse navbar-collapse" id="navbar-collapse">
      <ul class="nav navbar-nav navbar-right" ng-if="gapi.user">
        <li class="dropdown">
          <a class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">{{gapi.user.name}}<span class="caret"></span></a>
          <ul class="dropdown-menu" role="menu">
            <li><a ng-click="app.logout()">Logout</a></li>
          </ul>
        </li>
      </ul>
      <ul class="nav navbar-nav navbar-right" ng-if="!gapi.user">
        <li><a ng-click="app.login()">Login</a></li>
      </ul>
    </div>
```

## canActivateとcanDeactivate

PostControllerを実装していきます。
ListControllerでの`activate`と同様に`canActivate`と`canDeactivate`を追加します。
`canActivate`ではユーザーがログインできているかのチェックを行い、`canDeactivate`では入力途中でページ遷移しようとしたときに確認のダイアログを出すという処理をすることにします。
ここでもPromiseを返すことで非同期処理を行うことができます。

```javascript:app.js
var PostController = function ($q, GApi, authorized, $router) {
  this.$q = $q;
  this.GApi = GApi;
  this.authorized = authorized;
  this.$router = $router;
};

PostController.prototype.canActivate = function () {
  var promise = this.authorized();
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
  var self = this,
      obj = {
        title: self.title,
        text: self.text
      };
  self.$q.when(self.GApi .executeAuth('gdgkobe20150429', 'articles.post', obj))
    .then(function () {
      self.title = '';
      self.text = '';
      self.$router.parent.navigate('/');
    });
};
```

```html:components/post/post.html
<form ng-submit="post.submit()">
  <div class="form-group">
    <label>Title</label>
    <input class="form-control" ng-model="post.title">
  </div>
  <div class="form-group">
    <label>Body</label>
    <textarea class="form-control" ng-model="post.text"></textarea>
  </div>
  <input type="submit" value="Submit" class="btn">
</form>
```

`submit`からのページ遷移が`$router.parent.navigate`になっているのは不具合回避のためです。

* https://github.com/angular/router/issues/185

また、ダイアログが2回表示されていると思いますが、`canActivate`と`canDeactivate`が2回呼ばれる不具合が報告されています。。

* https://github.com/angular/router/issues/204

