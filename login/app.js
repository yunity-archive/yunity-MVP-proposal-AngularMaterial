var app = angular.module('yunityWebApp', ['ngRoute','ngMaterial', 'ngResource']);

app.controller('AppCtrl', function($scope) {
});

app.factory("apiUsers", function($resource) {
  return $resource("/api/groups/:id");
});


/**
 * Configure the Routes
 */
app.config(['$routeProvider', function ($routeProvider) {
  $routeProvider
    .when("/", {templateUrl: "login.html", controller: "AppCtrl"})
    .when("/signUp", {templateUrl: "signUp.html", controller: "AppCtrl"})
}]);


app.config(function($mdThemingProvider) {
    var yOrange = $mdThemingProvider.definePalette('yuniyColors', {
        '50': '363636', // yunity black
        '100': 'F5F5F5', // background grey
        '200': '91cb46', // yunity Green
        '300': 'fbaf36', // yunity yellow
        '400': '0290a2', // yunity blue 0290a2
        '500': 'f66c41', // yunity Orange
        '600': '2b9ccb', // blue for Links
        '700': 'FFFF00',
        '800': 'FF00FF',
        '900': '00FFFF',
        'A100': 'FF0000',
        'A200': 'f66c41', // yunity Orange
        'A400': '0000FF',
        'A700': '00FF00',
        'contrastDefaultColor': 'dark',
        'contrastLightColors': ['50', '100', //hues which contrast should be 'dark' by default
            '200', '300', '400', '500']
    });
  
  $mdThemingProvider.theme('default')
    .primaryPalette('yuniyColors', {
      'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
      'hue-2': '600', // use shade 600 for the <code>md-hue-2</code> class
      'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
    });
});